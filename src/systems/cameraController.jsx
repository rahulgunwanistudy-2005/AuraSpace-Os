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
  const encounterMidpointRef = useStore((s) => s.encounterMidpointRef);

  useEffect(() => {
    if (!cameraRef.current) return;

    // Earth target: [0, -1, -6]
    // Orb target: [8, 4, -4]

    if (judgeModeActive) {
      switch (judgeModeStep) {
        case 1: // 1. Earth view
          cameraRef.current.setLookAt(0, 0, 25, 0, -1, -6, true);
          break;
        case 2: // 2. Threat detected
          cameraRef.current.setLookAt(2, 4, 15, 0, -1, -6, true);
          break;
        case 3: // 3. Objects highlighted
          cameraRef.current.setLookAt(4, 2, 8, 0, -1, -6, true);
          break;
        case 4: // 4. Risk corridor appears
          cameraRef.current.setLookAt(8, 0, 2, 0, -1, -6, true);
          break;
        case 5: // 5. Collision projection
          cameraRef.current.setLookAt(2, -1, 0, 0, -1, -6, true);
          break;
        case 6: // 6. AI reasoning
          cameraRef.current.setLookAt(2, 2, 4, 8, 4, -4, true);
          break;
        case 7: // 7. Maneuver optimization
          cameraRef.current.setLookAt(4, 3, 2, 8, 4, -4, true);
          break;
        case 8: // 8. Maneuver selected
          cameraRef.current.setLookAt(-6, 4, 6, 0, -1, -6, true);
          break;
        case 9: // 9. Trajectory changes
          cameraRef.current.setLookAt(-4, 1, 2, 0, -1, -6, true);
          break;
        case 10: // 10. Risk drops
          cameraRef.current.setLookAt(-2, 0, 8, 0, -1, -6, true);
          break;
        case 11: // 11. Mission safe
          cameraRef.current.setLookAt(0, 2, 18, 0, -1, -6, true);
          break;
        default:
          break;
      }
    } else if (orbState === 'THINKING') {
      cameraRef.current.setLookAt(4, 3, 2, 8, 4, -4, true);
    } else if (immersiveMode) {
      cameraRef.current.setLookAt(0, 2, 16, 0, -1, -6, true);
    } else {
      cameraRef.current.setLookAt(0, 2, 20, 0, -1, -6, true);
    }
  }, [orbState, immersiveMode, judgeModeActive, judgeModeStep]);

  useFrame((state, delta) => {
    // If the cinematic sequence is active, lock the camera to the dynamic encounter midpoint
    if (orbState !== 'IDLE' && encounterMidpointRef?.current) {
      const mid = encounterMidpointRef.current;
      // We keep the camera slightly offset from the midpoint (e.g. up and to the side)
      // and look directly at the midpoint.
      if (cameraRef.current) {
        // Smoothly interpolate the lookAt and position
        // To avoid jitter, we just let CameraControls smoothTime handle the easing
        // We set the target to the midpoint, and the camera position relatively offset
        cameraRef.current.setLookAt(
          mid.x + 4, mid.y + 3, mid.z + 4, // camera pos
          mid.x, mid.y, mid.z,             // look at pos
          true                             // animate
        );
      }
    }
  });

  return <CameraControls ref={cameraRef} makeDefault smoothTime={1.5} maxSpeed={0.5} />;
}

