import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, MessageSquare, X, User } from 'lucide-react';
import { UserProfile } from '../types';
import { supabaseService } from '../lib/supabase';
import { UserAvatar } from './UserAvatar';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  contacts: UserProfile[];
  onContactAdded: (contact: UserProfile) => void;
  onStartChatWith: (contact: UserProfile) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  contacts,
  onContactAdded,
  onStartChatWith,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Existing contact ID set
  const contactIdSet = new Set(contacts.map((c) => c.id));

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      return;
    }

    // Pre-load all available users if search is empty
    supabaseService.getProfiles().then((all) => {
      setSearchResults(all.filter((p) => p.id !== currentUser.id));
    });
  }, [isOpen, currentUser.id]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      const all = await supabaseService.getProfiles();
      setSearchResults(all.filter((p) => p.id !== currentUser.id));
      return;
    }

    setIsSearching(true);
    const results = await supabaseService.searchUsers(term, currentUser.id);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAdd = async (targetUser: UserProfile) => {
    await supabaseService.addContact(currentUser.id, targetUser.id);
    setAddedIds((prev) => new Set([...prev, targetUser.id]));
    onContactAdded(targetUser);
  };

  if (!isOpen) return null;

  return (
    <div
      id="florxup-add-contact-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Add New Contact</h2>
              <p className="text-[11px] text-slate-400">Search users to connect and chat privately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username, phone number, or bio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isSearching ? (
            <div className="py-8 text-center text-xs text-slate-400">Searching directory...</div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <User className="w-6 h-6 text-slate-600" />
              <span>No users found matching "{searchTerm}"</span>
            </div>
          ) : (
            searchResults.map((user) => {
              const isAlreadyContact = contactIdSet.has(user.id) || addedIds.has(user.id);

              return (
                <div
                  key={user.id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      username={user.username}
                      avatarUrl={user.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          @{user.username}
                        </span>
                        {user.is_online && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-[220px]">
                        {user.status_bio || 'Florxup Member'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAlreadyContact ? (
                      <>
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Added
                        </span>
                        <button
                          onClick={() => {
                            onStartChatWith(user);
                            onClose();
                          }}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                          title="Start Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAdd(user)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-500/20"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
