import React from 'react';
import { 
  HeartHandshake, 
  Flame, 
  Crown, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Droplet,
  Radio,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';
import type { UserProfile } from '../../types/database';
import type { ThemeMode } from '../../services/themeService';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: 'home' | 'requester_status' | 'donor_dashboard' | 'admin';
  setActiveTab: (tab: 'home' | 'requester_status' | 'donor_dashboard' | 'admin') => void;
  sessionReady: boolean;
  onOpenAuth: () => void;
  onOpenRegisterDonor: () => void;
  onOpenCreateEmergency: () => void;
  onOpenPremium: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  sessionReady,
  onOpenAuth,
  onOpenRegisterDonor,
  onOpenCreateEmergency,
  onOpenPremium,
  onLogout,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/90 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('home')} 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
                Hemo<span className="text-red-600 dark:text-red-500">Go</span>
              </span>
              <span className="hidden xl:inline text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/60">
                24/7 Dispatch
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden xl:block whitespace-nowrap">
              Blood Emergency Connection
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex whitespace-nowrap items-center gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs font-bold transition-colors">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'home'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-red-600 dark:shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => setActiveTab('requester_status')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'requester_status'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-red-600 dark:shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Live Dispatch Status</span>
          </button>

          <button
            onClick={() => setActiveTab('donor_dashboard')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'donor_dashboard'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-red-600 dark:shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Donor Dashboard</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-700 text-white shadow-md font-black'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Raise Emergency Blood CTA */}
          <button
            onClick={onOpenCreateEmergency}
            className="inline-flex whitespace-nowrap items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-all shadow-md shadow-red-600/20"
          >
            <Flame className="hidden sm:block w-3.5 h-3.5 fill-white" />
            <span className="sm:hidden">Request</span>
            <span className="hidden sm:inline">Request Blood</span>
          </button>

          {/* Become a Donor CTA */}
          <button
            onClick={onOpenRegisterDonor}
            className="hidden 2xl:inline-flex whitespace-nowrap items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-all"
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Join Donors</span>
          </button>

          {/* Premium Status or Upgrade */}
          {currentUser?.premiumStatus ? (
            <div
              onClick={onOpenPremium}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold cursor-pointer hover:scale-105 transition-all shadow-sm"
              title="HemoGo Premium (₹299/yr) Active"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400" />
              <span>Premium</span>
            </div>
          ) : (
            <button
              onClick={onOpenPremium}
              className="hidden 2xl:inline-flex whitespace-nowrap items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs hover:brightness-110 transition-all shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              <span>Premium ₹299</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* User Status / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-2.5 pr-1.5 py-1">
              <div className="text-left pr-1 hidden sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[100px]">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.phone}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !sessionReady ? (
            <div className="w-20 h-8" aria-hidden="true" />
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-secondary text-xs !py-2 !px-3 whitespace-nowrap"
            >
              <LogIn className="hidden sm:block w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>

      {/* Mobile Bar */}
      <div className="flex lg:hidden items-center justify-around mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold gap-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`py-1 px-2 rounded-lg whitespace-nowrap ${activeTab === 'home' ? 'text-white bg-slate-900 dark:text-red-400 dark:bg-red-950' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('requester_status')}
          className={`py-1 px-2 rounded-lg whitespace-nowrap ${activeTab === 'requester_status' ? 'text-white bg-slate-900 dark:text-red-400 dark:bg-red-950' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Dispatch Status
        </button>
        <button
          onClick={() => setActiveTab('donor_dashboard')}
          className={`py-1 px-2 rounded-lg whitespace-nowrap ${activeTab === 'donor_dashboard' ? 'text-white bg-slate-900 dark:text-red-400 dark:bg-red-950' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Donor Dashboard
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-1 px-2 rounded-lg whitespace-nowrap ${activeTab === 'admin' ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
