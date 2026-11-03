import React, { useState, useEffect } from 'react';
import { X, Navigation, Clock, PhoneCall, MapPin } from 'lucide-react';
import type { DonorLiveLocation } from '../../types/database';
import { subscribeToLocation } from '../../services/locationService';

interface DonorLiveTrackerProps {
  isOpen: boolean;
  matchId: string;
  donorName: string;
  donorPhone: string;
  hospitalName: string;
  onClose: () => void;
  onOpenChat: () => void;
}

export const DonorLiveTracker: React.FC<DonorLiveTrackerProps> = ({
  isOpen,
  matchId,
  donorName,
  donorPhone,
  hospitalName,
  onClose,
  onOpenChat
}) => {
  const [location, setLocation] = useState<DonorLiveLocation | null>(null);

  useEffect(() => {
    if (isOpen) return subscribeToLocation(matchId, setLocation);
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  const mapsUrl = location
    ? `https://www.google.com/maps/search/?api=1&query=${location.currentLat},${location.currentLng}`
    : null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-lg p-6 sm:p-8 relative bg-white dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 shadow-2xl text-slate-900 dark:text-slate-100 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Donor Location</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">{donorName} travelling to {hospitalName}</p>
          </div>
        </div>

        {!location ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
            {donorName} has not shared a location yet. You can call or chat instead.
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Estimated Arrival</div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <Clock className="w-7 h-7" />
                  <span>
                    {location.status === 'arrived' ? 'Arrived' : location.estimatedMinutes === null ? 'Unknown' : `~${location.estimatedMinutes} min`}
                  </span>
                </div>
              </div>
              {location.distanceKm !== null && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Straight-line distance</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{location.distanceKm} km</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <span>Updated {new Date(location.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Open in Maps</span>
                </a>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${donorPhone}`} className="btn-emerald !py-2.5 text-xs font-bold justify-center flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Donor</span>
          </a>
          <button
            onClick={() => { onClose(); onOpenChat(); }}
            className="btn-primary !py-2.5 text-xs font-bold justify-center"
          >
            <span>Open Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
