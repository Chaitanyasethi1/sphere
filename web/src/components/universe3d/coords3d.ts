import * as THREE from "three";

/**
 * Standard radius for the virtual celestial sphere in Three.js world units.
 */
export const CELESTIAL_SPHERE_RADIUS = 80;

/**
 * Converts equatorial coordinates (RA, Dec in degrees) to a 3D position vector on a sphere.
 *
 * Convention:
 * +Y: North Celestial Pole (Dec = +90°)
 * -Y: South Celestial Pole (Dec = -90°)
 * +X: RA = 0° (Vernal Equinox), Dec = 0°
 * -Z: RA = 90° (6h), Dec = 0°
 * -X: RA = 180° (12h), Dec = 0°
 * +Z: RA = 270° (18h), Dec = 0°
 */
export function raDecToVector3(
  raDeg: number,
  decDeg: number,
  radius: number = CELESTIAL_SPHERE_RADIUS
): THREE.Vector3 {
  const raRad = (raDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  const cosDec = Math.cos(decRad);
  const x = radius * cosDec * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = -radius * cosDec * Math.sin(raRad);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D vector back to equatorial RA and Dec in degrees.
 */
export function vector3ToRaDec(v: THREE.Vector3): { ra: number; dec: number } {
  const norm = v.clone().normalize();
  const decRad = Math.asin(Math.max(-1, Math.min(1, norm.y)));
  let raRad = Math.atan2(-norm.z, norm.x);
  if (raRad < 0) {
    raRad += 2 * Math.PI;
  }

  const ra = (raRad * 180) / Math.PI;
  const dec = (decRad * 180) / Math.PI;
  return { ra, dec };
}
