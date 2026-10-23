import React from 'react';
import { 
  Flame, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Droplet, 
  Crown, 
  AlertTriangle,
  Lock,
  ArrowRight,
  Activity
} from 'lucide-react';
import { DispatchRadar3D } from '../3d/DispatchRadar3D';
import { BloodMatrix3D } from '../3d/BloodMatrix3D';

interface LandingPageProps {
  onOpenCreateEmergency: () => void;
  onOpenRegisterDonor: () => void;
  onOpenPremium: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenCreateEmergency,
  onOpenRegisterDonor,
  onOpenPremium
}) => {
  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="glass-panel p-8 sm:p-12 lg:p-16 relative overflow-hidden bg-white/60 dark:bg-slate-950/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl shadow-slate-200/30 dark:shadow-none transition-colors">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 dark:bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-400/10 dark:bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-3xl space-y-7 relative z-10 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/90 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/80 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <Flame className="w-4 h-4 text-red-600 dark:text-red-500" />
            <span>24/7 Emergency Blood & Platelet Dispatch</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            When Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-red-600">Drop Counts</span>,<br />
            Distance Can't Wait.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            HemoGo bridges critical blood shortages by instantly notifying verified donors in the exact hospital PIN area — powered by real-time geodesic dispatch, live GPS tracking, and zero-scrape donor privacy.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onOpenCreateEmergency}
              className="btn-primary !py-4 !px-8 text-base font-extrabold shadow-2xl shadow-red-600/30 dark:shadow-red-950/90 pulse-emergency flex items-center gap-2.5 group cursor-pointer"
            >
              <Flame className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span>REQUEST BLOOD NOW</span>
              <ArrowRight className="w-4 h-4 text-red-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenRegisterDonor}
              className="btn-emerald !py-4 !px-8 text-base font-extrabold shadow-2xl shadow-emerald-600/30 dark:shadow-emerald-950/90 flex items-center gap-2.5 cursor-pointer"
            >
              <Droplet className="w-5 h-5 fill-white" />
              <span>BECOME A DONOR</span>
            </button>
          </div>

          {/* Core Privacy & Technology Pillars */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-3 text-xs sm:text-sm">
            <span className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-Scrape Privacy</span>
            </span>
            <span className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>PIN-Code Matching</span>
            </span>
            <span className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>OTP Verified</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3D Holographic Dispatch Radar Engine */}
      <section className="space-y-4">
        <DispatchRadar3D />
      </section>

      {/* Clinical Blood Compatibility Visualizer */}
      <section className="space-y-4">
        <BloodMatrix3D />
      </section>

      {/* How It Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
            <span>Lifesaving Protocol</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">How HemoGo Works</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            A fast 4-step emergency bridge connecting patients and verified local donors
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-black flex items-center justify-center text-base border border-red-200 dark:border-red-800">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Register</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Donors and requesters register via OTP authentication with their PIN code and blood group.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-black flex items-center justify-center text-base border border-red-200 dark:border-red-800">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Raise or Receive Alert</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Requester raises an emergency blood request. Backend notifies matching donors in the hospital PIN area.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-black flex items-center justify-center text-base border border-red-200 dark:border-red-800">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Accept & Screen</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Donor clicks Accept and completes a 6-question preliminary health questionnaire.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-black flex items-center justify-center text-base border border-red-200 dark:border-red-800">
              4
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Connect & Donate</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Contact numbers are mutually revealed. The donor coordinates with hospital blood bank to complete donation.
            </p>
          </div>

        </div>
      </section>

      {/* HemoGo Premium Feature Banner */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-amber-300 dark:border-amber-500/30 bg-gradient-to-r from-amber-50/90 via-white/95 to-amber-100/50 dark:from-slate-900 dark:via-slate-900/95 dark:to-amber-950/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 transition-colors shadow-lg shadow-amber-500/5 dark:shadow-none">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-xs font-bold">
            <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>HemoGo Premium — ₹299 / Year</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Priority Emergency Matching for Dedicated Donors
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Premium members receive top priority dispatch in emergency request matching in their PIN code, instant WhatsApp notifications, and automated donation certificates.
          </p>

          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium italic">
            * Note: Premium status provides priority matching notifications but does not override medical compatibility or donor eligibility.
          </p>
        </div>

        <button
          onClick={onOpenPremium}
          className="btn-primary !py-3.5 !px-8 text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 flex-shrink-0 shadow-lg shadow-amber-500/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>Join Premium (₹299/yr)</span>
        </button>
      </section>

      {/* Medical Safety Disclaimer */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400 transition-colors shadow-sm">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Important Medical & Safety Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          HemoGo is a connection platform and does not independently determine whether a person is medically eligible to donate blood. Final donor eligibility, blood compatibility, testing, collection, and transfusion decisions must always be handled by qualified medical professionals and authorized blood banks. HemoGo is not a replacement for hospital blood banks.
        </p>
      </section>

    </div>
  );
};
