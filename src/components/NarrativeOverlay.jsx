import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';

export default function NarrativeOverlay() {
  const judgeModeActive = useStore((s) => s.judgeModeActive);
  const judgeModeStep = useStore((s) => s.judgeModeStep);
  const orbState = useStore((s) => s.orbState);

  const [narrativeText, setNarrativeText] = useState('');
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!judgeModeActive) {
      setNarrativeText('');
      setDisplayedText('');
      return;
    }

    // Map narrative text based on judgeModeStep or orbState
    if (judgeModeStep === 3) {
      setNarrativeText('MISSION STATUS:\nConjunction detected.');
    } else if (judgeModeStep === 4) {
      setNarrativeText('Computing collision probability...');
    } else if (judgeModeStep === 5) {
      setNarrativeText('Analyzing encounter geometry...');
    }

    if (orbState === 'AI_EVALUATES') {
      setNarrativeText('Evaluating avoidance maneuvers...');
    } else if (orbState === 'MANEUVER_LOCKED') {
      setNarrativeText('Optimal solution identified.');
    } else if (orbState === 'MISSION_SAFE') {
      setNarrativeText('Mission safe.');
    } else if (judgeModeStep < 3 && orbState === 'IDLE') {
      setNarrativeText('');
    }
  }, [judgeModeActive, judgeModeStep, orbState]);

  // Typing effect
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    let currentText = '';
    const interval = setInterval(() => {
      if (i < narrativeText.length) {
        currentText += narrativeText.charAt(i);
        setDisplayedText(currentText);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40); // typing speed

    return () => clearInterval(interval);
  }, [narrativeText]);

  if (!judgeModeActive || !narrativeText) return null;

  return (
    <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-[200]" style={{ paddingTop: '22%' }}>
      <div className="font-mono text-lg md:text-xl font-bold tracking-[0.2em] text-white whitespace-pre-wrap leading-relaxed animate-fade-in uppercase text-center px-6 py-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 drop-shadow-[0_0_30px_rgba(0,0,0,1)] max-w-[50vw]">
        {displayedText}
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
}

