import React, { useState, useRef } from 'react';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  LogIn,
  UserPlus
} from 'lucide-react';
import florxupLogo from '../assets/images/florxup_logo_1786740000857.jpg';
import {
  generateECDHKeyPair,
  exportPublicKeyJWK,
  savePrivateKeyToIndexedDB,
  getPrivateKeyFromIndexedDB
} from '../lib/crypto';
import { supabaseService } from '../lib/supabase';
import { UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { soundEngine } from '../lib/sound';
import confetti from 'canvas-confetti';

interface AuthProps {
  onAuthenticated: (user: UserProfile) => void;
  isSupabaseConfigured: boolean;
  onOpenConfig: () => void;
  onBackToLanding?: () => void;
  initialMode?: 'signin' | 'signup';
}

export const Auth: React.FC<AuthProps> = ({
  onAuthenticated,
  isSupabaseConfigured,
  onOpenConfig,
  onBackToLanding,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign Up State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accountNotFoundInfo, setAccountNotFoundInfo] = useState<{
    identifier: string;
    password?: string;
  } | null>(null);

  const clearErrors = () => {
    setErrorMessage('');
    setAccountNotFoundInfo(null);
  };

  // Sync fields when switching tabs
  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    clearErrors();

    if (newMode === 'signup') {
      const clean = signInIdentifier.trim();
      if (clean) {
        if (clean.includes('@')) {
          if (!email) setEmail(clean);
          if (!username) setUsername(clean.split('@')[0]);
        } else if (/^[\d+\s()-]{7,}$/.test(clean)) {
          if (!phoneNumber) setPhoneNumber(clean);
          if (!username) setUsername('user_' + clean.replace(/\D/g, '').slice(-4));
        } else {
          if (!username) setUsername(clean.replace(/^@+/, ''));
        }
      }
      if (signInPassword && !password) {
        setPassword(signInPassword);
        setConfirmPassword(signInPassword);
      }
    } else {
      if (!signInIdentifier) {
        setSignInIdentifier(email || username || phoneNumber);
      }
      if (password && !signInPassword) {
        setSignInPassword(password);
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        clearErrors();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickCreateAccount = async (targetIdentifier: string, targetPass: string) => {
    clearErrors();
    const cleanId = targetIdentifier.trim();
    const cleanPass = targetPass || 'Password123!';

    let cleanUsername = cleanId.replace(/^@+/, '');
    let cleanEmail = `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@florxup.me`;
    let cleanPhone = '';

    if (cleanId.includes('@')) {
      cleanEmail = cleanId.toLowerCase();
      cleanUsername = cleanId.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    } else if (/^[\d+\s()-]{6,}$/.test(cleanId)) {
      cleanPhone = cleanId;
      cleanUsername = 'user_' + cleanId.replace(/\D/g, '').slice(-4);
      cleanEmail = `${cleanUsername}@florxup.me`;
    }

    if (!cleanUsername || cleanUsername.length < 2) {
      cleanUsername = 'user_' + Math.random().toString(36).substring(2, 6);
    }

    try {
      setLoading(true);
      setStatusMessage('Generating ECDH encryption keys for your account...');
      soundEngine.playEncryptedKey();

      const keyPair = await generateECDHKeyPair();
      const publicJWK = await exportPublicKeyJWK(keyPair.publicKey);

      setStatusMessage('Creating your secure Florxup account...');
      const userProfile = await supabaseService.signUp({
        username: cleanUsername,
        email: cleanEmail,
        phone_number: cleanPhone || undefined,
        avatarUrl: null,
        password: cleanPass,
        statusBio: 'Building for Humanity with Florxup 🚀',
        publicKey: publicJWK,
      });

      setStatusMessage('Securing local device vault...');
      await savePrivateKeyToIndexedDB(userProfile.id, keyPair.privateKey);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#14B8A6'],
      });

      onAuthenticated(userProfile);
    } catch (err: any) {
      console.error('Quick account creation error:', err);
      setErrorMessage(err?.message || 'Failed to create account. Please try signing up manually.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const cleanUsername = username.trim().replace(/^@+/, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();

    if (!cleanUsername || cleanUsername.length < 2) {
      setErrorMessage('Please provide a username with at least 2 characters.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 6) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Generating private encryption keys on your device...');
      soundEngine.playEncryptedKey();

      // 1. Generate client-side ECDH P-256 cryptographic key pair
      const keyPair = await generateECDHKeyPair();
      const publicJWK = await exportPublicKeyJWK(keyPair.publicKey);

      setStatusMessage('Creating your secure Florxup account...');
      
      // 2. Register with service
      const userProfile = await supabaseService.signUp({
        username: cleanUsername,
        email: cleanEmail,
        phone_number: cleanPhone,
        avatarUrl: avatarUrl || null,
        password: password,
        statusBio: bio.trim() || 'Building for Humanity with Florxup 🚀',
        publicKey: publicJWK,
      });

      // 3. Store private key safely in IndexedDB on this device
      setStatusMessage('Securing local device vault...');
      await savePrivateKeyToIndexedDB(userProfile.id, keyPair.privateKey);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#14B8A6'],
      });

      onAuthenticated(userProfile);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const cleanIdentifier = signInIdentifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your username, email, or phone number.');
      return;
    }

    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Authenticating...');
      soundEngine.playEncryptedKey();

      const userProfile = await supabaseService.signIn(cleanIdentifier, signInPassword);

      // Verify or initialize local private key for device
      setStatusMessage('Loading private encryption keys...');
      const existingKey = await getPrivateKeyFromIndexedDB(userProfile.id);
      if (!existingKey) {
        // If logging into a new browser session, generate and re-bind device key
        const keyPair = await generateECDHKeyPair();
        await savePrivateKeyToIndexedDB(userProfile.id, keyPair.privateKey);
        const pubJWK = await exportPublicKeyJWK(keyPair.publicKey);
        userProfile.public_key = pubJWK;
        await supabaseService.upsertProfile(userProfile);
      }

      onAuthenticated(userProfile);
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errMsg = err?.message || 'Failed to sign in. Please check your credentials.';
      setErrorMessage(errMsg);
      if (errMsg.toLowerCase().includes('account not found')) {
        setAccountNotFoundInfo({ identifier: cleanIdentifier, password: signInPassword });
      }
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div
      id="florxup-auth-container"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden font-sans"
    >
      {/* Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer flex items-center gap-1 text-xs"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-500/30 shrink-0">
            <img
              src={florxupLogo}
              alt="Florxup Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Florxup</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md z-10">
        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Account Not Found Smart Resolution Banner */}
        {accountNotFoundInfo && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-200">
                <span className="font-bold text-emerald-400">Account not found</span> for "{accountNotFoundInfo.identifier}".
                <p className="text-slate-400 mt-0.5">
                  Would you like to create this account now with end-to-end encryption?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() =>
                  handleQuickCreateAccount(
                    accountNotFoundInfo.identifier,
                    accountNotFoundInfo.password || signInPassword
                  )
                }
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create & Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Customize
              </button>
            </div>
          </div>
        )}

        {/* Standard Error Alert (if not account not found banner) */}
        {errorMessage && !accountNotFoundInfo && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* 1. Sign In Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username, Email, or Phone Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={signInIdentifier}
                  onChange={(e) => setSignInIdentifier(e.target.value)}
                  placeholder="e.g. flourish, name@mail.com, or +1234567890"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !signInIdentifier.trim() || !signInPassword}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>{statusMessage || 'Signing in...'}</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        ) : (
          /* 2. Sign Up Form */
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Avatar Photo vs Plain Initial Monogram Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  username={username || 'User'}
                  avatarUrl={avatarUrl}
                  size="lg"
                  className="ring-2 ring-emerald-500/30"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Avatar Option</span>
                    {avatarUrl ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold">
                        Photo
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-semibold">
                        Plain Monogram
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {avatarUrl ? 'Custom photo selected' : 'Using initials monogram badge'}
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Display Handle *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. flourish, alex_dev, maya"
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 0199"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-8 pr-8 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bio / Humanitarian Focus (Optional)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Clean water access & open source relief tech 💧"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !email.trim() || !phoneNumber.trim() || !password}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>{statusMessage || 'Creating account...'}</span>
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Security & Privacy Guarantee */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Shield className="w-3.5 h-3.5" /> End-to-End Private
          </span>
          <span>Keys stay on your device</span>
        </div>
      </div>
    </div>
  );
};
