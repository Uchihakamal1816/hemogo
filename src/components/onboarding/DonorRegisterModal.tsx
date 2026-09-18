import React, { useState } from 'react';
import { 
  X, 
  Droplet, 
  AlertCircle, 
  Heart
} from 'lucide-react';
import type { BloodGroup, DonorProfile, UserProfile } from '../../types/database';
import { registerDonorProfile } from '../../services/donorService';

interface DonorRegisterModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess: (donor: DonorProfile) => void;
  onPromptLogin: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DonorRegisterModal: React.FC<DonorRegisterModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess,
  onPromptLogin
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [pinCode, setPinCode] = useState(currentUser?.pinCode || '530016');
  const [email] = useState(currentUser?.email || '');
  
  // Mandatory Consents (PRD Section 2)
  const [consentEmergency, setConsentEmergency] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      onPromptLogin();
      return;
    }

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!pinCode.trim() || pinCode.trim().length !== 6) {
      setError('A valid 6-digit PIN code is required for emergency matching.');
      return;
    }
    if (!consentEmergency || !agreeTerms) {
      setError('Please agree to emergency notification consent and terms.');
      return;
    }

    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const donorData: DonorProfile = {
        donorId: currentUser.userId,
        userId: currentUser.userId,
        name,
        phone,
        bloodGroup,
        pinCode,
        email: email || undefined,
        availability: 'available',
        verificationStatus: true,
        premiumStatus: currentUser.premiumStatus,
        premiumExpiry: currentUser.premiumExpiry,
        totalRequestsReceived: 0,
        totalAccepted: 0,
        totalRejected: 0,
        totalCompleted: 0,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const saved = await registerDonorProfile(donorData);
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete donor registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-lg p-6 sm:p-8 relative bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3 text-red-400">
            <Heart className="w-6 h-6 fill-red-500 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-white">Join as a Verified Blood Donor</h2>
          <p className="text-xs text-slate-400 mt-1">
            Receive emergency blood alerts when someone in your PIN code needs urgent help.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Your Blood Group
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`py-2.5 rounded-xl border text-center font-bold text-sm transition-all ${
                    bloodGroup === bg
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950 scale-105'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <Droplet className={`w-3.5 h-3.5 mx-auto mb-0.5 ${bloodGroup === bg ? 'fill-white' : 'text-red-400'}`} />
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Area PIN Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="530016"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Consents & Privacy Safeguard (PRD Section 2 & 3) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <label className="flex items-start gap-2.5 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={consentEmergency}
                onChange={(e) => setConsentEmergency(e.target.checked)}
                className="rounded text-red-600 w-4 h-4 mt-0.5"
              />
              <span>I give consent to receive emergency blood requests when matching patients need blood in my PIN area.</span>
            </label>

            <label className="flex items-start gap-2.5 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded text-red-600 w-4 h-4 mt-0.5"
              />
              <span>I agree to HemoGo Terms of Service and understand my phone number will only be shared after I explicitly click Accept.</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-emerald !py-3 text-sm font-bold justify-center"
          >
            {loading ? 'Creating Profile...' : 'Complete Donor Registration'}
          </button>
        </form>

      </div>
    </div>
  );
};
