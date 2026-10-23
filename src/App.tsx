import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Phone
} from 'lucide-react';
import type { UserProfile } from './types/database';
import { 
  getCurrentSessionUser, 
  logoutUser, 
  type DEMO_PRESET_USERS, 
  setDemoUserPreset 
} from './services/authService';
import { parseDeepLinkRoute } from './services/deepLinkService';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/home/LandingPage';
import { PhoneAuthModal } from './components/auth/PhoneAuthModal';
import { DonorRegisterModal } from './components/onboarding/DonorRegisterModal';
import { EmergencyRequestModal } from './components/onboarding/EmergencyRequestModal';
import { RequesterLiveStatus } from './components/emergency/RequesterLiveStatus';
import { DonorDashboard } from './components/dashboard/DonorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PremiumModal } from './components/premium/PremiumModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'requester_status' | 'donor_dashboard' | 'admin'>('home');
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRegisterDonorModal, setShowRegisterDonorModal] = useState(false);
  const [showCreateEmergencyModal, setShowCreateEmergencyModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    // One-time auto-wipe of legacy demo history for brand new experience
    const CLEAN_STATE_KEY = 'hemogo_clean_state_v3';
    if (!localStorage.getItem(CLEAN_STATE_KEY)) {
      localStorage.removeItem('hemogo_past_emergencies');
      localStorage.removeItem('hemogo_donation_records');
      localStorage.removeItem('hemogo_mock_chats_v1');
      localStorage.removeItem('hemogo_mock_requests_v2');
      localStorage.removeItem('hemogo_mock_matches_v2');
      localStorage.removeItem('hemogo_mock_donors_v2');
      localStorage.removeItem('hemogo_demo_user');
      localStorage.setItem(CLEAN_STATE_KEY, 'true');
    }

    // Check deep-link query parameters on launch
    const deepLink = parseDeepLinkRoute();
    if (deepLink.tab) {
      setActiveTab(deepLink.tab);
    }

    // Load active session user if logged in, otherwise stay as clean new visitor
    const savedUser = getCurrentSessionUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      setCurrentUser(null);
    }
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const handleSelectPreset = (key: keyof typeof DEMO_PRESET_USERS) => {
    const user = setDemoUserPreset(key);
    setCurrentUser(user);
  };

  const handleResetAllData = () => {
    if (confirm('Are you sure you want to clear all data and start completely fresh?')) {
      localStorage.clear();
      localStorage.setItem('hemogo_clean_state_v3', 'true');
      setCurrentUser(null);
      setActiveTab('home');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-600 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenRegisterDonor={() => setShowRegisterDonorModal(true)}
        onOpenCreateEmergency={() => setShowCreateEmergencyModal(true)}
        onOpenPremium={() => setShowPremiumModal(true)}
        onSelectPresetUser={handleSelectPreset}
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-red-500" />
            <span className="font-black text-white text-sm">
              Hemo<span className="text-red-500">Go</span>
            </span>
            <span>— Emergency Blood Connection Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 flex-wrap">
            <span className="flex items-center gap-1 text-red-400">
              <Phone className="w-3.5 h-3.5" />
              24/7 Emergency Line: 108 / 104
            </span>
            <span>•</span>
            <span>Privacy Guarded • Firebase & Razorpay Powered</span>
            <span>•</span>
            <button 
              onClick={handleResetAllData}
              className="hover:text-red-400 transition-colors cursor-pointer text-[11px] underline"
              title="Clear all stored data and reset app to brand new"
            >
              Reset App Data
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
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
        onSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
        onPromptLogin={() => {
          setShowPremiumModal(false);
          setShowAuthModal(true);
        }}
      />

    </div>
  );
};

export default App;
