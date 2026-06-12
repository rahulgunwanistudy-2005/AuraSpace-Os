import * as satellite from 'satellite.js';

/**
 * Propagates TLE to a given Date and returns state vector in km and km/s
 */
export function propagateTLE(tleLine1, tleLine2, targetDate) {
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
  const positionAndVelocity = satellite.propagate(satrec, targetDate);
  
  if (!positionAndVelocity.position) return null;
  
  const gmst = satellite.gstime(targetDate);
  const positionEcf = satellite.eciToEcf(positionAndVelocity.position, gmst);
  const velocityEcf = satellite.eciToEcf(positionAndVelocity.velocity, gmst);
  
  return {
    position: positionEcf, // {x, y, z} in ECF (km)
    velocity: velocityEcf, // {x, y, z} in ECF (km/s)
    eci: positionAndVelocity // Keep ECI for OrbitalEngine B-Plane math if needed
  };
}
