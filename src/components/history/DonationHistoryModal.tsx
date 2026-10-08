import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  FileText, 
  ShieldCheck, 
  Printer, 
  Heart 
} from 'lucide-react';
import type { DonationRecord } from '../../types/database';
import { getDonorDonationHistory } from '../../services/historyService';

interface DonationHistoryModalProps {
  isOpen: boolean;
  donorId: string;
  donorName: string;
  onClose: () => void;
}

export const DonationHistoryModal: React.FC<DonationHistoryModalProps> = ({
  isOpen,
  donorId,
  donorName,
  onClose
}) => {
  const [records, setRecords] = useState<DonationRecord[]>([]);
  const [selectedCert, setSelectedCert] = useState<DonationRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      const list = getDonorDonationHistory(donorId);
      setRecords(list);
    }
  }, [isOpen, donorId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-2xl p-6 sm:p-8 relative bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Donation History & Certificates</h2>
            <p className="text-xs text-slate-400">
              Verified hospital blood bank donations by {donorName}
            </p>
          </div>
        </div>

        {/* Certificate Modal View Overlay */}
        {selectedCert && (
          <div className="p-6 rounded-2xl bg-slate-950 border-2 border-amber-500/60 shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono text-[10px] text-amber-400 font-bold">
                ID: {selectedCert.certificateId}
              </span>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                Close Certificate
              </button>
            </div>

            <div className="space-y-2 py-2">
              <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500 mx-auto flex items-center justify-center text-red-400">
                <Heart className="w-6 h-6 fill-red-500 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Certificate of Blood Donation
              </h3>
              <p className="text-xs text-slate-400">
                This is to certify and honor the lifesaver contribution of
              </p>
              <div className="text-2xl font-black text-amber-400 font-serif">
                {selectedCert.donorName}
              </div>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                who voluntarily donated <strong>{selectedCert.unitsDonated} Unit ({selectedCert.bloodGroup} {selectedCert.donationType})</strong> at {selectedCert.hospitalName} for emergency medical support.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Date of Donation</div>
                <div className="font-bold text-white">{new Date(selectedCert.donatedAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Verified By</div>
                <div className="font-bold text-emerald-400">{selectedCert.bloodBankDoctor}</div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="btn-secondary !py-2 !px-4 text-xs font-bold mx-auto flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        )}

        {/* Records List */}
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.donationId}
              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold text-xs border border-red-800">
                    {rec.bloodGroup} ({rec.unitsDonated} Unit)
                  </span>
                  <span className="text-sm font-bold text-white">{rec.donationType} Donation</span>
                </div>

                <p className="text-xs text-slate-300">
                  {rec.hospitalName} (PIN: {rec.hospitalPinCode})
                </p>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Donated on {new Date(rec.donatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified by Blood Bank
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCert(rec)}
                className="btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 flex-shrink-0 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 border-amber-400"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Certificate</span>
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
