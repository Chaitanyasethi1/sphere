import { describe, it, expect } from "vitest";
import {
  computeSolarSystemPositions,
  computeOrbitSamples,
  raDecToSceneVector,
  scaleDistance,
} from "@/lib/solarEphemeris";

describe("Solar System Ephemeris & Coordinate Transformations", () => {
  it("computes physical heliocentric distance for Earth within realistic orbital bounds (0.98 to 1.02 AU)", () => {
    // Test multiple seasons throughout the year 2026
    const dates = [
      new Date("2026-01-03T00:00:00Z"), // Near Perihelion
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-07-04T00:00:00Z"), // Near Aphelion
      new Date("2026-10-01T00:00:00Z"),
    ];

    for (const d of dates) {
      const positions = computeSolarSystemPositions(d, "schematic");
      const earthDist = positions.earth.distanceAU;
      // Earth's perihelion is ~0.983 AU, aphelion is ~1.017 AU
      expect(earthDist).toBeGreaterThan(0.98);
      expect(earthDist).toBeLessThan(1.02);
    }
  });

  it("computes all major planets in correct monotonic average ordering from the Sun", () => {
    const d = new Date("2026-11-14T12:00:00Z");
    const pos = computeSolarSystemPositions(d, "schematic");

    expect(pos.mercury.distanceAU).toBeLessThan(pos.venus.distanceAU);
    expect(pos.venus.distanceAU).toBeLessThan(pos.earth.distanceAU);
    expect(pos.earth.distanceAU).toBeLessThan(pos.mars.distanceAU);
    expect(pos.mars.distanceAU).toBeLessThan(pos.jupiter.distanceAU);
    expect(pos.jupiter.distanceAU).toBeLessThan(pos.saturn.distanceAU);
    expect(pos.saturn.distanceAU).toBeLessThan(pos.uranus.distanceAU);
    expect(pos.uranus.distanceAU).toBeLessThan(pos.neptune.distanceAU);
    expect(pos.neptune.distanceAU).toBeLessThan(pos.pluto.distanceAU);
  });

  it("converts RA/Dec (ICRS) to Scene coordinates with correct ecliptic obliquity", () => {
    // 1. Vernal Equinox (RA 0°, Dec 0°) -> Ecliptic X = 1, Y = 0, Z = 0
    const [x0, y0, z0] = raDecToSceneVector(0, 0, 1.0);
    expect(x0).toBeCloseTo(1.0, 4);
    expect(y0).toBeCloseTo(0.0, 4);
    expect(z0).toBeCloseTo(0.0, 4);

    // 2. RA 360° wraps seamlessly to RA 0°
    const [x360, y360, z360] = raDecToSceneVector(360, 0, 1.0);
    expect(x360).toBeCloseTo(x0, 5);
    expect(y360).toBeCloseTo(y0, 5);
    expect(z360).toBeCloseTo(z0, 5);

    // 3. North Celestial Pole (Dec +90°):
    // In Ecliptic, vector is tilted by obliquity epsilon_0 ~ 23.4393°:
    // Y (scene up / ecliptic normal) = cos(23.4393°) ~ 0.91748
    // Z (scene depth) = sin(23.4393°) ~ 0.39778
    const [xNcp, yNcp, zNcp] = raDecToSceneVector(0, 90, 1.0);
    expect(xNcp).toBeCloseTo(0.0, 4);
    expect(yNcp).toBeCloseTo(0.9175, 3);
    expect(zNcp).toBeCloseTo(0.3978, 3);

    // 4. South Celestial Pole (Dec -90°):
    const [xScp, yScp, zScp] = raDecToSceneVector(0, -90, 1.0);
    expect(xScp).toBeCloseTo(0.0, 4);
    expect(yScp).toBeCloseTo(-0.9175, 3);
    expect(zScp).toBeCloseTo(-0.3978, 3);
  });

  it("generates closed orbital sampling loops that return to the starting point", () => {
    const baseDate = new Date("2026-03-01T00:00:00Z");
    const samples = computeOrbitSamples("earth", baseDate, "schematic", 128);

    expect(samples.length).toBe(129); // 128 segments + 1 closing endpoint
    const firstPoint = samples[0];
    const lastPoint = samples[samples.length - 1];

    // The endpoint after 1 full period must close smoothly on the first point
    const dx = lastPoint[0] - firstPoint[0];
    const dy = lastPoint[1] - firstPoint[1];
    const dz = lastPoint[2] - firstPoint[2];
    const loopClosureError = Math.hypot(dx, dy, dz);

    expect(loopClosureError).toBeLessThan(0.05);
  });

  it("correctly handles scale toggle between schematic compression and true linear AU", () => {
    // Earth at 1.0 AU
    const earthSchematic = scaleDistance(1.0, "schematic");
    const earthTrue = scaleDistance(1.0, "true");
    expect(earthSchematic).toBeCloseTo(12.0, 4);
    expect(earthTrue).toBeCloseTo(12.0, 4);

    // Neptune at ~30.0 AU
    const neptuneSchematic = scaleDistance(30.0, "schematic");
    const neptuneTrue = scaleDistance(30.0, "true");

    // True scale is strictly linear: 30 * 12 = 360
    expect(neptuneTrue).toBeCloseTo(360.0, 1);
    // Schematic compression keeps Neptune accessible around 70 units
    expect(neptuneSchematic).toBeLessThan(100.0);
    expect(neptuneSchematic).toBeGreaterThan(50.0);
  });
});

