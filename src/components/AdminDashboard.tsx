import React, { useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CheckCircle2, DollarSign, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { GroupReport, UserProfile } from '../types';
import { supabaseService } from '../lib/supabase';

interface AdminDashboardProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, profiles, onBack }) => {
  const [users, setUsers] = useState(profiles);
  const [reports, setReports] = useState<GroupReport[]>(() => supabaseService.getReports());
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

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

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">User management</h2><p className="text-xs text-slate-400 mt-1">Edit profiles, assign roles, or remove accounts.</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><Search className="w-4 h-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="bg-transparent outline-none w-40" /></label></div>
          <div className="divide-y divide-slate-800">
            {filteredUsers.map((user) => <UserRow key={user.id} user={user} isSelf={user.id === currentUser.id} onSave={saveUser} onDelete={deleteUser} />)}
            {filteredUsers.length === 0 && <p className="p-6 text-sm text-slate-400">No users match this search.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden"><div className="p-4 border-b border-slate-800"><h2 className="font-bold">Moderation queue</h2><p className="text-xs text-slate-400 mt-1">Review reports and record the decision.</p></div>{reports.length === 0 ? <p className="p-6 text-sm text-slate-400">No reports have been submitted.</p> : <div className="divide-y divide-slate-800">{reports.map((report) => <div key={report.id} className="p-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{report.reason}</p><p className="text-xs text-slate-400 mt-1">Target: {report.target_type} · {new Date(report.created_at).toLocaleString()}</p>{report.details && <p className="text-xs text-slate-300 mt-2">{report.details}</p>}</div><select value={report.status} onChange={(event) => updateReport(report.id, event.target.value as GroupReport['status'])} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs"><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option></select></div>)}</div>}</section>
      </div>
    </main>
  );
};

function Metric({ icon, label, value }: { icon: React.ReactElement<{ className?: string }>; label: string; value: React.ReactNode }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center justify-between text-emerald-400"><span className="text-xs text-slate-400">{label}</span>{React.cloneElement(icon, { className: 'w-4 h-4' })}</div><p className="text-2xl font-black mt-3">{value}</p></div>; }

function UserRow({ user, isSelf, onSave, onDelete }: { user: UserProfile; isSelf: boolean; onSave: (user: UserProfile) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(user);
  return <div className="p-4 grid gap-3 lg:grid-cols-[1fr_1fr_140px_auto] items-center"><div><p className="font-semibold">@{user.username}</p><p className="text-xs text-slate-500">{user.id}</p></div><input value={draft.email || ''} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-emerald-400" placeholder="Email" /><select value={draft.role || 'USER'} onChange={(event) => setDraft({ ...draft, role: event.target.value as UserProfile['role'] })} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select><div className="flex gap-2"><button onClick={() => onSave(draft)} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950">Save</button><button disabled={isSelf} onClick={() => onDelete(user.id)} title={isSelf ? 'You cannot delete yourself' : 'Delete user'} className="rounded-lg border border-rose-500/30 px-3 py-2 text-rose-300 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button></div></div>;
}
