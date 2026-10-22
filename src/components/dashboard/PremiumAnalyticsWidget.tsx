import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Receipt, 
  Clock, 
  Crown
} from 'lucide-react';
import type { DonorProfile, SubscriptionRecord } from '../../types/database';
import { getDonorSearchAnalytics } from '../../services/donorService';

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
  const analytics = getDonorSearchAnalytics(donor);

  if (!donor.premiumStatus) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-amber-900/60 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">HemoGo Premium Priority Telemetry</h3>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
            Preview Mode
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Unlock Priority 1 dispatch boost in PIN <strong>{donor.pinCode}</strong>, instant SMS/WhatsApp alerts, verified donor badge, and official donation certificates for ₹299/year.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-lg font-black text-slate-400">Standard</div>
            <div className="text-[10px] text-slate-500">Dispatch Priority</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-lg font-black text-slate-400">Regular</div>
            <div className="text-[10px] text-slate-500">SMS Dispatch Speed</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-lg font-black text-slate-400">Basic</div>
            <div className="text-[10px] text-slate-500">Profile Badge</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-lg font-black text-amber-400">₹299/yr</div>
            <div className="text-[10px] text-slate-400">Full Coverage</div>
          </div>
        </div>

        <button
          onClick={onOpenUpgradeModal}
          className="w-full btn-primary !py-2.5 text-xs font-bold justify-center flex items-center gap-2"
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>Upgrade to HemoGo Premium for ₹299/yr</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-base">HemoGo Premium Impact Telemetry</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                ★ Priority 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Your profile is ranked in the top {100 - analytics.rankingPercentile}% in your PIN code
            </p>
          </div>
        </div>

        {subscription && (
          <button
            onClick={onOpenReceipt}
            className="btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 hover:border-amber-500/50 flex-shrink-0"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Tax Invoice ({subscription.invoiceNumber || 'INV-2026'})</span>
          </button>
        )}
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Impressions</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">{analytics.totalSearchImpressions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Emergency Searches</div>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Priority #1 Rank</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">{analytics.priorityRankOneImpressions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rank Boost Matches</div>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Response Speed</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400">{analytics.averageResponseTimeMinutes}m</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Avg Response Time</div>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Lifesaver Tier</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-black text-amber-400">{analytics.badgeLevel}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Top {100 - analytics.rankingPercentile}% Regionally</div>
        </div>

      </div>

      {/* Expiry Banner */}
      {donor.premiumExpiry && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Your ₹299/yr coverage is valid until{' '}
              <strong className="text-white">
                {new Date(donor.premiumExpiry).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </strong>
            </span>
          </div>

          <span className="text-[10px] text-amber-400 font-bold">Auto-Renews Annually</span>
        </div>
      )}

    </div>
  );
};
