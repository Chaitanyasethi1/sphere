/**
 * SPHEREx & SOL Date-to-Date Timelapse Simulation Engine
 * Allows users to select ANY astronomical object (planets, moons, dwarf planets,
 * comets, spacecraft/probes, and SPHEREx candidate movers) and simulate its motion
 * over an arbitrary custom date/time range.
 */

(function (window) {
  'use strict';

  const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
  const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

  const TimelapseEngine = {
    active: false,
    paused: false,
    targetType: 'planet',
    targetObj: null,
    targetName: 'EARTH',
    startSimT: 20.0, // 2020
    endSimT: 30.0,   // 2030
    currentSimT: 20.0,
    speedMultiplier: 100000, // default ~10 days/sec
    trailGeometry: null,
    trailLine: null,
    trailPoints: [],
    maxTrailPoints: 1200,
    loop: false,
    onProgress: null,
    onComplete: null,
    animationFrameId: null,
    lastFrameTime: 0
  };

  /**
   * Convert JavaScript Date to Simulation Time (years since J2000).
   */
  TimelapseEngine.dateToSimTime = function (date) {
    const ms = date.getTime();
    return (ms - J2000_MS) / MS_PER_YEAR;
  };

  /**
   * Convert Simulation Time (years since J2000) to JavaScript Date.
   */
  TimelapseEngine.simTimeToDate = function (simT) {
    const ms = J2000_MS + simT * MS_PER_YEAR;
    return new Date(ms);
  };

  /**
   * Format a Date into ISO date-time string suitable for input[type="datetime-local"].
   */
  TimelapseEngine.formatDatetimeLocal = function (date) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const hh = pad(date.getUTCHours());
    const mm = pad(date.getUTCMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  /**
   * Format date into readable NASA telemetry string: "NOV 14, 2026 10:00:00 UTC"
   */
  TimelapseEngine.formatDisplayDate = function (date) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const pad = (n) => String(n).padStart(2, '0');
    const mon = months[date.getUTCMonth()] || 'JAN';
    const d = pad(date.getUTCDate());
    const yr = date.getUTCFullYear();
    const hh = pad(date.getUTCHours());
    const mm = pad(date.getUTCMinutes());
    const ss = pad(date.getUTCSeconds());
    return `${mon} ${d}, ${yr} ${hh}:${mm}:${ss} UTC`;
  };

  /**
   * Start a Date-to-Date Timelapse Simulation.
   * @param {Object} options
   * - targetType: 'planet' | 'moon' | 'dwarf' | 'comet' | 'probe' | 'mover' | 'sun'
   * - targetObj: object reference from sol
   * - targetName: string display name
   * - startDate: Date
   * - endDate: Date
   * - speedMultiplier: number (1x, 10x, 100x, 1000x, 10000x, 100000x, 1000000x)
   * - loop: boolean
   * - drawTrail: boolean
   */
  TimelapseEngine.start = function (options) {
    const sol = window.SOL_APP;
    if (!sol) return false;

    // Validate dates
    const startT = TimelapseEngine.dateToSimTime(options.startDate);
    const endT = TimelapseEngine.dateToSimTime(options.endDate);

    if (isNaN(startT) || isNaN(endT)) {
      throw new Error("Invalid start or end date.");
    }
    if (endT <= startT) {
      throw new Error("End date must be chronologically after the start date.");
    }

    TimelapseEngine.active = true;
    TimelapseEngine.paused = false;
    TimelapseEngine.targetType = options.targetType || 'planet';
    TimelapseEngine.targetObj = options.targetObj || null;
    TimelapseEngine.targetName = options.targetName || 'TARGET';
    TimelapseEngine.startSimT = startT;
    TimelapseEngine.endSimT = endT;
    TimelapseEngine.currentSimT = startT;
    TimelapseEngine.speedMultiplier = options.speedMultiplier || 100000;
    TimelapseEngine.loop = !!options.loop;
    TimelapseEngine.onProgress = options.onProgress || null;
    TimelapseEngine.onComplete = options.onComplete || null;

    // Set solar system simulation time to start date
    sol.setSimTime(startT);
    sol.setPaused(false);

    // Focus on the object if available
    if (options.targetObj && sol.focusObject) {
      sol.focusObject(options.targetType, options.targetObj);
    }

    // Initialize 3D Trajectory Trail if enabled
    TimelapseEngine.clearTrail();
    if (options.drawTrail !== false) {
      TimelapseEngine.initTrail();
    }

    TimelapseEngine.lastFrameTime = performance.now();
    if (TimelapseEngine.animationFrameId) {
      cancelAnimationFrame(TimelapseEngine.animationFrameId);
    }
    TimelapseEngine.runLoop();

    return true;
  };

  /**
   * Main simulation frame tick loop.
   */
  TimelapseEngine.runLoop = function () {
    if (!TimelapseEngine.active) return;

    const sol = window.SOL_APP;
    const now = performance.now();
    const dtMs = Math.min(now - TimelapseEngine.lastFrameTime, 100);
    TimelapseEngine.lastFrameTime = now;

    if (!TimelapseEngine.paused && sol) {
      // 1 day = 1 / 365.25 years
      // speedMultiplier: e.g. 100,000x means 1 real second = 100,000 simulation seconds (~1.15 days)
      const simSecondsPerRealSecond = TimelapseEngine.speedMultiplier;
      const simYearsPerRealSecond = simSecondsPerRealSecond / (365.25 * 86400);
      const deltaSimT = (dtMs / 1000.0) * simYearsPerRealSecond;

      TimelapseEngine.currentSimT += deltaSimT;

      // Update simulation time in SOL engine
      sol.setSimTime(TimelapseEngine.currentSimT);

      // Record 3D position into trajectory trail
      TimelapseEngine.recordTrailPoint();

      // Check for completion
      if (TimelapseEngine.currentSimT >= TimelapseEngine.endSimT) {
        if (TimelapseEngine.loop) {
          TimelapseEngine.currentSimT = TimelapseEngine.startSimT;
          sol.setSimTime(TimelapseEngine.startSimT);
          TimelapseEngine.clearTrail();
          TimelapseEngine.initTrail();
        } else {
          TimelapseEngine.currentSimT = TimelapseEngine.endSimT;
          sol.setSimTime(TimelapseEngine.endSimT);
          TimelapseEngine.active = false;
          sol.setPaused(true);
          if (TimelapseEngine.onComplete) {
            TimelapseEngine.onComplete({
              targetName: TimelapseEngine.targetName,
              startDate: TimelapseEngine.simTimeToDate(TimelapseEngine.startSimT),
              endDate: TimelapseEngine.simTimeToDate(TimelapseEngine.endSimT),
              pointsCount: TimelapseEngine.trailPoints.length
            });
          }
          return;
        }
      }

      // Progress callback
      if (TimelapseEngine.onProgress) {
        const totalDuration = TimelapseEngine.endSimT - TimelapseEngine.startSimT;
        const elapsed = TimelapseEngine.currentSimT - TimelapseEngine.startSimT;
        const progressRatio = Math.max(0, Math.min(1, elapsed / totalDuration));
        TimelapseEngine.onProgress({
          progressRatio,
          currentDate: TimelapseEngine.simTimeToDate(TimelapseEngine.currentSimT),
          currentSimT: TimelapseEngine.currentSimT
        });
      }
    }

    TimelapseEngine.animationFrameId = requestAnimationFrame(TimelapseEngine.runLoop);
  };

  TimelapseEngine.pause = function () {
    TimelapseEngine.paused = true;
    if (window.SOL_APP) window.SOL_APP.setPaused(true);
  };

  TimelapseEngine.resume = function () {
    TimelapseEngine.paused = false;
    TimelapseEngine.lastFrameTime = performance.now();
    if (window.SOL_APP) window.SOL_APP.setPaused(false);
  };

  TimelapseEngine.stop = function () {
    TimelapseEngine.active = false;
    TimelapseEngine.paused = false;
    if (TimelapseEngine.animationFrameId) {
      cancelAnimationFrame(TimelapseEngine.animationFrameId);
      TimelapseEngine.animationFrameId = null;
    }
    TimelapseEngine.clearTrail();
  };

  TimelapseEngine.reset = function () {
    TimelapseEngine.stop();
    if (window.SOL_APP) {
      window.SOL_APP.setSimTime(TimelapseEngine.startSimT);
      window.SOL_APP.setPaused(true);
    }
  };

  TimelapseEngine.setSpeed = function (multiplier) {
    TimelapseEngine.speedMultiplier = Math.max(1, multiplier);
  };

  TimelapseEngine.scrubToRatio = function (ratio) {
    const total = TimelapseEngine.endSimT - TimelapseEngine.startSimT;
    TimelapseEngine.currentSimT = TimelapseEngine.startSimT + Math.max(0, Math.min(1, ratio)) * total;
    if (window.SOL_APP) {
      window.SOL_APP.setSimTime(TimelapseEngine.currentSimT);
    }
  };

  // ── Trajectory Trail Drawing ──────────────────────────────────────────────
  TimelapseEngine.initTrail = function () {
    const sol = window.SOL_APP;
    if (!sol || !sol.scene) return;

    TimelapseEngine.clearTrail();
    TimelapseEngine.trailPoints = [];

    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      color: 0x22D3EE,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });
    const line = new THREE.Line(geom, mat);
    line.name = "timelapse-trail";
    sol.scene.add(line);

    TimelapseEngine.trailGeometry = geom;
    TimelapseEngine.trailLine = line;
  };

  TimelapseEngine.recordTrailPoint = function () {
    const sol = window.SOL_APP;
    if (!sol || !TimelapseEngine.trailLine || !TimelapseEngine.targetObj) return;

    let targetMesh = null;
    const obj = TimelapseEngine.targetObj;
    if (obj.mesh) targetMesh = obj.mesh;
    else if (obj.moonMesh) targetMesh = obj.moonMesh;
    else if (obj.nucleus) targetMesh = obj.nucleus;

    if (!targetMesh) return;

    const wpos = new THREE.Vector3();
    targetMesh.getWorldPosition(wpos);

    // Only append if moved significantly
    const len = TimelapseEngine.trailPoints.length;
    if (len > 0) {
      const lastP = TimelapseEngine.trailPoints[len - 1];
      if (lastP.distanceTo(wpos) < 0.25) return;
    }

    TimelapseEngine.trailPoints.push(wpos.clone());
    if (TimelapseEngine.trailPoints.length > TimelapseEngine.maxTrailPoints) {
      TimelapseEngine.trailPoints.shift();
    }

    const positions = new Float32Array(TimelapseEngine.trailPoints.length * 3);
    for (let i = 0; i < TimelapseEngine.trailPoints.length; i++) {
      const p = TimelapseEngine.trailPoints[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    TimelapseEngine.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    TimelapseEngine.trailGeometry.attributes.position.needsUpdate = true;
  };

  TimelapseEngine.clearTrail = function () {
    const sol = window.SOL_APP;
    if (sol && sol.scene && TimelapseEngine.trailLine) {
      sol.scene.remove(TimelapseEngine.trailLine);
      if (TimelapseEngine.trailGeometry) TimelapseEngine.trailGeometry.dispose();
      TimelapseEngine.trailLine = null;
      TimelapseEngine.trailGeometry = null;
    }
    TimelapseEngine.trailPoints = [];
  };

  window.TimelapseEngine = TimelapseEngine;
})(window);
