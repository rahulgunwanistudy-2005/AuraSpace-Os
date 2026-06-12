import React, { useState, useEffect } from 'react';
import { Shield, Activity, CheckCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../state/store';

export default function CopilotHUD({ scenario, selectedStrategy, onActivate, isRunning, isActivated }) {
  const [evaluationText, setEvaluationText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    // Fetch evaluation when activated and a selectedStrategy is finalized
    if (isActivated && !isRunning && selectedStrategy) {
      setIsEvaluating(true);
      // In a real app we'd pass the actual CDM ID. Using mock ID for demo.
      fetch('http://localhost:8000/api/v1/cdms/CDM-2026-0612-A1/evaluate')
        .then(res => res.json())
        .then(data => {
          setEvaluationText(data.evaluation || "Evaluation unavailable.");
          setIsEvaluating(false);
        })
        .catch(err => {
          console.error(err);
          setEvaluationText("Failed to retrieve SSA evaluation.");
          setIsEvaluating(false);
        });
    }
  }, [isActivated, isRunning, selectedStrategy]);

  if (!isActivated && !isRunning) {
    return (
      <div className="w-full bg-[#070b14]/50 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 h-full">
        <Shield className="w-12 h-12 text-[#9d8df1] opacity-50" />
        <div className="text-center">
          <h3 className="text-sm uppercase tracking-widest text-white font-bold mb-1">Mission Safety Copilot</h3>
          <p className="text-xs text-white/50 max-w-xs">AI-driven orbital mitigation analysis and maneuver synthesis.</p>
        </div>
        <button 
          onClick={onActivate}
          disabled={scenario.tier === 'Safe'}
          className="cyber-button py-3 px-6 rounded-lg font-bold text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[#9d8df1]/20 border border-[#9d8df1]/50 text-[#9d8df1]"
        >
          Activate Safety Synthesis Engine
        </button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="w-full bg-[#070b14]/50 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 h-full">
        <Activity className="w-12 h-12 text-[#9d8df1] animate-spin" />
        <h3 className="text-sm uppercase tracking-widest text-[#9d8df1] font-bold">Synthesizing Maneuvers...</h3>
        <div className="flex flex-col gap-1 text-[10px] font-mono text-white/50 text-center w-full max-w-xs">
          <div className="flex justify-between"><span>Evaluating Radial Burn...</span><span>[OK]</span></div>
          <div className="flex justify-between"><span>Evaluating In-Track Burn...</span><span>[OK]</span></div>
          <div className="flex justify-between"><span>Evaluating Cross-Track Burn...</span><span>[OK]</span></div>
        </div>
      </div>
    );
  }

  // Active state
  return (
    <div className="w-full bg-[#070b14]/50 border border-[#9d8df1]/30 rounded-xl p-4 flex flex-col h-full overflow-hidden relative shadow-[0_0_15px_rgba(157,141,241,0.1)]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#9d8df1]/20">
        <Shield className="w-4 h-4 text-[#9d8df1]" />
        <h3 className="text-xs uppercase tracking-widest text-white font-bold">SSA Copilot Evaluation</h3>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 p-2 rounded border border-white/5">
            <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1">Goal</div>
            <div className="font-mono text-white/90">Minimize collision risk</div>
          </div>
          <div className="bg-black/30 p-2 rounded border border-white/5">
            <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1">Constraints</div>
            <ul className="font-mono text-white/90 list-disc pl-3">
              <li>Fuel Budget &lt; 1 m/s</li>
              <li>No Secondary Conjunctions</li>
              <li>Maintain Mission Timeline</li>
            </ul>
          </div>
        </div>

        <div className="bg-[#070b14]/80 p-3 rounded border border-[#9d8df1]/20 flex flex-col gap-2 font-mono text-[9px] text-white/80 overflow-auto">
          <div className="text-[10px] uppercase tracking-wider text-[#9d8df1] font-bold mb-1 border-b border-[#9d8df1]/20 pb-1">Gemini SSA Brief</div>
          {isEvaluating ? (
            <div className="flex items-center gap-2 text-[#9d8df1]/70">
              <Activity className="w-3 h-3 animate-spin" /> Querying Gemini for maneuver rationale...
            </div>
          ) : evaluationText ? (
            <div className="whitespace-pre-wrap text-[10px] leading-relaxed text-white/90">{evaluationText}</div>
          ) : (
            <p className="font-mono text-white/40 italic">Awaiting Gemini Evaluation...</p>
          )}
        </div>

        {/* Manual Strategy Selection */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="text-[10px] uppercase tracking-wider text-[#9d8df1] font-bold">Maneuver Options</div>
          {scenario.strategies.filter(s => s.id !== 'no-action').map(strategy => {
            const isRecommended = strategy.recommendation === 'Best';
            const statusLabel = isRecommended ? 'Recommended' : 'Rejected';
            const statusColor = isRecommended ? 'text-[#00d084]' : 'text-[#ff003c]';
            
            return (
              <button
                key={strategy.id}
                onClick={() => useStore.getState().setSelectedStrategy(strategy)}
                className={`p-3 border rounded flex flex-col transition-colors text-left ${
                  selectedStrategy?.id === strategy.id 
                    ? 'bg-[#9d8df1]/20 border-[#9d8df1] text-white' 
                    : 'bg-black/30 border-white/10 text-white/60 hover:bg-black/50 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{strategy.name}</span>
                    <span className="text-[9px] opacity-70">{strategy.deltaV.toFixed(2)} m/s ΔV</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="text-[9px] opacity-60 border-t border-white/10 pt-1 mt-1 leading-snug">
                  {strategy.explanation}
                </div>
              </button>
            );
          })}
        </div>

        {selectedStrategy && selectedStrategy.id !== 'no-action' && (
          <button 
            onClick={() => useStore.getState().executeManeuver(selectedStrategy)}
            className="mt-auto bg-[#00d084]/20 hover:bg-[#00d084]/30 text-[#00d084] border border-[#00d084]/50 py-2 rounded uppercase tracking-widest text-[10px] font-bold flex items-center justify-center gap-2 transition-colors">
            <CheckCircle className="w-3 h-3" /> Commit Maneuver to Uplink
          </button>
        )}
      </div>
    </div>
  );
}
