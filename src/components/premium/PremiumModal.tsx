import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile } from '../../types/database';
import { HEMOGO_PREMIUM_PLAN, initiateSubscriptionCheckout } from '../../services/razorpayService';

interface PremiumModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
  onPromptLogin: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess,
  onPromptLogin
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setError(null);
    if (!currentUser) {
      onPromptLogin();
      return;
    }

    setLoading(true);
    try {
      await initiateSubscriptionCheckout(
        currentUser,
        (updatedUser) => {
          setLoading(false);
          setPaymentSuccess(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
          onSuccess(updatedUser);
        },
        (err) => {
          setLoading(false);
          setError(err);
        }
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Payment initiation failed.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-xl p-6 sm:p-8 relative bg-slate-900/95 border border-amber-500/40 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400">
              <Crown className="w-10 h-10 fill-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Welcome to HemoGo Premium!</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your annual subscription is now active! Your profile now receives priority dispatch in emergency blood matching in your PIN area.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="btn-primary !py-3 !px-8 text-sm font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 border-amber-400"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Annual Priority Membership</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                HemoGo <span className="text-amber-400">Premium</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Priority matching dispatch during emergency blood requests for dedicated lifesaver donors.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Plan Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/30 border-2 border-amber-500 shadow-xl shadow-amber-950/30 space-y-5 mb-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-black text-white">{HEMOGO_PREMIUM_PLAN.name}</div>
                  <div className="text-xs text-amber-400 font-semibold">Priority 1 Matching Score in Your PIN Code</div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-amber-400">₹{HEMOGO_PREMIUM_PLAN.price}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">/ {HEMOGO_PREMIUM_PLAN.period}</div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200">
                {HEMOGO_PREMIUM_PLAN.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Safety/Medical Disclaimer Note (PRD Section 7) */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Premium status provides priority emergency matching notifications but does NOT override medical blood compatibility or donor screening eligibility.
                </span>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleCheckout}
                className="w-full btn-primary !py-3 text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-950 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <CreditCard className="w-4 h-4 text-slate-950" />
                )}
                <span>Upgrade to HemoGo Premium for ₹299/year</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Razorpay Secured Gateway • 256-bit SSL Encryption</span>
              </div>
              <span>UPI / Cards / NetBanking</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
