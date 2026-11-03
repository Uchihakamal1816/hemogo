import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, KeyRound, ArrowRight, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { initializeRecaptcha, sendOtpToPhone, verifyPhoneOtp } from '../../services/authService';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RESEND_SECONDS = 60;

function describeAuthError(err: any): string {
  switch (err?.code) {
    case 'auth/invalid-phone-number':
      return 'That phone number is not valid.';
    case 'auth/too-many-requests':
      return 'Too many attempts from this device. Please wait a few minutes, or call 104 if this is urgent.';
    case 'auth/quota-exceeded':
      return 'HemoGo has reached its SMS limit for now. Please try again later, or call 104 if this is urgent.';
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
      return 'The security check failed. Please try again.';
    case 'auth/network-request-failed':
      return 'No connection. Please check your internet and try again.';
    case 'auth/invalid-verification-code':
      return 'That code is not correct.';
    case 'auth/code-expired':
      return 'That code has expired. Please request a new one.';
    default:
      return `Something went wrong${err?.code ? ` (${err.code})` : ''}. Please try again.`;
  }
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  // The security check never reports being closed, so a cancelled attempt is ignored when it settles.
  const attemptRef = useRef(0);

  const clearVerifier = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch {
      // Already removed with the modal.
    }
    recaptchaVerifierRef.current = null;
  };

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtp('');
      setError(null);
      setLoading(false);
    }
    const attempts = attemptRef;
    return () => {
      attempts.current++;
      clearVerifier();
    };
  }, [isOpen]);

  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const sendCode = async () => {
    setError(null);

    const digits = phoneNumber.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const attempt = ++attemptRef.current;
    setLoading(true);
    try {
      clearVerifier();
      recaptchaVerifierRef.current = initializeRecaptcha('recaptcha-container');
      const result = await sendOtpToPhone(`+91${digits}`, recaptchaVerifierRef.current);
      if (attempt !== attemptRef.current) return;
      setConfirmationResult(result);
      setOtp('');
      setStep('otp');
      setResendTimer(RESEND_SECONDS);
    } catch (err: any) {
      if (attempt !== attemptRef.current) return;
      console.error('OTP send failed:', err?.code, err?.message);
      clearVerifier();
      setError(describeAuthError(err));
    } finally {
      if (attempt === attemptRef.current) setLoading(false);
    }
  };

  const handleCancelSend = () => {
    attemptRef.current++;
    clearVerifier();
    setLoading(false);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sendCode();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !confirmationResult) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyPhoneOtp(otp, confirmationResult);
      onClose();
    } catch (err: any) {
      console.error('OTP verify failed:', err?.code, err?.message);
      setError(describeAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-md p-6 sm:p-8 relative bg-white dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 shadow-2xl text-slate-900 dark:text-slate-100">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div id="recaptcha-container"></div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3 text-red-700 dark:text-red-400 shadow-lg shadow-red-100 dark:shadow-red-950">
            {step === 'phone' ? <Phone className="w-6 h-6" /> : <KeyRound className="w-6 h-6 text-amber-700 dark:text-amber-400" />}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {step === 'phone' ? 'Sign in to HemoGo' : 'Enter Verification Code'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {step === 'phone'
              ? 'We will text a 6-digit code to your mobile number.'
              : `We sent a 6-digit code to +91 ${phoneNumber.replace(/\D/g, '').slice(-10)}`}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800/80 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-700 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="hemogo-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <span className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 font-semibold">
                  🇮🇳 +91
                </span>
                <input
                  id="hemogo-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  autoFocus
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary !py-3 text-sm font-bold justify-center">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending code...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>

            {loading && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center">
                If a security check appears, please complete it.{' '}
                <button type="button" onClick={handleCancelSend} className="text-red-700 dark:text-red-400 font-semibold underline">
                  Cancel
                </button>
              </p>
            )}
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label htmlFor="hemogo-otp" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center">
                6-Digit Code
              </label>
              <input
                id="hemogo-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full max-w-xs mx-auto block h-14 text-center text-2xl tracking-[0.5em] font-bold bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary !py-3 text-sm font-bold justify-center">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Sign In</span>
                </div>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2">
              <button type="button" onClick={() => { setStep('phone'); setError(null); }} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                Change Number
              </button>

              {resendTimer > 0 ? (
                <span>Resend in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={sendCode} disabled={loading} className="text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold">
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
