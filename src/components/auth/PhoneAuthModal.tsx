import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Phone, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { initializeRecaptcha, sendOtpToPhone, verifyPhoneOtp } from '../../services/authService';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtpDigits(['', '', '', '', '', '']);
      setError(null);
      
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = initializeRecaptcha('recaptcha-container');
      const result = await sendOtpToPhone(`${countryCode}${cleanNum}`, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.code === 'auth/too-many-requests' ? 'Too many attempts. Please wait a few minutes, or call 104 if this is urgent.' : err.code === 'auth/invalid-phone-number' ? 'That phone number is not valid.' : 'Could not send the code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of full 6-digit code
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!confirmationResult) throw new Error('Please request a new code.');
      await verifyPhoneOtp(enteredOtp, confirmationResult);
      onClose();
    } catch (err: any) {
      setError(err.code === 'auth/invalid-verification-code' ? 'That code is not correct.' : err.code === 'auth/code-expired' ? 'That code has expired. Please request a new one.' : err.message || 'Could not verify the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-md p-6 sm:p-8 relative bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* reCAPTCHA Invisible Holder */}
        <div id="recaptcha-container"></div>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3 text-red-400 shadow-lg shadow-red-950">
            {step === 'phone' ? <Phone className="w-6 h-6" /> : <KeyRound className="w-6 h-6 text-amber-400" />}
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === 'phone' ? 'Sign in to HemoGo' : 'Enter Verification Code'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'phone'
              ? 'Fast and secure Phone/OTP access for instant emergency response'
              : `We sent a 6-digit OTP code to ${countryCode} ${phoneNumber}`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Phone Input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-red-500"
                >
                  <option value="+91">🇮🇳 +91 (IN)</option>
                </select>
                
                <div className="relative flex-1">
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-3 text-sm font-bold justify-center"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending OTP...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>

          </form>
        )}

        {/* Step 2: OTP Entry */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3 text-center">
                Enter 6-Digit OTP
              </label>
              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-12 text-center text-xl font-bold bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-red-500 focus:bg-slate-750 focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-3 text-sm font-bold justify-center"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Sign In</span>
                </div>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="hover:text-slate-200 transition-colors"
              >
                Change Number
              </button>

              {resendTimer > 0 ? (
                <span>Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-red-400 hover:text-red-300 font-semibold"
                >
                  Resend OTP Code
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
