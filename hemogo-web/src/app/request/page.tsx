"use client";
import React, { useState } from 'react';

export default function RequestBlood() {
  const [urgency, setUrgency] = useState('normal');

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-12 font-sans relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-700/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-3xl mx-auto z-10 relative">
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(220,38,38,0.6)]">!</span>
            Emergency Blood Request
          </h1>
          <p className="text-neutral-400 mt-2">Fill in the details below to broadcast a request to nearby donors instantly.</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-10">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Patient Name</label>
                <input type="text" className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" placeholder="Enter patient name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Required Blood Group</label>
                <select className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all appearance-none">
                  <option value="">Select Group</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="O+">O+</option>
                  <option value="AB+">AB+</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="O-">O-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Units Required</label>
                <input type="number" className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Hospital Name & Location</label>
                <input type="text" className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" placeholder="City Hospital, Downtown" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Urgency Level</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setUrgency('normal')}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all ${urgency === 'normal' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-neutral-950 border-white/10 text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Normal (Within 24hrs)
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('critical')}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all ${urgency === 'critical' ? 'bg-red-600/20 border-red-600 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-neutral-950 border-white/10 text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Critical (ASAP)
                </button>
              </div>
            </div>

            <button className="w-full py-4 mt-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2">
              Broadcast Request Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
