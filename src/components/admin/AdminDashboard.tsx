import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Lock, 
  FileText, 
  Sliders,
  CheckCircle2,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import type { DonorProfile, BloodRequest, UserProfile, SubscriptionRecord } from '../../types/database';
import { getStoredMockDonors, adminVerifyDonor, adminRevokeDonor } from '../../services/donorService';
import { getStoredRequests, getStoredMatches } from '../../services/emergencyService';
import { getStoredSubscriptions } from '../../services/razorpayService';
import { PremiumReceiptModal } from '../premium/PremiumReceiptModal';

interface AdminDashboardProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'donors' | 'verification' | 'subscriptions' | 'requests' | 'matching'>('overview');
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [selectedSubForInvoice, setSelectedSubForInvoice] = useState<SubscriptionRecord | null>(null);
  const [searchPin, setSearchPin] = useState('');
  const [searchBlood, setSearchBlood] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    setDonors(getStoredMockDonors());
    setRequests(getStoredRequests());
    setSubscriptions(getStoredSubscriptions());
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel-elevated text-center space-y-4">
        <Lock className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administrator Portal Access</h2>
        <p className="text-xs text-slate-400">
          This portal is restricted to authorized HemoGo administrators. Please sign in as an administrator to proceed.
        </p>
        <button onClick={onOpenAuth} className="btn-primary w-full justify-center text-xs font-bold">
          Switch to Admin Persona
        </button>
      </div>
    );
  }

  const matches = getStoredMatches();
  const samePinMatches = matches.filter(m => m.locationMatch === 'SAME_PIN').length;
  const neighborPinMatches = matches.filter(m => m.locationMatch === 'NEIGHBOR_PIN').length;
  const premiumMatches = matches.filter(m => m.isPremiumDonor).length;
  const totalAccepted = matches.filter(m => m.response === 'ACCEPTED').length;

  const handleVerify = async (donorId: string) => {
    try {
      const updated = await adminVerifyDonor(donorId);
      setActionFeedback(`Verified donor "${updated.name}" successfully.`);
      loadAdminData();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleRevoke = async (donorId: string) => {
    try {
      const updated = await adminRevokeDonor(donorId);
      setActionFeedback(`Revoked verification for "${updated.name}".`);
      loadAdminData();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Revoke failed');
    }
  };

  const verificationDonors = donors.filter(d => {
    if (verificationFilter === 'PENDING') return !d.verificationStatus;
    if (verificationFilter === 'VERIFIED') return d.verificationStatus;
    return true;
  });

  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amountPaise, 0) / 100;

  const filteredDonors = donors.filter(d => {
    const pinMatch = !searchPin || d.pinCode.includes(searchPin);
    const bloodMatch = searchBlood === 'ALL' || d.bloodGroup === searchBlood;
    return pinMatch && bloodMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-400 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-slate-800 bg-slate-900/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
              SECURE ADMIN CONSOLE
            </span>
            <span className="text-xs text-slate-400">Role: Super Administrator</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">HemoGo Platform Command Center</h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'donors' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Donor DB ({donors.length})
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'verification' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Verification Queue</span>
            {donors.filter(d => !d.verificationStatus).length > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {donors.filter(d => !d.verificationStatus).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'subscriptions' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'requests' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'matching' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Matching Engine
          </button>
        </div>
      </div>

      {/* Overview Analytics Cards (PRD Section 17) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-white">{donors.length}</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Registered Donors</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-emerald-400">
                {donors.filter(d => d.availability === 'available').length}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Active Available Donors</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-red-500">{requests.length}</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Total Emergency Requests</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-amber-400">
                {donors.filter(d => d.premiumStatus).length}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">HemoGo Premium (₹299/yr)</div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Matching Engine Performance */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Matching & Dispatch Telemetry</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Same-PIN Dispatches</span>
                  <span className="font-bold text-white">{samePinMatches} Donors</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Neighbor-PIN Dispatches</span>
                  <span className="font-bold text-white">{neighborPinMatches} Donors</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Premium Priority Donors Dispatched</span>
                  <span className="font-bold text-amber-400">{premiumMatches} Donors</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Successful Acceptances after Screening</span>
                  <span className="font-bold text-emerald-400">{totalAccepted} Responses</span>
                </div>
              </div>
            </div>

            {/* Audit Log Overview (PRD Section 20 & 21) */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Security Audit Logs</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-400 font-mono">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  [12:30:10] MATCH_DISPATCH: Request #HG10245 sent to 8 donors in PIN 530016
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  [12:35:45] SCREENING_PASSED: Donor #demo_donor_001 completed 6/6 health declarations
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  [12:35:46] CONTACT_REVEAL: Mutual contacts shared between Req #demo_req_001 & Donor #demo_donor_001
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  [12:40:22] PREVENT_SCRAPE: Anonymous query on /donors blocked by Firestore Rule #2
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Donor Database Tab (PRD Section 17) */}
      {activeTab === 'donors' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by PIN Code (e.g. 530016)"
                  value={searchPin}
                  onChange={(e) => setSearchPin(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <select
                value={searchBlood}
                onChange={(e) => setSearchBlood(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Blood Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <span className="text-xs text-slate-400">
              Showing <strong>{filteredDonors.length}</strong> donors
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Donor Name</th>
                  <th className="p-3.5">Blood Group</th>
                  <th className="p-3.5">PIN Code</th>
                  <th className="p-3.5">Availability</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredDonors.map((d) => (
                  <tr key={d.donorId} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white">{d.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">{d.pinCode}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.availability === 'available' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {d.availability.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-emerald-400 font-semibold">Active & Verified</span>
                    </td>
                    <td className="p-3.5">
                      {d.premiumStatus ? (
                        <span className="text-amber-400 font-bold">★ Premium (₹299/yr)</span>
                      ) : (
                        <span className="text-slate-500">Free</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donor Verification & Compliance Queue Tab */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
              <button
                onClick={() => setVerificationFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  verificationFilter === 'ALL' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All ({donors.length})
              </button>
              <button
                onClick={() => setVerificationFilter('PENDING')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  verificationFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span>Pending Review</span>
                <span className="bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {donors.filter(d => !d.verificationStatus).length}
                </span>
              </button>
              <button
                onClick={() => setVerificationFilter('VERIFIED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  verificationFilter === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Verified ({donors.filter(d => d.verificationStatus).length})
              </button>
            </div>

            <span className="text-xs text-slate-400">
              Showing <strong>{verificationDonors.length}</strong> donors in queue
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Donor Name</th>
                  <th className="p-3.5">Blood Group</th>
                  <th className="p-3.5">PIN & City</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">ID Verification Proof</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {verificationDonors.map((d) => (
                  <tr key={d.donorId} className="hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{d.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {d.donorId}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">{d.pinCode} ({d.city || 'Visakhapatnam'})</td>
                    <td className="p-3.5 font-mono">{d.phone}</td>
                    <td className="p-3.5">
                      <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>{d.verificationDocumentType || 'Aadhaar / Blood Card'}</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      {d.verificationStatus ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>VERIFIED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>PENDING REVIEW</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {d.verificationStatus ? (
                        <button
                          onClick={() => handleRevoke(d.donorId)}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 text-xs font-semibold transition-colors"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(d.donorId)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscriptions & Revenue Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-amber-400">{subscriptions.length}</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Active Subscribers</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-emerald-400 font-mono">₹{totalRevenue}</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Total Revenue (Gross)</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-white">₹299/yr</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Annual Plan Fee</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-blue-400">Razorpay</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Live Gateway Status</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Subscription Invoices & GST Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">GST Rate: 18% (SAC 998313)</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Subscriber</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Amount Paid</th>
                  <th className="p-3.5">Coverage Expiry</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {subscriptions.map((s) => (
                  <tr key={s.subscriptionId} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {s.invoiceNumber || 'INV-HG-2026-9281'}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{s.donorName || 'Subscriber'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.donorPhone}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800">
                        HemoGo Premium
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      ₹{(s.amountPaise / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(s.expiryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                        PAID (RAZORPAY)
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedSubForInvoice(s)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blood Requests Tab (PRD Section 17) */}
      {activeTab === 'requests' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Request ID</th>
                <th className="p-3.5">Patient / Requester</th>
                <th className="p-3.5">Blood Needed</th>
                <th className="p-3.5">Hospital & PIN</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Notified / Accepted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {requests.map((r) => (
                <tr key={r.requestId} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-mono font-bold text-red-400">#{r.requestId}</td>
                  <td className="p-3.5 font-bold text-white">{r.patientName}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">
                      {r.bloodGroup} ({r.unitsRequired} Units)
                    </span>
                  </td>
                  <td className="p-3.5">{r.hospitalName} ({r.hospitalPinCode})</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-white">
                    {r.notifiedDonorsCount} Notified / <strong className="text-emerald-400">{r.acceptedDonorsCount} Accepted</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matching Engine Settings Tab (PRD Section 23 & 25) */}
      {activeTab === 'matching' && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-500" />
            <span>Matching Engine & Search Expansion Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white">Priority 1 (Score 100)</div>
              <p className="text-slate-400">Premium Donors residing in the exact same PIN code as the Hospital.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white">Priority 2 (Score 80)</div>
              <p className="text-slate-400">Premium Donors residing in neighboring PIN codes.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white">Priority 3 (Score 60)</div>
              <p className="text-slate-400">Regular Donors residing in the exact same PIN code as the Hospital.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white">Priority 4 (Score 40)</div>
              <p className="text-slate-400">Regular Donors residing in neighboring PIN codes.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal for Administrators */}
      <PremiumReceiptModal
        isOpen={Boolean(selectedSubForInvoice)}
        subscription={selectedSubForInvoice}
        onClose={() => setSelectedSubForInvoice(null)}
      />

    </div>
  );
};
