import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';

export default function NarrativeOverlay() {
  const judgeModeActive = useStore((s) => s.judgeModeActive);
  const judgeModeStep = useStore((s) => s.judgeModeStep);

  const [narrativeText, setNarrativeText] = useState('');
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!judgeModeActive) {
      setNarrativeText('');
      setDisplayedText('');
      return;
    }

    switch (judgeModeStep) {
      case 2:
        setNarrativeText('MISSION STATUS:\nConjunction detected.');
        break;
      case 4:
        setNarrativeText('Computing collision probability...');
        break;
      case 6:
        setNarrativeText('Evaluating avoidance maneuvers...');
        break;
      case 7:
        setNarrativeText('Optimal solution identified.');
        break;
      case 10:
        setNarrativeText('Mission safe.');
        break;
      default:
        // Retain current text during intermediate steps
        break;
    }
  }, [judgeModeActive, judgeModeStep]);

  // Typing effect
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < narrativeText.length) {
        setDisplayedText(prev => prev + narrativeText.charAt(i));
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
      <div className="font-mono text-xl md:text-3xl font-bold tracking-[0.2em] text-white whitespace-pre-wrap leading-relaxed animate-fade-in uppercase text-center px-8 drop-shadow-[0_0_20px_rgba(0,0,0,1)]">
        {displayedText}
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
}
