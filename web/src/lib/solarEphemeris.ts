import {
  Body,
  HelioVector,
  GeoVector,
  Rotation_EQJ_ECL,
  RotateVector,
  Vector,
  AstroTime,
} from "astronomy-engine";
import { DESIGN_TOKENS } from "@/design/tokens";

export type PlanetKey =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type ScaleMode = "schematic" | "true";

export interface PlanetPosition3D {
  key: PlanetKey;
  name: string;
  distanceAU: number;
  rawVectorAU: { x: number; y: number; z: number };
  scenePosition: [number, number, number];
  color: string;
  visualRadius: number;
  orbitalPeriodDays: number;
}

export const PLANET_ORBITAL_PERIODS_DAYS: Record<Exclude<PlanetKey, "sun">, number> = {
  mercury: 87.969,
  venus: 224.701,
  earth: 365.256,
  moon: 27.322,
  mars: 686.98,
  jupiter: 4332.59,
  saturn: 10759.22,
  uranus: 30685.4,
  neptune: 60189.0,
  pluto: 90560.0,
};

export const PLANET_BODY_MAP: Record<Exclude<PlanetKey, "sun">, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  earth: Body.Earth,
  moon: Body.Moon,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

// Authentic NASA Eyes orbit colors mapped to DESIGN_TOKENS
export const PLANET_COLORS: Record<PlanetKey, string> = {
  sun: "#FFE87C",
  mercury: DESIGN_TOKENS.colors.orbits.mercury, // #a278b5 purple-grey
  venus: DESIGN_TOKENS.colors.orbits.venus,     // #e8d5a3 pale gold
  earth: DESIGN_TOKENS.colors.orbits.earth,     // #68a8cf cyan-blue
  moon: "#cbd5e1",                              // silver
  mars: DESIGN_TOKENS.colors.orbits.mars,       // #d96b43 rust amber
  jupiter: DESIGN_TOKENS.colors.orbits.jupiter, // #cca06a warm gold
  saturn: "#e2b87f",                            // pale amber ringed
  uranus: "#7dd3fc",                            // cyan ice
  neptune: "#38bdf8",                           // azure blue
  pluto: "#c084fc",                             // distant violet
};

export const PLANET_VISUAL_RADII: Record<PlanetKey, number> = {
  sun: 1.6,
  mercury: 0.35,
  venus: 0.52,
  earth: 0.58,
  moon: 0.18,
  mars: 0.44,
  jupiter: 1.15,
  saturn: 0.95,
  uranus: 0.72,
  neptune: 0.70,
  pluto: 0.28,
};

const BASE_EARTH_RADIUS_SCENE = 12.0;

/**
 * Scale heliocentric distance in AU to Three.js scene distance.
 * - Schematic: Smooth non-linear power compression so all bodies (Mercury to Pluto) are visible together.
 * - True Scale: Strictly linear proportion to AU.
 */
export function scaleDistance(au: number, mode: ScaleMode): number {
  if (au <= 0) return 0;
  if (mode === "true") {
    return au * BASE_EARTH_RADIUS_SCENE;
  }
  // Schematic power compression: (au / 1.0)^0.52 * 12.0
  return BASE_EARTH_RADIUS_SCENE * Math.pow(au, 0.52);
}

/**
 * Compute real heliocentric positions for all major solar system bodies at a given date.
 */
export function computeSolarSystemPositions(
  date: Date,
  scaleMode: ScaleMode = "schematic"
): Record<PlanetKey, PlanetPosition3D> {
  const rotEqToEcl = Rotation_EQJ_ECL();
  const result: Partial<Record<PlanetKey, PlanetPosition3D>> = {};

  // 1. Sun at origin
  result.sun = {
    key: "sun",
    name: "SUN",
    distanceAU: 0,
    rawVectorAU: { x: 0, y: 0, z: 0 },
    scenePosition: [0, 0, 0],
    color: PLANET_COLORS.sun,
    visualRadius: PLANET_VISUAL_RADII.sun,
    orbitalPeriodDays: 0,
  };

  // 2. Earth position (needed for Moon and SPHEREx)
  const earthEqVector = HelioVector(Body.Earth, date);
  const earthEclVector = RotateVector(rotEqToEcl, earthEqVector);
  const earthDistAU = Math.hypot(earthEclVector.x, earthEclVector.y, earthEclVector.z);
  const earthSceneR = scaleDistance(earthDistAU, scaleMode);
  const earthUnit = earthDistAU > 0 ? 1 / earthDistAU : 0;
  const earthScenePos: [number, number, number] = [
    earthEclVector.x * earthUnit * earthSceneR,
    earthEclVector.z * earthUnit * earthSceneR, // Z in ecliptic -> Y in Three.js (height above orbital plane)
    earthEclVector.y * earthUnit * earthSceneR, // Y in ecliptic -> Z in Three.js
  ];

  result.earth = {
    key: "earth",
    name: "EARTH",
    distanceAU: earthDistAU,
    rawVectorAU: { x: earthEclVector.x, y: earthEclVector.y, z: earthEclVector.z },
    scenePosition: earthScenePos,
    color: PLANET_COLORS.earth,
    visualRadius: PLANET_VISUAL_RADII.earth,
    orbitalPeriodDays: PLANET_ORBITAL_PERIODS_DAYS.earth,
  };

  // 3. Moon (geocentric vector relative to Earth)
  // GeoVector takes aberration = false for geometric position
  const moonGeoEq = GeoVector(Body.Moon, date, false);
  const moonGeoEcl = RotateVector(rotEqToEcl, moonGeoEq);
  // Scale Moon distance visually so it doesn't collide with Earth's mesh
  const moonVisualOffsetR = scaleMode === "true" ? 0.9 : 1.35;
  const moonDistGeo = Math.hypot(moonGeoEcl.x, moonGeoEcl.y, moonGeoEcl.z);
  const moonUnit = moonDistGeo > 0 ? 1 / moonDistGeo : 0;
  const moonScenePos: [number, number, number] = [
    earthScenePos[0] + moonGeoEcl.x * moonUnit * moonVisualOffsetR,
    earthScenePos[1] + moonGeoEcl.z * moonUnit * moonVisualOffsetR,
    earthScenePos[2] + moonGeoEcl.y * moonUnit * moonVisualOffsetR,
  ];

  result.moon = {
    key: "moon",
    name: "MOON",
    distanceAU: earthDistAU, // Heliocentric distance approximately equals Earth's
    rawVectorAU: {
      x: earthEclVector.x + moonGeoEcl.x,
      y: earthEclVector.y + moonGeoEcl.y,
      z: earthEclVector.z + moonGeoEcl.z,
    },
    scenePosition: moonScenePos,
    color: PLANET_COLORS.moon,
    visualRadius: PLANET_VISUAL_RADII.moon,
    orbitalPeriodDays: PLANET_ORBITAL_PERIODS_DAYS.moon,
  };

  // 4. Remaining planets
  const otherBodies: Exclude<PlanetKey, "sun" | "earth" | "moon">[] = [
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ];

  for (const pKey of otherBodies) {
    const bodyEnum = PLANET_BODY_MAP[pKey];
    const eqVec = HelioVector(bodyEnum, date);
    const eclVec = RotateVector(rotEqToEcl, eqVec);
    const distAU = Math.hypot(eclVec.x, eclVec.y, eclVec.z);
    const sceneR = scaleDistance(distAU, scaleMode);
    const unit = distAU > 0 ? 1 / distAU : 0;

    result[pKey] = {
      key: pKey,
      name: pKey.toUpperCase(),
      distanceAU: distAU,
      rawVectorAU: { x: eclVec.x, y: eclVec.y, z: eclVec.z },
      scenePosition: [
        eclVec.x * unit * sceneR,
        eclVec.z * unit * sceneR,
        eclVec.y * unit * sceneR,
      ],
      color: PLANET_COLORS[pKey],
      visualRadius: PLANET_VISUAL_RADII[pKey],
      orbitalPeriodDays: PLANET_ORBITAL_PERIODS_DAYS[pKey],
    };
  }

  return result as Record<PlanetKey, PlanetPosition3D>;
}

/**
 * Sample a closed orbital trajectory curve for a given planetary body over one period.
 */
export function computeOrbitSamples(
  bodyKey: Exclude<PlanetKey, "sun" | "moon">,
  baseDate: Date,
  scaleMode: ScaleMode = "schematic",
  samples = 128
): [number, number, number][] {
  const rotEqToEcl = Rotation_EQJ_ECL();
  const bodyEnum = PLANET_BODY_MAP[bodyKey];
  const periodDays = PLANET_ORBITAL_PERIODS_DAYS[bodyKey];
  const points: [number, number, number][] = [];

  const baseMs = baseDate.getTime();
  const stepMs = (periodDays * 86400 * 1000) / samples;

  for (let i = 0; i <= samples; i++) {
    const sampleDate = new Date(baseMs + i * stepMs);
    const eqVec = HelioVector(bodyEnum, sampleDate);
    const eclVec = RotateVector(rotEqToEcl, eqVec);
    const distAU = Math.hypot(eclVec.x, eclVec.y, eclVec.z);
    const sceneR = scaleDistance(distAU, scaleMode);
    const unit = distAU > 0 ? 1 / distAU : 0;

    points.push([
      eclVec.x * unit * sceneR,
      eclVec.z * unit * sceneR,
      eclVec.y * unit * sceneR,
    ]);
  }

  return points;
}

/**
 * Convert ICRS / Equatorial J2000 (RA, Dec) coordinates into a 3D Three.js unit vector
 * aligned with the scene's Ecliptic coordinate frame.
 *
 * Math:
 * v_eq = [cos(dec) * cos(ra), cos(dec) * sin(ra), sin(dec)]
 * v_ecl = R_{EQJ -> ECL} * v_eq
 * Three.js scene mapping: X = v_ecl.x, Y = v_ecl.z (ecliptic pole), Z = v_ecl.y
 */
export function raDecToSceneVector(
  raDeg: number,
  decDeg: number,
  radius = 1.0
): [number, number, number] {
  const rotEqToEcl = Rotation_EQJ_ECL();
  const raRad = (raDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  const cosDec = Math.cos(decRad);
  const sinDec = Math.sin(decRad);
  const cosRa = Math.cos(raRad);
  const sinRa = Math.sin(raRad);

  const eqVector = new Vector(cosDec * cosRa, cosDec * sinRa, sinDec, new AstroTime(new Date()));
  const eclVector = RotateVector(rotEqToEcl, eqVector);

  return [eclVector.x * radius, eclVector.z * radius, eclVector.y * radius];
}

/**
 * Procedural Asteroid Main Belt particles generator.
 * Positioned between 2.2 AU and 3.2 AU (schematic particle ring).
 */
export function generateAsteroidBeltParticles(
  count = 1800,
  scaleMode: ScaleMode = "schematic"
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Semi-major axis between 2.2 and 3.2 AU
    const semiMajorAU = 2.2 + Math.random() * 1.0;
    const sceneR = scaleDistance(semiMajorAU, scaleMode);

    // Random azimuth angle around the Sun
    const theta = Math.random() * Math.PI * 2;
    // Slight random dispersion in radius (+/- 4%) and inclination (+/- 0.6 scene units)
    const r = sceneR * (0.96 + Math.random() * 0.08);
    const y = (Math.random() - 0.5) * 1.2;

    positions[i * 3 + 0] = Math.cos(theta) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * r;
  }

  return positions;
}

