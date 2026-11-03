import React, { Suspense, lazy, useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Phone
} from 'lucide-react';
import type { UserProfile } from './types/database';
import { subscribeToSession, logoutUser } from './services/authService';
import { isFirebaseConfigured } from './config/firebase';
import { parseDeepLinkRoute } from './services/deepLinkService';
import { initTheme, toggleTheme, type ThemeMode } from './services/themeService';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/home/LandingPage';
import { PhoneAuthModal } from './components/auth/PhoneAuthModal';
import { DonorRegisterModal } from './components/onboarding/DonorRegisterModal';
import { EmergencyRequestModal } from './components/onboarding/EmergencyRequestModal';
import { RequesterLiveStatus } from './components/emergency/RequesterLiveStatus';
import { DonorDashboard } from './components/dashboard/DonorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PremiumModal } from './components/premium/PremiumModal';

// three.js is heavy, so emergency screens must not wait for the decorative background.
const BackgroundErythrocyteCanvas3D = lazy(() =>
  import('./components/3d/BackgroundErythrocyteCanvas3D').then((m) => ({ default: m.BackgroundErythrocyteCanvas3D }))
);

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'requester_status' | 'donor_dashboard' | 'admin'>('home');
  const [theme, setTheme] = useState<ThemeMode>(() => initTheme());
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRegisterDonorModal, setShowRegisterDonorModal] = useState(false);
  const [showCreateEmergencyModal, setShowCreateEmergencyModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme);
  };

  useEffect(() => {
    // Check deep-link query parameters on launch
    const deepLink = parseDeepLinkRoute();
    if (deepLink.tab) {
      setActiveTab(deepLink.tab);
    }

    return subscribeToSession(setCurrentUser);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#030712] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-300 relative overflow-x-hidden">
      
      {/* 3D Biological Background Canvas */}
      <Suspense fallback={null}>
        <BackgroundErythrocyteCanvas3D theme={theme} />
      </Suspense>

      {!isFirebaseConfigured && (
        <div className="relative z-50 bg-red-700 text-white text-xs font-bold text-center py-2 px-4">
          HemoGo is not configured. Set the Firebase values from .env.example and rebuild.
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenRegisterDonor={() => setShowRegisterDonorModal(true)}
        onOpenCreateEmergency={() => setShowCreateEmergencyModal(true)}
        onOpenPremium={() => setShowPremiumModal(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        
        {/* Tab 1: Home Landing Page */}
        {activeTab === 'home' && (
          <LandingPage
            onOpenCreateEmergency={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowCreateEmergencyModal(true);
            }}
            onOpenRegisterDonor={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowRegisterDonorModal(true);
            }}
            onOpenPremium={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowPremiumModal(true);
            }}
          />
        )}

        {/* Tab 2: Requester Live Dispatch Status Page */}
        {activeTab === 'requester_status' && (
          <RequesterLiveStatus
            currentUser={currentUser}
            onOpenCreateEmergency={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowCreateEmergencyModal(true);
            }}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {/* Tab 3: Donor Dashboard */}
        {activeTab === 'donor_dashboard' && (
          <DonorDashboard
            currentUser={currentUser}
            onOpenRegister={() => setShowRegisterDonorModal(true)}
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenPremium={() => setShowPremiumModal(true)}
          />
        )}

        {/* Tab 4: Admin Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md py-8 px-4 text-xs text-slate-500 dark:text-slate-400 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-red-500" />
            <span className="font-black text-slate-900 dark:text-white text-sm">
              Hemo<span className="text-red-500">Go</span>
            </span>
            <span>— Emergency Blood Connection Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
              <Phone className="w-3.5 h-3.5" />
              24/7 Emergency Line: 108 / 104
            </span>
            <span>•</span>
            <span>HemoGo connects people. Final donor eligibility is decided by the blood bank.</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <DonorRegisterModal
        isOpen={showRegisterDonorModal}
        currentUser={currentUser}
        onClose={() => setShowRegisterDonorModal(false)}
        onSuccess={() => {
          setActiveTab('donor_dashboard');
        }}
        onPromptLogin={() => {
          setShowRegisterDonorModal(false);
          setShowAuthModal(true);
        }}
      />

      <EmergencyRequestModal
        isOpen={showCreateEmergencyModal}
        currentUser={currentUser}
        onClose={() => setShowCreateEmergencyModal(false)}
        onSuccess={() => {
          setActiveTab('requester_status');
        }}
        onPromptLogin={() => {
          setShowCreateEmergencyModal(false);
          setShowAuthModal(true);
        }}
      />

      <PremiumModal
        isOpen={showPremiumModal}
        currentUser={currentUser}
        onClose={() => setShowPremiumModal(false)}
        onPromptLogin={() => {
          setShowPremiumModal(false);
          setShowAuthModal(true);
        }}
      />

    </div>
  );
};

export default App;
