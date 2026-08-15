import React, { useState } from 'react';
import {
  Shield,
  MessageSquare,
  Globe,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Flame,
  Volume2,
  HardDrive,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Users,
  KeyRound,
  HeartHandshake,
  Check
} from 'lucide-react';
import florxupLogo from '../assets/images/florxup_logo_1786740000857.jpg';
import networkBg from '../assets/images/network_bg_1786740013014.jpg';
import { TestimonialSlider } from './TestimonialSlider';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenSignIn,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const FAQS = [
    {
      question: 'How does Florxup protect my private messages?',
      answer:
        'Florxup uses modern client-side Elliptic Curve Diffie-Hellman (ECDH P-256) combined with AES-GCM 256-bit encryption. Your private keys never leave your browser or device storage (IndexedDB). Messages are encrypted before hitting any server, so only the designated recipient can decrypt and view the plaintext.',
    },
    {
      question: 'Do I need a phone number or SIM card to sign up?',
      answer:
        'No. Unlike traditional messaging platforms, Florxup gives you total freedom: you can choose any unique username or handle without being forced to attach a phone number or real identity.',
    },
    {
      question: 'Can Florxup or third parties read my encrypted messages?',
      answer:
        'Never. Because of our zero-knowledge cryptographic architecture, the server and relays only transport encrypted binary ciphertexts and initialization vectors. Even under subpoena or server compromise, the message contents cannot be decrypted.',
    },
    {
      question: 'How does the Global Community Channel work?',
      answer:
        'The Global Community feed is an open, real-time town square for sharing announcements, humanitarian aid coordination, feedback, and technical updates. You can filter by topic tags and engage in public discussions with community members worldwide.',
    },
    {
      question: 'What happens if I lose my device or switch browsers?',
      answer:
        'Because private keys are bound to your local device vault for ultimate zero-knowledge security, you can export and backup your public/private credentials or connect to your own Supabase project for synchronized multi-device cloud relays.',
    },
  ];

  return (
    <div
      id="florxup-landing"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950"
    >
      {/* Background Ambient Glow & Network Image */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen overflow-hidden">
        <img
          src={networkBg}
          alt="Global Secure Network"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky Modern Top Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-500/30 shrink-0">
              <img
                src={florxupLogo}
                alt="Florxup Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white leading-none">Florxup</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                Secure & Fast
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Hidden on small screens) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition">
              Security
            </a>
            <a href="#testimonials" className="hover:text-emerald-400 transition">
              Testimonials
            </a>
            <a href="#impact" className="hover:text-emerald-400 transition">
              Humanitarian Impact
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              FAQ
            </a>
          </nav>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            <button
              id="landing-signin-nav-btn"
              onClick={onOpenSignIn}
              className="text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              id="landing-getstarted-nav-btn"
              onClick={onGetStarted}
              className="text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-6xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center z-10">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Code for Humanity • Zero-Knowledge Private Communication</span>
        </div>

        {/* Brand Hero Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl">
          Connect freely, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-300">
            chat with unbreakable privacy.
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          A lightning-fast WhatsApp-style messaging suite built for humanitarian responders, private conversations, and real-time global collaboration. No phone numbers required.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
          <button
            id="landing-hero-cta-btn"
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Open Florxup Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            id="landing-hero-signin-btn"
            onClick={onOpenSignIn}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-base transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Sign In to Vault</span>
          </button>
        </div>

        {/* Trust & Performance Metrics Bar */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 mb-16 p-4 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
          <div className="p-3 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">100%</p>
            <p className="text-xs text-slate-400 font-medium">Zero-Knowledge E2EE</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-cyan-400">256-Bit</p>
            <p className="text-xs text-slate-400 font-medium">ECDH + AES-GCM</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-teal-400">&lt; 50ms</p>
            <p className="text-xs text-slate-400 font-medium">Realtime Message Sync</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">0</p>
            <p className="text-xs text-slate-400 font-medium">Phone Numbers Required</p>
          </div>
        </div>

        {/* Interactive App Mockup Preview */}
        <div className="w-full max-w-4xl mb-24 rounded-3xl bg-slate-900/90 border border-slate-800 p-3 sm:p-5 shadow-2xl shadow-emerald-500/10 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-400 font-mono ml-2">florxup://e2ee-room-verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Shield className="w-3 h-3" />
              <span>ECDH P-256 Secured</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            {/* Mock Sidebar list */}
            <div className="hidden md:block p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Active Rooms</div>
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    MC
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-xs font-bold text-white">Maya Chen</div>
                    <div className="text-[10px] text-emerald-400">typing...</div>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                    AD
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-xs font-bold text-slate-200">Alex Dev</div>
                    <div className="text-[10px] text-slate-400">Key fingerprint verified</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Chat View */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/60 flex flex-col justify-between min-h-[220px]">
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl rounded-bl-xs bg-slate-900 border border-slate-800 text-slate-200 text-xs max-w-xs shadow-sm">
                    <p className="font-semibold text-emerald-400 text-[11px] mb-0.5">Maya Chen</p>
                    Medical supplies dispatch is ready for Sector 4. Coordinates attached safely.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="p-3 rounded-2xl rounded-br-xs bg-emerald-600 text-slate-950 font-medium text-xs max-w-xs shadow-md">
                    Received and verified with device session key. Logistics team deployed! 🚀
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="p-2 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Maya Chen is typing...</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> End-to-end encrypted session active
                </span>
                <button
                  onClick={onGetStarted}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                >
                  Try Now →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Core Feature Pillars */}
        <section id="features" className="w-full py-16 scroll-mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Featured Messaging Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Built for speed, privacy, and community
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Everything you need for mission-critical conversations without compromising your identity or data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-lg group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                1-on-1 End-to-End Encryption
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Peer-to-peer ECDH P-256 key exchanges generate per-session AES-GCM symmetric keys stored solely in your device vault.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 shadow-lg group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Global Community Hub
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Connect live with humanitarian teams, open-source developers, and volunteers worldwide with instant topic channels.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 transition-all duration-300 shadow-lg group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Ephemeral Self-Destruct
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Configure auto-expiring timer envelopes for sensitive data that vanish automatically upon read verification.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-lg group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Audio Synthesizer & Voice Notes
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Built-in Web Audio synthesis sound effects and secure voice note capture for hands-free communication.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 shadow-lg group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Offline-First Local Vault
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                IndexedDB-backed local key vaults ensure full functionality even with intermittent or severed network connectivity.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 transition-all duration-300 shadow-lg group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Real-Time Presence & Typing
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Supabase Realtime broadcast channels stream live typing indicators and presence updates with zero server persistence.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How It Works / Security Architecture */}
        <section id="how-it-works" className="w-full py-16 scroll-mt-20 border-t border-slate-800/80">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cryptographic Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              How Zero-Knowledge Privacy Works
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Three seamless steps guarantee your conversations stay between you and your recipient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Device Key Generation</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Your browser creates an ECDH P-256 cryptographic pair on the fly. The private key is sealed in IndexedDB and never transmitted.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-xs mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">AES-GCM Encryption</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Each message is converted into unreadable ciphertext with a random 96-bit initialization vector before relaying across the network.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-xl bg-teal-400 text-slate-950 font-black flex items-center justify-center text-xs mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Local Decryption Only</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Only the designated recipient's private key can derive the shared secret and render the original message locally.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Case Studies Intro + Slideshow Testimonials (Auto Loop) */}
        <section id="testimonials" className="w-full py-16 scroll-mt-20 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto mb-8 px-4 text-center">
            <h3 className="text-xl text-emerald-300 font-bold mb-2">Case Studies</h3>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Real deployments where Florxup made a measurable difference in coordination, safety, and delivery timelines.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-xs text-emerald-300 font-bold">Supply Chain</div>
                <div className="text-sm text-slate-200 font-semibold">Rapid medical dispatch across disrupted networks</div>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-xs text-emerald-300 font-bold">Investigations</div>
                <div className="text-sm text-slate-200 font-semibold">Secure tips collection without exposing sources</div>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-xs text-emerald-300 font-bold">Community Safety</div>
                <div className="text-sm text-slate-200 font-semibold">Local volunteers coordinate aid with minimal metadata</div>
              </div>
            </div>
          </div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Real-World Stories</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Trusted by Frontline Responders & Advocates
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Discover how humanitarian volunteers, investigative journalists, and community organizers rely on Florxup every day.
            </p>
          </div>

          {/* Testimonial Slider with Auto Loop */}
          <TestimonialSlider />
        </section>

        {/* Section 4: Humanitarian Impact & Hackathon Mission */}
        <section id="impact" className="w-full py-16 scroll-mt-20 border-t border-slate-800/80">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 text-left relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-4">
                <HeartHandshake className="w-4 h-4" />
                <span>Code for Humanity Initiative</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                Technology in Service of Human Rights & Safety
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                In times of humanitarian crises, natural disasters, or censorship crackdowns, access to secure communication is not a luxury—it is a lifeline. Florxup was designed to ensure that anyone, anywhere, can broadcast vital updates or coordinate aid without risking their safety or surveillance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Free & open for all humanitarian teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No corporate ad tracking or data brokers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lightweight bundle for low-bandwidth regions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Client-side verification against impersonation</span>
                </div>
              </div>
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <span>Join the Open Network</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ Accordion */}
        <section id="faq" className="w-full py-16 scroll-mt-20 border-t border-slate-800/80">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Got Questions? We Have Answers.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Everything you need to know about our privacy protocols, cryptography, and network.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3 text-left">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  id={`faq-item-${idx}`}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-white hover:text-emerald-400 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 6: Final High-Conversion CTA Banner */}
        <section className="w-full py-16">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-slate-950 text-center shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight">
                Start Chatting Privately Today
              </h2>
              <p className="text-sm sm:text-base font-medium text-slate-900/90 mb-8 max-w-lg mx-auto">
                No setup delays, no phone numbers, no tracking. Create your account in under 5 seconds with end-to-end encryption.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="landing-bottom-getstarted-btn"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-emerald-400 font-extrabold text-base shadow-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Launch Florxup Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  id="landing-bottom-signin-btn"
                  onClick={onOpenSignIn}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/20 hover:bg-white/30 text-slate-950 font-bold text-base transition cursor-pointer backdrop-blur-sm"
                >
                  Sign In to Existing Vault
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900/90 z-10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-800">
              <img
                src={florxupLogo}
                alt="Florxup"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white font-bold">Florxup</p>
              <p className="text-[11px] text-slate-400">Code for Humanity • E2EE Social Messaging</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <a href="#features" className="hover:text-slate-300 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-300 transition">
              Cryptography
            </a>
            <a href="#testimonials" className="hover:text-slate-300 transition">
              Testimonials
            </a>
            <a href="#faq" className="hover:text-slate-300 transition">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Online • Zero-Knowledge Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
