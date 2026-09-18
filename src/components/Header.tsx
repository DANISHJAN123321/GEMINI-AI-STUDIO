import React from 'react';
import { Sparkles, Database, LogOut, Layers, MessageSquareCode, Briefcase, History } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  activeTab: 'creative' | 'intelligence' | 'workspace' | 'history';
  setActiveTab: (tab: 'creative' | 'intelligence' | 'workspace' | 'history') => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  hasOAuthToken: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSignIn,
  onSignOut,
  isSigningIn,
  hasOAuthToken,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-100 text-lg tracking-tight">
                  Gemini Studio
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Multimodal & Workspace
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                All-in-one Creative Generation, Intelligence & Productivity
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
            <button
              id="nav-tab-creative"
              onClick={() => setActiveTab('creative')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'creative'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Creative Studio
            </button>
            <button
              id="nav-tab-intelligence"
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'intelligence'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <MessageSquareCode className="w-4 h-4" />
              Gemini Intelligence
            </button>
            <button
              id="nav-tab-workspace"
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'workspace'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Google Workspace
            </button>
            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <History className="w-4 h-4" />
              Firestore History
            </button>
          </nav>

          {/* Auth / Profile & Status */}
          <div className="flex items-center gap-3">
            {/* Cloud Badges */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-3.5 h-3.5" />
                Firestore Active
              </span>
              {hasOAuthToken && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Workspace Connected
                </span>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-medium text-neutral-200 max-w-[120px] truncate">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  id="sign-out-btn"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-xl border border-transparent hover:border-neutral-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Google Sign-In button adhering to official guidelines from workspace skill */
              <button
                id="google-sign-in-btn"
                onClick={onSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 rounded-xl font-medium text-xs shadow transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-neutral-800">
          <button
            onClick={() => setActiveTab('creative')}
            className={`text-xs font-semibold py-1 px-2.5 rounded-lg ${
              activeTab === 'creative' ? 'bg-blue-600 text-white' : 'text-neutral-400'
            }`}
          >
            Creative
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`text-xs font-semibold py-1 px-2.5 rounded-lg ${
              activeTab === 'intelligence' ? 'bg-blue-600 text-white' : 'text-neutral-400'
            }`}
          >
            Intelligence
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`text-xs font-semibold py-1 px-2.5 rounded-lg ${
              activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-neutral-400'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-xs font-semibold py-1 px-2.5 rounded-lg ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-neutral-400'
            }`}
          >
            History
          </button>
        </div>
      </div>
    </header>
  );
};
