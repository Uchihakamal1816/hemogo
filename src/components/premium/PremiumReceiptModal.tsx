import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  HeartHandshake
} from 'lucide-react';
import type { SubscriptionRecord } from '../../types/database';

interface PremiumReceiptModalProps {
  isOpen: boolean;
  subscription: SubscriptionRecord | null;
  onClose: () => void;
}

export const PremiumReceiptModal: React.FC<PremiumReceiptModalProps> = ({
  isOpen,
  subscription,
  onClose
}) => {
  if (!isOpen || !subscription) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNum = subscription.invoiceNumber || `INV-HG-2026-9281`;
  const basePrice = (subscription.baseAmountPaise || 25339) / 100;
  const gstPrice = (subscription.gstAmountPaise || 4561) / 100;
  const totalPrice = subscription.amountPaise / 100;

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-2xl p-6 sm:p-8 relative bg-slate-900/98 border border-slate-700 shadow-2xl text-slate-100 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 print:hidden transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Action Bar (Print / Download) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 px-2.5 py-1 rounded-lg">
              TAX INVOICE / RECEIPT
            </span>
            <span className="text-xs text-slate-400">Payment Status: Paid</span>
          </div>
          
          <button
            onClick={handlePrint}
            className="btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 hover:border-amber-500/50"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Invoice Printable Document Body */}
        <div className="space-y-6 p-4 sm:p-6 bg-slate-950/80 rounded-2xl border border-slate-800/80 print:bg-white print:text-black print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-lg print:bg-red-600">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white print:text-black">
                  Hemo<span className="text-red-500">Go</span> HealthTech
                </h1>
                <p className="text-[11px] text-slate-400 print:text-gray-600 font-mono">
                  GSTIN: 37AAACH7409R1ZV | SAC: 998313
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs font-mono font-bold text-amber-400 print:text-gray-800">
                {invoiceNum}
              </div>
              <div className="text-[11px] text-slate-400 print:text-gray-500">
                Date: {new Date(subscription.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-200">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 print:text-gray-500">
                Billed To (Subscriber)
              </div>
              <div className="font-bold text-white print:text-black text-sm">
                {subscription.donorName || 'Rahul Sharma'}
              </div>
              <div className="text-slate-300 print:text-gray-700 font-mono mt-0.5">
                {subscription.donorPhone || '+91 98765 43210'}
              </div>
              {subscription.donorEmail && (
                <div className="text-slate-400 print:text-gray-600 text-[11px]">
                  {subscription.donorEmail}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-200">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 print:text-gray-500">
                Payment Verification
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Razorpay Online Payment (Success)</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 print:text-gray-600 mt-1">
                Order ID: {subscription.razorpayOrderId}
              </div>
              <div className="text-[11px] font-mono text-slate-400 print:text-gray-600">
                Payment Ref: {subscription.razorpayPaymentId || 'pay_live_001'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden print:border-gray-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800 print:bg-gray-100 print:text-gray-700 print:border-gray-300">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">SAC Code</th>
                  <th className="p-3 text-center">Period</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200 text-slate-300 print:text-black">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-white print:text-black">HemoGo Premium Membership</div>
                    <div className="text-[11px] text-slate-400 print:text-gray-500">
                      Priority 1 Emergency Dispatch Boost, Instant SMS Alerts, Verified Lifesaver Shield
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono">998313</td>
                  <td className="p-3 text-center">1 Year</td>
                  <td className="p-3 text-right font-mono font-bold">₹{basePrice.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown */}
          <div className="flex justify-end text-xs">
            <div className="w-full sm:w-64 space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 print:bg-transparent print:border-none">
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>Taxable Amount:</span>
                <span className="font-mono">₹{basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>CGST (9.0%):</span>
                <span className="font-mono">₹{(gstPrice / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>SGST (9.0%):</span>
                <span className="font-mono">₹{(gstPrice / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white print:text-black font-black text-sm pt-2 border-t border-slate-800 print:border-gray-300">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-emerald-400 print:text-black">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Coverage Validity & Guarantee */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-800/40 text-xs text-amber-200/90 flex items-center justify-between print:border-gray-300 print:text-gray-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <div className="font-bold">Active Premium Coverage</div>
                <div className="text-[11px] text-amber-300/80 print:text-gray-600">
                  Valid until {new Date(subscription.expiryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg">
              Priority 1 Active
            </span>
          </div>

          {/* Footer Note */}
          <p className="text-[10px] text-slate-500 print:text-gray-500 text-center leading-relaxed">
            This is a computer-generated official tax invoice for digital services provided by HemoGo Blood Emergency Network. No physical signature required.
          </p>

        </div>

      </div>
    </div>
  );
};
