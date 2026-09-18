import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Flame, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Sparkles, 
  RefreshCw,
  Power,
  Droplets,
  PhoneCall,
  X,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { 
  DonorProfile, 
  UserProfile, 
  MatchRecord, 
  PreliminaryScreening 
} from '../../types/database';
import { 
  getDonorProfile, 
  toggleDonorAvailability, 
  getCooldownStatus 
} from '../../services/donorService';
import { 
  getPendingMatchesForDonor, 
  acceptMatchWithScreening, 
  rejectMatch 
} from '../../services/emergencyService';

interface DonorDashboardProps {
  currentUser: UserProfile | null;
  onOpenRegister: () => void;
  onOpenAuth: () => void;
  onOpenPremium: () => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  currentUser,
  onOpenRegister,
  onOpenAuth,
  onOpenPremium
}) => {
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [pendingMatches, setPendingMatches] = useState<(MatchRecord & { requestDetails?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Preliminary Medical Screening Modal State (PRD Section 10)
  const [activeScreeningMatch, setActiveScreeningMatch] = useState<MatchRecord | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState({
    feelingWell: true,
    recentDonation: false,
    hasInfectionSymptoms: false,
    takingMedications: false,
    previousDecline: false,
    willingForBloodBankScreening: true
  });
  const [acceptedContactInfo, setAcceptedContactInfo] = useState<any | null>(null);
  const [submittingScreening, setSubmittingScreening] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const profile = await getDonorProfile(currentUser.userId);
      setDonor(profile);
      if (profile) {
        const matches = getPendingMatchesForDonor(profile.donorId || currentUser.userId);
        setPendingMatches(matches);
      }
    } catch (err: any) {
      console.error('Error loading donor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!donor) return;
    setToggling(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetState = donor.availability === 'available' ? 'unavailable' : 'available';
    try {
      const result = await toggleDonorAvailability(donor.donorId || currentUser!.userId, targetState);
      setDonor({ ...donor, availability: result.availability });
      setSuccessMsg(result.message);

      if (result.availability === 'available') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update availability.');
    } finally {
      setToggling(false);
    }
  };

  const handleReject = async (matchId: string) => {
    if (!donor) return;
    await rejectMatch(donor.donorId || currentUser!.userId, matchId);
    setPendingMatches(prev => prev.filter(m => m.matchId !== matchId));
    setSuccessMsg('Request rejected. You will not be notified again for this request.');
  };

  const handleOpenScreening = (match: MatchRecord) => {
    setActiveScreeningMatch(match);
    setScreeningAnswers({
      feelingWell: true,
      recentDonation: false,
      hasInfectionSymptoms: false,
      takingMedications: false,
      previousDecline: false,
      willingForBloodBankScreening: true
    });
  };

  const handleSubmitScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donor || !activeScreeningMatch) return;

    if (!screeningAnswers.willingForBloodBankScreening) {
      setErrorMsg('You must agree to the blood bank screening before proceeding.');
      return;
    }

    setSubmittingScreening(true);
    setErrorMsg(null);
    try {
      const screeningPayload: PreliminaryScreening = {
        ...screeningAnswers,
        confirmedAt: new Date().toISOString()
      };

      const result = await acceptMatchWithScreening(donor.donorId || currentUser!.userId, activeScreeningMatch.matchId, screeningPayload);
      
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setAcceptedContactInfo({
        patientName: result.request.patientName,
        hospitalName: result.request.hospitalName,
        hospitalPinCode: result.request.hospitalPinCode,
        requesterPhone: result.request.requesterPhone,
        unitsRequired: result.request.unitsRequired,
        bloodGroup: result.request.bloodGroup
      });

      setActiveScreeningMatch(null);
      setSuccessMsg('Thank you! Your response has been sent to the requester.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit acceptance screening.');
    } finally {
      setSubmittingScreening(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel-elevated text-center">
        <ShieldCheck className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Donor Dashboard Access</h2>
        <p className="text-xs text-slate-400 mb-6">
          Sign in to manage your availability, receive emergency blood alerts, and view donation history.
        </p>
        <button onClick={onOpenAuth} className="btn-primary w-full justify-center text-xs font-bold">
          Sign In / Switch Persona
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-red-500" />
        <p className="text-sm">Loading donor profile & emergency alert channel...</p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 glass-panel-elevated text-center space-y-4">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">You are not registered as a Donor yet</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Complete your 1-minute donor profile to start receiving emergency requests in your PIN code area.
        </p>
        <button onClick={onOpenRegister} className="btn-primary !py-3 !px-6 text-sm font-bold mx-auto">
          <span>Register as Blood Donor</span>
        </button>
      </div>
    );
  }

  const cooldown = getCooldownStatus(donor);
  const displayName = donor.name || currentUser.name || 'Rahul Sharma';
  const displayPin = donor.pinCode || currentUser.pinCode || '530016';
  const displayPhone = donor.phone || currentUser.phone || '+91 98765 43210';
  const displayBlood = donor.bloodGroup || 'O+';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Cooldown Warning Notice if applicable */}
      {cooldown.isOnCooldown && (
        <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <strong>Medical 90-Day Cooldown Active:</strong> In recovery for {cooldown.daysRemaining} more days until {cooldown.cooldownDate?.toLocaleDateString()}. Availability toggle is automatically held.
          </div>
        </div>
      )}

      {/* Connected Requester Card upon successful acceptance (PRD Section 11) */}
      {acceptedContactInfo && (
        <div className="p-6 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-slate-100 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Response Sent! Connect with the Hospital / Requester</span>
            </div>
            <button onClick={() => setAcceptedContactInfo(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Patient & Hospital</div>
              <div className="font-bold text-white text-sm">{acceptedContactInfo.patientName}</div>
              <div className="text-slate-300">{acceptedContactInfo.hospitalName} (PIN: {acceptedContactInfo.hospitalPinCode})</div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Requester Phone</div>
                <div className="font-mono font-bold text-white text-sm">{acceptedContactInfo.requesterPhone}</div>
              </div>
              <a
                href={`tel:${acceptedContactInfo.requesterPhone}`}
                className="btn-emerald !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Profile & Live Availability Bar (PRD Section 15) */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-red-600 border-2 border-red-400 flex flex-col items-center justify-center text-white font-black text-xl shadow-xl shadow-red-950">
            <Droplets className="w-4 h-4 mb-0.5" />
            <span>{displayBlood}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{displayName}</h1>
              {donor.premiumStatus && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  Hero Premium
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>PIN Code: <strong>{displayPin}</strong></span>
              <span>•</span>
              <span>Phone: <strong>{displayPhone}</strong></span>
            </p>
          </div>
        </div>

        {/* Availability Switch (PRD Section 15) */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <div className="text-left sm:text-right">
            <div className="text-xs font-bold text-slate-200">
              {donor.availability === 'available' ? 'Available for emergency requests' : 'Currently unavailable'}
            </div>
            <div className="text-[11px] text-slate-400">
              {donor.availability === 'available' ? 'Receiving real-time alerts in PIN ' + displayPin : 'Emergency alerts paused'}
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              donor.availability === 'available'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{donor.availability === 'available' ? 'AVAILABLE' : 'UNAVAILABLE'}</span>
          </button>
        </div>
      </div>

      {/* Live Incoming Emergency Alerts (PRD Section 8 & 9) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <span>Incoming Emergency Blood Alerts ({pendingMatches.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Private PIN-code match</span>
        </div>

        {pendingMatches.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
            No active emergency blood requests in your PIN code right now. You will be notified instantly when a matching patient needs blood.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMatches.map((match) => (
              <div
                key={match.matchId}
                className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/40 border-2 border-red-600/70 shadow-2xl shadow-red-950/40 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-red-600 border border-red-400 text-white font-black text-base flex items-center justify-center shadow-lg">
                      {match.donorBloodGroup || 'O+'}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>🚨 HemoGo Blood Emergency</span>
                        <span className="text-[10px] uppercase font-bold bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded">
                          Urgent Dispatch
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        A patient urgently requires <strong>{match.donorBloodGroup || 'O+'} Blood</strong> at {match.requestDetails?.hospitalName || 'Care Hospital, Waltair Main Rd'} (PIN: <strong>{match.donorPinCode || '530016'}</strong>)
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <div>Match Score: <strong>{match.priorityScore || 100}/100</strong></div>
                    <div className="text-amber-400 font-semibold">{match.locationMatch === 'SAME_PIN' ? 'Exact PIN Match' : 'Neighboring PIN'}</div>
                  </div>
                </div>

                {/* ACCEPT / REJECT Buttons (PRD Section 9) */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleReject(match.matchId)}
                    className="btn-secondary !py-2 !px-5 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    REJECT
                  </button>

                  <button
                    onClick={() => handleOpenScreening(match)}
                    className="btn-primary !py-2 !px-6 text-xs font-black bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-950"
                  >
                    ACCEPT & PROCEED TO SCREENING
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Metrics & HemoGo Premium Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Request History */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Donor Request History</span>
          </h3>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-xl font-bold text-white">{donor.totalRequestsReceived || 12}</div>
              <div className="text-[10px] text-slate-400">Received</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-xl font-bold text-emerald-400">{donor.totalAccepted || 8}</div>
              <div className="text-[10px] text-slate-400">Accepted</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-xl font-bold text-slate-400">{donor.totalRejected || 1}</div>
              <div className="text-[10px] text-slate-400">Rejected</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-xl font-bold text-red-400">{donor.totalCompleted || 6}</div>
              <div className="text-[10px] text-slate-400">Completed</div>
            </div>
          </div>
        </div>

        {/* HemoGo Premium ₹299/yr Card */}
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 to-amber-950/20 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>HemoGo Premium — ₹299/year</span>
              </div>
              {donor.premiumStatus ? (
                <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  FREE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-2">
              Receive top priority matching during blood emergency dispatches in your PIN area with verified shield recognition.
            </p>
          </div>

          <button
            onClick={onOpenPremium}
            className="w-full btn-primary !py-2.5 text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 border-amber-400"
          >
            {donor.premiumStatus ? 'Manage Membership' : 'Upgrade to Premium (₹299/yr)'}
          </button>
        </div>

      </div>

      {/* Preliminary Medical Screening Modal (PRD Section 10) */}
      {activeScreeningMatch && (
        <div className="modal-overlay">
          <div className="glass-panel-elevated w-full max-w-lg p-6 sm:p-8 relative bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setActiveScreeningMatch(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">Donor Preliminary Health Screening</h2>
              <p className="text-xs text-slate-400 mt-1">
                Please answer these preliminary safety questions before we share contact details.
              </p>
            </div>

            <form onSubmit={handleSubmitScreening} className="space-y-4 text-xs">
              
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={screeningAnswers.feelingWell}
                  onChange={(e) => setScreeningAnswers({ ...screeningAnswers, feelingWell: e.target.checked })}
                  className="rounded text-red-600 w-4 h-4 mt-0.5"
                />
                <span className="text-slate-200">1. I am currently feeling well and healthy enough to donate.</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!screeningAnswers.recentDonation}
                  onChange={(e) => setScreeningAnswers({ ...screeningAnswers, recentDonation: !e.target.checked })}
                  className="rounded text-red-600 w-4 h-4 mt-0.5"
                />
                <span className="text-slate-200">2. I have NOT donated whole blood in the past 90 days.</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!screeningAnswers.hasInfectionSymptoms}
                  onChange={(e) => setScreeningAnswers({ ...screeningAnswers, hasInfectionSymptoms: !e.target.checked })}
                  className="rounded text-red-600 w-4 h-4 mt-0.5"
                />
                <span className="text-slate-200">3. I do NOT have any active fever, cold, or infection symptoms.</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!screeningAnswers.takingMedications}
                  onChange={(e) => setScreeningAnswers({ ...screeningAnswers, takingMedications: !e.target.checked })}
                  className="rounded text-red-600 w-4 h-4 mt-0.5"
                />
                <span className="text-slate-200">4. I am NOT taking medications that prohibit blood donation (e.g. blood thinners).</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!screeningAnswers.previousDecline}
                  onChange={(e) => setScreeningAnswers({ ...screeningAnswers, previousDecline: !e.target.checked })}
                  className="rounded text-red-600 w-4 h-4 mt-0.5"
                />
                <span className="text-slate-200">5. I have NOT been permanently deferred by any blood bank or physician.</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={screeningAnswers.willingForBloodBankScreening}
                  onChange={(e) => setScreeningAnswers({ ...screeningAnswers, willingForBloodBankScreening: e.target.checked })}
                  className="rounded text-emerald-600 w-4 h-4 mt-0.5"
                />
                <span className="text-emerald-300 font-semibold">6. I am willing to undergo the blood bank's final medical screening before donation.</span>
              </label>

              {/* Mandatory Medical Disclaimer (PRD Section 10 & 27) */}
              <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  This questionnaire is only a preliminary screening. Final eligibility and blood safety is determined by the hospital blood bank/medical professional.
                </span>
              </div>

              <button
                type="submit"
                disabled={submittingScreening}
                className="w-full btn-primary !py-3 text-sm font-bold justify-center"
              >
                {submittingScreening ? 'Confirming...' : 'Confirm Screening & Share Contact'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
