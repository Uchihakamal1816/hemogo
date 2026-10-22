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
import { BloodCellCanvas3D } from '../3d/BloodCellCanvas3D';
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
      
      {/* 3D Hero Section */}
      <section className="glass-panel p-6 sm:p-10 lg:p-14 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/30 border border-slate-800 rounded-3xl">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Headlines & Emergency CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/90 text-red-400 border border-red-800/80 text-xs font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <Flame className="w-4 h-4 text-red-500" />
              <span>24/7 Emergency Blood & Platelet Dispatch</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              When Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-600">Drop Counts</span>,<br />
              Distance Can't Wait.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl leading-relaxed">
              HemoGo bridges critical blood shortages by instantly notifying verified donors in the exact hospital PIN area — powered by real-time geodesic dispatch, live GPS tracking, and zero-scrape donor privacy.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenCreateEmergency}
                className="btn-primary !py-3.5 !px-8 text-sm sm:text-base font-extrabold shadow-2xl shadow-red-950/90 pulse-emergency flex items-center gap-2 group"
              >
                <Flame className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span>REQUEST BLOOD NOW</span>
                <ArrowRight className="w-4 h-4 text-red-200 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenRegisterDonor}
                className="btn-emerald !py-3.5 !px-8 text-sm sm:text-base font-extrabold shadow-2xl shadow-emerald-950/90 flex items-center gap-2"
              >
                <Droplet className="w-5 h-5 fill-white" />
                <span>BECOME A DONOR</span>
              </button>
            </div>

            {/* Core Privacy & Technology Pillars */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400">
              <span className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Zero-Scrape Privacy</span>
              </span>
              <span className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <MapPin className="w-4 h-4 text-red-400" />
                <span>PIN-Code Matching</span>
              </span>
              <span className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>OTP Verified</span>
              </span>
            </div>
          </div>

          {/* Right Column: 3D Interactive WebGL Erythrocyte Simulation */}
          <div className="lg:col-span-5 h-[380px] sm:h-[440px] relative">
            <BloodCellCanvas3D />
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-red-500" />
            <span>Lifesaving Protocol</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">How HemoGo Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            A fast 4-step emergency bridge connecting patients and verified local donors
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-950 text-red-400 font-black flex items-center justify-center text-base border border-red-800">
              1
            </div>
            <h3 className="font-bold text-white text-base">Register</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Donors and requesters register via OTP authentication with their PIN code and blood group.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-950 text-red-400 font-black flex items-center justify-center text-base border border-red-800">
              2
            </div>
            <h3 className="font-bold text-white text-base">Raise or Receive Alert</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Requester raises an emergency blood request. Backend notifies matching donors in the hospital PIN area.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-950 text-red-400 font-black flex items-center justify-center text-base border border-red-800">
              3
            </div>
            <h3 className="font-bold text-white text-base">Accept & Screen</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Donor clicks Accept and completes a 6-question preliminary health questionnaire.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-950 text-red-400 font-black flex items-center justify-center text-base border border-red-800">
              4
            </div>
            <h3 className="font-bold text-white text-base">Connect & Donate</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contact numbers are mutually revealed. The donor coordinates with hospital blood bank to complete donation.
            </p>
          </div>

        </div>
      </section>

      {/* HemoGo Premium Feature Banner */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-amber-950/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 text-xs font-bold">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>HemoGo Premium — ₹299 / Year</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Priority Emergency Matching for Dedicated Donors
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Premium members receive top priority dispatch in emergency request matching in their PIN code, instant WhatsApp notifications, and automated donation certificates.
          </p>

          <p className="text-[11px] text-amber-400 italic">
            * Note: Premium status provides priority matching notifications but does not override medical compatibility or donor eligibility.
          </p>
        </div>

        <button
          onClick={onOpenPremium}
          className="btn-primary !py-3.5 !px-8 text-sm font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 border-amber-400 flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Join Premium (₹299/yr)</span>
        </button>
      </section>

      {/* Medical Safety Disclaimer */}
      <section className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
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
