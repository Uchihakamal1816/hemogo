import React, { useState } from 'react';
import { 
  Droplet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles,
  Info
} from 'lucide-react';
import type { BloodGroup } from '../../types/database';

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

// Standard medical ABO/Rh compatibility rules
const COMPATIBILITY_RULES: Record<BloodGroup, { canDonateTo: BloodGroup[]; canReceiveFrom: BloodGroup[]; note: string }> = {
  'O-': {
    canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    note: 'Universal Red Blood Cell Donor! Critical for trauma centers and unknown emergencies.'
  },
  'O+': {
    canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    note: 'Most common blood group in India (~38%). Vital for everyday surgical procedures.'
  },
  'A-': {
    canDonateTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    note: 'Rare Rh-negative group. High emergency demand for matching surgical patients.'
  },
  'A+': {
    canDonateTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    note: 'Second most common group. High volume needed for cancer and elective surgeries.'
  },
  'B-': {
    canDonateTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    note: 'Rare group with high value for targeted emergency transfusions.'
  },
  'B+': {
    canDonateTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    note: 'Very prevalent in South Asia (~32%). Essential for hospital blood bank reserves.'
  },
  'AB-': {
    canDonateTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    note: 'Extremely rare (~1% of population). Specialized donor matching.'
  },
  'AB+': {
    canDonateTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    note: 'Universal Red Blood Cell Recipient! Can receive red blood cells from any blood type.'
  }
};

export const BloodMatrix3D: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<BloodGroup>('O-');

  const activeRules = COMPATIBILITY_RULES[activeGroup];

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-red-950/20 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Interactive Transfusion Matrix
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
            Clinical Blood Compatibility Visualizer
          </h3>
          <p className="text-xs text-slate-400">
            Click on any blood group to visualize clinical donor-recipient compatibility rules
          </p>
        </div>

        {/* Selected Blood Group Hero Badge */}
        <div className="flex items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 border border-red-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-950">
            {activeGroup}
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Selected Type</div>
            <div className="text-xs font-bold text-white">
              {activeGroup === 'O-' ? 'Universal Donor' : activeGroup === 'AB+' ? 'Universal Recipient' : `${activeGroup} Group`}
            </div>
          </div>
        </div>
      </div>

      {/* 8 Blood Group Selector Buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
        {BLOOD_GROUPS.map(bg => (
          <button
            key={bg}
            onClick={() => setActiveGroup(bg)}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeGroup === bg
                ? 'bg-gradient-to-b from-red-600 to-red-700 text-white shadow-xl shadow-red-950 border border-red-400 scale-105'
                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Droplet className={`w-4 h-4 ${activeGroup === bg ? 'fill-white text-white' : 'text-red-500'}`} />
            <span className="font-black text-sm">{bg}</span>
          </button>
        ))}
      </div>

      {/* Clinical Notes Banner */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-white mb-0.5">Clinical Note for {activeGroup}:</div>
          <p className="text-slate-400 leading-relaxed">{activeRules.note}</p>
        </div>
      </div>

      {/* Dual Interactive Output Panels: CAN DONATE TO vs CAN RECEIVE FROM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Can Donate To Panel */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ArrowUpRight className="w-4 h-4" />
              <span>{activeGroup} Can Donate To:</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              {activeRules.canDonateTo.length} Blood Groups
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map(bg => {
              const isCompatible = activeRules.canDonateTo.includes(bg);
              return (
                <div
                  key={`donate-${bg}`}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                    isCompatible
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/40 text-slate-600 border border-slate-800/40 opacity-40'
                  }`}
                >
                  <div className="font-black text-sm">{bg}</div>
                  <div className="text-[9px] mt-0.5">{isCompatible ? '✓ Compatible' : '✗ Incompatible'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Can Receive From Panel */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-blue-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <ArrowDownLeft className="w-4 h-4" />
              <span>{activeGroup} Can Receive From:</span>
            </div>
            <span className="text-[10px] font-mono text-blue-300 font-bold bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              {activeRules.canReceiveFrom.length} Blood Groups
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map(bg => {
              const isCompatible = activeRules.canReceiveFrom.includes(bg);
              return (
                <div
                  key={`receive-${bg}`}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                    isCompatible
                      ? 'bg-blue-950/80 text-blue-300 border border-blue-700/80 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30'
                      : 'bg-slate-900/40 text-slate-600 border border-slate-800/40 opacity-40'
                  }`}
                >
                  <div className="font-black text-sm">{bg}</div>
                  <div className="text-[9px] mt-0.5">{isCompatible ? '✓ Compatible' : '✗ Incompatible'}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
