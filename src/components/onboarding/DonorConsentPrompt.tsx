import React, { useState } from 'react';
import { Droplet, Bell } from 'lucide-react';
import { enablePushAlerts } from '../../services/notificationService';

interface DonorConsentPromptProps {
  isOpen: boolean;
  userId: string;
  onYes: () => void;
  onNo: () => void;
}

/**
 * Asks a signed-in user whether they are willing to become a blood donor.
 * "Yes" turns on alerts and then opens the donor registration form.
 * "No" is recorded so the question is not asked again.
 */
export const DonorConsentPrompt: React.FC<DonorConsentPromptProps> = ({ isOpen, userId, onYes, onNo }) => {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleYes = async () => {
    setBusy(true);
    setNote(null);
    try {
      // Must run directly from this click so the browser allows the notification prompt.
      await enablePushAlerts(userId);
      onYes();
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Alerts could not be turned on.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="donor-consent-title" className="glass-panel-elevated max-w-md w-full p-6 space-y-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-red-500 fill-red-500" />
          <h2 id="donor-consent-title" className="text-lg font-bold text-slate-900 dark:text-white">Become a blood donor?</h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Donors in your PIN area receive emergency blood request alerts that match their blood group.
          Your phone number is shared only after you accept a request and complete the health screening.
        </p>

        {note && <p className="text-xs text-amber-600 dark:text-amber-400">{note}</p>}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleYes}
            className="btn-primary !py-3 !px-6 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Bell className="w-4 h-4" />
            <span>{busy ? 'Setting up alerts...' : 'Yes, I am willing to donate'}</span>
          </button>

          {note && (
            <button
              type="button"
              disabled={busy}
              onClick={onYes}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Continue without alerts
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={onNo}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            No, not now
          </button>
        </div>
      </div>
    </div>
  );
};
