import React, { useEffect, useState } from 'react';
import { 
  X, 
  Flame, 
  AlertTriangle, 
  Send, 
  ArrowLeft,
  MapPin,
  RefreshCw
} from 'lucide-react';
import type { BloodGroup, UrgencyLevel, BloodRequest, UserProfile } from '../../types/database';
import { createEmergencyBloodRequest } from '../../services/emergencyService';
import { findNearbyHospitals, type NearbyHospital } from '../../services/hospitalService';
import { getCurrentPosition } from '../../services/locationService';

interface EmergencyRequestModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess: (req: BloodRequest) => void;
  onPromptLogin: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EmergencyRequestModal: React.FC<EmergencyRequestModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess,
  onPromptLogin
}) => {
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalPinCode, setHospitalPinCode] = useState('');
  const [hospitalCoords, setHospitalCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState<NearbyHospital[]>([]);
  const [searching, setSearching] = useState(false);
  const [unitsRequired, setUnitsRequired] = useState<number>(1);
  const [urgency, setUrgency] = useState<UrgencyLevel>('critical');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every request starts clean: an old patient must never be re-sent or leak to the next user.
  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setPatientName('');
    setBloodGroup('O+');
    setHospitalName('');
    setHospitalPinCode('');
    setHospitalCoords(null);
    setNearby([]);
    setUnitsRequired(1);
    setUrgency('critical');
    setNotes('');
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      onPromptLogin();
      return;
    }

    if (!patientName.trim()) {
      setError('Please provide the patient/requester name.');
      return;
    }
    if (!hospitalName.trim() || !/^[1-9]\d{5}$/.test(hospitalPinCode.trim())) {
      setError('Hospital name and a valid 6-digit PIN code are required for matching.');
      return;
    }

    setStep('confirm');
  };

  const handleFindNearby = async () => {
    setError(null);
    setSearching(true);
    try {
      const { lat, lng } = await getCurrentPosition();
      const hospitals = await findNearbyHospitals(lat, lng);
      setNearby(hospitals);
      if (hospitals.length === 0) setError('No hospitals found nearby. Please enter the hospital manually.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleChooseHospital = (hospital: NearbyHospital) => {
    setHospitalName(hospital.name);
    setHospitalPinCode(hospital.pinCode);
    setHospitalCoords({ lat: hospital.lat, lng: hospital.lng });
    setNearby([]);
  };

  const handleRaiseEmergencyRequest = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    try {
      const result = await createEmergencyBloodRequest({
        patientName,
        bloodGroup,
        hospitalName,
        hospitalPinCode: hospitalPinCode.trim(),
        hospitalLat: hospitalCoords?.lat ?? null,
        hospitalLng: hospitalCoords?.lng ?? null,
        unitsRequired,
        urgency,
        notes
      });

      onSuccess(result.request);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to broadcast emergency request.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-lg p-6 sm:p-8 relative bg-white dark:bg-slate-900/95 border border-red-200 dark:border-red-800/50 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto mb-3 text-red-700 dark:text-red-400 shadow-lg shadow-red-100 dark:shadow-red-950 animate-pulse">
            <Flame className="w-6 h-6 text-red-700 dark:text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {step === 'form' ? 'Create Blood Emergency Request' : 'Confirm Emergency Details'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {step === 'form'
              ? 'We will alert compatible donors near the hospital straight away. Your verified number is shared only with a donor who accepts.'
              : 'Please double-check the critical details before broadcasting the alert.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-700 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Input Form */}
        {step === 'form' && (
          <form onSubmit={handleProceedToConfirm} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Patient / Requester Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Patient name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Units Needed
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={unitsRequired}
                  onChange={(e) => setUnitsRequired(Number(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Required Blood Group
              </label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-2 rounded-xl border text-center font-bold text-sm transition-all ${
                      bloodGroup === bg
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-100 dark:shadow-red-950 scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleFindNearby}
                disabled={searching}
                className="w-full btn-secondary !py-2.5 text-xs font-bold justify-center flex items-center gap-2"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-red-700 dark:text-red-400" />}
                <span>{searching ? 'Finding hospitals...' : 'Find hospitals near me'}</span>
              </button>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Your location is sent to OpenStreetMap only for this search. Call the hospital to confirm it has a blood bank before travelling.
              </p>
              {nearby.map((hospital) => (
                <button
                  key={`${hospital.name}-${hospital.lat}`}
                  type="button"
                  onClick={() => handleChooseHospital(hospital)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-red-500 text-left text-xs flex items-center justify-between gap-2"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{hospital.name}{hospital.hasBloodBank ? ' • Blood bank' : ''}</span>
                  <span className="text-slate-600 dark:text-slate-400 flex-shrink-0">{hospital.distanceKm} km</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hospital Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Hospital name"
                  value={hospitalName}
                  onChange={(e) => { setHospitalName(e.target.value); setHospitalCoords(null); }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hospital PIN Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit PIN"
                  value={hospitalPinCode}
                  onChange={(e) => setHospitalPinCode(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-mono placeholder-slate-600 dark:placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                >
                  <option value="critical">🚨 Critical (&lt; 2 Hours)</option>
                  <option value="urgent">⏱️ Urgent (&lt; 12 Hours)</option>
                  <option value="moderate">📅 Moderate (&lt; 24-48 Hours)</option>
                </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ward / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Trauma Care ICU, 2nd Floor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary !py-3 text-sm font-bold justify-center mt-2"
            >
              <span>Review & Confirm Request</span>
            </button>
          </form>
        )}

        {/* Step 2: Mandatory Confirmation Screen (PRD Section 5) */}
        {step === 'confirm' && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-red-200 dark:border-red-800/80 space-y-3">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Emergency Broadcast Summary
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-200 dark:border-slate-800/80">
                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Required Blood Group</div>
                  <div className="text-2xl font-black text-red-600 dark:text-red-500">{bloodGroup}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Units Required</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{unitsRequired} Unit{unitsRequired === 1 ? '' : 's'}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Hospital</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{hospitalName}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Hospital PIN Code</div>
                  <div className="text-sm font-mono font-bold text-amber-700 dark:text-amber-400">{hospitalPinCode}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Patient: <strong>{patientName}</strong></span>
                <span>Contact: <strong>{currentUser?.phone}</strong></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="btn-secondary !py-3 text-xs font-bold flex-1 justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit Details</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleRaiseEmergencyRequest}
                className="btn-primary !py-3 text-sm font-black flex-[2] justify-center pulse-emergency bg-red-600 hover:bg-red-500 shadow-xl shadow-red-100 dark:shadow-red-950"
              >
                {loading ? (
                  <span>Dispatching Donors...</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>RAISE EMERGENCY REQUEST</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
