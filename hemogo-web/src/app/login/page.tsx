"use client";
import React, { useState } from 'react';

export default function Login() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-800/20 blur-[120px] rounded-full" />
      </div>
      
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-neutral-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">HemoGo</h2>
          <p className="text-neutral-400 mt-2 text-center">Save lives. Join the network.</p>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 bg-neutral-950/50 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] transform hover:-translate-y-0.5"
            >
              Send OTP
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="0 0 0 0"
                className="w-full px-4 py-3 bg-neutral-950/50 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-center tracking-widest text-lg"
              />
            </div>
            <button
              onClick={() => alert("Logged in successfully!")}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] transform hover:-translate-y-0.5"
            >
              Verify & Login
            </button>
            <button onClick={() => setStep(1)} className="w-full text-sm text-neutral-400 hover:text-white transition-colors">
              Wrong number? Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
