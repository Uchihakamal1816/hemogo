"use client";
import React, { useState } from 'react';

export default function Dashboard() {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-10 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, John 👋</h1>
            <p className="text-neutral-400 mt-1">Your HemoGo Dashboard</p>
          </div>
          <div className="flex items-center gap-4 bg-neutral-900/80 px-4 py-2 rounded-full border border-white/10">
            <span className="text-sm font-medium text-neutral-300">Donor Availability</span>
            <button 
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isAvailable ? 'bg-green-500' : 'bg-neutral-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-red-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-600/20 blur-2xl rounded-full group-hover:bg-red-600/30 transition-all" />
            <h3 className="text-neutral-400 text-sm font-medium mb-2">Lives Saved</h3>
            <p className="text-5xl font-black text-white">3</p>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/20 blur-2xl rounded-full group-hover:bg-blue-600/30 transition-all" />
            <h3 className="text-neutral-400 text-sm font-medium mb-2">Donations</h3>
            <p className="text-5xl font-black text-white">5</p>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-600/20 blur-2xl rounded-full group-hover:bg-purple-600/30 transition-all" />
            <h3 className="text-neutral-400 text-sm font-medium mb-2">Premium Status</h3>
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mt-2">Active MVP</p>
            <button className="mt-4 text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg">View Perks</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activity
            </h2>
            <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-200">Donated Blood (O+)</h4>
                    <p className="text-sm text-neutral-500">City General Hospital</p>
                  </div>
                  <span className="text-xs text-neutral-500 bg-neutral-950 px-3 py-1 rounded-full">2 weeks ago</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-gradient-to-b from-red-900/20 to-neutral-900 border border-red-500/20 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Emergency Requests</h3>
              <p className="text-sm text-neutral-400 mb-6">3 critical requests match your blood type near you.</p>
              
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">CRITICAL</span>
                    <span className="text-xs text-neutral-400">2km away</span>
                  </div>
                  <h4 className="font-bold text-white mb-1">O+ Required (2 Units)</h4>
                  <p className="text-xs text-neutral-400 mb-4">Apollo Hospital</p>
                  <button className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors">
                    Accept Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
