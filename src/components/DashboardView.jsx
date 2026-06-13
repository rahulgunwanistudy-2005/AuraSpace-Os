import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Box, AlertTriangle, Cog, Eye, FileText, Settings, Radio, Activity } from 'lucide-react';
import DashboardMain from './DashboardMain';
import CatalogView from './CatalogView';
import ConjunctionsView from './ConjunctionsView';
import OperationsView from './OperationsView';
import LiveView from './LiveView';
import ReportsView from './ReportsView';
import SettingsView from './SettingsView';
import InvestigationView from './InvestigationView';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'catalog', label: 'Catalog', icon: Box },
  { id: 'conjunctions', label: 'Conjunctions', icon: AlertTriangle },
  { id: 'investigation', label: 'Investigation', icon: Activity },
  { id: 'operations', label: 'Operations', icon: Cog },
  { id: 'liveview', label: 'Live View', icon: Eye },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function DashboardView() {
  const activeNav = useStore((s) => s.activeDashboardTab);
  const setActiveNav = useStore((s) => s.setActiveDashboardTab);
  const engineState = useStore((s) => s.engineState);
  
  // Parallax Mouse Tracking (Passed down to children if needed)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxX = useTransform(mouseX, [-1000, 1000], [-10, 10]);
  const parallaxY = useTransform(mouseY, [-1000, 1000], [-10, 10]);
  const reverseParallaxX = useTransform(mouseX, [-1000, 1000], [5, -5]);
  const reverseParallaxY = useTransform(mouseY, [-1000, 1000], [5, -5]);

  return (
    <div className="absolute inset-0 pointer-events-none flex text-white font-sans overflow-hidden">
      
      {/* ═══ LEFT NAVIGATION SIDEBAR ═══ */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-[240px] shrink-0 border-r border-[#1e2433] bg-[#0d1120]/80 backdrop-blur-xl flex flex-col p-4 z-20 pointer-events-auto shadow-[5px_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-6 mb-8">
          {/* Logo / Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#7c5df8] to-[#5135c4] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(124,93,248,0.5)] border border-[#9d8df1]/50">
              A
            </div>
            <span className="text-sm font-bold tracking-[0.2em]">AURASPACE</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-[#6b7280] uppercase tracking-widest px-2 mb-2 font-bold">Menu</span>
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive ? 'bg-[#9d8df1]/10 text-white shadow-[inset_2px_0_0_#9d8df1]' : 'text-[#8a91a6] hover:bg-[#1e2433] hover:text-white'}`}
                >
                  <Icon size={18} className={`${isActive ? 'text-[#9d8df1]' : 'text-[#6b7280] group-hover:text-white'} transition-colors duration-200`} />
                  <span className={`text-xs font-bold tracking-wider ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Connection Status */}
        <div className="mt-auto px-2">
          <div className="bg-[#080c16] rounded-xl p-4 border border-[#1e2433] flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00d084] to-transparent opacity-50" />
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#6b7280] uppercase tracking-widest font-bold">Data Link</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d084] animate-pulse" />
                <span className="text-[10px] font-bold text-[#00d084]">NOMINAL</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8a91a6]">
                <span>UP</span>
                <span className="text-white">1.4 GB/s</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8a91a6]">
                <span>DN</span>
                <span className="text-white">3.2 GB/s</span>
              </div>
            </div>
            <div className="h-6 w-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAiPjxwYXRoIGQ9Ik0wLDEwIFEyNSwwIDUwLDEwIFQxMDAsMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwZDA4NCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-cover bg-no-repeat bg-center" />
          </div>
        </div>
      </motion.div>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Top Data Bar */}
        <motion.div style={{ y: parallaxY }} className="h-16 shrink-0 border-b border-[#1e2433] bg-[#0d1120]/80 backdrop-blur-md flex items-center justify-between px-8 shadow-md pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280] font-bold">Current Conjunction</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest text-white">AURA-1 vs COMM SAT VS ROCKET BODY (DEBRIS)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider border bg-[#9d8df1]/10 text-[#9d8df1] border-[#9d8df1]/30">T-12h</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280] font-bold">Time to TCA</span>
              <span className="text-sm font-mono font-bold tracking-wider text-white">12:45:32</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280] font-bold">Confidence</span>
              <span className="text-sm font-bold tracking-wider text-white">{engineState.confidence ?? 85}%</span>
            </div>
            <div className="h-8 w-px bg-[#1e2433]" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#ff3c3c]/10 border border-[#ff3c3c]/30 text-[#ff3c3c]">
              <Radio size={14} className="animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase">High Risk</span>
            </div>
          </div>
        </motion.div>

        {/* Dynamic View Router */}
        <AnimatePresence mode="wait">
          {activeNav === 'dashboard' && <DashboardMain key="dashboard" parallaxX={parallaxX} parallaxY={parallaxY} reverseParallaxX={reverseParallaxX} reverseParallaxY={reverseParallaxY} />}
          {activeNav === 'catalog' && <CatalogView key="catalog" parallaxX={parallaxX} parallaxY={parallaxY} />}
          {activeNav === 'conjunctions' && <ConjunctionsView key="conjunctions" parallaxX={parallaxX} parallaxY={parallaxY} />}
          {activeNav === 'investigation' && <InvestigationView key="investigation" parallaxX={parallaxX} parallaxY={parallaxY} />}
          {activeNav === 'operations' && <OperationsView key="operations" parallaxX={parallaxX} parallaxY={parallaxY} />}
          {activeNav === 'liveview' && <LiveView key="liveview" parallaxX={parallaxX} parallaxY={parallaxY} />}
          {activeNav === 'reports' && <ReportsView key="reports" parallaxX={parallaxX} parallaxY={parallaxY} />}
          {activeNav === 'settings' && <SettingsView key="settings" parallaxX={parallaxX} parallaxY={parallaxY} />}
        </AnimatePresence>

      </div>
    </div>
  );
}
