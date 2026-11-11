import React, { Suspense, lazy, useRef, useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Phone
} from 'lucide-react';
import type { UserProfile } from './types/database';
import { subscribeToSession, logoutUser } from './services/authService';
import { auth, db, isFirebaseConfigured } from './config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { parseDeepLinkRoute } from './services/deepLinkService';
import { initTheme, toggleTheme, type ThemeMode } from './services/themeService';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/home/LandingPage';
import { PhoneAuthModal } from './components/auth/PhoneAuthModal';
import { DonorRegisterModal } from './components/onboarding/DonorRegisterModal';
import { DonorConsentPrompt } from './components/onboarding/DonorConsentPrompt';
import { EmergencyRequestModal } from './components/onboarding/EmergencyRequestModal';
import { PremiumModal } from './components/premium/PremiumModal';

// three.js is heavy, so emergency screens must not wait for the decorative background.
const BackgroundErythrocyteCanvas3D = lazy(() =>
  import('./components/3d/BackgroundErythrocyteCanvas3D').then((m) => ({ default: m.BackgroundErythrocyteCanvas3D }))
);

const RequesterLiveStatus = lazy(() =>
  import('./components/emergency/RequesterLiveStatus').then((m) => ({ default: m.RequesterLiveStatus }))
);
const DonorDashboard = lazy(() =>
  import('./components/dashboard/DonorDashboard').then((m) => ({ default: m.DonorDashboard }))
);
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

type AppTab = 'home' | 'requester_status' | 'donor_dashboard' | 'admin';

// Phones and low-end machines get the plain background so the app stays responsive.
function canRunBackground3D(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return !window.matchMedia('(pointer: coarse), (max-width: 767px), (prefers-reduced-motion: reduce)').matches &&
    !nav.connection?.saveData &&
    (nav.hardwareConcurrency || 8) > 4 &&
    (nav.deviceMemory || 8) > 4;
}

const PageLoading: React.FC = () => (
  <div className="py-24 flex justify-center" role="status" aria-label="Loading">
    <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
  </div>
);

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<AppTab>(() => parseDeepLinkRoute().tab || 'home');
  const [show3D, setShow3D] = useState(false);
  const pendingAfterLogin = useRef<(() => void) | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => initTheme());
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRegisterDonorModal, setShowRegisterDonorModal] = useState(false);
  const [showDonorConsent, setShowDonorConsent] = useState(false);
  const [showCreateEmergencyModal, setShowCreateEmergencyModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const setActiveTab = (tab: AppTab) => {
    if (tab === activeTab) return;
    setActiveTabState(tab);
    window.history.pushState(null, '', tab === 'home' ? '/' : `/?tab=${tab}`);
    window.scrollTo(0, 0);
  };

  // Signing in should carry on to what the person was trying to do.
  const requireLogin = (action: () => void) => {
    if (currentUser) {
      action();
    } else {
      pendingAfterLogin.current = action;
      setShowAuthModal(true);
    }
  };

  const openEmergency = () => requireLogin(() => setShowCreateEmergencyModal(true));

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme);
  };

  useEffect(() => {
    const onPopState = () => {
      setActiveTabState(parseDeepLinkRoute().tab || 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);

    // Start the decorative scene only after the page is ready to use.
    const start3D = () => {
      if (canRunBackground3D()) setShow3D(true);
    };
    const idleId = window.requestIdleCallback ? window.requestIdleCallback(start3D, { timeout: 2500 }) : window.setTimeout(start3D, 1500);

    // Fetch the other screens quietly so opening them feels instant.
    const preload = window.setTimeout(() => {
      import('./components/emergency/RequesterLiveStatus');
      import('./components/dashboard/DonorDashboard');
    }, 2000);

    const stopSession = subscribeToSession((user) => {
      setCurrentUser(user);
      setSessionReady(true);
      if (user) {
        setSessionError(null);
        const next = pendingAfterLogin.current;
        pendingAfterLogin.current = null;
        next?.();
      }
    }, (message) => {
      setSessionError(message);
      setSessionReady(true);
    });

    return () => {
      window.removeEventListener('popstate', onPopState);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      window.clearTimeout(preload);
      stopSession();
    };
  }, []);

  // Ask every signed-in user who has no donor profile whether they are willing to donate.
  const signedInUserId = currentUser?.userId;
  const donorDecision = currentUser?.donorDecision;
  useEffect(() => {
    if (!signedInUserId || donorDecision === 'declined') {
      setShowDonorConsent(false);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, 'donors', signedInUserId))
      .then((snap) => { if (!cancelled) setShowDonorConsent(!snap.exists()); })
      .catch((err) => console.error('Donor check failed:', err));
    return () => { cancelled = true; };
  }, [signedInUserId, donorDecision]);

  const handleDonorNo = () => {
    setShowDonorConsent(false);
    if (currentUser) {
      updateDoc(doc(db, 'users', currentUser.userId), { donorDecision: 'declined', updatedAt: new Date().toISOString() })
        .catch((err) => console.error('Could not save donor choice:', err));
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#030712] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-300 relative overflow-x-clip">
      
      {/* 3D Biological Background Canvas */}
      {show3D && activeTab === 'home' && (
        <Suspense fallback={null}>
          <BackgroundErythrocyteCanvas3D theme={theme} />
        </Suspense>
      )}

      {sessionError && (
        <div role="alert" className="relative z-50 bg-amber-700 text-white text-xs font-bold text-center py-2 px-4">
          {sessionError}
        </div>
      )}

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
        sessionReady={sessionReady}
        onOpenCreateEmergency={openEmergency}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        
        {/* Tab 1: Home Landing Page */}
        {activeTab === 'home' && (
          <LandingPage
            onOpenCreateEmergency={openEmergency}
          />
        )}

        {activeTab !== 'home' && !sessionReady && <PageLoading />}

        {activeTab !== 'home' && sessionReady && (
          <Suspense fallback={<PageLoading />}>
            {activeTab === 'requester_status' && (
              <RequesterLiveStatus
                currentUser={currentUser}
                onOpenCreateEmergency={openEmergency}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === 'donor_dashboard' && (
              <DonorDashboard
                currentUser={currentUser}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            )}
          </Suspense>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/90 py-8 px-4 text-xs text-slate-500 dark:text-slate-400 relative z-10 transition-colors">
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
            <span>HemoGo connects people. Final donor eligibility is decided by the blood bank.</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // A closed dialog with no sign-in abandons the pending action.
          setTimeout(() => {
            if (!auth.currentUser) pendingAfterLogin.current = null;
          }, 0);
        }}
      />

      <DonorConsentPrompt
        isOpen={showDonorConsent && !!currentUser}
        userId={currentUser?.userId ?? ''}
        onYes={() => {
          setShowDonorConsent(false);
          setShowRegisterDonorModal(true);
        }}
        onNo={handleDonorNo}
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
