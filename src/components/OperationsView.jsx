import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cog, Calendar, Clock, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useStore } from '../state/store';

export default function OperationsView({ parallaxX, parallaxY }) {
  const [ops, setOps] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/operations')
      .then(r => r.json())
      .then(data => setOps(data || []))
      .catch(err => console.error("Failed to fetch ops", err));
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none">
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[600px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <div className="w-10 h-10 rounded-lg border border-[#9d8df1]/30 flex items-center justify-center bg-[#9d8df1]/10">
            <Cog size={20} className="text-[#9d8df1]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-widest uppercase">Operations & Tasking</span>
            <span className="text-[10px] text-[#9d8df1]">Maneuver Schedule & Delta-V Budgets</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[39px] top-6 bottom-6 w-[2px] bg-[#1e2433]" />

          {ops.map((op, i) => {
            const isPending = op.status === 'PENDING_APPROVAL';
            return (
              <motion.div 
                key={op.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 relative z-10"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#1e2433] bg-[#0d1120] flex items-center justify-center shrink-0 mt-2">
                  {isPending ? <Clock size={12} className="text-[#f5a623]" /> : <CheckCircle2 size={12} className="text-[#00d084]" />}
                </div>

                <div className="flex-1 rounded-xl border border-[#1e2433] bg-[#080c16] p-4 flex flex-col gap-4">
                  <div className="flex items-start justify-between border-b border-[#1e2433] pb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white tracking-widest uppercase">{op.type.replace('_', ' ')}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${isPending ? 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30' : 'bg-[#00d084]/10 text-[#00d084] border-[#00d084]/30'}`}>
                          {op.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#6b7280]">TASK ID: {op.id} | ASSET: {op.asset}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-[#1e2433] bg-[#0d1120] flex items-center justify-center">
                        <Calendar size={14} className="text-[#6b7280]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Execution Window</span>
                        <span className="text-xs font-mono text-white">{new Date(op.scheduled_time).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-[#1e2433] bg-[#0d1120] flex items-center justify-center">
                        <Zap size={14} className="text-[#6b7280]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-[#6b7280] tracking-widest font-bold">Delta-V Req</span>
                        <span className="text-xs font-mono text-white">{op.delta_v}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

        </div>
      </motion.div>
    </div>
  );
}
