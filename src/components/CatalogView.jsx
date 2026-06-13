import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Search, Filter, Satellite, Orbit, Maximize, AlertCircle } from 'lucide-react';
import { useStore } from '../state/store';

export default function CatalogView({ parallaxX, parallaxY }) {
  const [catalogData, setCatalogData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const setHoveredObject = useStore(s => s.setHoveredObject);
  const setCameraTarget = useStore(s => s.setCameraTarget);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/catalog')
      .then(r => r.json())
      .then(data => {
        setCatalogData(data || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch catalog", err);
        setIsLoading(false);
      });
  }, []);

  const filteredData = catalogData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.norad_id.includes(searchQuery)
  );

  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 pointer-events-none">
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="flex-1 rounded-xl border flex flex-col overflow-hidden bg-[#0d1120]/90 backdrop-blur border-[#1e2433] shadow-lg pointer-events-auto">
        
        {/* Header & Controls */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2433] bg-[#080c16]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-[#1e2433] flex items-center justify-center bg-[#1e2433]/30">
              <Box size={20} className="text-[#9d8df1]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-widest uppercase">Space Object Catalog</span>
              <span className="text-[10px] text-[#6b7280]">Live feed from CelesTrak (Top 200)</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input 
                type="text" 
                placeholder="Search NORAD ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-9 pl-9 pr-3 rounded-lg bg-[#1e2433]/50 border border-[#2a2f3a] text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#9d8df1] transition-colors"
              />
            </div>
            <button className="h-9 px-3 rounded-lg border border-[#2a2f3a] bg-[#1e2433]/50 hover:bg-[#1e2433] flex items-center gap-2 transition-colors">
              <Filter size={14} className="text-[#6b7280]" />
              <span className="text-xs text-white">Filter</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full flex-col gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-[#9d8df1]/30 border-t-[#9d8df1] animate-spin" />
              <span className="text-xs text-[#6b7280] uppercase tracking-widest animate-pulse">Syncing with CelesTrak Network...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2433]">
                  <th className="py-3 px-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-widest">Object</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-widest">Type</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-widest">Orbit (Apo / Per)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-widest">Inclination</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-widest">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((obj, i) => (
                  <motion.tr 
                    key={obj.norad_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-[#1e2433]/50 hover:bg-white/5 transition-colors cursor-pointer group"
                    onMouseEnter={() => {
                      // Only hover PRIMARY or SECONDARY to trigger globe effects for this demo
                      // Otherwise just general hover
                      if(i === 0) setHoveredObject('PRIMARY');
                      else if(i === 1) setHoveredObject('SECONDARY');
                    }}
                    onMouseLeave={() => setHoveredObject(null)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{obj.name}</span>
                        <span className="text-[10px] text-[#6b7280] font-mono">NORAD: {obj.norad_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {obj.type === 'PAYLOAD' ? <Satellite size={12} className="text-[#00d084]" /> : <AlertCircle size={12} className="text-[#ff3c3c]" />}
                        <span className="text-[10px] uppercase font-bold text-[#9ca3af]">{obj.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono text-white">{Math.round(obj.apogee)} km / {Math.round(obj.perigee)} km</span>
                        <span className="text-[9px] text-[#6b7280]">Period: {Math.round(obj.period)} min</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-white">
                      {Math.round(obj.inclination * 10) / 10}°
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${obj.status === 'NOMINAL' ? 'bg-[#00d084]/10 text-[#00d084] border-[#00d084]/30' : 'bg-[#ff3c3c]/10 text-[#ff3c3c] border-[#ff3c3c]/30'}`}>
                        {obj.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => setCameraTarget(i === 0 ? 'PRIMARY' : i === 1 ? 'SECONDARY' : 'EARTH')}
                        className="p-1.5 rounded bg-transparent border border-transparent group-hover:border-[#9d8df1]/30 hover:bg-[#9d8df1]/10 text-[#6b7280] hover:text-white transition-all"
                        title="Locate in 3D View"
                      >
                        <Maximize size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filteredData.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-[#6b7280]">No objects found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
