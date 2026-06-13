import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useStore } from '../state/store';
import { useFrame } from '@react-three/fiber';

export default function GlobalCameraController() {
  const cameraRef = useRef();
  const orbState = useStore((s) => s.orbState);
  const immersiveMode = useStore((s) => s.immersiveMode);
  const judgeModeActive = useStore((s) => s.judgeModeActive);
  const judgeModeStep = useStore((s) => s.judgeModeStep);
  const appView = useStore((s) => s.appView);
  const cameraTarget = useStore((s) => s.cameraTarget);
  const hoveredObject = useStore((s) => s.hoveredObject);
  const encounterMidpointRef = useStore((s) => s.encounterMidpointRef);

  useEffect(() => {
    if (!cameraRef.current) return;

    if (appView === 'DASHBOARD') {
      // In Dashboard mode, camera is tightly coupled to interaction
      let targetPos = [0, 2, 20];
      let lookAtPos = [0, -1, -6]; // Earth Center

      if (cameraTarget === 'PRIMARY' || hoveredObject === 'PRIMARY') {
        targetPos = [3, 2, 10];
        lookAtPos = [1.5, -1, -6];
      } else if (cameraTarget === 'SECONDARY' || hoveredObject === 'SECONDARY') {
        targetPos = [-3, 3, 12];
        lookAtPos = [0, 0, -6];
      } else if (cameraTarget === 'TCA') {
        targetPos = [0, 5, 8];
        lookAtPos = [1.5, -1, -6];
      } else if (cameraTarget === '2D') {
        targetPos = [1.5, -1, 30]; // Pull way back for flat look
        lookAtPos = [1.5, -1, -6];
      } else {
        // Default EARTH
        targetPos = [6, 3, 35]; // Zoomed out MORE cinematic side angle
        lookAtPos = [1.5, -1, -6];
      }
      
      cameraRef.current.setLookAt(...targetPos, ...lookAtPos, true);
      return;
    }

    // ═══ ORIGINAL COMMAND CENTER / JUDGE MODE LOGIC (PRESERVED) ═══
    if (judgeModeActive) {
      switch (judgeModeStep) {
        case 1: cameraRef.current.setLookAt(0, 0, 25, 0, -1, -6, true); break;
        case 2: cameraRef.current.setLookAt(2, 4, 15, 0, -1, -6, true); break;
        case 3: cameraRef.current.setLookAt(4, 2, 8, 0, -1, -6, true); break;
        case 4: cameraRef.current.setLookAt(8, 0, 2, 0, -1, -6, true); break;
        case 5: cameraRef.current.setLookAt(2, -1, 0, 0, -1, -6, true); break;
        case 6: cameraRef.current.setLookAt(2, 2, 4, 8, 4, -4, true); break;
        case 7: cameraRef.current.setLookAt(4, 3, 2, 8, 4, -4, true); break;
        case 8: cameraRef.current.setLookAt(-6, 4, 6, 0, -1, -6, true); break;
        case 9: cameraRef.current.setLookAt(-4, 1, 2, 0, -1, -6, true); break;
        case 10: cameraRef.current.setLookAt(-2, 0, 8, 0, -1, -6, true); break;
        case 11: cameraRef.current.setLookAt(0, 2, 18, 0, -1, -6, true); break;
        default: break;
      }
    } else if (orbState === 'THINKING') {
      cameraRef.current.setLookAt(4, 3, 2, 8, 4, -4, true);
    } else if (immersiveMode) {
      cameraRef.current.setLookAt(0, 2, 16, 0, -1, -6, true);
    } else {
      cameraRef.current.setLookAt(0, 2, 20, 0, -1, -6, true);
    }
  }, [orbState, immersiveMode, judgeModeActive, judgeModeStep, appView, cameraTarget, hoveredObject]);

  useFrame((state, delta) => {
    // If the cinematic sequence is active, lock the camera to the dynamic encounter midpoint
    if (orbState !== 'IDLE' && encounterMidpointRef?.current && appView !== 'DASHBOARD') {
      const mid = encounterMidpointRef.current;
      if (cameraRef.current) {
        cameraRef.current.setLookAt(mid.x + 4, mid.y + 3, mid.z + 4, mid.x, mid.y, mid.z, true);
      }
    }

    // Micro-motion breathing when idle in DASHBOARD
    if (appView === 'DASHBOARD' && cameraRef.current && cameraTarget === 'EARTH' && !hoveredObject) {
      const time = state.clock.elapsedTime;
      const tX = 6 + Math.sin(time * 0.1) * 0.5;
      const tY = 3 + Math.cos(time * 0.15) * 0.3;
      cameraRef.current.setLookAt(tX, tY, 35, 1.5, -1, -6, true);
    }
  });

  return <CameraControls ref={cameraRef} makeDefault smoothTime={0.5} maxSpeed={1.5} />;
}
