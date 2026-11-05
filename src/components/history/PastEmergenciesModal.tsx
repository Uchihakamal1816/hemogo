import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Droplet, 
  UserCheck, 
  Calendar
} from 'lucide-react';
import type { PastEmergencyRecord } from '../../types/database';
import { getRequesterPastEmergencies } from '../../services/historyService';

interface PastEmergenciesModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
}

export const PastEmergenciesModal: React.FC<PastEmergenciesModalProps> = ({
  isOpen,
  userId,
  onClose
}) => {
  const [historyList, setHistoryList] = useState<PastEmergencyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getRequesterPastEmergencies(userId).then(setHistoryList).catch(console.error).finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-2xl p-6 sm:p-8 relative bg-white dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 shadow-2xl text-slate-900 dark:text-slate-100 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-700 dark:text-red-400 shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Past Emergency Requests</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Audit trail of all your historical emergency blood requests & outcomes
            </p>
          </div>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400">Loading...</div>
          ) : historyList.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Past Emergency Requests</p>
              <p className="text-xs text-slate-500">
                You have not raised any previous requests yet. All new emergency requests will be logged here.
              </p>
            </div>
          ) : (
            historyList.map((record) => (
            <div
              key={record.historyId}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-400 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                    #{record.requestId}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{record.patientName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase flex items-center gap-1 ${record.status === 'FULFILLED' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 !border-slate-300 dark:!border-slate-700'}`}>
                    {record.status === 'FULFILLED' && <CheckCircle2 className="w-3 h-3" />}
                    <span>{record.status}</span>
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Blood Required</div>
                  <div className="font-black text-red-600 dark:text-red-500 text-sm">{record.bloodGroup} ({record.unitsRequired} Unit{record.unitsRequired === 1 ? '' : 's'})</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Hospital</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">{record.hospitalName}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Hospital PIN</div>
                  <div className="font-mono text-amber-700 dark:text-amber-400 font-bold">{record.hospitalPinCode}</div>
                </div>
              </div>

              {/* Fulfilled Donors */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Donors Who Accepted ({record.acceptedDonors.length})</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {record.acceptedDonors.map((d, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2"
                    >
                      <Droplet className="w-3 h-3 text-red-600 dark:text-red-500 fill-red-500" />
                      <span className="font-bold text-slate-900 dark:text-white">{d.donorName}</span>
                      <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">({d.donorPhone})</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))
          )}
        </div>

      </div>
    </div>
  );
};
