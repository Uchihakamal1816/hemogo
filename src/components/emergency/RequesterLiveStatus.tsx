import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  MapPin, 
  CheckCircle2, 
  UserCheck, 
  RefreshCw, 
  XCircle, 
  PhoneCall 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { BloodRequest, MatchRecord, UserProfile } from '../../types/database';
import { 
  getStoredRequests, 
  getMatchesForRequest, 
  markRequestFulfilled, 
  cancelBloodRequest 
} from '../../services/emergencyService';

interface RequesterLiveStatusProps {
  currentUser: UserProfile | null;
  onOpenCreateEmergency: () => void;
  onOpenAuth: () => void;
}

export const RequesterLiveStatus: React.FC<RequesterLiveStatusProps> = ({
  currentUser,
  onOpenCreateEmergency,
  onOpenAuth
}) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // 3-second live poll for real-time donor response telemetry
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const allReqs = getStoredRequests();
    setRequests(allReqs);

    if (allReqs.length > 0) {
      const activeId = selectedRequestId || allReqs[0].requestId;
      if (!selectedRequestId) setSelectedRequestId(activeId);
      const reqMatches = getMatchesForRequest(activeId);
      setMatches(reqMatches);
    }
  };

  const handleSelectRequest = (reqId: string) => {
    setSelectedRequestId(reqId);
    setMatches(getMatchesForRequest(reqId));
  };

  const handleFulfill = async (reqId: string) => {
    await markRequestFulfilled(reqId);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    loadData();
  };

  const handleCancel = async (reqId: string) => {
    if (confirm('Are you sure you want to cancel this emergency request?')) {
      await cancelBloodRequest(reqId);
      loadData();
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel-elevated text-center">
        <Flame className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Requester Live Dispatch</h2>
        <p className="text-xs text-slate-400 mb-6">
          Sign in to track real-time emergency blood requests and view accepted donor contacts.
        </p>
        <button onClick={onOpenAuth} className="btn-primary w-full justify-center text-xs font-bold">
          Sign In
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 glass-panel-elevated text-center space-y-4">
        <Flame className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
        <h2 className="text-2xl font-black text-white">No Active Blood Requests</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Need blood urgently? Raise an emergency request to dispatch immediate notifications to matching donors in the hospital PIN area.
        </p>
        <button onClick={onOpenCreateEmergency} className="btn-primary !py-3 !px-6 text-sm font-bold mx-auto">
          <Flame className="w-4 h-4" />
          <span>Raise Blood Request Now</span>
        </button>
      </div>
    );
  }

  const currentReq = requests.find(r => r.requestId === selectedRequestId) || requests[0];
  const acceptedMatches = matches.filter(m => m.response === 'ACCEPTED');
  const pendingMatches = matches.filter(m => m.response === 'PENDING');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Request Switcher Tabs if multiple requests exist */}
      {requests.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {requests.map(r => (
            <button
              key={r.requestId}
              onClick={() => handleSelectRequest(r.requestId)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                r.requestId === selectedRequestId
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              #{r.requestId} ({r.bloodGroup} at {r.hospitalName})
            </button>
          ))}
        </div>
      )}

      {/* Main Request Live Status Card (PRD Section 12 & 13) */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-red-800/60 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/30 space-y-6">
        
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950 px-2.5 py-0.5 rounded border border-red-800">
                Blood Request #{currentReq.requestId}
              </span>
              <span className="text-xs text-slate-400">
                Created {new Date(currentReq.createdAt).toLocaleTimeString()}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>{currentReq.unitsRequired} Units of {currentReq.bloodGroup} Blood</span>
            </h1>

            <p className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>{currentReq.hospitalName} (PIN: <strong>{currentReq.hospitalPinCode}</strong>)</span>
              <span>•</span>
              <span>Patient: <strong>{currentReq.patientName}</strong></span>
            </p>
          </div>

          {/* Current Request State Badge */}
          <div className="text-left sm:text-right space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Real-Time Dispatch Status
            </div>
            
            {currentReq.status === 'FULFILLED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>REQUEST FULFILLED</span>
              </span>
            ) : currentReq.status === 'CANCELLED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
                <XCircle className="w-4 h-4" />
                <span>CANCELLED</span>
              </span>
            ) : acceptedMatches.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60 text-xs font-black animate-pulse shadow-lg shadow-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>DONOR FOUND ({acceptedMatches.length} ACCEPTED)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-950 text-red-300 border border-red-500/60 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>SEARCHING FOR DONORS</span>
              </span>
            )}
          </div>
        </div>

        {/* Telemetry Numbers */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-2xl sm:text-3xl font-black text-white">{currentReq.notifiedDonorsCount}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Suitable Donors Notified</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{acceptedMatches.length}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Donors Accepted</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{pendingMatches.length}</div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Awaiting Response</div>
          </div>
        </div>

        {/* Donors Who Accepted Cards (PRD Section 13) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Donors Who Accepted Your Request ({acceptedMatches.length})</span>
            </h2>
            <span className="text-xs text-slate-400">
              Verified after 6-question medical screening
            </span>
          </div>

          {acceptedMatches.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-500" />
              <div className="font-semibold text-slate-300">We're actively contacting suitable donors in PIN {currentReq.hospitalPinCode}</div>
              <p className="text-[11px]">As soon as a donor accepts and completes screening, their contact number will appear right here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {acceptedMatches.map((match) => (
                <div
                  key={match.matchId}
                  className="p-5 rounded-2xl bg-slate-900 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/30 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-600 border border-red-400 flex items-center justify-center text-white font-black text-base shadow-md">
                        {match.donorBloodGroup}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base flex items-center gap-1.5">
                          <span>{match.donorName}</span>
                          {match.isPremiumDonor && (
                            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded font-bold">
                              Hero
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>Donor PIN: <strong>{match.donorPinCode}</strong> ({match.locationMatch === 'SAME_PIN' ? 'Same PIN' : 'Neighbor PIN'})</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black uppercase">
                      Accepted
                    </span>
                  </div>

                  {/* Mutual Contact Action Button */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Donor Phone</div>
                      <div className="text-sm font-mono font-black text-white">{match.donorPhone}</div>
                    </div>

                    <a
                      href={`tel:${match.donorPhone}`}
                      className="btn-emerald !py-2 !px-4 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Donor</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls for Requester */}
        {currentReq.status !== 'FULFILLED' && currentReq.status !== 'CANCELLED' && (
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => handleCancel(currentReq.requestId)}
              className="btn-secondary text-xs !py-2 text-red-400 hover:text-red-300"
            >
              Cancel Blood Request
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleFulfill(currentReq.requestId)}
                className="btn-emerald text-xs !py-2.5 font-bold shadow-md shadow-emerald-950"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Request as Fulfilled</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
