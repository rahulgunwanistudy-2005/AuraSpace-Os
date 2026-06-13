import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cpu, Navigation, CheckCircle2 } from 'lucide-react';
import { useStore } from '../state/store';
import BPlaneVisualization from './BPlaneVisualization';

export default function InvestigationView({ parallaxX, parallaxY }) {
  const orbState = useStore((s) => s.orbState);
  const activeSequence = orbState !== 'IDLE';
  const isComputing = useStore((s) => s.isComputing);
  const computingLabel = useStore((s) => s.computingLabel);
  const timeOffset = useStore((s) => s.timeOffset);
  const selectedStrategy = useStore((s) => s.selectedStrategy);
  
  const activateCopilot = useStore((s) => s.activateCopilot);
  const abortCopilotSequence = useStore((s) => s.abortCopilotSequence);
  
  const scenario = useStore((s) => s.scenario);
  const executeManeuver = useStore((s) => s.executeManeuver);
  const [coreLogs, setCoreLogs] = useState([]);

  useEffect(() => {
    if (activeSequence && orbState === 'THREAT_DETECTION') {
      setCoreLogs([]);
      let sequence = [
        { t: 0, time: "00.00s", type: "info", text: "INGESTING CCSDS CDM & TLE..." },
        { t: 500, time: "00.12s", type: "info", text: "INITIALIZING SGP4 PROPAGATOR FOR LEO..." },
        { t: 1200, time: "00.35s", type: "info", text: "COORDINATE TRANSFORM: TEME -> ITRF -> J2000" },
        { t: 4000, time: "00.80s", type: "warn", text: "CALCULATING ||v_rel||... v_rel = 8.4 m/s" },
        { t: 4500, time: "00.85s", type: "warn", text: "SINGULARITY_FLAG = TRUE. BYPASSING 2D FOSTER Pc." },
        { t: 5500, time: "01.00s", type: "info", text: "SPAWNING 10^5 MONTE CARLO SIMULATORS (CWH J2)..." },
        { t: 9000, time: "02.10s", type: "info", text: "MINIMIZING J(Δv) OVER RADIAL, IN-TRACK, CROSS-TRACK..." },
        { t: 10000, time: "02.50s", type: "info", text: "EVALUATING GAUSS VARIATIONAL EQUATIONS (GVE)..." },
        { t: 11000, time: "03.20s", type: "info", text: "RUNNING DYNAMIC SECONDARY COLLISION SWEEP..." },
        { t: 14000, time: "03.45s", type: "success", text: "KD-TREE DEBRIS CATALOG QUERIED: NO INTERSECTIONS." },
        { t: 16000, time: "03.90s", type: "success", text: "OPTIMAL DELTA-V LOCKED." },
        { t: 16500, time: "04.05s", type: "info", text: "INITIATING MANEUVER SEQUENCE..." },
        { t: 20000, time: "04.85s", type: "success", text: "Pc < 10e-6 SECURED." }
      ];

      const timers = sequence.map((step) => 
        setTimeout(() => {
          setCoreLogs(prev => [...prev, step]);
        }, step.t)
      );

      return () => timers.forEach(clearTimeout);
    }
  }, [activeSequence, orbState]);

  let countdownNum = 3;
  if (orbState === 'MANEUVER_LOCKED') {
    countdownNum = Math.max(1, Math.ceil(Math.abs(timeOffset)));
  }

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none relative z-10">
      
      {/* ═══ MONTE CARLO TERMINAL ═══ */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[450px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <div className="w-10 h-10 rounded-lg border border-[#9d8df1]/30 flex items-center justify-center bg-[#9d8df1]/10">
            <Cpu size={20} className="text-[#9d8df1]" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-bold text-white tracking-widest uppercase">Monte Carlo Engine</span>
            <span className="text-[10px] text-[#9d8df1]">J2-Perturbed Covariance Propagation</span>
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isComputing ? 'bg-[#9d8df1]/10 border-[#9d8df1]/30' : 'bg-[#00d084]/10 border-[#00d084]/30'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isComputing ? 'bg-[#9d8df1] animate-pulse' : 'bg-[#00d084]'}`} />
            <span className={`text-[9px] font-bold tracking-widest ${isComputing ? 'text-[#9d8df1]' : 'text-[#00d084]'}`}>{isComputing ? 'COMPUTING' : 'READY'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col bg-[#05070a] font-mono text-xs relative">
          <AnimatePresence>
            {coreLogs.map((log, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 mb-2"
              >
                <span className="text-[#6b7280] shrink-0">[{log.time}]</span>
                <span className={
                  log.type === 'warn' ? 'text-[#f5a623]' : 
                  log.type === 'success' ? 'text-[#00d084]' : 
                  'text-[#9d8df1]'
                }>
                  {log.text}
                </span>
              </motion.div>
            ))}
            {isComputing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-4 bg-[#9d8df1] mt-2 ml-14"
              />
            )}
          </AnimatePresence>
        </div>

        {orbState === 'OPTIONS_READY' ? (
          <div className="flex flex-col p-4 border-t border-[#1e2433] bg-[#080c16] gap-3">
            <span className="text-[10px] text-[#8a91a6] font-bold tracking-widest uppercase">Select Maneuver Strategy</span>
            <div className="grid grid-cols-2 gap-2">
              {scenario?.strategies?.filter(s => s.id !== 'no-action').map(strategy => (
                <button
                  key={strategy.id}
                  onClick={() => useStore.getState().setSelectedStrategy(strategy)}
                  className={`p-2 border rounded text-left text-xs transition-colors ${
                    selectedStrategy?.id === strategy.id ? 'bg-[#9d8df1]/20 border-[#9d8df1] text-white' : 'bg-black/30 border-white/10 text-[#8a91a6] hover:bg-black/50 hover:text-white'
                  }`}
                >
                  <div className="font-bold">{strategy.name}</div>
                  <div className="text-[10px] opacity-70">{strategy.deltaV?.toFixed(2)} m/s ΔV</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { if(selectedStrategy) executeManeuver(selectedStrategy); }}
              disabled={!selectedStrategy}
              className="mt-2 flex-1 py-3 rounded-lg border border-[#00d084]/50 bg-[#00d084]/10 text-[#00d084] hover:bg-[#00d084]/20 flex items-center justify-center gap-2 font-bold text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={14} /> EXECUTE MANEUVER
            </button>
          </div>
        ) : (
          <div className="border-t border-[#1e2433] bg-[#080c16] p-4 flex gap-3">
            <button
              onClick={activeSequence ? abortCopilotSequence : activateCopilot}
              className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs tracking-widest transition-all ${
                activeSequence 
                  ? 'border-[#ff3c3c]/50 bg-[#ff3c3c]/10 text-[#ff3c3c] hover:bg-[#ff3c3c]/20' 
                  : 'border-[#9d8df1]/50 bg-[#9d8df1]/10 text-[#9d8df1] hover:bg-[#9d8df1]/20'
              }`}
            >
              <Navigation size={14} />
              {activeSequence ? 'ABORT CALCULATION' : 'EXECUTE MONTE CARLO'}
            </button>
          </div>
        )}
      </motion.div>
      
      {/* ═══ B-PLANE VISUALIZATION ═══ */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[350px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <Activity size={16} className="text-[#9d8df1]" />
          <span className="text-[11px] font-bold text-white tracking-widest uppercase">B-Plane Geometry</span>
        </div>
        <div className="flex-1 p-4 relative flex flex-col items-center justify-center">
          <div className="w-full h-full border border-[#1e2433] bg-[#05070a] rounded-lg overflow-hidden relative">
            <BPlaneVisualization />
            
            {/* Overlay grid */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWUyNDMzIiBzdHJva2Utd2lkdGg9IjAuNSIvPgo8L3N2Zz4=')] opacity-20 pointer-events-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full mt-4">
            <div className="bg-[#080c16] border border-[#1e2433] rounded p-2 flex flex-col items-center">
              <span className="text-[9px] text-[#6b7280] tracking-widest font-bold">MISS DISTANCE</span>
              <span className="text-sm font-mono text-[#f5a623]">0.087 km</span>
            </div>
            <div className="bg-[#080c16] border border-[#1e2433] rounded p-2 flex flex-col items-center">
              <span className="text-[9px] text-[#6b7280] tracking-widest font-bold">RADIAL Δv</span>
              <span className="text-sm font-mono text-[#00d084]">1.2 m/s</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="flex-1" />

      {/* ═══ MISSION SUMMARY OVERLAY ═══ */}
      <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity duration-1000 ${orbState === 'MISSION_SUMMARY' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center border border-[#1e2433] bg-[#0d1120] p-12 rounded-xl max-w-xl w-full shadow-2xl shadow-[#00d084]/5">
          <CheckCircle2 size={48} className="text-[#00d084] mb-6" />
          <h2 className="text-3xl font-bold tracking-widest mb-8 text-white">MISSION SUMMARY</h2>
          
          <div className="w-full flex flex-col gap-4 text-sm font-mono text-[#8a91a6]">
            <div className="flex justify-between border-b border-[#1e2433] pb-2">
              <span>INITIAL RISK:</span>
              <span className="text-[#ff003c] font-bold">CRITICAL</span>
            </div>
            <div className="flex justify-between border-b border-[#1e2433] pb-2">
              <span>FINAL RISK:</span>
              <span className="text-[#00d084] font-bold">SAFE</span>
            </div>
            <div className="flex justify-between border-b border-[#1e2433] pb-2">
              <span>RECOMMENDED ACTION:</span>
              <span className="text-white font-bold">MANEUVER ({selectedStrategy?.deltaV?.toFixed(1) || '1.2'} m/s)</span>
            </div>
            <div className="flex justify-between border-b border-[#1e2433] pb-2">
              <span>CONFIDENCE:</span>
              <span className="text-white font-bold">97.4%</span>
            </div>
            <div className="flex justify-between border-b border-[#1e2433] pb-2">
              <span>OUTCOME:</span>
              <span className="text-[#00d084] font-bold">SUCCESSFUL</span>
            </div>
          </div>
          
          <div className="mt-12 text-xs font-bold tracking-widest text-[#6b7280] animate-pulse">
            RETURNING TO ORBITAL TRAFFIC COMMAND...
          </div>
        </div>
      </div>

      {/* ═══ VISUAL LEGEND ═══ */}
      <div className={`absolute right-6 top-20 pointer-events-none transition-all duration-700 ${['FUTURE_PREDICTION', 'AI_EVALUATES', 'MANEUVER_LOCKED'].includes(orbState) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
        <div className="bg-[#0d1120]/80 backdrop-blur-md border border-[#1e2433] rounded-xl p-4 w-[240px] shadow-lg flex flex-col gap-3">
          <div className="text-[10px] font-bold text-[#8a91a6] tracking-widest uppercase mb-1 border-b border-[#1e2433] pb-2">
            VISUAL LEGEND
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-0.5 bg-[#ff003c]"></div>
            <span className="text-xs font-semibold text-white">DANGER TRAJECTORY</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-0.5 bg-[#00d084]"></div>
            <span className="text-xs font-semibold text-white">SAFE PATH</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#ffb400]/20 border border-[#ffb400] border-dashed"></div>
            <span className="text-xs font-semibold text-white">UNCERTAINTY ZONE</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute w-full h-full border border-[#ff003c] rounded-full animate-ping opacity-75"></div>
              <div className="w-1.5 h-1.5 bg-[#ff003c] rounded-full"></div>
            </div>
            <span className="text-xs font-semibold text-white">COLLISION RISK</span>
          </div>
        </div>
      </div>

      {/* ═══ MANEUVER LOCKED COUNTDOWN ═══ */}
      <div className={`fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none transition-opacity duration-300 ${orbState === 'MANEUVER_LOCKED' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-[#9d8df1] text-2xl font-bold tracking-[0.5em] mb-4 shadow-black drop-shadow-lg">
          AI CHOICE LOCKED
        </div>
        <div className="text-[120px] font-bold text-white shadow-black drop-shadow-2xl leading-none">
          {countdownNum}
        </div>
        <div className="text-[#8a91a6] text-sm tracking-widest mt-4 uppercase shadow-black drop-shadow-md">
          PREPARING THRUSTER IGNITION
        </div>
      </div>

      {/* ═══ COMPUTING NOTIFICATION BAR ═══ */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[160] pointer-events-none transition-all duration-500 ${isComputing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3 bg-[#0d1120]/90 backdrop-blur-md border border-[#9d8df1]/40 rounded-xl px-5 py-2.5 shadow-lg shadow-[#9d8df1]/10">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="absolute w-full h-full border-2 border-[#9d8df1] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs font-semibold text-[#9d8df1] tracking-wider uppercase whitespace-nowrap">{computingLabel}</span>
        </div>
      </div>

    </div>
  );
}
