import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Activity, BrainCircuit, ShieldAlert, Database } from 'lucide-react';
import { useStore } from '../state/store';

export default function ConjunctionsView({ parallaxX, parallaxY }) {
  const [queue, setQueue] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [reasonings, setReasonings] = useState({});
  const setCameraTarget = useStore(s => s.setCameraTarget);
  const setActiveDashboardTab = useStore(s => s.setActiveDashboardTab);

  useEffect(() => {
    // Polling function for live queue updates
    const fetchTriageData = async () => {
      try {
        const r1 = await fetch('http://localhost:8000/api/v1/triage_queue');
        const queueData = await r1.json();
        setQueue(queueData || []);

        const r2 = await fetch('http://localhost:8000/api/v1/agent_activity');
        const logData = await r2.json();
        setActivityLog(logData || []);
        
        // Fetch reasoning asynchronously for each item that doesn't have it
        queueData.forEach(item => {
          if (!reasonings[item.message_id]) {
            fetchReasoning(item.message_id);
          }
        });
        
      } catch (err) {
        console.error("Failed to fetch triage data", err);
      }
    };

    fetchTriageData();
    const interval = setInterval(fetchTriageData, 5000); // refresh every 5s to show autonomous updates
    return () => clearInterval(interval);
  }, []);

  const fetchReasoning = async (msgId) => {
    // Mark as pending
    setReasonings(prev => ({ ...prev, [msgId]: { status: 'loading', data: null }}));
    try {
      const res = await fetch(`http://localhost:8000/api/v1/triage_queue/${msgId}/reasoning`);
      const data = await res.json();
      setReasonings(prev => ({ ...prev, [msgId]: { status: 'complete', data: data.reasoning }}));
    } catch (err) {
      setReasonings(prev => ({ ...prev, [msgId]: { status: 'error', data: ["Failed to generate reasoning."] }}));
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'CRITICAL': return '#ff3c3c';
      case 'HIGH': return '#f5a623';
      case 'MEDIUM': return '#f5d123';
      case 'LOW': return '#6b7280';
      default: return '#1e2433';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none">
      
      {/* ═══ CONJUNCTION TRIAGE QUEUE ═══ */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[380px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <div className="w-10 h-10 rounded-lg border border-[#ff3c3c]/30 flex items-center justify-center bg-[#ff3c3c]/10">
            <BrainCircuit size={20} className="text-[#ff3c3c]" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-bold text-white tracking-widest uppercase">Conjunction Triage Queue</span>
            <span className="text-[10px] text-[#ff3c3c]">Autonomous Threat Ranking Active</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#ff3c3c]/10 border border-[#ff3c3c]/30">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff3c3c] animate-pulse" />
            <span className="text-[9px] font-bold text-[#ff3c3c] tracking-widest">LIVE</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4 relative">
          <AnimatePresence>
            {queue.map((cdm, i) => {
              const isCritical = cdm.priority === 'CRITICAL';
              const pColor = getPriorityColor(cdm.priority);
              const reasoningState = reasonings[cdm.message_id];
              
              return (
                <motion.div 
                  key={cdm.message_id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => setCameraTarget('TCA')}
                  className={`group cursor-pointer rounded-xl border bg-[#080c16] flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${isCritical ? 'border-[#ff3c3c] shadow-[0_0_15px_rgba(255,60,60,0.15)]' : 'border-[#1e2433] hover:border-[#6b7280]'}`}
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: pColor }} />
                  
                  {isCritical && (
                     <motion.div 
                       className="absolute inset-0 bg-[#ff3c3c]/5 pointer-events-none"
                       animate={{ opacity: [0.5, 0, 0.5] }}
                       transition={{ duration: 2, repeat: Infinity }}
                     />
                  )}

                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white tracking-wider">{cdm.primary_object?.name} / {cdm.secondary_object?.name}</span>
                        <span className="text-[10px] font-mono text-[#6b7280]">MSG ID: {cdm.message_id}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold border tracking-widest uppercase" style={{ borderColor: `${pColor}40`, backgroundColor: `${pColor}10`, color: pColor }}>
                          {cdm.priority}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold text-white font-mono">Threat Score:</span>
                          <span className="text-lg font-bold font-mono" style={{ color: pColor }}>{cdm.score}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Time to CA</span>
                        <span className="text-sm font-mono text-white">T-12h 45m</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Probability (Pc)</span>
                        <span className="text-sm font-mono text-[#ff3c3c]">{Number(cdm.collision_probability).toExponential(3)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 border-l-2 pl-2 border-[#1e2433] mt-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={10} className="text-[#00d084]" />
                        <span className="text-[9px] text-[#6b7280] uppercase tracking-widest font-bold">Data Confidence: <span className="text-[#00d084]">{cdm.data_confidence}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database size={10} className="text-[#6b7280]" />
                        <span className="text-[9px] text-[#6b7280] uppercase tracking-widest font-bold">Source: <span className="text-white">{cdm.data_source}</span> (Updated {cdm.data_updated_ago})</span>
                      </div>
                    </div>

                    <div className="bg-[#1e2433]/30 rounded p-2">
                      <span className="text-[9px] text-[#9ca3af] uppercase tracking-widest font-bold mb-1 block">Reasoning:</span>
                      {(!reasoningState || reasoningState.status === 'loading') ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#9d8df1] animate-pulse" />
                          <span className="text-[10px] text-[#9d8df1] font-mono animate-pulse">Generating...</span>
                        </div>
                      ) : (
                        <ul className="text-[10px] text-[#9ca3af] list-disc list-inside space-y-0.5">
                          {reasoningState.data.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#1e2433] bg-[#0d1120] px-4 py-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#6b7280] uppercase tracking-widest font-bold">Recommended Action</span>
                      <span className="text-[10px] font-bold text-white">{cdm.recommended_action}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveDashboardTab('investigation'); setCameraTarget('TCA'); }}
                      className={`flex items-center gap-1 text-[10px] font-bold tracking-widest transition-colors ${isCritical ? 'text-[#ff3c3c] hover:text-white' : 'text-[#9d8df1] hover:text-white'}`}
                    >
                      {isCritical ? 'ESCALATE' : 'REVIEW'}
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {queue.length === 0 && (
             <div className="text-center text-xs text-[#6b7280] mt-10">No active conjunctions in queue.</div>
          )}
        </div>
      </motion.div>
      
      {/* ═══ AGENT ACTIVITY FEED ═══ */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[300px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <Activity size={16} className="text-[#9d8df1]" />
          <span className="text-[11px] font-bold text-white tracking-widest uppercase">Agent Activity Feed</span>
        </div>
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-3 font-mono text-[10px] text-[#9ca3af]">
          {activityLog.slice().reverse().map((log, i) => {
            const isEscalation = log.message.includes('Escalated');
            return (
              <div key={i} className={`flex flex-col gap-0.5 border-l-2 pl-2 pb-2 ${isEscalation ? 'border-[#ff3c3c]' : 'border-[#1e2433]'}`}>
                <span className="text-[#6b7280]">{new Date(log.time).toLocaleTimeString()}</span>
                <span className={`leading-relaxed ${isEscalation ? 'text-[#ff3c3c] font-bold' : 'text-[#00d084]'}`}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
      
      <div className="flex-1" />
    </div>
  );
}
