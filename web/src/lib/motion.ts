/**
 * SPHEREx Sky Diary - Motion and Astrometric Calculations.
 */

/**
 * Computes the total apparent motion rate (proper motion) in arcsec/day.
 * By default, raRate is assumed to be already projected by cos(dec) (i.e. mu_alpha*).
 */
export function computeTotalRate(
  raRate: number,
  decRate: number,
  decDeg?: number,
  isProjected: boolean = true
): number {
  if (raRate === 0 && decRate === 0) return 0;
  let projRa = raRate;
  if (!isProjected && decDeg !== undefined) {
    const cosDec = Math.cos((decDeg * Math.PI) / 180);
    projRa = raRate * cosDec;
  }
  return Math.hypot(projRa, decRate);
}

/**
 * Computes position angle (PA) of motion in degrees measured East of North (0..360).
 * 0° = North (+Dec), 90° = East (+RA), 180° = South (-Dec), 270° = West (-RA).
 */
export function computePositionAngle(raRate: number, decRate: number): number {
  if (raRate === 0 && decRate === 0) return 0;
  let deg = (Math.atan2(raRate, decRate) * 180) / Math.PI;
  if (deg < 0) {
    deg += 360;
  }
  return deg;
}

/**
 * Converts a position angle (0..360) into standard 8-point compass notation (N, NE, E, SE, S, SW, W, NW).
 */
export function positionAngleToCompass(paDeg: number): string {
  const norm = ((paDeg % 360) + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(norm / 45) % 8;
  return directions[index];
}

/**
 * Formats celestial (RA, Dec) into sexagesimal strings:
 * RA:  HHh MMm SS.SSs
 * Dec: ±DD° MM' SS.SS"
 */
export function formatSexagesimalCoords(
  raDeg: number,
  decDeg: number
): { ra: string; dec: string; combined: string } {
  // Normalize RA to [0, 360)
  const normRa = ((raDeg % 360) + 360) % 360;
  const totalRaHours = normRa / 15.0;
  const raH = Math.floor(totalRaHours);
  const raRemM = (totalRaHours - raH) * 60;
  const raM = Math.floor(raRemM);
  const raS = (raRemM - raM) * 60;

  const raStr = `${String(raH).padStart(2, "0")}h ${String(raM).padStart(2, "0")}m ${raS.toFixed(2).padStart(5, "0")}s`;

  // Dec
  const isNegative = decDeg < 0;
  const absDec = Math.abs(decDeg);
  const decD = Math.floor(absDec);
  const decRemM = (absDec - decD) * 60;
  const decM = Math.floor(decRemM);
  const decS = (decRemM - decM) * 60;
  const sign = isNegative ? "-" : "+";

  const decStr = `${sign}${String(decD).padStart(2, "0")}° ${String(decM).padStart(2, "0")}' ${decS.toFixed(2).padStart(5, "0")}"`;

  return {
    ra: raStr,
    dec: decStr,
    combined: `${raStr}, ${decStr}`,
  };
}
