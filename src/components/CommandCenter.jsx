import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { AlertCircle, CheckCircle2, ShieldAlert, Activity, ChevronRight, Settings, Radio, Cpu } from 'lucide-react';

export default function CommandCenter() {
  const setAppView = useStore((s) => s.setAppView);
  const judgeModeActive = useStore((s) => s.judgeModeActive);
  const runJudgeModeSequence = useStore((s) => s.runJudgeModeSequence);
  const judgeModeStep = useStore((s) => s.judgeModeStep);
  const isComputing = useStore((s) => s.isComputing);
  const computingLabel = useStore((s) => s.computingLabel);

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch real CDMs from the backend
    fetch('http://localhost:8000/api/v1/cdms')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const formattedAlerts = data.map((cdm, index) => {
            const riskTier = cdm.collision_probability > 1e-4 ? 'CRITICAL' : 
                             cdm.collision_probability > 1e-6 ? 'WARNING' : 'SAFE';
            return {
              id: cdm.message_id || `CDM-${index}`,
              primary: cdm.primary_object.name || 'UNKNOWN',
              secondary: cdm.secondary_object.name || 'UNKNOWN',
              tca: new Date(cdm.tca).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              risk: riskTier,
              confidence: riskTier === 'CRITICAL' ? 94 : riskTier === 'WARNING' ? 82 : 99,
              action: riskTier === 'CRITICAL' ? 'REVIEW IMMEDIATELY' : 'MONITOR',
              reason: `Pc: ${cdm.collision_probability.toExponential(2)} | Miss Dist: ${cdm.miss_distance}m`,
              selected: false,
              visible: true
            };
          });
          setAlerts(formattedAlerts);
        } else {
          // Fallback to demo data if backend is empty
          setAlerts([
            { id: 'AURA-CRIT-001', primary: 'AURA-1', secondary: 'DEBRIS-327A', tca: '4h 12m', risk: 'CRITICAL', confidence: 94, action: 'REVIEW IMMEDIATELY', reason: 'Low miss distance. High uncertainty. Rapid risk growth.', selected: false, visible: true },
            { id: 'AURA-WARN-002', primary: 'AURA-1', secondary: 'OBJECT-901', tca: '16h 45m', risk: 'WARNING', confidence: 82, action: 'MONITOR', reason: 'Tracking confidence degraded. Probability stable.', selected: false, visible: true },
            { id: 'AURA-SAFE-003', primary: 'AURA-1', secondary: 'OBJECT-442', tca: '27h 10m', risk: 'SAFE', confidence: 99, action: 'IGNORE', reason: 'Miss distance > 10km. No intersection in uncertainty volume.', selected: false, visible: true }
          ]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch CDMs:', err);
        // Fallback to demo data on error
        setAlerts([
          { id: 'AURA-CRIT-001', primary: 'AURA-1', secondary: 'DEBRIS-327A', tca: '4h 12m', risk: 'CRITICAL', confidence: 94, action: 'REVIEW IMMEDIATELY', reason: 'Low miss distance. High uncertainty. Rapid risk growth.', selected: false, visible: true },
          { id: 'AURA-WARN-002', primary: 'AURA-1', secondary: 'OBJECT-901', tca: '16h 45m', risk: 'WARNING', confidence: 82, action: 'MONITOR', reason: 'Tracking confidence degraded. Probability stable.', selected: false, visible: true },
          { id: 'AURA-SAFE-003', primary: 'AURA-1', secondary: 'OBJECT-442', tca: '27h 10m', risk: 'SAFE', confidence: 99, action: 'IGNORE', reason: 'Miss distance > 10km. No intersection in uncertainty volume.', selected: false, visible: true }
        ]);
      });
  }, []);

  const [liveStream, setLiveStream] = useState([
    { text: "SYSTEM INITIATED. MONITORING TRAFFIC.", type: "system" }
  ]);
  
  const [totalCount, setTotalCount] = useState(1432);
  const [statsVisible, setStatsVisible] = useState(true);

  // Handle Judge Mode Orchestration
  useEffect(() => {
    if (judgeModeActive) {
      if (judgeModeStep === 1) {
        // Step 1: Hide everything
        setAlerts(prev => prev.map(a => ({...a, visible: false, selected: false})));
        setTotalCount(0);
        setStatsVisible(false);
      } else if (judgeModeStep === 3) {
        // Step 3: Stream starts flowing, stats animate up
        let currentCount = 0;
        const targets = [25, 127, 493, 892, 1432];
        targets.forEach((target, i) => {
          setTimeout(() => setTotalCount(target), 300 + (i * 300));
        });
        
        setTimeout(() => setStatsVisible(true), 2000);
        
        // Stagger SAFE cards
        setTimeout(() => {
          setAlerts(prev => prev.map(a => a.risk === 'SAFE' ? { ...a, visible: true } : a));
        }, 1000);

        let count = 0;
        const interval = setInterval(() => {
          count++;
          setLiveStream(prev => [
            { text: `NEW ALERT: ${Math.random() > 0.5 ? 'DEBRIS' : 'OBJECT'} ${Math.floor(Math.random() * 9000)} - LOW RISK - AUTO-DISMISSED`, type: "safe" },
            ...prev
          ].slice(0, 5));
          if (count > 6) clearInterval(interval);
        }, 400);
      } else if (judgeModeStep === 4) {
        // Step 4: AI Triages, Warning then Critical alert rises
        setTimeout(() => {
          setAlerts(prev => prev.map(a => a.risk === 'WARNING' ? { ...a, visible: true } : a));
          setLiveStream(prev => [{ text: `NEW ALERT: OBJECT-901 - MEDIUM RISK - MONITORING`, type: "warning" }, ...prev].slice(0, 5));
        }, 500);

        setTimeout(() => {
          setAlerts(prev => prev.map(a => a.risk === 'CRITICAL' ? { ...a, visible: true } : a));
          setLiveStream(prev => [{ text: `NEW ALERT: DEBRIS-327A - HIGH RISK - ESCALATED`, type: "critical" }, ...prev].slice(0, 5));
        }, 1500);
        
        setTimeout(() => {
          setAlerts(prev => prev.map(a => a.risk === 'CRITICAL' ? { ...a, selected: true } : a));
        }, 2500);
      }
    } else {
      // Normal idle stream
      setAlerts(prev => prev.map(a => ({...a, visible: true})));
      setTotalCount(1432);
      setStatsVisible(true);
      const interval = setInterval(() => {
        setLiveStream(prev => [
          { text: `NEW ALERT: OBJECT ${Math.floor(Math.random() * 9000)} - LOW RISK - AUTO-DISMISSED`, type: "safe" },
          ...prev
        ].slice(0, 5));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [judgeModeActive, judgeModeStep]);

  const handleAlertClick = (alert) => {
    if (alert.risk === 'CRITICAL') {
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, selected: true } : a));
      setTimeout(() => {
        setAppView('DASHBOARD');
      }, 1500);
    }
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-none font-sans text-white overflow-hidden flex">
      
      {/* 5-SECOND HERO SHOT TITLE */}
      {judgeModeActive && judgeModeStep === 1 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[100] animate-fade-in-out">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-light tracking-[0.5em] mb-4">AURASPACE OS</h1>
            <h2 className="text-sm font-bold tracking-[0.8em] text-[#8a91a6]">ORBITAL TRAFFIC COMMAND</h2>
          </div>
        </div>
      )}

      {/* LEFT 35% PANEL */}
      <div className={`w-[35%] min-w-[500px] h-full bg-[#04060a]/95 backdrop-blur-xl border-r border-[#2a2f3a] flex flex-col pointer-events-auto transform transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${judgeModeActive && judgeModeStep < 3 ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${judgeModeActive && judgeModeStep >= 5 ? '-translate-x-full opacity-0' : ''}
      `}>
        
        {/* HEADER */}
        <div className="p-6 border-b border-[#2a2f3a] bg-[#070b14] shrink-0 transition-opacity duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded text-[#9d8df1] flex items-center justify-center font-bold text-xl relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[#9d8df1]/20 rotate-45 transform"></div>
                A
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-widest text-lg">AURASPACE OS</span>
                <span className="text-[9px] text-[#8a91a6] tracking-widest uppercase">Orbital Traffic Command</span>
              </div>
            </div>
            
            <button onClick={runJudgeModeSequence} className="px-3 py-1.5 bg-[#13161f] border border-[#2a2f3a] rounded flex items-center gap-2 hover:bg-[#1e1e2d] transition-colors z-50">
              <Settings size={12} className="text-[#8a91a6]" />
              <span className="text-[10px] font-bold text-[#8a91a6]">RUN JUDGE MODE</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold transition-all duration-300">{totalCount.toLocaleString()}</span>
              <span className="text-[9px] text-[#8a91a6] tracking-widest uppercase">TOTAL ALERTS</span>
            </div>
            <div className={`flex flex-col transition-opacity duration-500 ${statsVisible ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-2xl font-bold text-[#ff003c]">3</span>
              <span className="text-[9px] text-[#ff003c] tracking-widest uppercase">CRITICAL</span>
            </div>
            <div className={`flex flex-col transition-opacity duration-500 ${statsVisible ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-2xl font-bold text-[#00d084]">1,415</span>
              <span className="text-[9px] text-[#00d084] tracking-widest uppercase">AUTO-IGNORED</span>
            </div>
          </div>
        </div>

        {/* TRIAGE QUEUE */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
          <div className="flex justify-between items-end mb-4 shrink-0 transition-opacity duration-500">
            <h2 className="text-lg font-bold tracking-wider text-[#d0d0d0]">TRIAGE QUEUE</h2>
            <span className="text-[10px] text-[#8a91a6]">SORTED BY: CALIBRATED RISK</span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto scrollbar-hide pb-4 relative">
            {alerts.map((alert, index) => {
              if (!alert.visible) return null;
              
              // CSS animation for Step 5 transition
              const isDetached = judgeModeActive && judgeModeStep >= 5 && alert.risk === 'CRITICAL';
              const isFadingOut = judgeModeActive && judgeModeStep >= 5 && alert.risk !== 'CRITICAL';

              return (
                <div 
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`flex flex-col p-4 rounded-lg border cursor-pointer relative group shrink-0
                    ${alert.risk === 'CRITICAL' ? 'bg-[#1e0a0a] border-[#ff003c]/50 hover:bg-[#2a0f0f]' : 
                      alert.risk === 'WARNING' ? 'bg-[#1a150a] border-[#ffb400]/50 hover:bg-[#261f0f]' : 
                      'bg-[#070b14] border-[#2a2f3a] hover:bg-[#13161f]'}
                    ${alert.selected ? 'ring-1 ring-white' : ''}
                    
                    animate-fade-in-up transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                    
                    ${isDetached ? 'fixed z-[200] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-125 shadow-2xl shadow-[#ff003c]/20' : ''}
                    ${isFadingOut ? 'opacity-0 translate-y-10' : 'opacity-100'}
                  `}
                >
                  {alert.risk === 'CRITICAL' && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff003c]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                  )}

                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-3">
                      {alert.risk === 'CRITICAL' ? <ShieldAlert size={18} className="text-[#ff003c]" /> :
                       alert.risk === 'WARNING' ? <AlertCircle size={18} className="text-[#ffb400]" /> :
                       <CheckCircle2 size={18} className="text-[#00d084]" />}
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{alert.primary}</span>
                          <span className="text-[#8a91a6] text-xs">vs</span>
                          <span className="text-sm font-bold">{alert.secondary}</span>
                        </div>
                        <span className="text-[10px] text-[#8a91a6] mt-0.5">ID: {alert.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold font-mono text-[#f5a623]">{alert.tca}</span>
                      <span className="text-[9px] tracking-widest text-[#8a91a6] uppercase">TCA</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#8a91a6] tracking-widest uppercase">RECOMMENDATION</span>
                      <span className={`text-xs font-bold ${
                        alert.risk === 'CRITICAL' ? 'text-[#ff003c]' : 
                        alert.risk === 'WARNING' ? 'text-[#ffb400]' : 'text-[#00d084]'
                      }`}>{alert.action}</span>
                    </div>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#8a91a6] tracking-widest uppercase">CONFIDENCE</span>
                      <span className="text-xs font-bold text-white">{alert.confidence}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col pt-3 border-t border-white/10 relative z-10">
                    <div className="flex items-start gap-2">
                      <Activity size={12} className="text-[#9d8df1] mt-0.5 shrink-0" />
                      <span className="text-xs text-[#a0a0a0] leading-snug">{alert.reason}</span>
                    </div>
                    
                    {alert.risk === 'CRITICAL' && !isDetached && (
                      <button className="mt-3 ml-auto flex items-center gap-1 px-3 py-1.5 bg-[#ff003c] hover:bg-[#ff003c]/80 text-white text-[10px] font-bold tracking-wider rounded transition-colors group-hover:pr-2">
                        INVESTIGATE <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INCOMING STREAM (BOTTOM) */}
        <div className="h-48 border-t border-[#2a2f3a] bg-[#04060a] p-4 flex flex-col shrink-0 transition-opacity duration-500">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={12} className="text-[#00d084] animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-[#8a91a6]">LIVE DATA INGESTION</span>
          </div>
          <div className="flex flex-col gap-2 overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#04060a] to-transparent z-10"></div>
            {liveStream.map((msg, i) => (
              <div key={i} className="flex items-center gap-2 animate-fade-in text-[10px] font-mono">
                <span className="text-[#8a91a6]">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                <span className={`${
                  msg.type === 'critical' ? 'text-[#ff003c]' : 
                  msg.type === 'warning' ? 'text-[#ffb400]' :
                  msg.type === 'safe' ? 'text-[#00d084]/60' : 'text-[#8a91a6]'
                }`}>{msg.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* OVERLAY FOR JUDGE MODE TEXT (Step 2) */}
      {judgeModeActive && judgeModeStep === 2 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] animate-fade-in">
          <div className="text-3xl font-bold tracking-widest text-white bg-black/50 px-8 py-4 rounded backdrop-blur-sm border border-[#2a2f3a]">
            MONITORING 1,432 ACTIVE CONJUNCTION ALERTS
          </div>
        </div>
      )}

      {/* COMPUTING NOTIFICATION */}
      {isComputing && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none animate-fade-in">
          <div className="flex items-center gap-3 bg-[#070b14]/90 backdrop-blur-md border border-[#9d8df1]/40 rounded-lg px-5 py-2.5 shadow-lg shadow-[#9d8df1]/10">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute w-full h-full border-2 border-[#9d8df1] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-xs font-semibold text-[#9d8df1] tracking-wider uppercase whitespace-nowrap">{computingLabel}</span>
          </div>
        </div>
      )}
      
    </div>
  );
}
