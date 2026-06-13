import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Activity, Radio, Signal } from 'lucide-react';
import { useStore } from '../state/store';

export default function LiveView({ parallaxX, parallaxY }) {
  const engineState = useStore(s => s.engineState);
  
  return (
    <div className="flex-1 flex overflow-hidden p-8 pointer-events-none justify-between items-start">
      {/* Top Left Minimal HUD */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[#00d084] flex items-center justify-center bg-[#00d084]/10 shadow-[0_0_15px_rgba(0,208,132,0.3)]">
            <Eye size={16} className="text-[#00d084]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-widest uppercase shadow-black drop-shadow-md">LIVE TELEMETRY HUD</span>
            <span className="text-[10px] text-[#00d084] shadow-black drop-shadow-md">Immersive Mode Active</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <Activity size={12} className="text-[#9d8df1]" />
            <span className="text-[10px] uppercase text-[#9ca3af] font-mono tracking-widest w-24">FPS Lock</span>
            <span className="text-xs font-bold text-white font-mono">60.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Radio size={12} className="text-[#9d8df1]" />
            <span className="text-[10px] uppercase text-[#9ca3af] font-mono tracking-widest w-24">Uplink</span>
            <span className="text-xs font-bold text-[#00d084] font-mono">SECURE</span>
          </div>
          <div className="flex items-center gap-3">
            <Signal size={12} className="text-[#9d8df1]" />
            <span className="text-[10px] uppercase text-[#9ca3af] font-mono tracking-widest w-24">Ping</span>
            <span className="text-xs font-bold text-white font-mono">12ms</span>
          </div>
        </div>
      </motion.div>

      {/* Top Right Minimal Warning HUD if Risk is high */}
      {engineState.riskTier === 'Critical' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-end gap-2 bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-[#ff3c3c]/30"
        >
          <span className="text-[10px] font-bold tracking-widest text-[#ff3c3c] uppercase">Critical Alert</span>
          <span className="text-2xl font-mono font-bold text-[#ff3c3c] drop-shadow-[0_0_10px_rgba(255,60,60,0.8)]">
            Pc: {Number(engineState.Pc).toExponential(3)}
          </span>
          <span className="text-[10px] font-mono text-white/70">Collision Avoidance Required</span>
        </motion.div>
      )}
    </div>
  );
}
