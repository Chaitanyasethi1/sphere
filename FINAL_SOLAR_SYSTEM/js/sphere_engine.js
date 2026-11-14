/**
 * SPHEREx Sky Diary - Core Algorithmic & Functional Engine
 * Transferred and adapted from the SPHERE project for SOL integration.
 *
 * Implements:
 * 1. Astrometric Coordinate Engine (decimal, sexagesimal HMS/DMS, colon parsing, formatting)
 * 2. Kinematics & Motion Engine (proper motion rates, position angles, compass conversion)
 * 3. 102-Channel Spectrophotometry (SED) Engine (Bands 1-6, feature identification, CSV export)
 * 4. Multi-Epoch Blink Comparator & Cadence Controller
 * 5. Astronomical Target Database & SESAME Name Resolver
 * 6. Candidates Catalog Management & Filter/Search Engine
 * 7. 3D Celestial Coordinate & Orbit Mapping
 */

(function (window) {
  'use strict';

  const SphereEngine = {};

  // ── 1. Astrometric & Coordinate Engine ───────────────────────────────────────

  /**
   * Parses celestial coordinate strings in various formats:
   * - Decimal degrees: "269.4520, +66.5610" or "133.7951 -7.2452"
   * - Sexagesimal HMS & DMS: "08h55m10.83s, -07d14m42.5s"
   * - Sexagesimal Colon notation: "08:55:10.83, -07:14:42.53"
   */
  SphereEngine.parseCoordinates = function (rawInput) {
    if (!rawInput || !rawInput.trim()) {
      throw new Error("Coordinate string is empty.");
    }
    const input = rawInput.trim();

    // 1. Sexagesimal HMS & DMS (e.g. 08h55m10.83s, -07d14m42.5s)
    const hmsDmsRegex = /^(\d{1,2})h\s*(\d{1,2})m\s*([\d.]+)s[,\s]+([+-]?\d{1,2})d\s*(\d{1,2})m\s*([\d.]+)s$/i;
    const hmsMatch = input.match(hmsDmsRegex);
    if (hmsMatch) {
      const [, h, m, s, decDStr, decM, decS] = hmsMatch;
      const raHours = parseFloat(h) + parseFloat(m) / 60 + parseFloat(s) / 3600;
      const ra = raHours * 15.0;
      const isNeg = decDStr.startsWith('-');
      const absD = Math.abs(parseFloat(decDStr));
      const decVal = absD + parseFloat(decM) / 60 + parseFloat(decS) / 3600;
      const dec = isNeg ? -decVal : decVal;
      SphereEngine.validateBounds(ra, dec);
      return { ra, dec, format: "sexagesimal-hms" };
    }

    // 2. Colon notation (e.g. 08:55:10.83, -07:14:42.53)
    const colonRegex = /^(\d{1,2}):(\d{1,2}):([\d.]+)[,\s]+([+-]?\d{1,2}):(\d{1,2}):([\d.]+)$/;
    const colonMatch = input.match(colonRegex);
    if (colonMatch) {
      const [, h, m, s, decDStr, decM, decS] = colonMatch;
      const raHours = parseFloat(h) + parseFloat(m) / 60 + parseFloat(s) / 3600;
      const ra = raHours * 15.0;
      const isNeg = decDStr.startsWith('-');
      const absD = Math.abs(parseFloat(decDStr));
      const decVal = absD + parseFloat(decM) / 60 + parseFloat(decS) / 3600;
      const dec = isNeg ? -decVal : decVal;
      SphereEngine.validateBounds(ra, dec);
      return { ra, dec, format: "sexagesimal-colon" };
    }

    // 3. Decimal degrees
    const decimalParts = input.split(/[,\s]+/).filter(Boolean);
    if (decimalParts.length === 2) {
      const ra = parseFloat(decimalParts[0]);
      const dec = parseFloat(decimalParts[1]);
      if (!isNaN(ra) && !isNaN(dec)) {
        SphereEngine.validateBounds(ra, dec);
        return { ra, dec, format: "decimal" };
      }
    }

    throw new Error(`Unrecognized coordinate format: "${input}"`);
  };

  SphereEngine.validateBounds = function (ra, dec) {
    if (ra < 0 || ra > 360) {
      throw new Error(`Right Ascension (${ra}°) is out of bounds [0, 360].`);
    }
    if (dec < -90 || dec > 90) {
      throw new Error(`Declination (${dec}°) is out of bounds [-90, +90].`);
    }
  };

  SphereEngine.formatDecimalCoordinates = function (ra, dec, precision = 4) {
    const decSign = dec >= 0 ? `+${dec.toFixed(precision)}` : dec.toFixed(precision);
    return `${ra.toFixed(precision)}° ${decSign}°`;
  };

  SphereEngine.formatSexagesimal = function (ra, dec) {
    const normRa = ((ra % 360) + 360) % 360;
    const totalHours = normRa / 15.0;
    const h = Math.floor(totalHours);
    const remM = (totalHours - h) * 60;
    const m = Math.floor(remM);
    const s = (remM - m) * 60;

    const isNeg = dec < 0;
    const absDec = Math.abs(dec);
    const d = Math.floor(absDec);
    const decRemM = (absDec - d) * 60;
    const dm = Math.floor(decRemM);
    const ds = (decRemM - dm) * 60;
    const sign = isNeg ? '-' : '+';

    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${s.toFixed(2).padStart(5, '0')}s, ${sign}${String(d).padStart(2, '0')}d ${String(dm).padStart(2, '0')}m ${ds.toFixed(2).padStart(5, '0')}s`;
  };

  SphereEngine.formatSexagesimalCoords = function (raDeg, decDeg) {
    const normRa = ((raDeg % 360) + 360) % 360;
    const totalRaHours = normRa / 15.0;
    const raH = Math.floor(totalRaHours);
    const raRemM = (totalRaHours - raH) * 60;
    const raM = Math.floor(raRemM);
    const raS = (raRemM - raM) * 60;
    const raStr = `${String(raH).padStart(2, '0')}h ${String(raM).padStart(2, '0')}m ${raS.toFixed(2).padStart(5, '0')}s`;

    const isNegative = decDeg < 0;
    const absDec = Math.abs(decDeg);
    const decD = Math.floor(absDec);
    const decRemM = (absDec - decD) * 60;
    const decM = Math.floor(decRemM);
    const decS = (decRemM - decM) * 60;
    const sign = isNegative ? '-' : '+';
    const decStr = `${sign}${String(decD).padStart(2, '0')}° ${String(decM).padStart(2, '0')}' ${decS.toFixed(2).padStart(5, '0')}"`;

    return {
      ra: raStr,
      dec: decStr,
      combined: `${raStr}, ${decStr}`
    };
  };

  // ── 2. Kinematics & Proper Motion Engine ────────────────────────────────────

  SphereEngine.computeTotalRate = function (raRate, decRate, decDeg, isProjected = true) {
    if (raRate === 0 && decRate === 0) return 0;
    let projRa = raRate;
    if (!isProjected && decDeg !== undefined) {
      const cosDec = Math.cos((decDeg * Math.PI) / 180);
      projRa = raRate * cosDec;
    }
    return Math.hypot(projRa, decRate);
  };

  SphereEngine.computePositionAngle = function (raRate, decRate) {
    if (raRate === 0 && decRate === 0) return 0;
    let deg = (Math.atan2(raRate, decRate) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  };

  SphereEngine.positionAngleToCompass = function (paDeg) {
    const norm = ((paDeg % 360) + 360) % 360;
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(norm / 45) % 8;
    return directions[index];
  };

  // ── 3. 102-Channel Spectrophotometry (SED) Engine ──────────────────────────

  SphereEngine.SPHEREX_BANDS = [
    { band: 1, minWl: 0.75, maxWl: 1.11, channels: 16, label: "Band 1 (0.75-1.11 um)" },
    { band: 2, minWl: 1.11, maxWl: 1.64, channels: 17, label: "Band 2 (1.11-1.64 um)" },
    { band: 3, minWl: 1.64, maxWl: 2.42, channels: 17, label: "Band 3 (1.64-2.42 um)" },
    { band: 4, minWl: 2.42, maxWl: 3.82, channels: 17, label: "Band 4 (2.42-3.82 um)" },
    { band: 5, minWl: 3.82, maxWl: 4.42, channels: 17, label: "Band 5 (3.82-4.42 um)" },
    { band: 6, minWl: 4.42, maxWl: 5.00, channels: 18, label: "Band 6 (4.42-5.00 um)" }
  ];

  SphereEngine.detectSpectralFeatures = function (wavelengths, fluxes) {
    const features = [];
    if (!wavelengths || !fluxes || wavelengths.length === 0) return features;

    // Check for Water Ice Absorption Dips at ~1.5 um and ~2.0 um
    for (let i = 1; i < wavelengths.length - 1; i++) {
      const wl = wavelengths[i];
      const fl = fluxes[i];
      const prevFl = fluxes[i - 1];
      const nextFl = fluxes[i + 1];

      if (Math.abs(wl - 1.50) < 0.08 && fl < prevFl && fl < nextFl) {
        features.push({ name: "H2O Ice (1.5 um)", wavelength: wl, type: "absorption" });
      }
      if (Math.abs(wl - 2.02) < 0.08 && fl < prevFl && fl < nextFl) {
        features.push({ name: "H2O Ice (2.0 um)", wavelength: wl, type: "absorption" });
      }
      if (Math.abs(wl - 4.26) < 0.08 && fl < prevFl && fl < nextFl) {
        features.push({ name: "CO2 Ice (4.26 um)", wavelength: wl, type: "absorption" });
      }
    }
    return features;
  };

  SphereEngine.exportSpectrumCsv = function (mover) {
    if (!mover || !mover.spectrum) return;
    const spectrum = mover.spectrum;
    const wls = spectrum.wavelength_um || [];
    const fls = spectrum.flux || spectrum.flux_mjy || [];
    const errs = spectrum.flux_err || spectrum.flux_err_mjy || [];

    const lines = [];
    lines.push("# SPHEREx Sky Diary - Spectrophotometric SED (102-channel)");
    lines.push(`# Target Object: ${mover.object_id}`);
    if (mover.match_name) lines.push(`# Catalog Match: ${mover.match_name}`);
    lines.push(`# Classification: ${mover.type}`);
    if (mover.is_synthetic) {
      lines.push("# NOTE: TEST DATA - Synthesized spectrum for pipeline verification only");
    }
    lines.push("wavelength_um,flux_mjy,flux_err_mjy");

    const n = Math.min(wls.length, fls.length);
    for (let i = 0; i < n; i++) {
      const w = wls[i] !== undefined ? Number(wls[i]).toFixed(4) : "0.0000";
      const f = fls[i] !== undefined ? Number(fls[i]).toFixed(4) : "0.0000";
      const e = (errs[i] !== undefined && errs[i] !== null) ? Number(errs[i]).toFixed(4) : "0.0000";
      lines.push(`${w},${f},${e}`);
    }

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${mover.object_id}_102ch_spectrum.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── 4. Astronomical Challenge Targets Database ──────────────────────────────

  SphereEngine.CHALLENGE_TARGETS = [
    {
      id: "barnards-star",
      name: "Barnard's Star",
      category: "High Proper Motion",
      ra: 269.4520,
      dec: 4.6933,
      properMotion: "10.3 arcsec/yr",
      description: "Fastest apparent proper motion star in Earth's sky. Ideal baseline calibration for SPHEREx epoch differencing.",
      distanceLy: "5.96 ly",
      spectralType: "M4.0V"
    },
    {
      id: "epsilon-indi-b",
      name: "Epsilon Indi B",
      category: "Cold Brown Dwarf",
      ra: 330.8402,
      dec: -56.7861,
      properMotion: "4.7 arcsec/yr",
      description: "Cold binary brown dwarf system (T1 + T6). Strong methane and water vapor absorption across SPHEREx Bands 2-4.",
      distanceLy: "11.87 ly",
      spectralType: "T1 + T6"
    },
    {
      id: "wise-0855",
      name: "WISE 0855-0714",
      category: "Sub-Stellar Object",
      ra: 133.7951,
      dec: -7.2452,
      properMotion: "8.1 arcsec/yr",
      description: "Coldest known sub-stellar object (250 K) with putative water-ice clouds. Key analog for Planet X atmospheric modeling.",
      distanceLy: "7.27 ly",
      spectralType: "Y2"
    },
    {
      id: "rw-aurigae",
      name: "RW Aurigae",
      category: "Variable / Circumstellar",
      ra: 77.0655,
      dec: 30.4014,
      properMotion: "0.02 arcsec/yr",
      description: "Classical T Tauri binary exhibiting dramatic dimming events and circumstellar accretion dust emission.",
      distanceLy: "530 ly",
      spectralType: "K3:e"
    },
    {
      id: "r-draconis",
      name: "R Draconis",
      category: "Pulsating Variable",
      ra: 247.5583,
      dec: 66.7028,
      properMotion: "0.03 arcsec/yr",
      description: "Mira-type pulsating red giant with 245-day photometric cycle and prominent CO/H2O molecular bands.",
      distanceLy: "2,100 ly",
      spectralType: "M7e"
    }
  ];

  SphereEngine.resolveTarget = function (query) {
    if (!query) return null;
    const q = query.trim().toLowerCase();

    // 1. Direct match with challenge targets
    for (const t of SphereEngine.CHALLENGE_TARGETS) {
      if (t.id.toLowerCase() === q || t.name.toLowerCase().includes(q)) {
        return {
          type: "target",
          data: t,
          ra: t.ra,
          dec: t.dec,
          label: t.name
        };
      }
    }

    // 2. Direct match with candidate movers
    if (SphereEngine.candidates && SphereEngine.candidates.movers) {
      for (const m of SphereEngine.candidates.movers) {
        if (m.object_id.toLowerCase() === q || (m.match_name && m.match_name.toLowerCase().includes(q))) {
          return {
            type: "mover",
            data: m,
            ra: m.ra,
            dec: m.dec,
            label: m.match_name ? `${m.object_id} (${m.match_name})` : m.object_id
          };
        }
      }
    }

    // 3. Try coordinate parsing
    try {
      const coords = SphereEngine.parseCoordinates(query);
      return {
        type: "coords",
        data: coords,
        ra: coords.ra,
        dec: coords.dec,
        label: SphereEngine.formatDecimalCoordinates(coords.ra, coords.dec)
      };
    } catch (e) {
      return null;
    }
  };

  // ── 5. Candidates Catalog Manager ──────────────────────────────────────────

  SphereEngine.candidates = null;

  SphereEngine.loadCandidates = async function (url = 'data/candidates.json') {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching candidates`);
      const data = await res.json();
      SphereEngine.candidates = data;
      return data;
    } catch (err) {
      console.warn("Failed to load candidates.json from primary URL, trying fallback:", err);
      try {
        const fallbackRes = await fetch('demo/candidates.json');
        const fallbackData = await fallbackRes.json();
        SphereEngine.candidates = fallbackData;
        return fallbackData;
      } catch (fallbackErr) {
        console.error("Critical: Could not load candidate catalog:", fallbackErr);
        return null;
      }
    }
  };

  // ── 6. 3D Celestial Sphere & Coordinate Mapping ─────────────────────────────

  /**
   * Converts RA/Dec (degrees) into Three.js Cartesian Vector on a celestial sphere of given radius.
   * Coordinate convention matching SOL's ecliptic plane:
   * x = r * cos(Dec) * cos(RA)
   * y = r * sin(Dec)
   * z = -r * cos(Dec) * sin(RA)
   */
  SphereEngine.raDecToVector3 = function (raDeg, decDeg, radius = 500) {
    const raRad = (raDeg * Math.PI) / 180;
    const decRad = (decDeg * Math.PI) / 180;
    const cosDec = Math.cos(decRad);

    const x = radius * cosDec * Math.cos(raRad);
    const y = radius * Math.sin(decRad);
    const z = -radius * cosDec * Math.sin(raRad);

    return { x, y, z };
  };

  window.SphereEngine = SphereEngine;
})(window);
