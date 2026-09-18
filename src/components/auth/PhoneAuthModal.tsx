import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Phone, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { 
  initializeRecaptcha, 
  sendOtpToPhone, 
  verifyPhoneOtp, 
  DEMO_PRESET_USERS, 
  setDemoUserPreset 
} from '../../services/authService';
import type { UserProfile } from '../../types/database';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtpDigits(['', '', '', '', '', '']);
      setError(null);
      
      // Initialize reCAPTCHA
      setTimeout(() => {
        recaptchaVerifierRef.current = initializeRecaptcha('recaptcha-container');
      }, 300);
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
      const fullPhone = `${countryCode}${cleanNum}`;
      const result = await sendOtpToPhone(fullPhone, recaptchaVerifierRef.current);
      
      if (result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
      }
      setIsSimulated(result.isMock);
      setStep('otp');
      setResendTimer(60);

      // Auto-fill test digits in simulation mode for ease of developer testing
      if (result.isMock) {
        setTimeout(() => {
          setOtpDigits(['1', '2', '3', '4', '5', '6']);
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
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
      const fullPhone = `${countryCode} ${phoneNumber}`;
      const user = await verifyPhoneOtp(enteredOtp, confirmationResult, fullPhone);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code entered.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (key: keyof typeof DEMO_PRESET_USERS) => {
    const user = setDemoUserPreset(key);
    onSuccess(user);
    onClose();
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
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+971">🇦🇪 +971 (UAE)</option>
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

            {/* Quick Demo Test Presets */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Quick Test Logins
                </span>
                <span className="text-[10px] text-slate-500">1-click login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('donor_active')}
                  className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all text-xs"
                >
                  <div className="font-semibold text-emerald-400">Rahul Sharma</div>
                  <div className="text-[10px] text-slate-400">O+ Active Donor</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('donor_cooldown')}
                  className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition-all text-xs"
                >
                  <div className="font-semibold text-amber-400">Pooja Varma</div>
                  <div className="text-[10px] text-slate-400">A+ in Cooldown</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('requester_emergency')}
                  className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-red-500/50 transition-all text-xs"
                >
                  <div className="font-semibold text-red-400">Anil Kumar</div>
                  <div className="text-[10px] text-slate-400">Requester</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('premium_hero')}
                  className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition-all text-xs"
                >
                  <div className="font-semibold text-amber-300">Dr. Siddharth</div>
                  <div className="text-[10px] text-slate-400">Premium Hero</div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: OTP Entry */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {isSimulated && (
              <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs flex items-center justify-between">
                <span>🧪 Demo Code: <strong>123456</strong> (Auto-filled)</span>
                <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-900/60 px-1.5 py-0.5 rounded">
                  Test Mode
                </span>
              </div>
            )}

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
