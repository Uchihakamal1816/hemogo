import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Heart
} from 'lucide-react';
import type { BloodGroup } from '../../types/database';

interface RadarDonorNode {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  distanceKm: number;
  pinCode: string;
  angle: number; // degrees
  isPremium: boolean;
  status: 'standby' | 'dispatched' | 'connected';
}

const INITIAL_RADAR_DONORS: RadarDonorNode[] = [
  { id: 'd1', name: 'Rahul S.', bloodGroup: 'O+', distanceKm: 1.8, pinCode: '530016', angle: 35, isPremium: true, status: 'standby' },
  { id: 'd2', name: 'Vikramaditya R.', bloodGroup: 'O-', distanceKm: 3.2, pinCode: '530016', angle: 110, isPremium: true, status: 'standby' },
  { id: 'd3', name: 'Dr. Neha P.', bloodGroup: 'B+', distanceKm: 4.5, pinCode: '530016', angle: 195, isPremium: false, status: 'standby' },
  { id: 'd4', name: 'Pooja V.', bloodGroup: 'A+', distanceKm: 6.8, pinCode: '530013', angle: 260, isPremium: false, status: 'standby' },
  { id: 'd5', name: 'Suresh K.', bloodGroup: 'O+', distanceKm: 8.4, pinCode: '530013', angle: 320, isPremium: true, status: 'standby' },
  { id: 'd6', name: 'Ananya D.', bloodGroup: 'AB+', distanceKm: 9.6, pinCode: '530020', angle: 75, isPremium: false, status: 'standby' },
];

export const DispatchRadar3D: React.FC = () => {
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup>('O+');
  const [donors, setDonors] = useState<RadarDonorNode[]>(INITIAL_RADAR_DONORS);
  const [isPulsing, setIsPulsing] = useState<boolean>(true);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [hoveredDonor, setHoveredDonor] = useState<RadarDonorNode | null>(null);

  // Trigger dispatch pulse animation
  const handleTriggerDispatch = (blood: BloodGroup) => {
    setSelectedBlood(blood);
    setIsPulsing(true);
    setPulseCount(prev => prev + 1);

    // Update donors matching compatibility
    setDonors(prev =>
      prev.map(d => {
        const isCompatible = blood === 'O+' ? ['O+', 'O-'].includes(d.bloodGroup) : d.bloodGroup === blood || d.bloodGroup === 'O-';
        return {
          ...d,
          status: isCompatible ? 'dispatched' : 'standby'
        };
      })
    );

    // After 1.4s, upgrade dispatched to connected
    setTimeout(() => {
      setDonors(prev =>
        prev.map(d => (d.status === 'dispatched' ? { ...d, status: 'connected' } : d))
      );
    }, 1400);
  };

  useEffect(() => {
    handleTriggerDispatch('O+');
  }, []);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-900/50 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/25 relative overflow-hidden space-y-6">
      
      {/* Background ambient grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef44440a_1px,transparent_1px),linear-gradient(to_bottom,#ef44440a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none opacity-60"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800 text-[10px] font-bold">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              24/7 Geodesic Radar
            </span>
            <span className="text-xs text-slate-400 font-mono">PIN 530016 Center</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
            Holographic Emergency Dispatch Engine
          </h3>
          <p className="text-xs text-slate-400">
            Real-time geospatial matching: Hospital Epicenter $\rightarrow$ Same PIN $\rightarrow$ Neighbor PINs
          </p>
        </div>

        {/* Trigger Blood Group Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 hidden sm:inline">Emergency Blood:</span>
          {(['O+', 'O-', 'A+', 'B+', 'AB+'] as BloodGroup[]).map(bg => (
            <button
              key={bg}
              onClick={() => handleTriggerDispatch(bg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedBlood === bg
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 scale-105'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Circular Radar Display Area */}
      <div className="relative w-full max-w-xl mx-auto aspect-square flex items-center justify-center p-4">
        
        {/* Radar Concentric Rings with Distance Markers */}
        {/* Ring 1: 0 - 4 km (Same PIN) */}
        <div className="absolute w-[36%] aspect-square rounded-full border border-red-500/40 bg-red-950/10 flex items-center justify-center">
          <span className="absolute top-1 text-[9px] font-mono text-red-400/80 font-bold">0-4 km (Same PIN)</span>
        </div>

        {/* Ring 2: 4 - 8 km (Neighbor PINs) */}
        <div className="absolute w-[68%] aspect-square rounded-full border border-red-500/25 bg-red-950/5 flex items-center justify-center">
          <span className="absolute top-2 text-[9px] font-mono text-slate-400 font-semibold">4-8 km (Neighbor PINs)</span>
        </div>

        {/* Ring 3: 8 - 15 km (District Boundary) */}
        <div className="absolute w-[96%] aspect-square rounded-full border border-dashed border-slate-700/60 flex items-center justify-center">
          <span className="absolute top-2 text-[9px] font-mono text-slate-500">8-15 km (District)</span>
        </div>

        {/* Pulsing Shockwave Rings */}
        {isPulsing && (
          <>
            <div 
              key={`pulse-1-${pulseCount}`}
              className="absolute w-24 h-24 rounded-full border-2 border-red-500/80 pointer-events-none animate-ping"
              style={{ animationDuration: '2.4s' }}
            />
            <div 
              key={`pulse-2-${pulseCount}`}
              className="absolute w-44 h-44 rounded-full border border-amber-500/50 pointer-events-none animate-ping"
              style={{ animationDuration: '3.2s', animationDelay: '0.4s' }}
            />
          </>
        )}

        {/* Radar Scanner Line (Rotating 360 deg) */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
          style={{ animation: 'spin 6s linear infinite' }}
        >
          <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-tl from-red-600/20 via-red-600/5 to-transparent"></div>
        </div>

        {/* Center Hospital Epicenter Node */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 border-2 border-white/60 flex items-center justify-center text-white shadow-2xl shadow-red-600/80 group cursor-pointer hover:scale-110 transition-transform">
            <Heart className="w-7 h-7 fill-white animate-pulse" />
          </div>
          <span className="mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/90 text-white border border-red-500/60 shadow-lg font-mono">
            Hospital Epicenter
          </span>
          <span className="text-[9px] text-slate-400 font-mono">PIN 530016</span>
        </div>

        {/* Orbiting Donor Nodes plotted by Polar Coordinates */}
        {donors.map(d => {
          // Compute x, y coordinates based on angle & distance
          const normalizedDist = 20 + (d.distanceKm / 10) * 36; // percent radius from center
          const rad = (d.angle * Math.PI) / 180;
          const leftPercent = 50 + normalizedDist * Math.cos(rad);
          const topPercent = 50 + normalizedDist * Math.sin(rad);

          const isConnected = d.status === 'connected';
          const isDispatched = d.status === 'dispatched';

          return (
            <div
              key={d.id}
              onMouseEnter={() => setHoveredDonor(d)}
              onMouseLeave={() => setHoveredDonor(null)}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 cursor-pointer"
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
            >
              {/* Energy Connection Line to Center when matched */}
              {(isConnected || isDispatched) && (
                <svg className="absolute inset-0 w-96 h-96 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" style={{ left: '50%', top: '50%' }}>
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`${50 + (50 - leftPercent) * 2}%`}
                    y2={`${50 + (50 - topPercent) * 2}%`}
                    stroke={isConnected ? '#10b981' : '#f59e0b'}
                    strokeWidth="1.5"
                    strokeDasharray={isDispatched ? '4,4' : 'none'}
                    className={isDispatched ? 'animate-pulse' : ''}
                    opacity="0.6"
                  />
                </svg>
              )}

              {/* Node Avatar */}
              <div
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all shadow-xl ${
                  isConnected
                    ? 'bg-emerald-600 text-white border-2 border-emerald-400 ring-4 ring-emerald-500/30 scale-110'
                    : isDispatched
                    ? 'bg-amber-600 text-white border-2 border-amber-400 ring-4 ring-amber-500/30 scale-105 animate-pulse'
                    : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-red-400'
                }`}
              >
                <span>{d.bloodGroup}</span>
                {d.isPremium && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[8px] font-black shadow">
                    ★
                  </span>
                )}
              </div>

              {/* Mini Label */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-center pointer-events-none">
                <span className="text-[9px] font-bold text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                  {d.distanceKm}km
                </span>
              </div>
            </div>
          );
        })}

        {/* Hovered Donor Floating Info Card */}
        {hoveredDonor && (
          <div className="absolute bottom-4 left-4 z-30 p-3 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs space-y-1 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{hoveredDonor.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-bold border border-red-800 text-[10px]">
                {hoveredDonor.bloodGroup}
              </span>
              {hoveredDonor.isPremium && (
                <span className="text-[9px] text-amber-400 font-bold">★ Premium</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              PIN {hoveredDonor.pinCode} • {hoveredDonor.distanceKm} km from hospital
            </div>
            <div className="text-[10px] font-bold text-emerald-400">
              {hoveredDonor.status === 'connected' ? '✓ Dispatched & Accepted' : 'Ready for Alert'}
            </div>
          </div>
        )}

      </div>

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
          <div className="text-xl font-black text-white">4.2 min</div>
          <div className="text-[10px] text-slate-400">Avg Dispatch Speed</div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
          <div className="text-xl font-black text-emerald-400">
            {donors.filter(d => d.status === 'connected').length} Connected
          </div>
          <div className="text-[10px] text-slate-400">Accepted {selectedBlood} Donors</div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
          <div className="text-xl font-black text-amber-400">100%</div>
          <div className="text-[10px] text-slate-400">Zero-Scrape Privacy</div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
          <div className="text-xl font-black text-blue-400">15 km</div>
          <div className="text-[10px] text-slate-400">Max Geodesic Range</div>
        </div>
      </div>

    </div>
  );
};
