import React, { useState, useRef } from 'react';
import { X, Check, User, ShieldCheck, Mail, Phone, Camera, Trash2, LogOut, FileText } from 'lucide-react';
import { UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { supabaseService } from '../lib/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
  onSignOut?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  onSignOut,
}) => {
  const [username, setUsername] = useState(currentUser.username);
  const [statusBio, setStatusBio] = useState(currentUser.status_bio || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSaving(true);
    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        username: username.trim().replace(/^@+/, ''),
        status_bio: statusBio.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber.trim() || undefined,
        avatar_url: avatarUrl || null,
      };

      await supabaseService.upsertProfile(updatedUser);
      onProfileUpdated(updatedUser);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profile Settings</h2>
              <p className="text-xs text-slate-400">Your account identity & contact info</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Avatar Option: Photo or Plain Monogram */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                username={username || 'User'}
                avatarUrl={avatarUrl}
                size="lg"
                isOnline={true}
                className="shadow-xl ring-2 ring-emerald-500/30"
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>@{username || 'User'}</span>
                  {avatarUrl ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold">
                      Photo Avatar
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-semibold">
                      Plain Monogram
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {avatarUrl ? 'Custom photo active' : 'Initial monogram active'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Upload avatar photo"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>{avatarUrl ? 'Change' : 'Upload'}</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
                  title="Leave it plain"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Handle / Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. flourish"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Phone & Email Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555 0199"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Bio Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bio / Humanitarian Focus
            </label>
            <textarea
              rows={2}
              value={statusBio}
              onChange={(e) => setStatusBio(e.target.value)}
              placeholder="e.g. Building accessible tech for clean water access 💧"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !username.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                {savedSuccess ? <Check className="w-4 h-4" /> : null}
                <span>{savedSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
