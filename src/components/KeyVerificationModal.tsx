import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, CheckCircle, Copy, Check, Lock, QrCode } from 'lucide-react';
import { UserProfile } from '../types';
import { generateSafetyFingerprint } from '../lib/crypto';

interface KeyVerificationModalProps {
  currentUser: UserProfile;
  recipient: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const KeyVerificationModal: React.FC<KeyVerificationModalProps> = ({
  currentUser,
  recipient,
  isOpen,
  onClose,
}) => {
  const [fingerprint, setFingerprint] = useState<{ fingerprint: string; blocks: string[]; hexDigest: string }>({
    fingerprint: 'Loading...',
    blocks: ['0000', '0000', '0000', '0000', '0000', '0000'],
    hexDigest: 'FLORXUP-E2EE-VERIFIED',
  });
  const [copied, setCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser.public_key && recipient.public_key) {
      generateSafetyFingerprint(currentUser.public_key, recipient.public_key).then((res) => {
        setFingerprint(res);
      });
    }
  }, [isOpen, currentUser, recipient]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint.fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Verify Security Code</h3>
            <p className="text-xs text-slate-400">End-to-End Encryption Safety Numbers</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          To verify that messages and calls with <strong className="text-emerald-400">@{recipient.username}</strong> are end-to-end encrypted, compare these 24 numbers with their screen.
        </p>

        {/* Security Safety Number Blocks */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-4 text-center">
          <div className="grid grid-cols-3 gap-2.5 font-mono text-sm sm:text-base font-bold tracking-widest text-emerald-400">
            {fingerprint.blocks.map((block, idx) => (
              <span key={idx} className="bg-slate-900/90 py-2 rounded-lg border border-slate-800/80">
                {block}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
            <span className="font-mono text-[11px] truncate max-w-[200px]">
              ID: {fingerprint.hexDigest}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Visual Simulated QR Verification Pattern */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-950" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Cryptographic Fingerprint Match</div>
              <div className="text-[11px] text-slate-400">Curve: ECDH P-256 (NIST standard)</div>
            </div>
          </div>

          <button
            onClick={() => setIsVerified(!isVerified)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isVerified
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isVerified ? 'Verified' : 'Verify'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};
