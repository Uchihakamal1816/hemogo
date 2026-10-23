"use client";
import React, { useState } from 'react';

export default function Register() {
  const [role, setRole] = useState('donor');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-3">Join HemoGo</h1>
          <p className="text-neutral-400 text-lg">Set up your profile to start saving lives or requesting help.</p>
        </div>

        <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
          <div className="flex p-1 bg-neutral-950 rounded-xl mb-8">
            <button
              onClick={() => setRole('donor')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${role === 'donor' ? 'bg-red-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
            >
              I want to Donate
            </button>
            <button
              onClick={() => setRole('requester')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${role === 'requester' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
            >
              I need Blood
            </button>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Full Name</label>
                <input type="text" className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Age</label>
                <input type="number" className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" placeholder="25" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Blood Group</label>
              <select className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all appearance-none">
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Location / Pin Code</label>
              <input type="text" className="w-full px-4 py-3 bg-neutral-950 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" placeholder="e.g. 110001" />
            </div>

            <button className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] mt-4">
              Complete Registration
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
