import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ChevronDown, Target, Crosshair, RotateCcw, Sparkles, Zap } from 'lucide-react';

const TIMELINE_STEPS = [
  { label: 'T-72h', desc: 'Initial Detection', offset: -72 },
  { label: 'T-48h', desc: 'Tracking Objects', offset: -48 },
  { label: 'T-24h', desc: 'Risk Analysis', badge: 'HIGH RISK', offset: -24 },
  { label: 'T-12h', desc: 'AI Evaluation', offset: -12 },
  { label: 'T-6h', desc: 'Maneuver Planning', offset: -6 },
  { label: 'T-0h', desc: 'Maneuver Execution', offset: 0 },
];

const AI_EVENTS = [
  { id: 'DETECTION', delay: 0.2, color: '#ff3c3c', title: 'DETECTION', desc: 'Primary and secondary object trajectories intersect within the 50km high-risk threshold.' },
  { id: 'ANALYSIS', delay: 1.0, color: '#f5a623', title: 'ANALYSIS', desc: 'Closest approach projected in 12h 45m. Monte Carlo simulation indicates high probability of fragmentation.' },
  { id: 'RECOMMENDATION', delay: 1.8, color: '#9d8df1', title: 'RECOMMENDATION', desc: 'Objects projected to pass within threshold. Evasive maneuver highly recommended to preserve asset.' },
];

const IntelligenceFeedItem = ({ item, onHoverStart, onHoverEnd }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: item.delay, duration: 0.5 }}
    onHoverStart={onHoverStart}
    onHoverEnd={onHoverEnd}
    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
  >
    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
    <div className="flex flex-col">
      <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: item.color }}>{item.title}</span>
      <span className="text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>{item.desc}</span>
    </div>
  </motion.div>
);

export default function DashboardMain({ parallaxX, parallaxY, reverseParallaxY, reverseParallaxX }) {
  const scenario = useStore((s) => s.scenario);
  const engineState = useStore((s) => s.engineState);
  const setAppView = useStore((s) => s.setAppView);
  
  const setHoveredObject = useStore((s) => s.setHoveredObject);
  const activeTimelineIdx = useStore((s) => s.activeTimelineIdx);
  const setActiveTimelineIdx = useStore((s) => s.setActiveTimelineIdx);
  const setCameraTarget = useStore((s) => s.setCameraTarget);
  const setActiveAiEvent = useStore((s) => s.setActiveAiEvent);
  const smoothScrubTo = useStore((s) => s.smoothScrubTo);
  
  const { riskTier, Pc, confidence } = engineState;

  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
  const [activeGlobeTool, setActiveGlobeTool] = useState('Center');
  const [showAlts, setShowAlts] = useState(false);

  // CDM data from backend
  const [cdmAlerts, setCdmAlerts] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/cdms')
      .then(r => r.json())
      .then(data => setCdmAlerts(data || []))
      .catch(() => setCdmAlerts([]));
  }, []);

  const primaryCdm = cdmAlerts[0] || null;
  const pcValue = primaryCdm?.collision_probability ?? Pc ?? 0;
  const pcDisplay = pcValue !== 0 ? Number(pcValue).toExponential(3) : '0.000';
  const confPercent = confidence ?? 0;
  const missDistance = primaryCdm?.miss_distance ?? 0;
  const primaryName = primaryCdm?.primary_object?.name ?? scenario?.shortName?.split(' vs ')?.[0] ?? 'PRIMARY';
  const secondaryName = primaryCdm?.secondary_object?.name ?? scenario?.shortName?.split(' vs ')?.[1] ?? 'SECONDARY';
  const primaryId = primaryCdm?.primary_object?.norad_id ?? 'N/A';
  const secondaryId = primaryCdm?.secondary_object?.norad_id ?? 'N/A';
  const tcaRaw = primaryCdm?.tca ?? null;
  const tcaDisplay = tcaRaw ? new Date(tcaRaw).toLocaleTimeString('en-US', { hour12: false }) + ' UTC' : 'N/A';

  const riskLabel = riskTier === 'Critical' ? 'HIGH RISK' : riskTier === 'Warning' ? 'MEDIUM RISK' : 'LOW RISK';
  const riskShort = riskTier === 'Critical' ? 'HI' : riskTier === 'Warning' ? 'MED' : 'LO';

  const handleGlobeTool = (label) => {
    setActiveGlobeTool(label);
    if (label === 'Reset') setCameraTarget('EARTH');
    if (label === 'Center') setCameraTarget('PRIMARY');
    if (label === '2D') setCameraTarget('2D');
    if (label === 'Threat') setCameraTarget('SECONDARY');
  };

  const handleTimelineHover = (idx, offset) => {
    setActiveTimelineIdx(idx);
    smoothScrubTo(offset); // Trigger mission replay in 3D scene
  };

  return (
    <>
      <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none">
        
        {/* LEFT COLUMN: Timeline + Active Objects */}
        <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[320px] shrink-0 flex flex-col gap-4 pointer-events-auto">
          
          {/* Mission Timeline */}
          <motion.div whileHover={{ y: -2 }} className="rounded-xl border flex-1 flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 cursor-pointer" onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9d8df1] shadow-[0_0_5px_#9d8df1]" />
                <span className="text-xs font-bold uppercase tracking-[0.1em]">Mission Timeline</span>
              </div>
              <motion.button animate={{ rotate: isTimelineExpanded ? 0 : 180 }} className="p-1 rounded text-[#6b7280] hover:text-white">
                <ChevronDown size={14} />
              </motion.button>
            </div>

            <AnimatePresence>
              {isTimelineExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col px-4 pb-4 overflow-hidden">
                  {TIMELINE_STEPS.map((step, i) => {
                    const isActive = i <= activeTimelineIdx;
                    const isCurrent = i === activeTimelineIdx;
                    const isPast = i < activeTimelineIdx;
                    return (
                      <div 
                        key={step.label} 
                        className="flex items-start gap-3 relative cursor-pointer group"
                        onMouseEnter={() => handleTimelineHover(i, step.offset)}
                      >
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className="absolute left-[7px] top-[18px] w-[2px] h-[calc(100%)] transition-colors duration-500" style={{ background: isPast ? '#9d8df1' : '#1e2433' }} />
                        )}
                        <motion.div 
                          animate={isCurrent ? { scale: [1, 1.2, 1], boxShadow: ['0 0 0px #9d8df1', '0 0 10px #9d8df1', '0 0 0px #9d8df1'] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 z-10 transition-colors group-hover:border-[#9d8df1] group-hover:bg-[#9d8df1]`}
                          style={{ background: isActive ? '#9d8df1' : '#0d1120', borderColor: isActive ? '#9d8df1' : '#2a2f3a' }} 
                        />
                        <div className={`flex items-center gap-2 pb-5 group-hover:text-white transition-colors ${isCurrent ? 'text-white' : isActive ? 'text-white/70' : 'text-[#4a5060]'}`}>
                          <span className="text-xs font-mono font-semibold w-12">{step.label}</span>
                          <span className="text-xs">{step.desc}</span>
                          {step.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider border bg-[#ff3c3c]/10 text-[#ff3c3c] border-[#ff3c3c]/30">
                              {step.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Active Objects */}
          <motion.div whileHover={{ y: -2 }} className="rounded-xl border p-4 bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d084] shadow-[0_0_5px_#00d084]" />
              <span className="text-xs font-bold uppercase tracking-[0.1em]">Active Objects</span>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02, borderColor: '#00d084' }}
              onHoverStart={() => setHoveredObject('PRIMARY')}
              onHoverEnd={() => setHoveredObject(null)}
              onClick={() => setCameraTarget('PRIMARY')}
              className="flex flex-col p-3 rounded-lg border bg-[#080c16] border-[#1e2433] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00d084] shadow-[0_0_8px_#00d084]" />
                  <span className="text-xs font-bold text-white">{primaryName} (PRIMARY)</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00d084]/20 text-[#00d084] border border-[#00d084]/30">ACTIVE</span>
              </div>
              <span className="text-[10px] text-[#6b7280] ml-4 font-mono">ID: {primaryId}</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, borderColor: '#ff3c3c' }}
              onHoverStart={() => setHoveredObject('SECONDARY')}
              onHoverEnd={() => setHoveredObject(null)}
              onClick={() => setCameraTarget('SECONDARY')}
              className="flex flex-col p-3 rounded-lg border bg-[#080c16] border-[#1e2433] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ff3c3c] shadow-[0_0_8px_#ff3c3c]" />
                  <span className="text-xs font-bold text-white">{secondaryName}</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ff3c3c]/20 text-[#ff3c3c] border border-[#ff3c3c]/30">DEBRIS</span>
              </div>
              <span className="text-[10px] text-[#6b7280] ml-4 font-mono">ID: {secondaryId}</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* CENTER: Transparent area for Globe */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Globe Controls */}
          <motion.div style={{ y: reverseParallaxY }} className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl border bg-[#0d1120]/80 backdrop-blur-md border-[#1e2433] shadow-2xl pointer-events-auto">
            {[
              { icon: <RotateCcw size={14} />, label: 'Reset' },
              { icon: <Crosshair size={14} />, label: 'Center' },
              { icon: <Target size={14} />, label: 'Threat' },
              { icon: null, label: '2D', text: true },
            ].map((btn, i) => {
              const isActive = activeGlobeTool === btn.label;
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGlobeTool(btn.label)}
                  className={`h-10 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${isActive ? 'text-white' : 'text-[#6b7280] hover:text-white hover:bg-white/10'}`}
                  style={{ 
                    background: isActive ? '#1a2235' : 'transparent', 
                    border: isActive ? '1px solid #7c5df8' : '1px solid transparent', 
                    boxShadow: isActive ? '0 0 15px rgba(124, 93, 248, 0.3)' : 'none'
                  }}
                  title={btn.label}
                >
                  {btn.icon}
                  <span className="text-xs font-bold">{btn.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Risk Analysis */}
        <motion.div style={{ x: reverseParallaxX, y: parallaxY }} className="w-[300px] shrink-0 flex flex-col pointer-events-auto">
          <motion.div whileHover={{ y: -2 }} className="rounded-xl border p-5 flex flex-col bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert size={16} className="text-[#ff3c3c]" />
              <span className="text-xs font-bold uppercase tracking-[0.1em]">Risk Analysis</span>
            </div>

            {/* Animated Circular Gauge */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="6" stroke="#1e2433" />
                  <motion.circle 
                    cx="60" cy="60" r="50" fill="none" strokeWidth="6" stroke="#ff3c3c"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${Math.PI * 100}` }}
                    animate={{ strokeDasharray: `${Math.PI * 100 * 0.75} ${Math.PI * 100 * 0.25}` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                  <span className="text-3xl font-bold text-[#ff3c3c] shadow-[#ff3c3c]">{riskShort}</span>
                  <span className="text-[9px] font-bold tracking-widest text-[#ff3c3c] mt-1">{riskLabel}</span>
                </div>
              </div>
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-4 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest bg-[#ff3c3c]/10 text-[#ff3c3c] border border-[#ff3c3c]/30 shadow-[0_0_10px_rgba(255,60,60,0.2)]">
                PENDING ACTION
              </motion.div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Probability', value: pcDisplay, color: '#ff3c3c' },
                { label: 'Confidence', value: `${confPercent}%`, color: '#fff' },
                { label: 'Time to CA', value: 'T-12h', color: '#fff' },
                { label: 'TCA', value: tcaDisplay, color: '#fff' },
                { label: 'Miss Distance', value: `${missDistance} km`, color: '#fff' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center px-1">
                  <span className="text-[11px] text-[#6b7280]">{item.label}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(157, 141, 241, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setAppView('INVESTIGATION'); setCameraTarget('TCA'); }}
              className="mt-6 w-full py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors bg-[#9d8df1] hover:bg-[#a698f2] text-white"
            >
              View Detailed Analysis
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* BOTTOM PANELS */}
      <div className="h-[180px] shrink-0 flex gap-4 px-4 pb-4 pointer-events-none z-10">
        
        {/* AI Reasoning Feed */}
        <motion.div style={{ y: parallaxY }} className="flex-1 rounded-xl border p-4 flex flex-col bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg relative overflow-hidden pointer-events-auto">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#9d8df1] to-transparent opacity-50" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#9d8df1]" />
              <span className="text-xs font-bold uppercase tracking-[0.1em]">AURA Intelligence Feed</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#9d8df1]/10 border border-[#9d8df1]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#9d8df1] animate-pulse" />
              <span className="text-[9px] font-bold text-[#9d8df1]">LIVE</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1 overflow-auto pl-2">
            {AI_EVENTS.map((item) => (
              <IntelligenceFeedItem 
                key={item.id} 
                item={item} 
                onHoverStart={() => {
                  setActiveAiEvent(item.id);
                  if (item.id === 'DETECTION') setHoveredObject('SECONDARY');
                  if (item.id === 'ANALYSIS') setHoveredObject('PRIMARY');
                }}
                onHoverEnd={() => {
                  setActiveAiEvent(null);
                  setHoveredObject(null);
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Recommended Action */}
        <motion.div style={{ y: parallaxY }} className="w-[450px] shrink-0 rounded-xl border p-4 flex flex-col bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.1em] font-bold mb-1 text-[#6b7280]">RECOMMENDED ACTION</div>
              <div className="text-[15px] font-bold text-white">Execute avoidance maneuver.</div>
            </div>
            <button onClick={() => setShowAlts(!showAlts)} className="text-[10px] font-bold text-[#9d8df1] hover:text-white transition-colors underline underline-offset-2">
              {showAlts ? 'Hide Alternatives' : 'View Alternatives'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!showAlts ? (
              <motion.div key="primary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col flex-1 justify-between">
                <div 
                  className="flex gap-8 bg-[#080c16] p-3 rounded-lg border border-[#1e2433] cursor-pointer hover:border-[#00d084] transition-colors"
                  onMouseEnter={() => setActiveAiEvent('RECOMMENDATION')}
                  onMouseLeave={() => setActiveAiEvent(null)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280]">Delta-V Req.</span>
                    <span className="text-sm font-bold font-mono text-white">2.45 m/s</span>
                  </div>
                  <div className="w-[1px] bg-[#1e2433]" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280]">Optimal Window</span>
                    <span className="text-sm font-bold font-mono text-white">T-11h 20m</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex items-center gap-1.5">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 rounded-full border border-dashed border-[#00d084] border-t-transparent" />
                    <span className="text-[9px] font-bold text-[#00d084]">SYSTEMS SYNCED</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(157, 141, 241, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setAppView('INVESTIGATION'); setCameraTarget('TCA'); }}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-widest uppercase bg-[#9d8df1] text-white"
                  >
                    <Zap size={14} />
                    Plan Maneuver
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="alts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2 overflow-auto">
                {[
                  { name: 'Radial Push', dv: '4.12 m/s', risk: 'Medium', reason: 'High fuel cost' },
                  { name: 'Cross-Track', dv: '8.50 m/s', risk: 'High', reason: 'Suboptimal angle' }
                ].map(alt => (
                  <div key={alt.name} className="flex items-center justify-between p-2 rounded bg-[#080c16] border border-[#1e2433] hover:border-[#ff3c3c] transition-colors cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white">{alt.name}</span>
                      <span className="text-[9px] text-[#ff3c3c]">Rejected: {alt.reason}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#6b7280]">{alt.dv}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
