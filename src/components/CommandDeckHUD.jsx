import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { 
  LayoutDashboard, Eye, Box, Activity, Cpu, FileText, Settings, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import BPlaneVisualization from './BPlaneVisualization';
import DecisionArena from './DecisionArena';

export default function CommandDeckHUD() {
  const [navExpanded, setNavExpanded] = useState(true);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [bottomExpanded, setBottomExpanded] = useState(true);

  // Resizing states
  const [navWidth, setNavWidth] = useState(240);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);

  // Drag handlers with cleanup
  const activeListeners = React.useRef({ move: null, up: null });

  const cleanupDrag = () => {
    if (activeListeners.current.move) document.removeEventListener('mousemove', activeListeners.current.move);
    if (activeListeners.current.up) document.removeEventListener('mouseup', activeListeners.current.up);
    activeListeners.current = { move: null, up: null };
  };

  useEffect(() => {
    return cleanupDrag; // Cleanup on unmount
  }, []);

  const handleNavDrag = (e) => {
    const startX = e.clientX;
    const startWidth = navWidth;
    const onMouseMove = (moveEvent) => setNavWidth(Math.max(60, startWidth + (moveEvent.clientX - startX)));
    const onMouseUp = () => cleanupDrag();
    activeListeners.current = { move: onMouseMove, up: onMouseUp };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleLeftPanelDrag = (e) => {
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    const onMouseMove = (moveEvent) => setLeftPanelWidth(Math.max(200, startWidth + (moveEvent.clientX - startX)));
    const onMouseUp = () => cleanupDrag();
    activeListeners.current = { move: onMouseMove, up: onMouseUp };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleRightPanelDrag = (e) => {
    const startX = e.clientX;
    const startWidth = rightPanelWidth;
    const onMouseMove = (moveEvent) => setRightPanelWidth(Math.max(200, startWidth - (moveEvent.clientX - startX)));
    const onMouseUp = () => cleanupDrag();
    activeListeners.current = { move: onMouseMove, up: onMouseUp };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const scenario = useStore((s) => s.scenario);
  const engineState = useStore((s) => s.engineState);
  const { riskTier, Pc, confidence } = engineState;
  const timeOffset = useStore((s) => s.timeOffset);
  const smoothScrubTo = useStore((s) => s.smoothScrubTo);
  const selectedStrategy = useStore((s) => s.selectedStrategy);
  const setSelectedStrategy = useStore((s) => s.setSelectedStrategy);
  const orbState = useStore((s) => s.orbState);
  const immersiveMode = useStore((s) => s.immersiveMode);
  const toggleImmersive = useStore((s) => s.toggleImmersive);
  const activateCopilot = useStore((s) => s.activateCopilot);
  const abortCopilotSequence = useStore((s) => s.abortCopilotSequence);
  const isThinking = orbState === 'THINKING' || orbState === 'SIMULATING' || orbState === 'THREAT_DETECTION' || orbState === 'FUTURE_PREDICTION' || orbState === 'AI_EVALUATES';
  const isComputing = useStore((s) => s.isComputing);
  const computingLabel = useStore((s) => s.computingLabel);

  const judgeModeActive = useStore((s) => s.judgeModeActive);
  const judgeModeStep = useStore((s) => s.judgeModeStep);
  const runJudgeModeSequence = useStore((s) => s.runJudgeModeSequence);

  const advancedAnalysis = useStore((s) => s.advancedAnalysis);
  const toggleAdvancedAnalysis = useStore((s) => s.toggleAdvancedAnalysis);

  const storyMode = useStore((s) => s.storyMode);
  const toggleStoryMode = useStore((s) => s.toggleStoryMode);

  const hoursToTca = Math.abs(timeOffset);
  const timeString = timeOffset <= 0 ? `-${Math.floor(hoursToTca)}H 0M` : `+${Math.floor(hoursToTca)}H 0M`;

  // Terminal Log Animation State
  const [coreLogs, setCoreLogs] = useState([]);

  // isThinking covers any active copilot sequence
  const activeSequence = orbState !== 'IDLE';

  // Countdown logic derived from orchestrator (MANEUVER_EXECUTION is at t=1, MANEUVER_LOCKED starts at t=-2)
  const targetTimeOffset = useStore(s => s.targetTimeOffset);
  let countdownNum = 3;
  if (orbState === 'MANEUVER_LOCKED') {
    countdownNum = Math.max(1, Math.ceil(Math.abs(timeOffset)));
  }

  useEffect(() => {
    if (activeSequence && orbState === 'THREAT_DETECTION') {
      setCoreLogs([]);
      
      let sequence = [];
      if (storyMode) {
        sequence = [
          { t: 0, time: "NOW", type: "warn", text: "Potential collision detected." },
          { t: 1500, time: "TCA", type: "warn", text: "Objects projected to pass dangerously close." },
          { t: 3000, time: "NOW", type: "info", text: "Monitoring risk evolution." },
          { t: 4000, time: "NOW", type: "info", text: "Projecting possible futures." },
          { t: 6000, time: "TCA", type: "info", text: "Estimating uncertainty." },
          { t: 7500, time: "NOW", type: "info", text: "Analyzing encounter geometry." },
          { t: 9000, time: "NOW", type: "info", text: "Testing avoidance options." },
          { t: 12000, time: "NOW", type: "info", text: "Comparing maneuver strategies." },
          { t: 14000, time: "NOW", type: "info", text: "Searching for optimal solution." },
          { t: 16000, time: "NOW", type: "info", text: "Executing avoidance maneuver." },
          { t: 17500, time: "POST", type: "success", text: "Trajectory updated." },
          { t: 18500, time: "NOW", type: "success", text: "Risk rapidly decreasing." },
          { t: 20000, time: "SAFE", type: "success", text: "Collision avoided." },
          { t: 21000, time: "SAFE", type: "success", text: "Mission safe." },
          { t: 22000, time: "SAFE", type: "success", text: "Conjunction resolved." }
        ];
      } else {
        sequence = [
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
      }

      const timers = sequence.map((step) => 
        setTimeout(() => {
          setCoreLogs(prev => [...prev, step]);
        }, step.t)
      );

      return () => timers.forEach(clearTimeout);
    }
  }, [activeSequence, orbState, storyMode]);

  return (
    <div className={`absolute inset-0 z-10 font-sans flex text-white pointer-events-none transition-opacity duration-1000 ${immersiveMode && !judgeModeActive ? 'opacity-0' : 'opacity-100'} overflow-hidden`}>
      
      {/* ═══ LEFT NAVIGATION SIDEBAR ═══ */}
      <div 
        className={`h-full bg-[#070b14] border-r border-[#2a2f3a] flex flex-col pointer-events-auto shrink-0 z-30 transition-transform duration-700 ease-in-out relative ${navExpanded ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: navWidth, marginLeft: navExpanded ? 0 : -navWidth }}
      >
        {/* Resize Handle */}
        <div 
          className="absolute top-0 bottom-0 right-0 w-1.5 cursor-col-resize hover:bg-[#9d8df1]/50 z-50 transition-colors"
          onMouseDown={handleNavDrag}
        />
        
        <button 
          onClick={() => setNavExpanded(!navExpanded)}
          className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#13161f] border border-l-0 border-[#2a2f3a] rounded-r flex items-center justify-center text-[#8a91a6] hover:text-white"
        >
          {navExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Logo */}
        <div className="p-6 flex items-center gap-3 pl-6">
          <div className="w-8 h-8 rounded text-[#9d8df1] flex items-center justify-center font-bold text-xl relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[#9d8df1]/20 rotate-45 transform"></div>
            A
          </div>
          <span className="font-bold tracking-widest text-lg whitespace-nowrap overflow-hidden text-ellipsis">AURASPACE</span>
        </div>

        {/* Nav Links */}
        <div className="flex flex-col mt-4 px-4 gap-2 overflow-hidden">
          <button className="flex items-center gap-4 px-4 py-3 bg-[#13161f] border-l-2 border-[#9d8df1] text-white rounded-r w-full">
            <LayoutDashboard size={18} className="text-[#9d8df1] shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap text-left overflow-hidden text-ellipsis">DASHBOARD</span>
          </button>
          <button className="flex items-center gap-4 px-4 py-3 text-[#8a91a6] hover:text-white transition-colors w-full">
            <Eye size={18} className="shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap text-left overflow-hidden text-ellipsis">LIVE VIEW</span>
          </button>
          <button className="flex items-center gap-4 px-4 py-3 text-[#8a91a6] hover:text-white transition-colors w-full">
            <Box size={18} className="shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap text-left overflow-hidden text-ellipsis">OBJECTS</span>
          </button>
          <button className="flex items-center gap-4 px-4 py-3 text-[#8a91a6] hover:text-white transition-colors w-full">
            <Activity size={18} className="shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap text-left overflow-hidden text-ellipsis">ANALYSIS</span>
          </button>
          <button className="flex items-center gap-4 px-4 py-3 text-[#8a91a6] hover:text-white transition-colors w-full">
            <Cpu size={18} className="shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap text-left overflow-hidden text-ellipsis">AI ARENA</span>
          </button>
          <button className="flex items-center gap-4 px-4 py-3 text-[#8a91a6] hover:text-white transition-colors w-full">
            <FileText size={18} className="shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap text-left overflow-hidden text-ellipsis">REPORTS</span>
          </button>
          <button className="flex items-center gap-4 px-4 py-3 text-[#8a91a6] hover:text-white transition-colors w-full">
            <Settings size={18} className="shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap text-left overflow-hidden text-ellipsis">SETTINGS</span>
          </button>
        </div>

        {/* System Status Bottom */}
        <div className="mt-auto p-4 m-4 dash-panel flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#00d084] shrink-0"></div>
            <span className="micro-cap whitespace-nowrap overflow-hidden text-ellipsis">SYSTEM STATUS</span>
          </div>
          <span className="text-sm font-semibold">NOMINAL</span>
          {/* Fake wave graphic */}
          <div className="w-full h-8 mt-2 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAiPjxwYXRoIGQ9Ik0wLDEwIFEyNSwwIDUwLDEwIFQxMDAsMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM4ODJmNiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-cover bg-no-repeat bg-center"></div>
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* TOP STATUS BAR */}
        <div className="h-20 border-b border-[#2a2f3a] flex items-center justify-between px-6 pointer-events-auto bg-[#070b14]/80 backdrop-blur-md z-10 w-full">
          <div className="flex items-center h-full overflow-x-auto scrollbar-hide flex-nowrap">
            <div className="flex flex-col justify-center border-r border-[#2a2f3a] pr-8 h-full shrink-0">
              <span className="micro-cap mb-1">MISSION STATUS</span>
              <span className={`text-sm font-semibold uppercase ${orbState === 'MISSION_SAFE' ? 'text-[#00d084]' : 'text-[#f5a623]'}`}>
                {orbState === 'MISSION_SAFE' ? 'SAFE' : riskTier}
              </span>
            </div>
            <div className="flex flex-col justify-center border-r border-[#2a2f3a] px-8 h-full shrink-0">
              <span className="micro-cap mb-1">CURRENT CONJUNCTION</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold uppercase">{scenario.shortName}</span>
                <span className="bg-[#1e1e2d] text-[#9d8df1] text-[10px] font-bold px-2 py-0.5 rounded">T-12h</span>
              </div>
            </div>
            <div className="flex flex-col justify-center border-r border-[#2a2f3a] px-8 h-full shrink-0">
              <span className="micro-cap mb-1">COLLISION PROBABILITY</span>
              <span className="text-sm font-semibold">{Pc === 0 ? '—' : Pc.toExponential(3)}</span>
            </div>
            <div className="flex flex-col justify-center border-r border-[#2a2f3a] px-8 h-full w-[200px] shrink-0">
              <span className="micro-cap mb-1">CONFIDENCE</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{confidence}%</span>
                <div className="flex-1 h-1 bg-[#1e1e2d] rounded-full overflow-hidden">
                  <div className="h-full bg-[#9d8df1]" style={{ width: `${confidence}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center px-8 h-full shrink-0">
              <span className="micro-cap mb-1">TIME TO TCA</span>
              <span className="text-sm font-semibold">{timeString}</span>
            </div>
          </div>

          <button onClick={toggleStoryMode} className="flex items-center gap-2 border border-[#2a2f3a] rounded bg-[#13161f] px-3 py-1.5 hover:bg-[#1e1e2d] transition-colors ml-4 shrink-0">
            <span className="micro-cap m-0">{storyMode ? 'MISSION MODE' : 'ANALYST MODE'}</span>
            <ChevronDown size={14} className="text-[#8a91a6]" />
          </button>
        </div>

        {/* COLUMNS AREA */}
        <div className="flex-1 relative flex justify-between p-6 pointer-events-none overflow-hidden">
          
          {/* ═══ LEFT PANEL ═══ */}
          <div className="relative pointer-events-auto h-full z-10 flex">
            {/* Panel Container */}
            <div 
              className={`flex flex-col gap-4 h-full transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden scrollbar-hide relative ${leftPanelExpanded ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute'}`}
              style={{ width: leftPanelWidth }}
            >
              {/* Resize Handle */}
              <div 
                className="absolute top-0 bottom-0 right-0 w-1.5 cursor-col-resize hover:bg-[#9d8df1]/50 z-50 transition-colors"
                onMouseDown={handleLeftPanelDrag}
              />
              
              {/* Mission Timeline */}
              <div className="dash-panel flex flex-col shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#8a91a6] shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8a91a6] whitespace-nowrap overflow-hidden text-ellipsis">MISSION TIMELINE</span>
                  </div>
                  <ChevronDown size={14} className="text-[#8a91a6] shrink-0" />
                </div>
                <div className="flex flex-col gap-4 relative pl-3">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-[#2a2f3a]"></div>
                  {[
                    { t: -72, label: 'Initial Detection' },
                    { t: -48, label: 'Tracking Objects' },
                    { t: -24, label: 'Risk Analysis' },
                    { t: -12, label: 'AI Evaluation' },
                    { t: 0, label: 'Closest Approach' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4 z-10 relative cursor-pointer" onClick={() => smoothScrubTo(step.t)}>
                      <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${timeOffset === step.t ? 'bg-[#9d8df1] border-[#9d8df1] ring-4 ring-[#9d8df1]/20' : (timeOffset > step.t ? 'bg-[#8a91a6] border-[#8a91a6]' : 'bg-[#13161f] border-[#8a91a6]')}`}></div>
                      <span className={`text-xs w-10 shrink-0 ${timeOffset === step.t ? 'text-[#9d8df1]' : 'text-[#8a91a6]'}`}>{step.t === 0 ? 'TCA' : `T${step.t}h`}</span>
                      <span className={`text-xs whitespace-nowrap overflow-hidden text-ellipsis ${timeOffset === step.t ? 'text-[#9d8df1]' : 'text-[#8a91a6]'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objects Involved */}
              <div className="dash-panel flex flex-col shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-[#8a91a6] shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8a91a6] whitespace-nowrap overflow-hidden text-ellipsis">OBJECTS INVOLVED</span>
                  </div>
                  <ChevronDown size={14} className="text-[#8a91a6] shrink-0" />
                </div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">AURA-1 (PRIMARY)</span>
                    <span className="text-[10px] text-[#8a91a6] mt-1">ID: 2025-A1-001</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#00d084] tracking-wider uppercase shrink-0 ml-2">ACTIVE</span>
                </div>
                
                <div className="w-full h-px bg-[#2a2f3a] mb-4"></div>
                
                <div className="flex justify-between items-start">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{scenario.shortName.toUpperCase()} (SECONDARY)</span>
                    <span className="text-[10px] text-[#8a91a6] mt-1">ID: 1998-ROCK-7721</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#f5a623] tracking-wider uppercase shrink-0 ml-2">DEBRIS</span>
                </div>
              </div>

              {/* Aura Core Reasoning */}
              <div className="dash-panel flex flex-col flex-1 min-h-[250px] relative overflow-hidden group">
                {/* Background scanning line effect */}
                {isThinking && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9d8df1]/10 to-transparent h-20 w-full animate-scan pointer-events-none" />
                )}

                <div className="flex justify-between items-center mb-4 z-10 relative">
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className={`shrink-0 ${isThinking ? 'text-[#9d8df1] animate-pulse' : 'text-[#8a91a6]'}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis ${isThinking ? 'text-[#9d8df1]' : 'text-[#8a91a6]'}`}>
                      {isThinking ? 'THREAT ANALYSIS RUNNING...' : 'AURA CORE REASONING'}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-[#8a91a6] shrink-0" />
                </div>
                
                <div className="flex flex-col gap-3 relative pl-3 mt-2 flex-1 overflow-y-auto scrollbar-hide z-10 text-[10px] font-mono leading-relaxed">
                  <div className="absolute left-4 top-2 bottom-6 w-px bg-[#2a2f3a]"></div>
                  
                  {!isThinking && coreLogs.length === 0 && (
                    <>
                      <div className="flex gap-4 z-10 relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#9d8df1] mt-1 ring-4 ring-[#9d8df1]/20 shrink-0"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#8a91a6] mb-1">IDLE STATE</span>
                          <span className="text-xs text-[#8a91a6]">Awaiting Threat Analysis...</span>
                        </div>
                      </div>
                    </>
                  )}

                  {coreLogs.map((log, i) => (
                    <div key={i} className="flex gap-4 z-10 relative animate-fade-in">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${log.type === 'info' ? 'bg-[#9d8df1] ring-4 ring-[#9d8df1]/20' : log.type === 'warn' ? 'bg-[#f5a623] ring-4 ring-[#f5a623]/20' : 'bg-[#00d084] ring-4 ring-[#00d084]/20'}`}></div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-[#8a91a6] mb-1">{log.time}</span>
                        <span className={log.type === 'warn' ? 'text-[#f5a623]' : log.type === 'success' ? 'text-[#00d084]' : 'text-white'}>
                          {log.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-4 py-3 bg-[#1e1e2d] hover:bg-[#2a2f3a] text-xs font-semibold rounded transition-colors text-[#8a91a6] z-10 relative">
                  VIEW FULL TRACE
                </button>
              </div>
            </div>

            {/* Left Panel Toggle */}
            <div className={`flex flex-col justify-center transition-all duration-700 ease-in-out ${leftPanelExpanded ? 'ml-0' : 'ml-0'}`}>
              <button 
                onClick={() => setLeftPanelExpanded(!leftPanelExpanded)}
                className="w-6 h-12 bg-[#13161f] border border-l-0 border-[#2a2f3a] rounded-r flex items-center justify-center text-[#8a91a6] hover:text-white pointer-events-auto"
              >
                {leftPanelExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>

          {/* ═══ RIGHT PANEL ═══ */}
          <div className="relative pointer-events-auto h-full z-10 flex">
            {/* Right Panel Toggle */}
            <div className="flex flex-col justify-center">
              <button 
                onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
                className="w-6 h-12 bg-[#13161f] border border-r-0 border-[#2a2f3a] rounded-l flex items-center justify-center text-[#8a91a6] hover:text-white pointer-events-auto z-20"
              >
                {rightPanelExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>

            {/* Panel Container */}
            <div 
              className={`flex flex-col gap-4 h-full transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden scrollbar-hide relative ${rightPanelExpanded ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute right-0'}`}
              style={{ width: rightPanelWidth }}
            >
              {/* Resize Handle */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize hover:bg-[#9d8df1]/50 z-50 transition-colors"
                onMouseDown={handleRightPanelDrag}
              />
              
              {/* Risk Analysis Banner */}
              <div className="dash-panel flex flex-col shrink-0">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#8a91a6] shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8a91a6] whitespace-nowrap overflow-hidden text-ellipsis">RISK ANALYSIS</span>
                  </div>
                  <ChevronDown size={14} className="text-[#8a91a6] shrink-0" />
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{selectedStrategy ? selectedStrategy.deltaV.toFixed(1) : (riskTier === 'Critical' ? 'HI' : 'LO')}</span>
                    <span className="text-sm text-[#8a91a6] mb-1">{selectedStrategy ? 'm/s' : ''}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded bg-[#2a2f3a] uppercase shrink-0 ml-2 ${selectedStrategy ? 'text-[#9d8df1]' : 'text-[#8a91a6]'}`}>
                    {selectedStrategy ? 'MANEUVER LOCKED' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Decision Arena (Burn Cards) */}
              <div className="flex flex-col flex-1 min-h-[250px]">
                <DecisionArena scenario={scenario} selectedStrategy={selectedStrategy} onSelectStrategy={setSelectedStrategy} />
              </div>

              {/* B-Plane / Encounter Frame */}
              <div className={`dash-panel flex flex-col h-[200px] shrink-0 relative transition-opacity duration-700 ${advancedAnalysis ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Box size={14} className="text-[#8a91a6] shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8a91a6] whitespace-nowrap overflow-hidden text-ellipsis">B-PLANE COVARIANCE</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-0.5 bg-[#f24e4e]"></div>
                      <span className="text-[8px] text-[#8a91a6] whitespace-nowrap">Probability Cloud</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 relative overflow-hidden -mx-2">
                  {advancedAnalysis && <BPlaneVisualization />}
                </div>
                
                <div className="mt-2 border-t border-[#2a2f3a] pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Box size={12} className="text-[#8a91a6]" />
                    <span className="text-[10px] font-semibold text-[#8a91a6] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">ENCOUNTER FRAME</span>
                  </div>
                  <div className="text-[10px] text-[#8a91a6] uppercase mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                    <p>PRIMARY (CENTER) VS TARGET</p>
                    <p>COVARIANCE 2σ BOUND</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ═══ CENTER BOTTOM DOCK & SCRUBBER ═══ */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center w-[600px] pointer-events-auto z-10">
            <div className={`w-full flex flex-col items-center transition-transform duration-700 ease-in-out ${bottomExpanded ? 'translate-y-0' : 'translate-y-[200px]'}`}>
              
              {/* Bottom Dock Toggle (appears above the dock) */}
              <button 
                onClick={() => setBottomExpanded(!bottomExpanded)}
                className="mb-2 w-12 h-6 bg-[#13161f] border border-b-0 border-[#2a2f3a] rounded-t flex items-center justify-center text-[#8a91a6] hover:text-white"
              >
                {bottomExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>

              {/* Scrubber */}
              <div className="w-full flex items-center justify-between relative mb-8">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-[#2a2f3a] -z-10"></div>
                {[
                  { t: -72, label: 'NOW' },
                  { t: -24, label: 'T-24h' },
                  { t: -12, label: 'T-12h' },
                  { t: 0, label: 'TCA' },
                  { t: 12, label: 'POST MANEUVER' },
                  { t: 24, label: 'SAFE' }
                ].map(step => (
                  <div key={step.t} className="flex flex-col items-center cursor-pointer" onClick={() => smoothScrubTo(step.t)}>
                    <div className={`w-3 h-3 rounded-sm transform rotate-45 mb-2 ${timeOffset === step.t ? 'bg-[#9d8df1] ring-4 ring-[#9d8df1]/20' : (timeOffset > step.t ? 'bg-[#8a91a6]' : 'bg-[#13161f] border border-[#8a91a6]')}`}></div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${timeOffset === step.t ? 'text-[#9d8df1]' : 'text-[#8a91a6]'}`}>{step.label}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Dock */}
              <div className="flex items-center gap-4 border border-[#2a2f3a] bg-[#070b14]/80 backdrop-blur-md rounded-lg p-2 overflow-x-auto scrollbar-hide max-w-full">
                <button className="px-4 py-2 text-xs font-semibold text-[#8a91a6] hover:text-white flex items-center gap-2 whitespace-nowrap">
                  <Box size={14} /> FOCUS EARTH
                </button>
                <button className="px-4 py-2 text-xs font-semibold text-[#8a91a6] hover:text-white flex items-center gap-2 whitespace-nowrap">
                  <Eye size={14} /> FOCUS ENCOUNTER
                </button>
                
                <button
                  onClick={activeSequence ? abortCopilotSequence : activateCopilot}
                  className={`px-6 py-2 border rounded mx-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeSequence ? 'border-[#ff003c] bg-[#1e1e2d] text-[#ff003c] hover:bg-[#ff003c]/20' : 'border-[#2a2f3a] bg-[#13161f] text-[#8a91a6] hover:text-white hover:border-[#8a91a6]'}`}
                >
                  <Cpu size={14} /> {activeSequence ? 'ABORT ANALYSIS' : 'THREAT ANALYSIS'}
                </button>

                <button onClick={toggleAdvancedAnalysis} className="px-4 py-2 text-xs font-semibold text-[#8a91a6] hover:text-white flex items-center gap-2 whitespace-nowrap">
                  <Activity size={14} /> B-PLANE EXPERT
                </button>
                <button onClick={runJudgeModeSequence} className={`px-4 py-2 text-xs font-semibold text-[#8a91a6] hover:text-white flex items-center gap-2 whitespace-nowrap ${judgeModeActive ? 'text-[#9d8df1]' : ''}`}>
                  <Settings size={14} /> JUDGE MODE
                </button>
              </div>
              
              <div className="absolute right-[-320px] bottom-0 flex gap-4 text-[10px] font-bold tracking-widest text-[#00d084] hidden md:flex">
                <span className="whitespace-nowrap">DATA SYNCHRONIZED</span>
                <span className="text-[#8a91a6] whitespace-nowrap">12:45:30 UTC <CheckCircle2 size={12} className="inline ml-1 text-[#00d084]" /></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══ MISSION SUMMARY OVERLAY ═══ */}
      <div className={`absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity duration-1000 ${orbState === 'MISSION_SUMMARY' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center border border-[#2a2f3a] bg-[#070b14] p-12 rounded-lg max-w-xl w-full shadow-2xl shadow-[#9d8df1]/10">
          <CheckCircle2 size={48} className="text-[#00d084] mb-6" />
          <h2 className="text-3xl font-bold tracking-widest mb-8">MISSION SUMMARY</h2>
          
          <div className="w-full flex flex-col gap-4 text-sm font-mono text-[#8a91a6]">
            <div className="flex justify-between border-b border-[#2a2f3a] pb-2">
              <span>INITIAL RISK:</span>
              <span className="text-[#ff003c] font-bold">CRITICAL</span>
            </div>
            <div className="flex justify-between border-b border-[#2a2f3a] pb-2">
              <span>FINAL RISK:</span>
              <span className="text-[#00d084] font-bold">SAFE</span>
            </div>
            <div className="flex justify-between border-b border-[#2a2f3a] pb-2">
              <span>RECOMMENDED ACTION:</span>
              <span className="text-white font-bold">MANEUVER ({selectedStrategy?.deltaV.toFixed(1)} m/s)</span>
            </div>
            <div className="flex justify-between border-b border-[#2a2f3a] pb-2">
              <span>CONFIDENCE:</span>
              <span className="text-white font-bold">97.4%</span>
            </div>
            <div className="flex justify-between border-b border-[#2a2f3a] pb-2">
              <span>OUTCOME:</span>
              <span className="text-[#00d084] font-bold">SUCCESSFUL</span>
            </div>
          </div>
          
          <div className="mt-12 text-xs font-bold tracking-widest text-[#8a91a6] animate-pulse">
            RETURNING TO ORBITAL TRAFFIC COMMAND...
          </div>
        </div>
      </div>

      {/* ═══ VISUAL LEGEND ═══ */}
      <div className={`absolute right-12 top-24 pointer-events-none transition-all duration-700 ${['FUTURE_PREDICTION', 'AI_EVALUATES', 'MANEUVER_LOCKED'].includes(orbState) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
        <div className="bg-[#070b14]/80 backdrop-blur-md border border-[#2a2f3a] rounded-lg p-4 w-[240px] shadow-lg flex flex-col gap-3">
          <div className="text-[10px] font-bold text-[#8a91a6] tracking-widest uppercase mb-1 border-b border-[#2a2f3a] pb-2">
            VISUAL LEGEND
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-0.5 bg-[#ff003c]"></div>
            <span className="text-xs font-semibold">DANGER TRAJECTORY</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-0.5 bg-[#00d084]"></div>
            <span className="text-xs font-semibold">SAFE PATH</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#ffb400]/20 border border-[#ffb400] border-dashed"></div>
            <span className="text-xs font-semibold">UNCERTAINTY ZONE</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute w-full h-full border border-[#ff003c] rounded-full animate-ping opacity-75"></div>
              <div className="w-1.5 h-1.5 bg-[#ff003c] rounded-full"></div>
            </div>
            <span className="text-xs font-semibold">COLLISION RISK</span>
          </div>
        </div>
      </div>

      {/* ═══ MANEUVER LOCKED COUNTDOWN ═══ */}
      <div className={`absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none transition-opacity duration-300 ${orbState === 'MANEUVER_LOCKED' ? 'opacity-100' : 'opacity-0'}`}>
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
      <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[160] pointer-events-none transition-all duration-500 ${isComputing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3 bg-[#070b14]/90 backdrop-blur-md border border-[#9d8df1]/40 rounded-lg px-5 py-2.5 shadow-lg shadow-[#9d8df1]/10">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="absolute w-full h-full border-2 border-[#9d8df1] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs font-semibold text-[#9d8df1] tracking-wider uppercase whitespace-nowrap">{computingLabel}</span>
        </div>
      </div>

    </div>
  );
}
