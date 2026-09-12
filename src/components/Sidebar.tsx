import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Globe,
  Search,
  Lock,
  Plus,
  Shield,
  User,
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Users,
  UserPlus,
  Trash2,
  CheckCheck,
  LogOut,
  Ban,
  RotateCcw
} from 'lucide-react';
import { UserProfile, GroupMembershipState } from '../types';
import { supabaseService } from '../lib/supabase';
import { soundEngine } from '../lib/sound';
import { UserAvatar } from './UserAvatar';
import { AddContactModal } from './AddContactModal';

interface SidebarProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  activeChatType: 'global' | 'private';
  selectedRecipient: UserProfile | null;
  onSelectGlobal: () => void;
  onSelectRecipient: (recipient: UserProfile) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onSignOut?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAdminDashboard?: () => void;
  lastMessages?: Record<string, { text: string; time: string; isSent: boolean }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  profiles,
  activeChatType,
  selectedRecipient,
  onSelectGlobal,
  onSelectRecipient,
  onOpenSettings,
  onOpenProfile,
  onSignOut,
  isDarkMode,
  onToggleTheme,
  onOpenAdminDashboard,
  lastMessages = {},
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'global'>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundEngine.enabled);
  const [groupState, setGroupState] = useState<GroupMembershipState>(() =>
    supabaseService.getGroupMembership(currentUser.id, 'global_community')
  );

  // Sync contacts and group state for current user
  useEffect(() => {
    supabaseService.getContacts(currentUser.id).then((list) => {
      setContacts(list);
    });

    const unsubscribe = supabaseService.subscribe(`contacts_${currentUser.id}`, () => {
      supabaseService.getContacts(currentUser.id).then((list) => {
        setContacts(list);
      });
    });

    const unsubscribeGroup = supabaseService.subscribe(`group_state_${currentUser.id}`, (state: GroupMembershipState) => {
      if (state.groupId === 'global_community') {
        setGroupState(state);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeGroup();
    };
  }, [currentUser.id]);

  const toggleSound = () => {
    soundEngine.enabled = !soundEngine.enabled;
    setSoundEnabled(soundEngine.enabled);
  };

  const handleRemoveContact = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabaseService.removeContact(currentUser.id, contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  // Filter out current user from all profiles
  const availableProfiles = profiles.filter((p) => p.id !== currentUser.id);

  // Filtered contacts
  const filteredContacts = contacts.filter(
    (p) =>
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.status_bio && p.status_bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtered private chat targets
  const filteredChatTargets = availableProfiles.filter(
    (p) =>
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.status_bio && p.status_bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      id="florxup-sidebar"
      className={`w-full md:w-80 lg:w-96 flex flex-col h-full border-r ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      } select-none transition-colors duration-200`}
    >
      {/* 1. Sidebar Top Header (Profile & Action Toolbar) */}
      <div
        className={`px-3 py-3 sm:px-4 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-90 transition min-w-0 flex-1"
          title="Edit your profile & avatar"
        >
          <UserAvatar
            username={currentUser.username}
            avatarUrl={currentUser.avatar_url}
            size="md"
            isOnline={true}
          />

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm leading-tight truncate group-hover:text-emerald-400 transition">
                {currentUser.username}
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                You
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {currentUser.status_bio || 'Online on Florxup'}
            </span>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={onOpenProfile}
            title="Profile & Avatar Settings"
            className={`p-2 rounded-xl transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <User className="w-4 h-4 text-emerald-400" />
          </button>

          {onOpenAdminDashboard && (
            <button
              onClick={onOpenAdminDashboard}
              title="Open admin dashboard"
              className={`p-2 rounded-xl transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                isDarkMode ? 'hover:bg-slate-800 text-amber-300' : 'hover:bg-slate-100 text-amber-600'
              }`}
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            className={`p-2 rounded-xl transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onToggleTheme}
            title="Toggle color theme"
            className={`p-2 rounded-xl transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            title="Database & Sync Settings"
            className={`p-2 rounded-xl transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Tabs (Private Chats | Contacts | Global Hub) */}
      <div
        className={`grid grid-cols-3 p-1 mx-3 mt-3 rounded-2xl border text-xs font-bold shrink-0 ${
          isDarkMode
            ? 'bg-slate-950/80 border-slate-800 text-slate-400'
            : 'bg-slate-200/80 border-slate-300 text-slate-600'
        }`}
      >
        <button
          onClick={() => {
            setActiveTab('chats');
          }}
          className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'chats'
              ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
              : 'hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chats</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('contacts');
          }}
          className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'contacts'
              ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
              : 'hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Contacts</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('global');
            onSelectGlobal();
          }}
          className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'global'
              ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
              : 'hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Global</span>
        </button>
      </div>

      {/* 3. Search Bar */}
      <div className="px-3 py-2 shrink-0">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-200 ${
            isDarkMode
              ? 'bg-slate-950/70 border-slate-800 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 text-slate-200'
              : 'bg-white border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 text-slate-800 shadow-sm'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            id="sidebar-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'contacts'
                ? 'Search saved contacts...'
                : activeTab === 'global'
                ? 'Search community posts & topics...'
                : 'Filter chats and contacts...'
            }
            className="w-full bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs flex items-center justify-center w-4 h-4"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono px-1 py-0.5 rounded bg-slate-800/40 hidden sm:inline-block">
              /
            </span>
          )}
        </div>
        {searchTerm && (
          <div className="flex items-center justify-between px-1.5 pt-1 text-[11px] text-slate-400">
            <span>
              Showing results for <span className="text-emerald-400 font-semibold">"{searchTerm}"</span>
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="hover:text-emerald-400 transition cursor-pointer font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* 4. Tab Content Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* --- TAB 1: PRIVATE CHATS --- */}
        {activeTab === 'chats' && (
          <div>
            <div className="px-3 pt-1 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                Private Chats
              </span>
              <button
                onClick={() => setIsAddContactOpen(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Chat
              </button>
            </div>

            {filteredChatTargets.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No users found for "{searchTerm}"
              </div>
            ) : (
              filteredChatTargets.map((recipient) => {
                const isSelected =
                  activeChatType === 'private' && selectedRecipient?.id === recipient.id;
                const lastMsg = lastMessages[recipient.id];

                return (
                  <button
                    key={recipient.id}
                    onClick={() => onSelectRecipient(recipient)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition text-left cursor-pointer group ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-white shadow-sm'
                          : 'bg-emerald-100/80 border border-emerald-300 text-emerald-950'
                        : isDarkMode
                        ? 'hover:bg-slate-800/60 text-slate-300'
                        : 'hover:bg-slate-200/60 text-slate-700'
                    }`}
                  >
                    <UserAvatar
                      username={recipient.username}
                      avatarUrl={recipient.avatar_url}
                      size="md"
                      isOnline={recipient.is_online}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected
                              ? 'text-white'
                              : isDarkMode
                              ? 'text-slate-200 group-hover:text-emerald-400'
                              : 'text-slate-800'
                          }`}
                        >
                          @{recipient.username}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {lastMsg ? lastMsg.time : recipient.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {lastMsg ? (
                            <span className="flex items-center gap-1">
                              {lastMsg.isSent && (
                                <CheckCheck className="w-3 h-3 text-cyan-400 shrink-0 inline" />
                              )}
                              <span>{lastMsg.text}</span>
                            </span>
                          ) : (
                            recipient.status_bio || 'Available for private messaging'
                          )}
                        </p>
                        <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* --- TAB 2: CONTACTS LIST --- */}
        {activeTab === 'contacts' && (
          <div>
            <div className="px-3 pt-1 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-emerald-400" />
                Saved Contacts ({filteredContacts.length})
              </span>
              <button
                onClick={() => setIsAddContactOpen(true)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" /> Add Contact
              </button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
                <p>No contacts saved yet.</p>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Search & Add Contacts</span>
                </button>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => onSelectRecipient(contact)}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 transition text-left cursor-pointer group ${
                    isDarkMode
                      ? 'hover:bg-slate-800/60 text-slate-300'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      username={contact.username}
                      avatarUrl={contact.avatar_url}
                      size="md"
                      isOnline={contact.is_online}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate group-hover:text-emerald-400 transition">
                          @{contact.username}
                        </span>
                        {contact.is_online && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {contact.status_bio || 'Florxup Member'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecipient(contact);
                      }}
                      className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                      title="Start Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleRemoveContact(contact.id, e)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                      title="Remove Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 3: GLOBAL COMMUNITY FEED --- */}
        {activeTab === 'global' && (
          <div className="p-3 space-y-3">
            <button
              onClick={onSelectGlobal}
              className={`w-full p-4 rounded-2xl flex flex-col gap-2 transition text-left cursor-pointer ${
                activeChatType === 'global'
                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-sm'
                  : 'bg-slate-800/40 border border-slate-800 text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/20">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white truncate">Global Community Hub</h3>
                    {groupState.isBlocked ? (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                        <Ban className="w-2.5 h-2.5" /> Blocked
                      </span>
                    ) : !groupState.isMember ? (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <LogOut className="w-2.5 h-2.5" /> Left
                      </span>
                    ) : (
                      <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        Live Feed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {groupState.isBlocked
                      ? 'Group is blocked & notifications silenced'
                      : !groupState.isMember
                      ? 'You left this group (view archives or rejoin)'
                      : 'Share updates, code snippets, and humanitarian work'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 5. Minimalist Safety Footer Indicator */}
      <div
        className={`p-3 border-t flex items-center justify-center gap-2 text-[11px] ${
          isDarkMode
            ? 'bg-slate-950/60 border-slate-800 text-slate-400'
            : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}
      >
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold text-slate-300">Protected Messaging</span>
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        currentUser={currentUser}
        contacts={contacts}
        onContactAdded={(newContact) => {
          setContacts((prev) => {
            if (prev.some((c) => c.id === newContact.id)) return prev;
            return [...prev, newContact];
          });
        }}
        onStartChatWith={(targetUser) => {
          onSelectRecipient(targetUser);
        }}
      />
    </div>
  );
};
