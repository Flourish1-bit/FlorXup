import React from 'react';
import {
  X,
  Globe,
  Users,
  Shield,
  LogOut,
  Ban,
  Flag,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowRightCircle,
} from 'lucide-react';
import { UserProfile, GroupMembershipState } from '../types';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  groupMembership: GroupMembershipState;
  memberCount?: number;
  onLeaveGroup: () => void;
  onRejoinGroup: () => void;
  onBlockGroup: () => void;
  onUnblockGroup: () => void;
  onOpenReport: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  groupMembership,
  memberCount = 128,
  onLeaveGroup,
  onRejoinGroup,
  onBlockGroup,
  onUnblockGroup,
  onOpenReport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="relative p-6 bg-gradient-to-b from-slate-850 to-slate-900 border-b border-slate-800 flex flex-col items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 mb-3">
            <Globe className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-bold text-white">Global Community Hub</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Live Worldwide
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" /> {memberCount} Participants
            </span>
          </div>
        </div>

        {/* Info & Settings Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Description Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Channel Purpose
            </span>
            <p className="text-slate-300 leading-relaxed">
              Official worldwide public channel for sharing humanitarian tech projects, real-time code snippets, and collaborative open-source work.
            </p>
          </div>

          {/* Membership Status */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Your Status
              </span>
              <div className="flex items-center gap-1.5">
                {groupMembership.isBlocked ? (
                  <span className="font-bold text-rose-400 flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5" /> Group Blocked
                  </span>
                ) : groupMembership.isMember ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Member
                  </span>
                ) : (
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <LogOut className="w-3.5 h-3.5" /> Left Group
                  </span>
                )}
              </div>
            </div>

            <div>
              {groupMembership.isBlocked ? (
                <button
                  onClick={() => {
                    onUnblockGroup();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
                >
                  Unblock
                </button>
              ) : groupMembership.isMember ? (
                <button
                  onClick={() => {
                    onLeaveGroup();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Group</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onRejoinGroup();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  <ArrowRightCircle className="w-3.5 h-3.5" />
                  <span>Rejoin</span>
                </button>
              )}
            </div>
          </div>

          {/* Group Management & Safety Actions */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-1">
              Safety & Controls
            </span>

            {/* Block Group */}
            {groupMembership.isBlocked ? (
              <button
                onClick={() => {
                  onUnblockGroup();
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-slate-200 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Unblock Group</p>
                    <p className="text-[11px] text-slate-400">Resume receiving global updates</p>
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  onBlockGroup();
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-rose-500/5 border border-slate-800 hover:border-rose-500/30 text-left flex items-center justify-between text-slate-200 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Block Group</p>
                    <p className="text-[11px] text-slate-400">Silence posts and prevent notifications</p>
                  </div>
                </div>
              </button>
            )}

            {/* Report Group */}
            <button
              onClick={() => {
                onClose();
                onOpenReport();
              }}
              className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-rose-500/5 border border-slate-800 hover:border-rose-500/30 text-left flex items-center justify-between text-slate-200 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-rose-400">Report Group</p>
                  <p className="text-[11px] text-slate-400">Flag inappropriate content or harassment</p>
                </div>
              </div>
            </button>
          </div>

          {/* Privacy & Safety Note */}
          <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-cyan-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span className="text-[11px] leading-relaxed">
              Global updates are visible across the Florxup community network. For private conversations, use 1-on-1 End-to-End Encrypted Private Chats.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
