import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  CheckCircle2,
  ShieldAlert,
  Send,
  Flag,
  Ban,
  Radio,
} from 'lucide-react';
import { UserProfile, GroupReport } from '../types';
import { supabaseService } from '../lib/supabase';
import { soundEngine } from '../lib/sound';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  targetType: 'group' | 'message' | 'user';
  targetId: string;
  targetTitle?: string;
  offendingContent?: string;
  groupId?: string;
  onReportSubmitted?: (report: GroupReport) => void;
  onBlockRequested?: () => void;
}

const REPORT_REASONS = [
  {
    id: 'spam',
    label: 'Spam, Unsolicited Promotion or Scams',
    desc: 'Automated messages, repetitive links, phishing or advertising',
  },
  {
    id: 'harassment',
    label: 'Harassment, Bullying or Hate Speech',
    desc: 'Targeted hostility, discrimination, threats or abuse',
  },
  {
    id: 'harmful_content',
    label: 'Harmful Code, Malware or Exploit Payload',
    desc: 'Malicious scripts, harmful repositories or attack tools',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate or Explicit Content',
    desc: 'NSFW media, disturbing content or rule violations',
  },
  {
    id: 'impersonation',
    label: 'Impersonation or False Identity',
    desc: 'Pretending to be someone else or unauthorized organization',
  },
  {
    id: 'other',
    label: 'Other Safety or Policy Concern',
    desc: 'Any other issue violating community standards',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetType,
  targetId,
  targetTitle = 'Global Community Hub',
  offendingContent,
  groupId = 'global_community',
  onReportSubmitted,
  onBlockRequested,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
      const report = await supabaseService.submitReport({
        reporter_id: currentUser.id,
        target_type: targetType,
        target_id: targetId,
        group_id: groupId,
        reason: reasonObj ? reasonObj.label : selectedReason,
        details: details.trim() || undefined,
        offending_content: offendingContent?.trim() || undefined,
      });

      if (alsoBlock && onBlockRequested) {
        onBlockRequested();
      }

      soundEngine.playSent();
      setIsSubmitted(true);
      onReportSubmitted?.(report);

      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Report {targetType === 'group' ? 'Group' : targetType === 'message' ? 'Message' : 'User'}
              </h2>
              <p className="text-xs text-slate-400">
                Help keep Florxup safe and compliant for humanity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isSubmitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Thank you for keeping our community safe. Our moderation system has received your report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Target Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Reporting Target
              </span>
              <p className="font-bold text-white text-sm">{targetTitle}</p>
              {offendingContent && (
                <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-300 font-mono text-[11px] line-clamp-3">
                  "{offendingContent}"
                </div>
              )}
            </div>

            {/* Reasons List */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Why are you reporting this? *
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason.id;
                  return (
                    <label
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition text-left ${
                        isSelected
                          ? 'bg-rose-500/10 border-rose-500/50 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block text-slate-200">
                          {reason.label}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {reason.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened or provide context..."
                rows={2}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition resize-none"
              />
            </div>

            {/* Also block checkbox */}
            {onBlockRequested && (
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-850 transition">
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-rose-400" /> Also block this group
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    You won't receive messages or feed updates from this group.
                  </span>
                </div>
              </label>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
