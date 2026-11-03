import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Receipt, 
  Crown
} from 'lucide-react';
import type { DonorProfile, SubscriptionRecord } from '../../types/database';

interface PremiumAnalyticsWidgetProps {
  donor: DonorProfile;
  subscription: SubscriptionRecord | null;
  onOpenReceipt: () => void;
  onOpenUpgradeModal: () => void;
}

export const PremiumAnalyticsWidget: React.FC<PremiumAnalyticsWidgetProps> = ({
  donor,
  subscription,
  onOpenReceipt,
  onOpenUpgradeModal
}) => {
  if (!donor.premiumStatus) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-white dark:from-slate-900 via-white dark:via-slate-900 to-amber-50 dark:to-amber-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">HemoGo Premium</h3>
          </div>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Be listed first when a request matches your PIN <strong>{donor.pinCode}</strong>, and have your own requests widen their search every 2 minutes instead of 5, for ₹299/year.
        </p>

        <button
          onClick={onOpenUpgradeModal}
          className="w-full btn-primary !py-2.5 text-xs font-bold justify-center flex items-center gap-2"
        >
          <Crown className="w-4 h-4 text-white" />
          <span>Upgrade to HemoGo Premium for ₹299/yr</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-white dark:from-slate-900 via-white dark:via-slate-900 to-amber-50 dark:to-amber-950/30 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 dark:text-white text-base">HemoGo Premium</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Active
              </span>
            </div>
          </div>
        </div>

        {subscription && (
          <button
            onClick={onOpenReceipt}
            className="btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 hover:border-amber-500/50 flex-shrink-0"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>Tax Invoice ({subscription.invoiceNumber || 'INV-2026'})</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Alerts</span>
            <Zap className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{donor.totalRequestsReceived}</div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold mb-1">Accepted</div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{donor.totalAccepted}</div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold mb-1">Donated</div>
          <div className="text-xl font-black text-red-700 dark:text-red-400">{donor.totalCompleted}</div>
        </div>
      </div>

      {/* Expiry Banner */}
      {donor.premiumExpiry && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Your membership is valid until{' '}
              <strong className="text-slate-900 dark:text-white">
                {new Date(donor.premiumExpiry).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </strong>
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
