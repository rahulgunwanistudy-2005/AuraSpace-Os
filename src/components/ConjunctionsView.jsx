import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Map, Crosshair, ChevronRight } from 'lucide-react';
import { useStore } from '../state/store';

export default function ConjunctionsView({ parallaxX, parallaxY }) {
  const [cdms, setCdms] = useState([]);
  const setCameraTarget = useStore(s => s.setCameraTarget);
  const setAppView = useStore(s => s.setAppView);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/cdms')
      .then(r => r.json())
      .then(data => setCdms(data || []))
      .catch(err => console.error("Failed to fetch CDMs", err));
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none">
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[450px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <div className="w-10 h-10 rounded-lg border border-[#ff3c3c]/30 flex items-center justify-center bg-[#ff3c3c]/10">
            <AlertTriangle size={20} className="text-[#ff3c3c]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-widest uppercase">Active Conjunctions</span>
            <span className="text-[10px] text-[#ff3c3c]">Requires Immediate Review</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          {cdms.map((cdm, i) => (
            <motion.div 
              key={cdm.message_id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                setCameraTarget('TCA');
              }}
              className="group cursor-pointer p-4 rounded-xl border border-[#1e2433] bg-[#080c16] hover:border-[#ff3c3c] transition-colors flex flex-col gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff3c3c]" />
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{cdm.primary_object?.name} vs {cdm.secondary_object?.name}</span>
                  <span className="text-[10px] font-mono text-[#6b7280]">MSG ID: {cdm.message_id}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold border border-[#ff3c3c]/30 bg-[#ff3c3c]/10 text-[#ff3c3c]">HIGH RISK</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Time to CA</span>
                  <span className="text-sm font-mono text-white">T-12h 45m</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Probability (Pc)</span>
                  <span className="text-sm font-mono text-[#ff3c3c]">{Number(cdm.collision_probability).toExponential(3)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Miss Distance</span>
                  <span className="text-sm font-mono text-white">{cdm.miss_distance} km</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Relative Vel.</span>
                  <span className="text-sm font-mono text-white">{cdm.relative_velocity} km/s</span>
                </div>
              </div>

              <div className="border-t border-[#1e2433] mt-2 pt-3 flex items-center justify-between">
                <button 
                  onClick={(e) => { e.stopPropagation(); setCameraTarget('TCA'); }}
                  className="flex items-center gap-2 text-[10px] font-bold text-[#6b7280] hover:text-white transition-colors"
                >
                  <Crosshair size={12} />
                  VIEW ON GLOBE
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setAppView('INVESTIGATION'); setCameraTarget('TCA'); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#9d8df1] hover:text-white transition-colors"
                >
                  ANALYZE
                  <ChevronRight size={12} />
                </button>
              </div>
            </motion.div>
          ))}
          
          {cdms.length === 0 && (
             <div className="text-center text-xs text-[#6b7280] mt-10">No active conjunctions found.</div>
          )}
        </div>
      </motion.div>
      
      {/* Invisible flex-1 filler to push it to the left */}
      <div className="flex-1" />
    </div>
  );
}
