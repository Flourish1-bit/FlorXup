import React, { useState, useEffect } from 'react';
import { Shield, Globe } from 'lucide-react';
import { UserProfile } from './types';
import { supabaseService } from './lib/supabase';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { PrivateChat } from './components/PrivateChat';
import { GlobalDevChat } from './components/GlobalDevChat';
import { ProfileModal } from './components/ProfileModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return supabaseService.getStoredSession();
  });
  const [authView, setAuthView] = useState<'landing' | 'auth'>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signup');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeChatType, setActiveChatType] = useState<'global' | 'private'>('global');
  const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // Load profiles on mount & listen for real-time updates
  useEffect(() => {
    async function loadData() {
      if (supabaseService.getIsConfigured()) {
        await supabaseService.syncAllAuthProfiles();
      }

      if (currentUser?.id) {
        const repaired = await supabaseService.ensureProfileKeyForUser(currentUser.id);
        if (repaired) {
          setCurrentUser(repaired);
          supabaseService.setStoredSession(repaired);
        }
      }

      const allProfiles = await supabaseService.getProfiles();
      setProfiles(allProfiles);
    }
    loadData();

    const unsubscribe = supabaseService.subscribe('profile_updated', (updated: UserProfile) => {
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      if (currentUser?.id === updated.id) {
        setCurrentUser(updated);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    setProfiles((prev) => {
      if (prev.some((p) => p.id === user.id)) {
        return prev.map((p) => (p.id === user.id ? user : p));
      }
      return [...prev, user];
    });
  };

  const handleSignOut = async () => {
    if (currentUser) {
      await supabaseService.signOut(currentUser.id);
    }
    setCurrentUser(null);
    setSelectedRecipient(null);
    setActiveChatType('global');
    setAuthView('landing');
  };

  const handleProfileUpdated = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setProfiles((prev) =>
      prev.map((p) => (p.id === updatedUser.id ? updatedUser : p))
    );
  };

  const handleSelectGlobal = () => {
    setActiveChatType('global');
    setSelectedRecipient(null);
    setMobileView('chat');
  };

  const handleSelectRecipient = (recipient: UserProfile) => {
    setActiveChatType('private');
    setSelectedRecipient(recipient);
    setMobileView('chat');
  };

  // 1. If not authenticated, render either Landing Page or Auth Form
  if (!currentUser) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => {
            setAuthInitialMode('signup');
            setAuthView('auth');
          }}
          onOpenSignIn={() => {
            setAuthInitialMode('signin');
            setAuthView('auth');
          }}
        />
      );
    }

    return (
      <Auth
        initialMode={authInitialMode}
        onAuthenticated={handleAuthenticated}
        isSupabaseConfigured={supabaseService.getIsConfigured()}
        onOpenConfig={() => setIsConfigOpen(true)}
        onBackToLanding={() => setAuthView('landing')}
      />
    );
  }

  // 2. Main Authenticated Chat App
  return (
    <div
      className={`h-screen w-screen flex overflow-hidden font-sans ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Left Sidebar (WhatsApp-Style Chat & Contact List) */}
      <div
        className={`h-full md:block ${
          mobileView === 'sidebar' ? 'w-full' : 'hidden'
        } md:w-80 lg:w-96 shrink-0`}
      >
        <Sidebar
          currentUser={currentUser}
          profiles={profiles}
          activeChatType={activeChatType}
          selectedRecipient={selectedRecipient}
          onSelectGlobal={handleSelectGlobal}
          onSelectRecipient={handleSelectRecipient}
          onOpenSettings={() => setIsConfigOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onSignOut={handleSignOut}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* 2. Right Main Chat Screen */}
      <div
        className={`h-full flex-1 flex flex-col ${
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeChatType === 'global' ? (
          <GlobalDevChat
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            onOpenPrivateChatWith={(user) => {
              handleSelectRecipient(user);
            }}
            onBack={() => {
              setMobileView('sidebar');
              setActiveChatType('private');
              setSelectedRecipient(null);
            }}
          />
        ) : selectedRecipient ? (
          <PrivateChat
            key={selectedRecipient.id + '_' + currentUser.id}
            currentUser={currentUser}
            recipient={selectedRecipient}
            isDarkMode={isDarkMode}
            onBackMobile={() => setMobileView('sidebar')}
          />
        ) : (
          /* Empty / Default Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-1 mb-4 shadow-xl shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[20px] flex items-center justify-center text-emerald-400">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Florxup Messaging</h2>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              End-to-End Private Messaging and Global Community Hub for the Code for Humanity Hackathon.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectGlobal}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Globe className="w-4 h-4" /> Open Global Community Hub
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onProfileUpdated={handleProfileUpdated}
          onSignOut={handleSignOut}
        />
      )}

      {/* 4. Global Cloud Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
