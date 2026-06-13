import { create } from 'zustand';
import { scenarios } from '../data/scenarios';
import { Engine } from '../orbital/OrbitalEngine';

// Initialize engine with first scenario
Engine.loadScenario(scenarios[0]);
const initialState = Engine.computeState(-72, null);

export const useStore = create((set, get) => ({
  // ═══ SCENARIO ═══
  scenario: scenarios[0],
  allScenarios: scenarios,
  setScenario: (scenario) => {
    Engine.loadScenario(scenario);
    const engineState = Engine.computeState(-72, null);
    set({ scenario, timeOffset: -72, selectedStrategy: null, orbState: 'IDLE', engineState });
  },

  // ═══ TIMELINE ═══
  timeOffset: -72,
  setTimeOffset: (timeOffset) => {
    set({ timeOffset });
    const state = get();
    const engineState = Engine.computeState(timeOffset, state.selectedStrategy);
    set({ engineState });
  },

  smoothScrubTo: (targetTime) => {
    get().clearCopilotSequence();
    set({ targetTimeOffset: targetTime });
    
    const animate = () => {
      const state = get();
      const current = state.timeOffset;
      const target = state.targetTimeOffset;
      
      if (Math.abs(current - target) > 0.05) {
        get().setTimeOffset(current + (target - current) * 0.1);
        set({ activeAnimationId: requestAnimationFrame(animate) });
      } else {
        get().setTimeOffset(target);
      }
    };
    set({ activeAnimationId: requestAnimationFrame(animate) });
  },

  // ═══ STRATEGY ═══
  selectedStrategy: null,
  setSelectedStrategy: (selectedStrategy) => {
    set({ selectedStrategy });
    const state = get();
    const engineState = Engine.computeState(state.timeOffset, selectedStrategy);
    set({ engineState });
  },

  // ═══ APP STATE ═══
  appView: 'COMMAND_CENTER', // 'COMMAND_CENTER' | 'DASHBOARD' | 'INVESTIGATION'
  setAppView: (appView) => set({ appView }),
  
  activeDashboardTab: 'dashboard',
  setActiveDashboardTab: (activeDashboardTab) => set({ activeDashboardTab }),

  immersiveMode: false,
  toggleImmersive: () => set(s => ({ immersiveMode: !s.immersiveMode })),
  
  orbState: 'IDLE',
  setOrbState: (orbState) => set({ orbState }),

  // ═══ HOVER STATE & V3 INTERACTION ═══
  hoveredObject: null, // 'PRIMARY' | 'SECONDARY' | null
  setHoveredObject: (hoveredObject) => set({ hoveredObject }),

  activeTimelineIdx: 3, // T-12h Default
  setActiveTimelineIdx: (activeTimelineIdx) => set({ activeTimelineIdx }),

  cameraTarget: 'EARTH', // 'EARTH' | 'PRIMARY' | 'SECONDARY' | 'TCA'
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),

  activeAiEvent: null, // Track specific AI events to trigger visual pulses
  setActiveAiEvent: (activeAiEvent) => set({ activeAiEvent }),

  // ═══ LOADING / COMPUTING STATE ═══
  isComputing: false,
  computingLabel: '',
  setComputing: (isComputing, computingLabel = '') => set({ isComputing, computingLabel }),

  // ═══ UI STATE ═══
  leftPanelOpen: true,
  rightPanelOpen: true,
  immersiveMode: false,
  showCinematicReveal: false,
  showSimChamber: false,

  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleImmersive: () => set((s) => ({
    immersiveMode: !s.immersiveMode,
    leftPanelOpen: s.immersiveMode, // restore panels when exiting
    rightPanelOpen: s.immersiveMode,
  })),
  setShowCinematicReveal: (v) => set({ showCinematicReveal: v }),
  setShowSimChamber: (v) => set({ showSimChamber: v }),

  // ═══ ENGINE OUTPUT ═══
  engineState: initialState || { Pc: 0, riskTier: 'Safe', bPlaneStats: null, confidence: 100 },

  // ═══ V8 JUDGE & FOCUS FEATURES ═══
  judgeModeActive: false,
  setJudgeModeActive: (v) => set({ judgeModeActive: v, lightingMode: v ? 'CINEMATIC' : 'OPERATIONAL' }),
  judgeModeStep: 0,
  setJudgeModeStep: (v) => set({ judgeModeStep: v }),
  
  lightingMode: 'OPERATIONAL', // 'OPERATIONAL' | 'CINEMATIC'
  setLightingMode: (v) => set({ lightingMode: v }),
  
  focusElement: null,
  setFocusElement: (v) => set({ focusElement: v }),
  
  advancedAnalysis: false,
  toggleAdvancedAnalysis: () => set((s) => ({ advancedAnalysis: !s.advancedAnalysis })),

  // ═══ SEQUENCE ORCHESTRATION ═══
  sequenceTimeouts: [],
  activeAnimationId: null,

  clearCopilotSequence: () => {
    const { sequenceTimeouts, activeAnimationId } = get();
    sequenceTimeouts.forEach(clearTimeout);
    if (activeAnimationId) cancelAnimationFrame(activeAnimationId);
    set({ sequenceTimeouts: [], activeAnimationId: null });
  },

  // ═══ JUDGE MODE ORCHESTRATOR ═══
  runJudgeModeSequence: () => {
    get().clearCopilotSequence();
    // START: Reset state
    set({ 
      judgeModeActive: true, 
      judgeModeStep: 1, 
      appView: 'COMMAND_CENTER',
      lightingMode: 'CINEMATIC', 
      immersiveMode: true, 
      leftPanelOpen: true, 
      rightPanelOpen: true, 
      timeOffset: -72, 
      selectedStrategy: null, 
      advancedAnalysis: false,
      isComputing: true,
      computingLabel: 'Initializing orbital traffic scan...'
    });
    
    // Step 1: Massive Earth Hero Shot (0-5s) - UI is hidden by CommandCenter returning null for step < 2

    // Step 2: Overlay appears: MONITORING 1432 ALERTS (5-8s)
    const t1 = setTimeout(() => {
      set({ judgeModeStep: 2, computingLabel: 'Processing conjunction alerts...' });
    }, 5000);

    // Step 3: Command Center slides in. Stream begins flowing. (8-11s)
    const t2 = setTimeout(() => {
      set({ judgeModeStep: 3, computingLabel: 'Triaging alert queue...' });
    }, 8000);
    
    // Step 4: AI starts triaging. Critical alert escalates. (11-15s)
    const t3 = setTimeout(() => {
      set({ judgeModeStep: 4, computingLabel: 'Escalating critical threat...' });
    }, 11000);

    // Step 5: Critical alert selected. Transition animation triggers.
    const t4 = setTimeout(() => {
      set({ judgeModeStep: 5, isComputing: false, computingLabel: '' });
    }, 15000);

    // Step 6: AppView switches to DASHBOARD
    const t5 = setTimeout(() => {
      set({ appView: 'DASHBOARD', judgeModeActive: false, judgeModeStep: 0, immersiveMode: false, isComputing: false, computingLabel: '' });
    }, 17000);

    set({ sequenceTimeouts: [t1, t2, t3, t4, t5] });
  },

  // ═══ STORY MODE ═══
  storyMode: true,
  toggleStoryMode: () => set((s) => ({ storyMode: !s.storyMode })),

  // ═══ ANIMATION TARGETS ═══
  targetMissDistance: 421,
  targetConfidence: 30,
  targetTimeOffset: -72,
  encounterMidpointRef: { current: null }, // Initialized via Three.js later

  // ═══ COPILOT ACTIVATION SEQUENCE (5-PHASE CINEMATIC) ═══
  activateCopilot: () => {
    get().clearCopilotSequence();
    const { scenario, setOrbState, setShowSimChamber, setSelectedStrategy, setTimeOffset } = get();
    
    set({ targetMissDistance: 421, targetConfidence: 30, targetTimeOffset: -72 });

    // Smooth animator loop for cinematic playback
    const animate = () => {
      const state = get();
      if (state.orbState === 'IDLE') return; // Stop if aborted or finished
      
      const current = state.timeOffset;
      const target = state.targetTimeOffset;
      
      if (Math.abs(current - target) > 0.01) {
        setTimeOffset(current + (target - current) * 0.05);
      }
      
      set({ activeAnimationId: requestAnimationFrame(animate) });
    };
    set({ activeAnimationId: requestAnimationFrame(animate) });

    // Phase 1: Threat Detection (0-4s)
    setOrbState('THREAT_DETECTION');
    set({ targetTimeOffset: -48, isComputing: true, computingLabel: 'Analyzing conjunction data...' });
    
    // Phase 2: Future Prediction (4-9s)
    const t1 = setTimeout(() => {
      setOrbState('FUTURE_PREDICTION');
      setShowSimChamber(true);
      set({ targetConfidence: 55, targetTimeOffset: -24, computingLabel: 'Running Monte Carlo simulations...' });
    }, 4000);
    
    // Phase 3: Options Ready (9s)
    const t2 = setTimeout(() => {
      setOrbState('OPTIONS_READY');
      set({ targetConfidence: 85, targetTimeOffset: -12, computingLabel: '', isComputing: false });
    }, 9000);

    set({ sequenceTimeouts: [t1, t2] });
  },

  executeManeuver: (strategy) => {
    get().clearCopilotSequence();
    const { setOrbState, setSelectedStrategy, setShowSimChamber } = get();
    
    setSelectedStrategy(strategy);
    setOrbState('MANEUVER_LOCKED');
    set({ targetTimeOffset: -2, isComputing: false, computingLabel: '' });
    
    const t1 = setTimeout(() => {
      setOrbState('MANEUVER_EXECUTION');
      set({ targetConfidence: 99.9, targetMissDistance: 3800, targetTimeOffset: 1 });
    }, 3000);
    
    const t2 = setTimeout(() => {
      setOrbState('MISSION_SAFE');
      setShowSimChamber(false);
      set({ targetTimeOffset: 12 });
    }, 7000);
    
    const t3 = setTimeout(() => {
      setOrbState('MISSION_SUMMARY');
      set({ targetTimeOffset: 24 });
    }, 12000);

    const t4 = setTimeout(() => {
      set({ 
        orbState: 'IDLE', 
        judgeModeActive: false, 
        judgeModeStep: 0, 
        appView: 'COMMAND_CENTER', 
        lightingMode: 'OPERATIONAL', 
        immersiveMode: false,
        timeOffset: -72,
        targetTimeOffset: -72,
        selectedStrategy: null
      });
    }, 17000);
    
    set({ sequenceTimeouts: [t1, t2, t3, t4] });
  },
  
  abortCopilotSequence: () => {
    get().clearCopilotSequence();
    set({
      orbState: 'IDLE',
      judgeModeActive: false,
      judgeModeStep: 0,
      appView: 'COMMAND_CENTER',
      lightingMode: 'OPERATIONAL',
      immersiveMode: false,
      isComputing: false,
      computingLabel: '',
    });
  }
}));
