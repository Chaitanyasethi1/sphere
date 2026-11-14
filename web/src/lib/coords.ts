/**
 * SPHEREx Sky Diary - Celestial Coordinate Parser & Formatter.
 */

export interface ParsedCoordinates {
  ra: number;   // Right Ascension in degrees [0, 360)
  dec: number;  // Declination in degrees [-90, +90]
  format: "decimal" | "sexagesimal-hms" | "sexagesimal-colon";
}

/**
 * Parses user coordinate input into decimal degrees (J2000).
 * Supports decimal degrees, HMS/DMS, and colon notation.
 */
export function parseCoordinates(rawInput: string): ParsedCoordinates {
  if (!rawInput || !rawInput.trim()) {
    throw new Error("Coordinate string is empty.");
  }

  const input = rawInput.trim();

  // 1. Check for Sexagesimal HMS & DMS (e.g., 08h55m10.831s -07d14m42.53s)
  const hmsDmsRegex = /^(\d{1,2})h\s*(\d{1,2})m\s*([\d.]+)s[,\s]+([+-]?\d{1,2})d\s*(\d{1,2})m\s*([\d.]+)s$/i;
  const hmsMatch = input.match(hmsDmsRegex);
  if (hmsMatch) {
    const [, h, m, s, decDStr, decM, decS] = hmsMatch;
    const raHours = parseFloat(h) + parseFloat(m) / 60 + parseFloat(s) / 3600;
    const ra = raHours * 15.0;

    const isNegative = decDStr.startsWith("-");
    const absD = Math.abs(parseFloat(decDStr));
    const decVal = absD + parseFloat(decM) / 60 + parseFloat(decS) / 3600;
    const dec = isNegative ? -decVal : decVal;

    validateBounds(ra, dec);
    return { ra, dec, format: "sexagesimal-hms" };
  }

  // 2. Check for Sexagesimal Colon Notation (e.g., 08:55:10.831 -07:14:42.53)
  const colonRegex = /^(\d{1,2}):(\d{1,2}):([\d.]+)[,\s]+([+-]?\d{1,2}):(\d{1,2}):([\d.]+)$/;
  const colonMatch = input.match(colonRegex);
  if (colonMatch) {
    const [, h, m, s, decDStr, decM, decS] = colonMatch;
    const raHours = parseFloat(h) + parseFloat(m) / 60 + parseFloat(s) / 3600;
    const ra = raHours * 15.0;

    const isNegative = decDStr.startsWith("-");
    const absD = Math.abs(parseFloat(decDStr));
    const decVal = absD + parseFloat(decM) / 60 + parseFloat(decS) / 3600;
    const dec = isNegative ? -decVal : decVal;

    validateBounds(ra, dec);
    return { ra, dec, format: "sexagesimal-colon" };
  }

  // 3. Decimal Degrees (e.g., 133.7951 -7.2452 or 269.4520, +66.5610)
  const decimalParts = input.split(/[,\s]+/).filter(Boolean);
  if (decimalParts.length === 2) {
    const ra = parseFloat(decimalParts[0]);
    const dec = parseFloat(decimalParts[1]);

    if (!isNaN(ra) && !isNaN(dec)) {
      validateBounds(ra, dec);
      return { ra, dec, format: "decimal" };
    }
  }

  throw new Error(`Unrecognized coordinate format: "${input}"`);
}

function validateBounds(ra: number, dec: number): void {
  if (ra < 0 || ra > 360) {
    throw new Error(`Right Ascension (${ra}°) is out of bounds [0, 360].`);
  }
  if (dec < -90 || dec > 90) {
    throw new Error(`Declination (${dec}°) is out of bounds [-90, +90].`);
  }
}

/**
 * Formats coordinates in decimal notation with degrees symbols.
 */
export function formatDecimalCoordinates(ra: number, dec: number, precision: number = 4): string {
  const decSign = dec >= 0 ? `+${dec.toFixed(precision)}` : dec.toFixed(precision);
  return `${ra.toFixed(precision)}° ${decSign}°`;
}

/**
 * Formats coordinates in compact sexagesimal notation.
 */
export function formatSexagesimal(ra: number, dec: number): string {
  const normRa = ((ra % 360) + 360) % 360;
  const totalHours = normRa / 15.0;
  const h = Math.floor(totalHours);
  const remM = (totalHours - h) * 60;
  const m = Math.floor(remM);
  const s = (remM - m) * 60;

  const isNeg = dec < 0;
  const absDec = Math.abs(dec);
  const dD = Math.floor(absDec);
  const dRemM = (absDec - dD) * 60;
  const dM = Math.floor(dRemM);
  const dS = (dRemM - dM) * 60;
  const sign = isNeg ? "-" : "+";

  const raStr = `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}m${s.toFixed(1).padStart(4, "0")}s`;
  const decStr = `${sign}${String(dD).padStart(2, "0")}d${String(dM).padStart(2, "0")}m${dS.toFixed(1).padStart(4, "0")}s`;

  return `${raStr} ${decStr}`;
}
