import React, { useState } from 'react';
import { Database, X, Check, Key, ExternalLink, RefreshCw, Shield } from 'lucide-react';
import { supabaseService } from '../lib/supabase';
import { UserProfile } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const customCreds = supabaseService.getCustomCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(
    customCreds?.url ||
      (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : '') ||
      ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    customCreds?.key ||
      (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : '') ||
      ''
  );
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseService.initClient(supabaseUrl.trim(), supabaseKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Database & Cloud Sync</h3>
            <p className="text-xs text-slate-400">Supabase Realtime backend configuration</p>
          </div>
        </div>

        {/* Status Box */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">Active Database State</span>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              supabaseService.getIsConfigured()
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {supabaseService.getIsConfigured() ? '● Live Supabase Connected' : '● Local Encrypted Storage'}
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Supabase Project URL (Optional)
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Supabase Anon Public API Key (Optional)
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
            >
              Open Supabase Console <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save & Reconnect'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Schema file: <code className="text-slate-300 font-mono">schema.sql</code></span>
          <span className="text-emerald-400 font-medium">Code for Humanity</span>
        </div>
      </div>
    </div>
  );
};
