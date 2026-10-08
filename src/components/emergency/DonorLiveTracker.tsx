import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Clock, 
  Bike, 
  PhoneCall
} from 'lucide-react';
import type { DonorLiveLocation } from '../../types/database';
import { getInitialDonorLocation } from '../../services/locationService';

interface DonorLiveTrackerProps {
  isOpen: boolean;
  donorId: string;
  requestId: string;
  matchId: string;
  donorName: string;
  donorPhone: string;
  hospitalName: string;
  onClose: () => void;
  onOpenChat: () => void;
}

export const DonorLiveTracker: React.FC<DonorLiveTrackerProps> = ({
  isOpen,
  donorId,
  requestId,
  matchId,
  donorName,
  donorPhone,
  hospitalName,
  onClose,
  onOpenChat
}) => {
  const [locationState, setLocationState] = useState<DonorLiveLocation | null>(null);

  useEffect(() => {
    if (isOpen) {
      const init = getInitialDonorLocation({
        donorId,
        requestId,
        matchId,
        donorName,
        hospitalName
      });
      setLocationState(init);
    }
  }, [isOpen, donorId, requestId, matchId, donorName, hospitalName]);

  if (!isOpen || !locationState) return null;

  const handleSimulateCloser = () => {
    setLocationState(prev => {
      if (!prev) return null;
      const newDistance = Math.max(0, Math.round((prev.distanceKm - 0.9) * 10) / 10);
      const newMinutes = Math.max(1, Math.round(newDistance * 3.5));
      const newStatus = newDistance === 0 ? 'arrived' : newDistance < 0.8 ? 'nearby' : 'en_route';

      return {
        ...prev,
        distanceKm: newDistance,
        estimatedMinutes: newMinutes,
        status: newStatus,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const progressPercent = Math.min(100, Math.max(10, Math.round((1 - locationState.distanceKm / 3.5) * 100)));

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-lg p-6 sm:p-8 relative bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950 animate-pulse">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Live Donor Proximity & ETA</h2>
            <p className="text-xs text-slate-400">
              Tracking {donorName}'s live travel status to {hospitalName}
            </p>
          </div>
        </div>

        {/* Distance & ETA Hero Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/50 shadow-xl space-y-5">
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Estimated Arrival (ETA)
              </div>
              <div className="text-3xl font-black text-emerald-400 flex items-center gap-2">
                <Clock className="w-7 h-7" />
                <span>{locationState.status === 'arrived' ? 'ARRIVED!' : `~${locationState.estimatedMinutes} Mins`}</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Distance
              </div>
              <div className="text-2xl font-black text-white">
                {locationState.distanceKm} km
              </div>
            </div>
          </div>

          {/* Animated Route Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-emerald-400" />
                <span>{donorName} (Donor)</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>{hospitalName}</span>
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700 relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">
              Status: <strong className="text-emerald-400 uppercase">{locationState.status.replace('_', ' ')}</strong>
            </span>
            <span className="text-slate-400 text-[11px]">
              Updated just now • Mode: <strong>Two-Wheeler (Fast)</strong>
            </span>
          </div>

        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSimulateCloser}
            className="btn-secondary !py-2.5 text-xs font-bold justify-center"
          >
            <span>Simulate Approaching</span>
          </button>

          <button
            onClick={() => { onClose(); onOpenChat(); }}
            className="btn-primary !py-2.5 text-xs font-bold justify-center"
          >
            <span>Open In-App Chat</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Direct Phone</div>
            <div className="font-mono font-bold text-white">{donorPhone}</div>
          </div>
          <a
            href={`tel:${donorPhone}`}
            className="btn-emerald !py-1.5 !px-3.5 text-xs font-bold flex items-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Donor</span>
          </a>
        </div>

      </div>
    </div>
  );
};
