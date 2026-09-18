import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header.tsx';
import { CreativeStudio } from './components/CreativeStudio.tsx';
import { GeminiIntelligence } from './components/GeminiIntelligence.tsx';
import { WorkspaceHub } from './components/WorkspaceHub.tsx';
import { FirestoreHistory } from './components/FirestoreHistory.tsx';
import {
  initAuth,
  signInWithGoogle,
  logOut,
  testFirebaseConnection,
} from './lib/firebase.ts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [hasOAuthToken, setHasOAuthToken] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'creative' | 'intelligence' | 'workspace' | 'history'
  >('creative');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Run connection test per Firebase integration skill
    testFirebaseConnection();

    // Listen to Firebase Auth state
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setHasOAuthToken(!!token);
      },
      () => {
        setUser(null);
        setHasOAuthToken(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const res = await signInWithGoogle();
      if (res?.user) {
        setUser(res.user);
        setHasOAuthToken(!!res.accessToken);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      // Helpful alert for popup blocked or user cancellation
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Authentication notice: ' + (err?.message || 'Could not complete sign-in.'));
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logOut();
    setUser(null);
    setHasOAuthToken(false);
  };

  const handleSavedToCloud = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Application Bar */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        hasOAuthToken={hasOAuthToken}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'creative' && (
          <CreativeStudio
            userId={user?.uid}
            onSavedToCloud={handleSavedToCloud}
          />
        )}

        {activeTab === 'intelligence' && (
          <GeminiIntelligence
            userId={user?.uid}
            onSavedToCloud={handleSavedToCloud}
          />
        )}

        {activeTab === 'workspace' && (
          <WorkspaceHub
            userId={user?.uid}
            hasOAuthToken={hasOAuthToken}
            onConnectOAuth={handleSignIn}
          />
        )}

        {activeTab === 'history' && (
          <FirestoreHistory
            userId={user?.uid}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Gemini AI & Workspace Suite &bull; Multi-model generative intelligence & productivity</span>
          <span className="font-mono text-[11px] text-neutral-600">
            Powered by Google Gemini 3, Veo 3 & Lyria
          </span>
        </div>
      </footer>
    </div>
  );
}
