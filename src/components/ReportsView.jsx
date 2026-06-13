import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, ShieldCheck, TrendingDown } from 'lucide-react';

export default function ReportsView({ parallaxX, parallaxY }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/reports')
      .then(r => r.json())
      .then(data => setReports(data || []))
      .catch(err => console.error("Failed to fetch reports", err));
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none">
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[800px] shrink-0 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <div className="w-10 h-10 rounded-lg border border-[#00d084]/30 flex items-center justify-center bg-[#00d084]/10">
            <FileText size={20} className="text-[#00d084]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-widest uppercase">Post-Event Reports</span>
            <span className="text-[10px] text-[#00d084]">Mission Debriefs & Analysis Logs</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-4 content-start">
          {reports.map((report, i) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-[#1e2433] bg-[#080c16] flex flex-col group hover:border-[#00d084] transition-colors cursor-pointer relative overflow-hidden"
            >
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {report.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-2 py-0.5 rounded font-bold border border-[#1e2433] bg-[#0d1120] text-[#6b7280]">
                      {tag}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono text-[#6b7280] ml-auto">{new Date(report.date).toLocaleDateString()}</span>
                </div>
                
                <span className="text-sm font-bold text-white mb-2">{report.title}</span>
                <p className="text-xs text-[#9ca3af] leading-relaxed mb-4 flex-1">
                  {report.summary}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-[#1e2433]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#00d084]" />
                    <span className="text-[10px] text-[#00d084] font-bold">Verified Safe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown size={14} className="text-[#9d8df1]" />
                    <span className="text-[10px] text-[#9d8df1] font-bold">Pc Reduced</span>
                  </div>
                </div>
              </div>

              {/* Download overlay on hover */}
              <div className="absolute inset-0 bg-[#00d084]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <div className="flex items-center gap-2 text-black font-bold tracking-widest text-sm">
                  <Download size={18} />
                  DOWNLOAD PDF
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
