import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CheckCircle2, DollarSign, MessageCircle, Search, Send, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { GroupReport, GlobalDevMessage, UserProfile } from '../types';
import { supabaseService } from '../lib/supabase';
import { encryptMessage, getSharedSecretKey, loadPrivateKeyFromIndexedDB } from '../lib/crypto';

interface AdminDashboardProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, profiles, onBack }) => {
  const [users, setUsers] = useState(profiles);
  const [reports, setReports] = useState<GroupReport[]>([]);
  const [globalMessages, setGlobalMessages] = useState<GlobalDevMessage[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [messageTarget, setMessageTarget] = useState<UserProfile | null>(null);
  const [messagePurpose, setMessagePurpose] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([supabaseService.getReports(), supabaseService.getGlobalMessages()]).then(([loadedReports, loadedMessages]) => {
      if (!active) return;
      setReports(loadedReports);
      setGlobalMessages(loadedMessages);
    });
    return () => { active = false; };
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) =>
    `${user.username} ${user.email || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const saveUser = async (user: UserProfile) => {
    const updated = await supabaseService.adminUpdateUser(user.id, user);
    if (!updated) return;
    setUsers((current) => current.map((candidate) => candidate.id === user.id ? updated : candidate));
    setNotice(`@${updated.username} updated`);
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUser.id || !window.confirm('Delete this user and their local contacts?')) return;
    if (await supabaseService.adminDeleteUser(userId)) {
      setUsers((current) => current.filter((user) => user.id !== userId));
      setNotice('User deleted');
    }
  };

  const updateReport = async (reportId: string, status: GroupReport['status']) => {
    if (await supabaseService.adminUpdateReport(reportId, status)) {
      setReports((current) => current.map((report) => report.id === reportId ? { ...report, status } : report));
    }
  };

  const getReportPerson = (report: GroupReport): UserProfile | undefined => {
    if (report.target_type === 'user') return users.find((user) => user.id === report.target_id);
    if (report.target_type === 'message') {
      const message = globalMessages.find((candidate) => candidate.id === report.target_id);
      return users.find((user) => user.id === message?.sender_id);
    }
    return undefined;
  };

  const openMessage = (target: UserProfile | undefined, purpose: string) => {
    if (!target) {
      setNotice('The reported account could not be identified.');
      return;
    }
    setMessageTarget(target);
    setMessagePurpose(purpose);
    setMessageText('');
  };

  const sendAdminMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!messageTarget || !messageText.trim()) return;
    setSending(true);
    try {
      const privateKey = await loadPrivateKeyFromIndexedDB(currentUser.id);
      if (!privateKey || !messageTarget.public_key) throw new Error('A secure key is not available for this account.');
      const sharedKey = await getSharedSecretKey(currentUser.id, privateKey, messageTarget.public_key);
      const { ciphertext, iv } = await encryptMessage(messageText.trim(), sharedKey);
      await supabaseService.sendPrivateMessage(currentUser.id, messageTarget.id, ciphertext, iv, messageText.trim());
      setNotice(`Message sent to @${messageTarget.username}`);
      setMessageTarget(null);
    } catch (error: any) {
      setNotice(error?.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const reportTrend = useMemo(() => getDailyCounts(reports.map((report) => report.created_at)), [reports]);
  const userTrend = useMemo(() => getDailyCounts(users.map((user) => user.created_at).filter(Boolean) as string[]), [users]);
  const resolvedRate = reports.length ? Math.round((reports.filter((report) => report.status === 'resolved').length / reports.length) * 100) : 0;

  return (
    <main className="min-h-full flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back to workspace
            </button>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300"><ShieldCheck /></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Control center</p><h1 className="text-2xl font-black">Admin dashboard</h1></div>
            </div>
          </div>
          {notice && <button onClick={() => setNotice('')} className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{notice}<X className="w-3 h-3" /></button>}
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric icon={<Users />} label="Total users" value={users.length} />
          <Metric icon={<BarChart3 />} label="Active profiles" value={users.filter((user) => user.is_online).length} />
          <Metric icon={<CheckCircle2 />} label="Open reports" value={reports.filter((report) => report.status === 'pending').length} />
          <Metric icon={<DollarSign />} label="Tracked revenue" value="$0" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <ChartPanel title="Community growth" subtitle="New profiles over the last 7 days" color="#34d399" values={userTrend} />
          <ChartPanel title="Moderation activity" subtitle={`${resolvedRate}% of reports resolved`} color="#f59e0b" values={reportTrend} />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">User management</h2><p className="text-xs text-slate-400 mt-1">Edit profiles, assign roles, or remove accounts.</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><Search className="w-4 h-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="bg-transparent outline-none w-40" /></label></div>
          <div className="divide-y divide-slate-800">
            {filteredUsers.map((user) => <UserRow key={user.id} user={user} isSelf={user.id === currentUser.id} onSave={saveUser} onDelete={deleteUser} />)}
            {filteredUsers.length === 0 && <p className="p-6 text-sm text-slate-400">No users match this search.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden"><div className="p-4 border-b border-slate-800"><h2 className="font-bold">Moderation queue</h2><p className="text-xs text-slate-400 mt-1">Review reports, contact both sides, and record the decision.</p></div>{reports.length === 0 ? <p className="p-6 text-sm text-slate-400">No reports have been submitted.</p> : <div className="divide-y divide-slate-800">{reports.map((report) => { const target = getReportPerson(report); const reporter = users.find((user) => user.id === report.reporter_id); return <div key={report.id} className="p-4 space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{report.reason}</p><p className="text-xs text-slate-400 mt-1">Target: {report.target_type} · {new Date(report.created_at).toLocaleString()}</p>{report.details && <p className="text-xs text-slate-300 mt-2">{report.details}</p>}</div><select value={report.status} onChange={(event) => updateReport(report.id, event.target.value as GroupReport['status'])} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs"><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option></select></div><div className="flex flex-wrap gap-2"><ActionButton icon={<MessageCircle />} label={target ? `Message @${target.username}` : 'Target unavailable'} disabled={!target} onClick={() => openMessage(target, 'Resolve reported issue')} /><ActionButton icon={<Send />} label={reporter ? `Update @${reporter.username}` : 'Reporter unavailable'} disabled={!reporter} onClick={() => openMessage(reporter, 'Report follow-up')} /></div></div>; })}</div>}</section>
      </div>
      {messageTarget && <MessageModal target={messageTarget} purpose={messagePurpose} value={messageText} sending={sending} onChange={setMessageText} onClose={() => setMessageTarget(null)} onSubmit={sendAdminMessage} />}
    </main>
  );
};

function getDailyCounts(dates: string[]): number[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return dates.filter((date) => { const value = new Date(date); value.setHours(0, 0, 0, 0); return value.getTime() === day.getTime(); }).length;
  });
}

function ChartPanel({ title, subtitle, values, color }: { title: string; subtitle: string; values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => `${index * 50},${70 - (value / max) * 58}`).join(' ');
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-start justify-between"><div><h2 className="font-bold">{title}</h2><p className="text-xs text-slate-400 mt-1">{subtitle}</p></div><BarChart3 className="w-5 h-5 text-slate-500" /></div><svg viewBox="0 0 300 82" className="w-full h-32 mt-4" role="img" aria-label={title}><path d="M0 70H300M0 41H300M0 12H300" stroke="rgba(148,163,184,.14)" /><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 0) scale(1 1)" />{values.map((value, index) => <circle key={index} cx={index * 50} cy={70 - (value / max) * 58} r="3.5" fill={color} />)}</svg><div className="flex justify-between text-[10px] text-slate-500"><span>6 days ago</span><span>Today</span></div></div>;
}

function ActionButton({ icon, label, disabled, onClick }: { icon: React.ReactElement<{ className?: string }>; label: string; disabled?: boolean; onClick: () => void }) { return <button disabled={disabled} onClick={onClick} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:text-slate-300">{React.cloneElement(icon, { className: 'w-3.5 h-3.5' })}{label}</button>; }

function MessageModal({ target, purpose, value, sending, onChange, onClose, onSubmit }: { target: UserProfile; purpose: string; value: string; sending: boolean; onChange: (value: string) => void; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-emerald-400">Secure admin message</p><h2 className="mt-1 text-lg font-bold">To @{target.username}</h2><p className="mt-1 text-xs text-slate-400">{purpose}</p></div><button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X /></button></div><textarea autoFocus required value={value} onChange={(event) => onChange(event.target.value)} rows={6} placeholder="Write a clear, respectful message..." className="mt-5 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-emerald-400" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Cancel</button><button disabled={sending} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950">{sending ? 'Sending...' : 'Send securely'}</button></div></form></div>; }

function Metric({ icon, label, value }: { icon: React.ReactElement<{ className?: string }>; label: string; value: React.ReactNode }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center justify-between text-emerald-400"><span className="text-xs text-slate-400">{label}</span>{React.cloneElement(icon, { className: 'w-4 h-4' })}</div><p className="text-2xl font-black mt-3">{value}</p></div>; }

function UserRow({ user, isSelf, onSave, onDelete }: { user: UserProfile; isSelf: boolean; onSave: (user: UserProfile) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(user);
  return <div className="p-4 grid gap-3 lg:grid-cols-[1fr_1fr_140px_auto] items-center"><div><p className="font-semibold">@{user.username}</p><p className="text-xs text-slate-500">{user.id}</p></div><input value={draft.email || ''} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-emerald-400" placeholder="Email" /><select value={draft.role || 'USER'} onChange={(event) => setDraft({ ...draft, role: event.target.value as UserProfile['role'] })} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select><div className="flex gap-2"><button onClick={() => onSave(draft)} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950">Save</button><button disabled={isSelf} onClick={() => onDelete(user.id)} title={isSelf ? 'You cannot delete yourself' : 'Delete user'} className="rounded-lg border border-rose-500/30 px-3 py-2 text-rose-300 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button></div></div>;
}
