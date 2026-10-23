import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Bell, 
  Check, 
  AlertCircle, 
  Sliders, 
  ShieldCheck, 
  MessageSquare, 
  Smartphone,
  Navigation
} from 'lucide-react';
import type { DonorProfile } from '../../types/database';
import { updateDonorSettings } from '../../services/donorService';

interface DonorSettingsModalProps {
  isOpen: boolean;
  donor: DonorProfile;
  onClose: () => void;
  onProfileUpdated: (updated: DonorProfile) => void;
}

export const DonorSettingsModal: React.FC<DonorSettingsModalProps> = ({
  isOpen,
  donor,
  onClose,
  onProfileUpdated
}) => {
  const [name, setName] = useState(donor.name || '');
  const [phone, setPhone] = useState(donor.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(donor.alternatePhone || '');
  const [city, setCity] = useState(donor.city || 'Visakhapatnam');
  const [pinCode, setPinCode] = useState(donor.pinCode || '');
  const [preferredRadiusKm, setPreferredRadiusKm] = useState(donor.preferredRadiusKm || 10);
  
  const [smsAlerts, setSmsAlerts] = useState(donor.notificationPreferences?.sms ?? true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(donor.notificationPreferences?.whatsapp ?? true);
  const [pushAlerts, setPushAlerts] = useState(donor.notificationPreferences?.push ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!pinCode.trim() || !/^\d{6}$/.test(pinCode.trim())) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateDonorSettings(donor.donorId, {
        name: name.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim(),
        city: city.trim(),
        pinCode: pinCode.trim(),
        preferredRadiusKm,
        notificationPreferences: {
          sms: smsAlerts,
          whatsapp: whatsappAlerts,
          push: pushAlerts
        }
      });

      setSuccess(true);
      onProfileUpdated(updated);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-xl p-6 sm:p-8 relative bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-md">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Donor Profile & Preferences</h2>
            <p className="text-xs text-slate-400">
              Manage your emergency dispatch area, alerts, and contact details
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Settings saved successfully! Updating live feed...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Blood Group Readonly Pill */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Registered Blood Group</div>
              <div className="text-xs text-slate-300">Requires medical verification to change</div>
            </div>
            <span className="text-sm font-black px-3 py-1 bg-red-950 text-red-400 border border-red-800 rounded-lg">
              {donor.bloodGroup}
            </span>
          </div>

          {/* Personal Information */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-red-500" />
              <span>Contact Information</span>
            </h3>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                placeholder="Your Full Name"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Primary Mobile (OTP Verified)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Alternate Emergency Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    placeholder="+91 91234 56789"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location & Dispatch Radius */}
          <div className="space-y-3.5 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Location & Dispatch Matching</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Current City / District
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  placeholder="e.g. Visakhapatnam"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  PIN Code (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-red-500"
                  placeholder="530016"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  <span>Maximum Alert Distance Radius</span>
                </label>
                <span className="text-xs font-bold text-blue-400">{preferredRadiusKm} km</span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={preferredRadiusKm}
                onChange={(e) => setPreferredRadiusKm(parseInt(e.target.value))}
                className="w-full accent-red-600 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>3 km (Immediate Neighborhood)</span>
                <span>15 km (Citywide)</span>
                <span>30 km (District)</span>
              </div>
            </div>
          </div>

          {/* Notification Alert Channels */}
          <div className="space-y-3.5 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Emergency Dispatch Channels</span>
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Instant SMS Dispatch</div>
                    <div className="text-[10px] text-slate-400">High-priority SMS when matching requests occur</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">WhatsApp Emergency Alerts</div>
                    <div className="text-[10px] text-slate-400">Receive hospital location and patient details via WhatsApp</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold text-white">In-App Sound & Push Notifications</div>
                    <div className="text-[10px] text-slate-400">Foreground siren and background mobile push alerts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary !py-2.5 !px-5 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold flex items-center gap-2"
            >
              {saving ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
