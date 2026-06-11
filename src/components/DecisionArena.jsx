import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../state/store';

export default function DecisionArena({ scenario, selectedStrategy, onSelectStrategy }) {
  const orbState = useStore((s) => s.orbState);
  
  const [visibleCards, setVisibleCards] = useState([]);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (orbState === 'THREAT_DETECTION' || orbState === 'FUTURE_PREDICTION') {
      setVisibleCards([]);
      setEvaluating(true);
    } else if (orbState === 'AI_EVALUATES') {
      setEvaluating(true);
      // Phase 3 lasts 7s (9s to 16s). Stagger cards in quickly.
      const timers = scenario.strategies
        .filter(s => s.id !== 'no-action')
        .map((strat, idx) => 
          setTimeout(() => {
            setVisibleCards(prev => [...prev, strat.id]);
          }, 500 + (idx * 1500))
        );
      return () => timers.forEach(clearTimeout);
    } else if (orbState === 'MANEUVER_EXECUTION' || orbState === 'MISSION_SAFE') {
      setEvaluating(false);
      // Only keep the 'Best' strategy visible
      const best = scenario.strategies.find(s => s.recommendation === 'Best');
      if (best) {
        setVisibleCards([best.id]);
      }
    } else if (orbState === 'IDLE') {
      setEvaluating(false);
      setVisibleCards(scenario.strategies.map(s => s.id));
    }
  }, [orbState, scenario]);

  const traceData = {
    "event_id": "CDM-2026-0922A",
    "conjunction_pair": { "primary": "NORAD-58912", "secondary": "NORAD-90124" },
    "unmitigated_pc": 4.12e-3,
    "decision": {
      "selected_strategy": "Radial-Axis Burn",
      "rationale": "In-Track Burn rejected due to critical secondary conjunction risk. Radial-Axis Burn reduces primary Pc below safety limit with zero secondary space intersections."
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto scrollbar-hide pb-10">
      {scenario.strategies.map((strat) => {
        if (strat.id === 'no-action') return null;
        if (!visibleCards.includes(strat.id)) return null;
        
        const isSelected = selectedStrategy?.id === strat.id || orbState === 'MANEUVER_EXECUTION' || orbState === 'MISSION_SAFE';
        
        let status = 'EVALUATING J(Δv)...';
        let statusColor = 'text-[#f5a623]';
        let borderColor = 'border-[#2a2f3a]';
        let bgStyle = 'bg-[#13161f]';
        let icon = <Activity size={12} className="animate-spin text-[#f5a623]" />;
        
        if (!evaluating) {
          if (strat.recommendation === 'Best') {
            status = 'SELECTED: OPTIMAL SOLUTION';
            statusColor = 'text-[#00d084]';
            borderColor = isSelected ? 'border-[#00d084]' : 'border-[#2a2f3a]';
            bgStyle = isSelected ? 'bg-[#1e1e2d]' : 'bg-[#13161f]';
            icon = <CheckCircle2 size={12} className="text-[#00d084]" />;
          } else if (strat.id === 'in-track' && strat.deltaV > 0.1) {
            status = 'REJECTED: SECONDARY RISK (S_risk)';
            statusColor = 'text-[#f24e4e]';
            bgStyle = 'bg-[#13161f] opacity-60';
            icon = <XCircle size={12} className="text-[#f24e4e]" />;
          } else {
            status = 'REJECTED: HIGH FUEL COST';
            statusColor = 'text-[#f24e4e]';
            bgStyle = 'bg-[#13161f] opacity-60';
            icon = <XCircle size={12} className="text-[#f24e4e]" />;
          }
        }

        // Mock progress bar position based on Pc reduction
        const riskReduction = Math.max(0.1, Math.min(0.9, 1 - (strat.newPc / scenario.basePc)));
        const sliderLeft = `${riskReduction * 100}%`;

        return (
          <div 
            key={strat.id}
            onClick={() => { if (!evaluating) onSelectStrategy(strat); }}
            className={`flex flex-col p-4 rounded-lg border transition-all duration-500 cursor-pointer animate-fade-in ${bgStyle} ${borderColor}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">{strat.name} BURN</span>
              <span className="text-[10px] text-[#8a91a6]">ΔV: {strat.deltaV.toFixed(3)} m/s</span>
            </div>
            
            <div className="flex justify-between items-center mt-1 mb-4">
              <div className={`flex items-center gap-1 text-[9px] font-bold tracking-widest ${statusColor}`}>
                {icon} {status}
              </div>
              {!evaluating && (
                <div className="text-[10px] text-[#8a91a6]">
                  Pc: {strat.newPc.toExponential(2)}
                </div>
              )}
            </div>

            {/* Simulated Slider Visual */}
            <div className="relative w-full h-1 bg-[#2a2f3a] rounded-full mt-2">
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#9d8df1] border-2 border-[#13161f]" style={{ left: `calc(${sliderLeft} - 6px)` }}></div>
            </div>
            
            {/* Show Trace for Selected Best Strategy */}
            {isSelected && !evaluating && strat.recommendation === 'Best' && !useStore.getState().storyMode && (
              <div className="mt-4 pt-3 border-t border-[#2a2f3a] text-[9px] font-mono text-[#8a91a6] whitespace-pre-wrap leading-relaxed animate-fade-in">
                {JSON.stringify(traceData, null, 2)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
