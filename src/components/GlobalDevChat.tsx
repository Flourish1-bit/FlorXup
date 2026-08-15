import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Send,
  Code,
  Copy,
  Check,
  Pin,
  Terminal,
  MessageSquare,
  Lock,
  ArrowLeft,
  MoreVertical,
  LogOut,
  Ban,
  Flag,
  Info,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Users,
  AlertTriangle,
  RotateCcw,
  Smile,
  Plus,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile, GlobalDevMessage, GroupMembershipState } from '../types';
import { supabaseService } from '../lib/supabase';
import { soundEngine } from '../lib/sound';
import { UserAvatar } from './UserAvatar';
import { ReportModal } from './ReportModal';
import { GroupInfoModal } from './GroupInfoModal';

interface GlobalDevChatProps {
  currentUser: UserProfile;
  isDarkMode: boolean;
  onOpenPrivateChatWith?: (user: UserProfile) => void;
  onBack?: () => void;
}

export const GlobalDevChat: React.FC<GlobalDevChatProps> = ({
  currentUser,
  isDarkMode,
  onOpenPrivateChatWith,
  onBack,
}) => {
  const [messages, setMessages] = useState<GlobalDevMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [messageType, setMessageType] = useState<'text' | 'code' | 'humanity_project' | 'announcement'>('text');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [showCodeBuilder, setShowCodeBuilder] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<string | null>(null);

  // Group membership and moderation states
  const [groupMembership, setGroupMembership] = useState<GroupMembershipState>(() =>
    supabaseService.getGroupMembership(currentUser.id, 'global_community')
  );
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState<{
    targetType: 'group' | 'message' | 'user';
    targetId: string;
    targetTitle: string;
    content?: string;
  }>({
    targetType: 'group',
    targetId: 'global_community',
    targetTitle: 'Global Community Hub',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync group state from storage / events
  useEffect(() => {
    const current = supabaseService.getGroupMembership(currentUser.id, 'global_community');
    setGroupMembership(current);

    const unsubscribe = supabaseService.subscribe(`group_state_${currentUser.id}`, (state: GroupMembershipState) => {
      if (state.groupId === 'global_community') {
        setGroupMembership(state);
      }
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // Close dropdown menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial global messages
  useEffect(() => {
    supabaseService.getGlobalMessages().then((msgs) => {
      setMessages(msgs);
    });

    const unsubscribe = supabaseService.subscribe('global_message', (newMsg: GlobalDevMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      soundEngine.playReceived();
    });

    const unsubscribeUpdates = supabaseService.subscribe('global_message_updated', (updatedMsg: GlobalDevMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    });

    return () => {
      unsubscribe();
      unsubscribeUpdates();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!groupMembership.isMember || groupMembership.isBlocked) {
      return;
    }

    let content = inputText.trim();

    if (showCodeBuilder && codeSnippet.trim()) {
      content = `${content ? content + '\n\n' : ''}\`\`\`${codeLanguage}\n${codeSnippet.trim()}\n\`\`\``;
    }

    if (!content) return;

    soundEngine.playSent();
    setInputText('');
    setCodeSnippet('');
    setShowCodeBuilder(false);

    await supabaseService.sendGlobalMessage(currentUser.id, content, messageType, [
      messageType,
      'code-for-humanity',
    ]);
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!groupMembership.isMember || groupMembership.isBlocked) return;
    soundEngine.playSent();
    await supabaseService.toggleGlobalReaction(messageId, emoji, currentUser.id);
  };

  const handleLeaveGroup = async () => {
    const updated = await supabaseService.leaveGroup(currentUser.id, 'global_community');
    setGroupMembership(updated);
    setShowLeaveConfirm(false);
    setShowMenuDropdown(false);
  };

  const handleRejoinGroup = async () => {
    const updated = await supabaseService.rejoinGroup(currentUser.id, 'global_community');
    setGroupMembership(updated);
  };

  const handleBlockGroup = async () => {
    const updated = await supabaseService.blockGroup(currentUser.id, 'global_community');
    setGroupMembership(updated);
    setShowBlockConfirm(false);
    setShowMenuDropdown(false);
  };

  const handleUnblockGroup = async () => {
    const updated = await supabaseService.unblockGroup(currentUser.id, 'global_community');
    setGroupMembership(updated);
  };

  const handleOpenReportGroup = () => {
    setReportConfig({
      targetType: 'group',
      targetId: 'global_community',
      targetTitle: 'Global Community Hub',
    });
    setShowReportModal(true);
    setShowMenuDropdown(false);
  };

  const handleOpenReportMessage = (msg: GlobalDevMessage) => {
    const authorName = msg.sender?.username || 'Member';
    setReportConfig({
      targetType: 'message',
      targetId: msg.id,
      targetTitle: `Message from @${authorName}`,
      content: msg.content,
    });
    setShowReportModal(true);
  };

  const codeTemplates = [
    {
      name: '💧 Water Purity IoT',
      lang: 'typescript',
      code: `interface WaterTelemetry {\n  stationId: "DEPOT-KENYA-04";\n  phLevel: 7.35;\n  turbidityNTU: 0.45; // Safe < 1.0\n  solarBatteryPercent: 94;\n  status: "POTABLE_OPTIMAL";\n}`,
    },
    {
      name: '🛰️ Disaster Relief Mesh',
      lang: 'rust',
      code: `pub struct EmergencyMeshPacket {\n    hop_count: u8,\n    geo_hash: [u8; 8],\n    priority: PacketPriority::UrgentMedical,\n    payload_signature: [u8; 64],\n}`,
    },
    {
      name: '🌱 Solar Grid Monitor',
      lang: 'javascript',
      code: `const gridStatus = {\n  location: "Community Center Alpha",\n  activeCells: 48,\n  dailyHarvestKWh: 142.6,\n  gridHealth: "OPTIMAL"\n};`,
    },
  ];

  const filteredMessages = selectedTag === 'all'
    ? messages
    : messages.filter((m) => m.message_type === selectedTag || (m.tags && m.tags.includes(selectedTag)));

  return (
    <div
      id="florxup-global-dev-chat"
      className={`flex-1 flex flex-col h-full ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      } relative`}
    >
      {/* 1. Header with Back Button, Channel Meta, Actions & Responsive Tag Filters */}
      <div
        className={`px-3 py-2.5 sm:px-4 sm:py-3 border-b shrink-0 ${
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Top Row: Navigation, Avatar, Title & Group Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Back Button for Navigation */}
            {onBack && (
              <button
                onClick={onBack}
                title="Back to Chats & Contacts"
                className={`p-2 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 min-w-[38px] min-h-[38px] ${
                  isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold hidden md:inline ml-1">Back</span>
              </button>
            )}

            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer min-w-0 flex-1"
              title="View Group Info & Safety Rules"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0 group-hover:scale-105 transition">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold leading-tight group-hover:text-cyan-400 transition truncate">
                    Global Community Hub
                  </h2>
                  {groupMembership.isBlocked ? (
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-0.5 shrink-0">
                      <Ban className="w-2.5 h-2.5" /> Blocked
                    </span>
                  ) : !groupMembership.isMember ? (
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                      <LogOut className="w-2.5 h-2.5" /> Left
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {groupMembership.isBlocked
                    ? 'Group silenced by user'
                    : 'Worldwide humanitarian channel'}
                </p>
              </div>
            </button>
          </div>

          {/* Quick Header Actions (Info, Options Menu) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowInfoModal(true)}
              title="Group Info & Safety Rules"
              className={`p-2 rounded-xl transition cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-cyan-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Group Options Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                title="Group Options & Moderation"
                className={`p-2 rounded-xl transition cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center ${
                  showMenuDropdown
                    ? 'bg-slate-700 text-white'
                    : isDarkMode
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenuDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowInfoModal(true);
                      setShowMenuDropdown(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Group Info & Rules</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  {/* Leave Group Action */}
                  {groupMembership.isMember && !groupMembership.isBlocked ? (
                    <button
                      onClick={() => {
                        setShowLeaveConfirm(true);
                        setShowMenuDropdown(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Leave Group</span>
                    </button>
                  ) : !groupMembership.isBlocked ? (
                    <button
                      onClick={() => {
                        handleRejoinGroup();
                        setShowMenuDropdown(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Rejoin Group</span>
                    </button>
                  ) : null}

                  {/* Block / Unblock Group Action */}
                  {groupMembership.isBlocked ? (
                    <button
                      onClick={() => {
                        handleUnblockGroup();
                        setShowMenuDropdown(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Unblock Group</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowBlockConfirm(true);
                        setShowMenuDropdown(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Block Group (Hide Feed)</span>
                    </button>
                  )}

                  {/* Report Group Action */}
                  <button
                    onClick={handleOpenReportGroup}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report Group</span>
                  </button>

                  {onBack && (
                    <>
                      <div className="my-1 border-t border-slate-800" />
                      <button
                        onClick={() => {
                          setShowMenuDropdown(false);
                          onBack();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Exit to Chats</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Mobile-friendly horizontally scrollable Tag Filter Bar */}
        {!groupMembership.isBlocked && (
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            {['all', 'announcement', 'code', 'humanity_project'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium capitalize whitespace-nowrap transition cursor-pointer shrink-0 ${
                  selectedTag === tag
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tag === 'all' ? 'All Updates' : tag.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. MAIN FEED AREA OR BLOCKED/LEFT NOTIFICATION */}
      {groupMembership.isBlocked ? (
        /* BLOCKED STATE VIEW */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
            <Ban className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white">Global Community Hub is Blocked</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You have blocked this group. New messages, notifications, and live broadcasts are hidden to respect your preferences.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleUnblockGroup}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unblock Group</span>
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Chats</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* NORMAL FEED (WITH OPTIONAL "LEFT GROUP" NOTICE) */
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Left Group Notice Banner */}
          {!groupMembership.isMember && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">You left this group.</span>
                  <p className="text-[11px] text-amber-300/80">
                    You can view public historical updates, but sending messages is paused.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRejoinGroup}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rejoin Group</span>
              </button>
            </div>
          )}

          {filteredMessages.map((msg) => {
            const sender = msg.sender || {
              username: 'Member_' + msg.sender_id.slice(0, 6),
              avatar_url: null,
              status_bio: 'Community Contributor',
            };
            const isCurrentUser = msg.sender_id === currentUser.id;
            const timeString = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`p-3.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl border transition ${
                  msg.pinned
                    ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : isDarkMode
                    ? 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Header with Sender Meta & Message Actions */}
                <div className="flex items-center justify-between mb-2.5 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <UserAvatar
                      username={sender.username}
                      avatarUrl={sender.avatar_url}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold text-white hover:text-cyan-400 cursor-pointer truncate"
                          onClick={() => onOpenPrivateChatWith?.(sender as UserProfile)}
                        >
                          @{sender.username}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] sm:text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            You
                          </span>
                        )}
                        {msg.message_type && (
                          <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 capitalize shrink-0">
                            {msg.message_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block">
                        {timeString} • {sender.status_bio || 'Florxup Member'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {msg.pinned && (
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Pin className="w-3 h-3" /> <span className="hidden sm:inline">Pinned</span>
                      </span>
                    )}

                    {groupMembership.isMember && (
                      <button
                        onClick={() =>
                          setActiveReactionPickerMessageId(
                            activeReactionPickerMessageId === msg.id ? null : msg.id
                          )
                        }
                        className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs ${
                          activeReactionPickerMessageId === msg.id
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-cyan-400'
                        }`}
                        title="React with emoji"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isCurrentUser && onOpenPrivateChatWith && (
                      <button
                        onClick={() => onOpenPrivateChatWith(sender as UserProfile)}
                        className="text-xs px-2 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium transition cursor-pointer flex items-center gap-1"
                        title="Send Private Message"
                      >
                        <Lock className="w-3 h-3" />
                        <span className="hidden md:inline">Message</span>
                      </button>
                    )}

                    {!isCurrentUser && (
                      <button
                        onClick={() => handleOpenReportMessage(msg)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Report this message"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Floating Emoji Picker for this message */}
                {activeReactionPickerMessageId === msg.id && groupMembership.isMember && (
                  <div className="mb-2.5 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl flex items-center gap-1.5 flex-wrap animate-fadeIn">
                    <span className="text-[10px] font-semibold text-slate-400 px-1">React:</span>
                    {['🚀', '❤️', '🛡️', '🔥', '💡', '🙌', '👏', '🎯', '💯', '✨', '⚡', '🤝'].map((emoji) => {
                      const userList = msg.reactions?.[emoji] || [];
                      const hasReacted = userList.includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          onClick={() => {
                            handleReaction(msg.id, emoji);
                            setActiveReactionPickerMessageId(null);
                          }}
                          className={`p-1.5 rounded-xl hover:scale-125 transition cursor-pointer text-sm ${
                            hasReacted ? 'bg-cyan-500/20 border border-cyan-500/40' : 'hover:bg-slate-800'
                          }`}
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Message Content: Markdown + Code Blocks */}
                <div className="text-xs sm:text-sm prose prose-invert max-w-none text-slate-200 leading-relaxed break-words">
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeContent = String(children).replace(/\n$/, '');

                        return match ? (
                          <div className="my-2.5 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
                            <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                              <span className="font-mono font-semibold uppercase text-cyan-400 text-[10px] sm:text-xs">
                                {match[1]}
                              </span>
                              <button
                                onClick={() => handleCopyCode(codeContent, msg.id)}
                                className="flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer text-[11px]"
                              >
                                {copiedCodeId === msg.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedCodeId === msg.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-3 text-[11px] sm:text-xs font-mono text-emerald-300 overflow-x-auto">
                              <code>{children}</code>
                            </pre>
                          </div>
                        ) : (
                          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Reactions Bar - Displays all active emoji reactions & fast reaction buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                  {/* Default / Active Emojis */}
                  {Array.from(
                    new Set([
                      '🚀',
                      '❤️',
                      '🛡️',
                      '🔥',
                      '💡',
                      '🙌',
                      ...Object.keys(msg.reactions || {}),
                    ])
                  ).map((emoji) => {
                    const userList = msg.reactions?.[emoji] || [];
                    const hasReacted = userList.includes(currentUser.id);
                    const count = userList.length;

                    // Only show unreacted default buttons if total count > 0 or it's one of primary top 4
                    const isTopDefault = ['🚀', '❤️', '🛡️', '🔥'].includes(emoji);
                    if (count === 0 && !isTopDefault) return null;

                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        disabled={!groupMembership.isMember}
                        title={
                          count > 0
                            ? `${count} reaction${count > 1 ? 's' : ''}${
                                hasReacted ? ' (including you)' : ''
                              }`
                            : `React with ${emoji}`
                        }
                        className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer ${
                          hasReacted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : count > 0
                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                            : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border border-slate-700/30'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="text-xs">{emoji}</span>
                        {count > 0 && <span className="font-bold text-[10px]">{count}</span>}
                      </button>
                    );
                  })}

                  {/* Add reaction trigger */}
                  {groupMembership.isMember && (
                    <button
                      onClick={() =>
                        setActiveReactionPickerMessageId(
                          activeReactionPickerMessageId === msg.id ? null : msg.id
                        )
                      }
                      className="p-1 px-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-700/30 text-[11px] flex items-center gap-1 transition cursor-pointer"
                      title="Add reaction"
                    >
                      <Plus className="w-3 h-3" />
                      <Smile className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 3. Interactive Code Builder / Snippet Drawer */}
      {showCodeBuilder && groupMembership.isMember && !groupMembership.isBlocked && (
        <div
          className={`p-4 border-t ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Terminal className="w-4 h-4" />
              <span>Instant & Secure Information Sharing (Code Snippet)</span>
            </div>
            <button
              onClick={() => setShowCodeBuilder(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 whitespace-nowrap">Examples:</span>
            {codeTemplates.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => {
                  setCodeSnippet(tpl.code);
                  setCodeLanguage(tpl.lang);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition whitespace-nowrap cursor-pointer"
              >
                {tpl.name}
              </button>
            ))}
          </div>

          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="// Paste or write code snippet here to share with the community..."
            className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* 4. Global Input Bar OR Rejoin prompt */}
      {!groupMembership.isBlocked && (
        <div
          className={`p-2.5 sm:p-3 md:p-4 border-t shrink-0 ${
            isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {groupMembership.isMember ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Post Type Selector (Compact on mobile) */}
              <select
                value={messageType}
                onChange={(e: any) => setMessageType(e.target.value)}
                className="px-2 py-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none shrink-0 max-w-[90px] sm:max-w-none cursor-pointer"
                title="Select topic category"
              >
                <option value="text">Post</option>
                <option value="code">Code</option>
                <option value="humanity_project">Project</option>
                <option value="announcement">Alert</option>
              </select>

              {/* Code Snippet Builder Trigger */}
              <button
                onClick={() => setShowCodeBuilder(!showCodeBuilder)}
                className={`p-2 sm:px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer shrink-0 min-w-[36px] min-h-[36px] ${
                  showCodeBuilder
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
                title="Attach formatted code snippet"
              >
                <Code className="w-4 h-4" />
                <span className="hidden md:inline">Snippet</span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Share an update, project or code..."
                className={`flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm focus:outline-none transition ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500 placeholder-slate-500'
                    : 'bg-slate-100 border-slate-300 text-slate-900 focus:border-cyan-600 placeholder-slate-400'
                }`}
              />

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() && !codeSnippet.trim()}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer disabled:cursor-not-allowed shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center"
                title="Send to Global Feed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-2.5 px-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <span className="text-slate-400 text-center sm:text-left">
                You must be a member to send updates in the Global Community Hub.
              </span>
              <button
                onClick={handleRejoinGroup}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-500/20 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rejoin Group</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM LEAVE GROUP MODAL */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Leave Global Community Hub?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                You will no longer be able to post messages or participate in group discussions until you choose to rejoin.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BLOCK GROUP MODAL */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Block Global Community Hub?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This will silence all community posts, hide feed updates, and pause notifications. You can unblock this group at any time.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockGroup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Block Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GROUP INFO MODAL */}
      <GroupInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        currentUser={currentUser}
        groupMembership={groupMembership}
        onLeaveGroup={() => setShowLeaveConfirm(true)}
        onRejoinGroup={handleRejoinGroup}
        onBlockGroup={() => setShowBlockConfirm(true)}
        onUnblockGroup={handleUnblockGroup}
        onOpenReport={handleOpenReportGroup}
      />

      {/* REPORT MODAL */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        currentUser={currentUser}
        targetType={reportConfig.targetType}
        targetId={reportConfig.targetId}
        targetTitle={reportConfig.targetTitle}
        offendingContent={reportConfig.content}
        onBlockRequested={() => {
          if (reportConfig.targetType === 'group') {
            handleBlockGroup();
          }
        }}
      />
    </div>
  );
};
