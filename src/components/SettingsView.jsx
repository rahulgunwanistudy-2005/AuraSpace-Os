import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Monitor, Sun, Globe2, Bell } from 'lucide-react';
import { useStore } from '../state/store';

export default function SettingsView({ parallaxX, parallaxY }) {
  const [bloom, setBloom] = useState(true);
  const [highResTextures, setHighResTextures] = useState(true);
  const [metric, setMetric] = useState(true);
  const [sound, setSound] = useState(true);

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none">
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[600px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <div className="w-10 h-10 rounded-lg border border-[#6b7280]/30 flex items-center justify-center bg-[#6b7280]/10">
            <Settings size={20} className="text-[#9ca3af]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-widest uppercase">System Settings</span>
            <span className="text-[10px] text-[#6b7280]">Application Configuration & Rendering</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-8">
          
          {/* Graphics Settings */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#1e2433] pb-2">
              <Monitor size={14} className="text-[#9d8df1]" />
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Graphics & Rendering</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#080c16] border border-[#1e2433]">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Post-Processing Bloom</span>
                <span className="text-[10px] text-[#6b7280]">Cinematic glow effects on orbits and stars</span>
              </div>
              <button 
                onClick={() => setBloom(!bloom)}
                className={`w-10 h-5 rounded-full relative transition-colors ${bloom ? 'bg-[#9d8df1]' : 'bg-[#2a2f3a]'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${bloom ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#080c16] border border-[#1e2433]">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">8K Earth Textures</span>
                <span className="text-[10px] text-[#6b7280]">Use high-resolution maps for the Globe</span>
              </div>
              <button 
                onClick={() => setHighResTextures(!highResTextures)}
                className={`w-10 h-5 rounded-full relative transition-colors ${highResTextures ? 'bg-[#00d084]' : 'bg-[#2a2f3a]'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${highResTextures ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Localization */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#1e2433] pb-2">
              <Globe2 size={14} className="text-[#9d8df1]" />
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Localization</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#080c16] border border-[#1e2433]">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Measurement System</span>
                <span className="text-[10px] text-[#6b7280]">Kilometers vs Miles</span>
              </div>
              <div className="flex items-center gap-1 bg-[#1e2433]/50 rounded-lg p-1">
                <button onClick={() => setMetric(true)} className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${metric ? 'bg-[#1e2433] text-white' : 'text-[#6b7280]'}`}>METRIC</button>
                <button onClick={() => setMetric(false)} className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${!metric ? 'bg-[#1e2433] text-white' : 'text-[#6b7280]'}`}>IMPERIAL</button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#1e2433] pb-2">
              <Bell size={14} className="text-[#9d8df1]" />
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Alerts & Audio</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#080c16] border border-[#1e2433]">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">UI Sound Effects</span>
                <span className="text-[10px] text-[#6b7280]">Telemetry pings and hover sounds</span>
              </div>
              <button 
                onClick={() => setSound(!sound)}
                className={`w-10 h-5 rounded-full relative transition-colors ${sound ? 'bg-[#9d8df1]' : 'bg-[#2a2f3a]'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${sound ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
