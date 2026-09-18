import React from 'react';
import { 
  Flame, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Droplet, 
  Crown, 
  AlertTriangle,
  Lock
} from 'lucide-react';

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
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="glass-panel p-8 sm:p-14 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-red-950/40 border border-slate-800 text-center">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/90 text-red-400 border border-red-800/80 text-xs font-bold shadow-md">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            <span>24/7 Emergency Blood Connection Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            When Every <span className="text-red-500">Drop Matters.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            HemoGo connects people who need blood with nearby donors during emergencies — quickly, securely, and with strict privacy protection.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenCreateEmergency}
              className="btn-primary !py-3.5 !px-8 text-sm sm:text-base font-extrabold shadow-xl shadow-red-950/80 pulse-emergency"
            >
              <Flame className="w-5 h-5 text-white" />
              <span>REQUEST BLOOD NOW</span>
            </button>

            <button
              onClick={onOpenRegisterDonor}
              className="btn-emerald !py-3.5 !px-8 text-sm sm:text-base font-extrabold shadow-xl shadow-emerald-950/80"
            >
              <Droplet className="w-5 h-5 fill-white" />
              <span>BECOME A DONOR</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              Zero-Scrape Donor Privacy
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-400" />
              PIN-Code Proximity Match
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              OTP Verified Accounts
            </span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">How HemoGo Works</h2>
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
      <section className="glass-panel p-8 sm:p-10 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
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

      {/* Medical Safety Disclaimer (PRD Section 27) */}
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
