/**
 * SPHEREx Sky Diary - SOL 3D UI & Functional Integration Bridge
 * Connects SPHERE's astrometric, spectrophotometric, and discovery modules
 * into SOL's 3D Three.js environment and NASA telemetry user interface.
 */

(function () {
  'use strict';

  // Wait for DOM and SOL_APP to be available
  function initWhenReady() {
    if (typeof window.SOL_APP === 'undefined' || !window.SphereEngine) {
      setTimeout(initWhenReady, 50);
      return;
    }
    initSphereIntegration();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady);
  } else {
    initWhenReady();
  }

  function initSphereIntegration() {
    const sol = window.SOL_APP;
    const scene = sol.scene;
    const camera = sol.camera;
    const renderer = sol.renderer;

    // State
    let candidatesData = null;
    let selectedMover = null;
    let currentInfoTab = 'telemetry';
    let blinkTimer = null;
    let blinkCurrentEpochIdx = 0;
    let blinkRateHz = 2;
    let isBlinking = true;
    let pitchTourActive = false;
    let pitchTourStep = 0;
    let pitchTourTimeout = null;

    // 3D Groups
    const spherexGroup = new THREE.Group();
    spherexGroup.name = "spherex-observatory";
    scene.add(spherexGroup);

    const celestialGridGroup = new THREE.Group();
    celestialGridGroup.name = "celestial-grid";
    celestialGridGroup.visible = false;
    scene.add(celestialGridGroup);

    const fovRaysGroup = new THREE.Group();
    fovRaysGroup.name = "spherex-fov-rays";
    fovRaysGroup.visible = true;
    scene.add(fovRaysGroup);

    const moversGroup = new THREE.Group();
    moversGroup.name = "spherex-movers";
    moversGroup.visible = true;
    scene.add(moversGroup);

    // ── 1. Create SPHEREx Space Observatory 3D Model ────────────────────────
    let spherexMesh = null;
    function buildSpherexObservatory() {
      const busGeom = new THREE.CylinderGeometry(0.22, 0.26, 0.45, 6);
      const busMat = new THREE.MeshStandardMaterial({
        color: 0xCCA040,
        metalness: 0.85,
        roughness: 0.25,
        emissive: 0x221805
      });
      const bus = new THREE.Mesh(busGeom, busMat);

      // Distinctive SPHEREx Thermal Baffle Cone
      const coneGeom = new THREE.ConeGeometry(0.38, 0.55, 16, 1, true);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x99BBDD,
        metalness: 0.6,
        roughness: 0.35,
        side: THREE.DoubleSide
      });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.rotation.x = Math.PI;
      cone.position.y = 0.45;
      bus.add(cone);

      // Telescope Primary Aperture
      const apGeom = new THREE.CircleGeometry(0.18, 16);
      const apMat = new THREE.MeshBasicMaterial({ color: 0x010815 });
      const ap = new THREE.Mesh(apGeom, apMat);
      ap.rotation.x = -Math.PI / 2;
      ap.position.y = 0.22;
      bus.add(ap);

      // Solar Arrays (Twin Blue Panels)
      const panelGeom = new THREE.BoxGeometry(1.2, 0.02, 0.35);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x114488,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x001133
      });
      const panels = new THREE.Mesh(panelGeom, panelMat);
      panels.position.y = -0.1;
      bus.add(panels);

      // Glow beacon
      const beaconGeom = new THREE.SphereGeometry(0.08, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x087EAC });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.y = 0.75;
      bus.add(beacon);

      bus.scale.set(1.5, 1.5, 1.5);
      spherexGroup.add(bus);
      spherexMesh = bus;

      // Click handle for SPHEREx
      bus.userData = {
        type: 'spherex',
        name: 'SPHEREx Observatory',
        obj: {
          d: {
            name: 'SPHEREx',
            diameter: '1.2 m × 1.8 m',
            dist: '700 km (Sun-Sync LEO)',
            year: '98.8 min',
            moons: '6 bands (102 ch)',
            type: 'NASA Spectrophotometer',
            orbitSpeed: '7.5 km/s'
          }
        }
      };
    }
    buildSpherexObservatory();

    // ── 1b. Create NEOSSat Spacecraft 3D Model (CSA / DRDC) ─────────────────
    const neossatGroup = new THREE.Group();
    neossatGroup.name = "neossat-satellite";
    scene.add(neossatGroup);

    let neossatMesh = null;
    function buildNeossatSatellite() {
      // 40 cm x 40 cm x 40 cm Micro-satellite cuboid chassis
      const bodyGeom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xC0C0C8,
        metalness: 0.8,
        roughness: 0.3
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);

      // Canadian Red accent stripe across chassis
      const redBandGeom = new THREE.BoxGeometry(0.355, 0.08, 0.355);
      const redBandMat = new THREE.MeshStandardMaterial({
        color: 0xD82020,
        metalness: 0.4,
        roughness: 0.4
      });
      const redBand = new THREE.Mesh(redBandGeom, redBandMat);
      body.add(redBand);

      // 15 cm Maksutov-Cassegrain Telescope Baffle Tube
      const baffleGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.42, 16);
      const baffleMat = new THREE.MeshStandardMaterial({
        color: 0x1A1A24,
        metalness: 0.7,
        roughness: 0.4
      });
      const baffle = new THREE.Mesh(baffleGeom, baffleMat);
      baffle.rotation.x = Math.PI / 2;
      baffle.position.z = 0.32;
      body.add(baffle);

      // Telescope Optical Aperture (blue coated glass)
      const lensGeom = new THREE.CircleGeometry(0.11, 16);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x2266AA });
      const lens = new THREE.Mesh(lensGeom, lensMat);
      lens.position.z = 0.53;
      body.add(lens);

      // Deployable Solar Arrays (Dual Blue Wings)
      const wingGeom = new THREE.BoxGeometry(0.85, 0.02, 0.32);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x0A3366,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x001122
      });
      const leftWing = new THREE.Mesh(wingGeom, wingMat);
      leftWing.position.x = 0.55;
      body.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeom, wingMat);
      rightWing.position.x = -0.55;
      body.add(rightWing);

      // Canadian Flag Beacon / Red-White Blinker
      const beaconGeom = new THREE.SphereGeometry(0.06, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xFF2A2A });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.y = 0.25;
      body.add(beacon);

      body.scale.set(1.4, 1.4, 1.4);
      neossatGroup.add(body);
      neossatMesh = body;

      body.userData = {
        type: 'neossat',
        name: 'NEOSSat (CSA)',
        obj: {
          d: {
            name: 'NEOSSat',
            diameter: '40 cm × 40 cm × 40 cm',
            dist: '720 km Polar LEO',
            year: '99.1 min',
            moons: '15 cm Maksutov-Cassegrain',
            type: 'Canadian Asteroid Surveillance',
            orbitSpeed: '7.5 km/s'
          }
        }
      };
    }
    buildNeossatSatellite();

    // ── 2. Create 3D Celestial RA/Dec Grid ──────────────────────────────────
    function buildCelestialGrid() {
      const radius = 550;
      const gridMat = new THREE.LineBasicMaterial({
        color: 0x22D3EE,
        transparent: true,
        opacity: 0.14
      });

      // Declination parallels (-60 to +60 in steps of 30)
      for (let dec = -60; dec <= 60; dec += 30) {
        const points = [];
        const decRad = (dec * Math.PI) / 180;
        const rParallel = radius * Math.cos(decRad);
        const y = radius * Math.sin(decRad);
        for (let ra = 0; ra <= 360; ra += 5) {
          const raRad = (ra * Math.PI) / 180;
          points.push(new THREE.Vector3(rParallel * Math.cos(raRad), y, -rParallel * Math.sin(raRad)));
        }
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        celestialGridGroup.add(new THREE.Line(geom, gridMat));
      }

      // Right Ascension meridians (every 30 degrees = 2 hours)
      for (let ra = 0; ra < 360; ra += 30) {
        const points = [];
        const raRad = (ra * Math.PI) / 180;
        for (let dec = -85; dec <= 85; dec += 5) {
          const decRad = (dec * Math.PI) / 180;
          const x = radius * Math.cos(decRad) * Math.cos(raRad);
          const y = radius * Math.sin(decRad);
          const z = -radius * Math.cos(decRad) * Math.sin(raRad);
          points.push(new THREE.Vector3(x, y, z));
        }
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        celestialGridGroup.add(new THREE.Line(geom, gridMat));
      }

      // Ecliptic North Pole Marker
      const enpPoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, radius, 0)
      ];
      const enpGeom = new THREE.BufferGeometry().setFromPoints(enpPoints);
      const enpLine = new THREE.Line(enpGeom, new THREE.LineDashedMaterial({
        color: 0xE0A526,
        dashSize: 10,
        gapSize: 6,
        transparent: true,
        opacity: 0.35
      }));
      enpLine.computeLineDistances();
      celestialGridGroup.add(enpLine);
    }
    buildCelestialGrid();

    // ── 3. Survey Field Footprints and Sightline Rays ────────────────────────
    function buildSurveyField() {
      // SPHEREx Deep Field North Center: RA 269.4520, Dec +66.5610
      const centerRa = 269.452;
      const centerDec = 66.561;
      const radius = 540;

      // 4 corners of 1.2 deg FOV
      const half = 1.0;
      const cosDec = Math.cos((centerDec * Math.PI) / 180);
      const dRa = half / cosDec;
      const dDec = half;
      const corners = [
        { ra: centerRa - dRa, dec: centerDec - dDec },
        { ra: centerRa + dRa, dec: centerDec - dDec },
        { ra: centerRa + dRa, dec: centerDec + dDec },
        { ra: centerRa - dRa, dec: centerDec + dDec },
        { ra: centerRa - dRa, dec: centerDec - dDec }
      ];

      const boxPoints = corners.map(c => {
        const v = SphereEngine.raDecToVector3(c.ra, c.dec, radius);
        return new THREE.Vector3(v.x, v.y, v.z);
      });

      const boxGeom = new THREE.BufferGeometry().setFromPoints(boxPoints);
      const boxMat = new THREE.LineBasicMaterial({
        color: 0x087EAC,
        linewidth: 2,
        transparent: true,
        opacity: 0.85
      });
      const boxLine = new THREE.Line(boxGeom, boxMat);
      fovRaysGroup.add(boxLine);

      // Line of sight ray from origin to center of field
      const centerVec = SphereEngine.raDecToVector3(centerRa, centerDec, radius);
      const rayPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(centerVec.x, centerVec.y, centerVec.z)];
      const rayGeom = new THREE.BufferGeometry().setFromPoints(rayPoints);
      const rayMat = new THREE.LineDashedMaterial({
        color: 0x22D3EE,
        dashSize: 12,
        gapSize: 6,
        transparent: true,
        opacity: 0.4
      });
      const rayLine = new THREE.Line(rayGeom, rayMat);
      rayLine.computeLineDistances();
      fovRaysGroup.add(rayLine);
    }
    buildSurveyField();

    // ── 4. Load Candidates and Populate 3D Mover Markers ────────────────────
    const moverMeshes = [];
    async function loadAndSpawnMovers() {
      candidatesData = await SphereEngine.loadCandidates();
      if (!candidatesData || !candidatesData.movers) return;

      const movers = candidatesData.movers;
      movers.forEach((m, idx) => {
        const isKnown = m.type === 'known';
        const color = isKnown ? 0x22D3EE : 0xE0A526;

        // Position on 3D celestial sphere / heliocentric distance
        // Known asteroid Ceres: SMA 2.767 AU (~88.5 scene units)
        // Unknown candidate: deep field distance ~140 - 240 units
        let dist = 110 + (idx % 12) * 14;
        if (isKnown) dist = 88.5; // Ceres orbit distance

        const pos = SphereEngine.raDecToVector3(m.ra, m.dec, dist);

        // Core marker mesh
        const geom = new THREE.SphereGeometry(isKnown ? 0.75 : 0.6, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(pos.x, pos.y, pos.z);

        // Outer glow halo ring
        const ringGeom = new THREE.RingGeometry(isKnown ? 1.0 : 0.8, isKnown ? 1.4 : 1.1, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.lookAt(0, 0, 0);
        mesh.add(ring);

        // Motion vector trail arrow
        const paDeg = SphereEngine.computePositionAngle(
          m.motion?.ra_rate_arcsec_per_day || 0,
          m.motion?.dec_rate_arcsec_per_day || 0
        );
        const paRad = (paDeg * Math.PI) / 180;
        const trailLen = 8.0;
        const trailEnd = new THREE.Vector3(
          pos.x + Math.sin(paRad) * trailLen,
          pos.y + Math.cos(paRad) * trailLen,
          pos.z
        );
        const trailGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.sin(paRad) * trailLen, Math.cos(paRad) * trailLen, 0)
        ]);
        const trailMat = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.7
        });
        const trail = new THREE.Line(trailGeom, trailMat);
        mesh.add(trail);

        mesh.userData = {
          type: 'mover',
          mover: m,
          name: m.match_name ? `${m.object_id} (${m.match_name})` : m.object_id,
          obj: {
            d: {
              name: m.match_name || m.object_id,
              diameter: isKnown ? '939 km' : 'Candidate (< 50 km)',
              dist: `${dist.toFixed(1)} AU eq`,
              year: isKnown ? '4.6 yrs' : 'Hyperbolic / Trans-Neptunian',
              moons: m.type === 'known' ? 'Catalog Match' : 'Unknown',
              type: isKnown ? 'Main Belt Asteroid' : 'Moving Transient Candidate',
              orbitSpeed: `${(m.motion ? SphereEngine.computeTotalRate(m.motion.ra_rate_arcsec_per_day, m.motion.dec_rate_arcsec_per_day).toFixed(1) : '—')}"/day`
            }
          }
        };

        moversGroup.add(mesh);
        moverMeshes.push(mesh);
      });

      renderMoversDrawerList();
    }
    loadAndSpawnMovers();

    // ── 5. Inject SPHEREx UI Controls into DOM ────────────────────────────────
    function injectUIControls() {
      // 1. Hook or add SPHEREx & NEOSSat to Focus Bar
      const focusBar = document.getElementById('focus-bar');
      if (focusBar) {
        let btnSpherex = document.getElementById('fbtn-spherex');
        if (!btnSpherex) {
          const sep = document.createElement('span');
          sep.className = 'fbar-sep';
          focusBar.appendChild(sep);

          btnSpherex = document.createElement('button');
          btnSpherex.className = 'fbtn';
          btnSpherex.id = 'fbtn-spherex';
          btnSpherex.innerHTML = '<span class="dot" style="background:#087EAC"></span>SPHEREx';
          focusBar.appendChild(btnSpherex);
        }
        btnSpherex.onclick = () => focusOnSpherex();

        let btnNeossat = document.getElementById('fbtn-neossat');
        if (!btnNeossat) {
          btnNeossat = document.createElement('button');
          btnNeossat.className = 'fbtn';
          btnNeossat.id = 'fbtn-neossat';
          btnNeossat.innerHTML = '<span class="dot" style="background:#FF4444"></span>🍁 NEOSSat';
          focusBar.appendChild(btnNeossat);
        }
        btnNeossat.onclick = () => focusOnNeossat();

        let btnCeres = document.getElementById('fbtn-ceres-known');
        if (!btnCeres) {
          btnCeres = document.createElement('button');
          btnCeres.className = 'fbtn';
          btnCeres.id = 'fbtn-ceres-known';
          btnCeres.innerHTML = '<span class="dot" style="background:#22D3EE"></span>1 CERES [KNOWN]';
          focusBar.appendChild(btnCeres);
        }
        btnCeres.onclick = () => selectMoverById('SPX-MOV-0001');

        let btnUnknown = document.getElementById('fbtn-cand-unknown');
        if (!btnUnknown) {
          btnUnknown = document.createElement('button');
          btnUnknown.className = 'fbtn';
          btnUnknown.id = 'fbtn-cand-unknown';
          btnUnknown.innerHTML = '<span class="dot" style="background:#E0A526"></span>CANDIDATE [UNKNOWN]';
          focusBar.appendChild(btnUnknown);
        }
        btnUnknown.onclick = () => selectMoverById('SPX-MOV-0002');

        let btnMoversDrawer = document.getElementById('fbtn-open-movers');
        if (!btnMoversDrawer) {
          btnMoversDrawer = document.createElement('button');
          btnMoversDrawer.className = 'fbtn';
          btnMoversDrawer.id = 'fbtn-open-movers';
          btnMoversDrawer.style.borderColor = '#22D3EE';
          btnMoversDrawer.innerHTML = '<span class="dot" style="background:#22D3EE"></span>MOVERS (25) 🔭';
          focusBar.appendChild(btnMoversDrawer);
        }
        btnMoversDrawer.onclick = () => toggleMoversDrawer();
      }

      // Also wire Left Stories NEOSSat card
      const storyNeossat = document.getElementById('story-neossat');
      if (storyNeossat) {
        storyNeossat.onclick = () => focusOnNeossat();
      }

      // 2. Add View toggles to Speed/Controls Bar
      const speedWrap = document.getElementById('speed-wrap');
      if (speedWrap) {
        const btnToggleFov = document.createElement('button');
        btnToggleFov.className = 'sbtn';
        btnToggleFov.id = 'btn-toggle-fov';
        btnToggleFov.title = 'Toggle SPHEREx Telescope FOV Cone and Line-of-Sight Rays';
        btnToggleFov.style.borderColor = 'rgba(8, 126, 172, 0.6)';
        btnToggleFov.textContent = 'SPHEREx FOV ON';
        btnToggleFov.addEventListener('click', () => {
          fovRaysGroup.visible = !fovRaysGroup.visible;
          btnToggleFov.textContent = fovRaysGroup.visible ? 'SPHEREx FOV ON' : 'SPHEREx FOV OFF';
        });
        speedWrap.appendChild(btnToggleFov);

        const btnToggleGrid = document.createElement('button');
        btnToggleGrid.className = 'sbtn';
        btnToggleGrid.id = 'btn-toggle-grid';
        btnToggleGrid.title = 'Toggle 3D Celestial Equatorial RA/Dec Grid';
        btnToggleGrid.style.borderColor = 'rgba(34, 211, 238, 0.4)';
        btnToggleGrid.textContent = 'RA/DEC GRID';
        btnToggleGrid.addEventListener('click', () => {
          celestialGridGroup.visible = !celestialGridGroup.visible;
          btnToggleGrid.textContent = celestialGridGroup.visible ? 'GRID ON' : 'RA/DEC GRID';
        });
        speedWrap.appendChild(btnToggleGrid);

        const btnToggleMovers = document.createElement('button');
        btnToggleMovers.className = 'sbtn';
        btnToggleMovers.id = 'btn-toggle-movers-3d';
        btnToggleMovers.title = 'Toggle 3D Moving Object Vectors';
        btnToggleMovers.style.borderColor = 'rgba(224, 165, 38, 0.5)';
        btnToggleMovers.textContent = 'MOVERS 3D ON';
        btnToggleMovers.addEventListener('click', () => {
          moversGroup.visible = !moversGroup.visible;
          btnToggleMovers.textContent = moversGroup.visible ? 'MOVERS 3D ON' : 'MOVERS 3D OFF';
        });
        speedWrap.appendChild(btnToggleMovers);

        const btnPitchTour = document.createElement('button');
        btnPitchTour.className = 'sbtn';
        btnPitchTour.id = 'btn-pitch-tour';
        btnPitchTour.title = 'Automated 3-Minute Science Pitch Tour';
        btnPitchTour.style.borderColor = '#E0A526';
        btnPitchTour.style.color = '#E0A526';
        btnPitchTour.style.marginTop = '6px';
        btnPitchTour.innerHTML = '▶ 3-MIN TOUR';
        btnPitchTour.addEventListener('click', () => {
          startPitchTour();
        });
        speedWrap.appendChild(btnPitchTour);
      }

      // 3. Inject SPHEREx Movers Drawer Panel
      injectMoversDrawerDOM();

      // 4. Inject Extended Tabs into #planet-info
      injectInfoTabsDOM();

      // 5. Inject Pitch Tour Overlay Banner
      injectPitchTourOverlayDOM();

      // 6. Hook Raycaster clicks for Mover meshes
      hookRaycasterClicks();

      // 7. Enhance Search with Coordinate parsing & Candidate Search
      enhanceSearchAutocomplete();
    }
    injectUIControls();

    // ── 6. SPHEREx Movers Drawer DOM ─────────────────────────────────────────
    function injectMoversDrawerDOM() {
      const drawer = document.createElement('div');
      drawer.id = 'spherex-movers-drawer';
      drawer.style.cssText = `
        position: fixed;
        top: 60px;
        right: 16px;
        width: min(390px, 92vw);
        max-height: calc(100vh - 120px);
        background: rgba(4, 8, 16, 0.94);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(34, 211, 238, 0.28);
        border-radius: 4px;
        padding: 14px 16px;
        color: #fff;
        font-family: 'Courier New', monospace;
        z-index: 100;
        display: none;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.85);
        overflow: hidden;
      `;

      drawer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:8px;">
          <div>
            <div style="font-size:12px; letter-spacing:2px; font-weight:bold; color:#22D3EE;">SPHEREx SKY DIARY</div>
            <div style="font-size:10px; color:#8899aa; letter-spacing:1px; margin-top:2px;">DETECTED MOVERS <span style="background:rgba(224,165,38,0.2); color:#E0A526; padding:1px 5px; border-radius:2px; font-size:9px; border:1px solid #E0A526;">TEST DATA</span></div>
          </div>
          <button id="close-movers-drawer" style="background:none; border:1px solid rgba(255,255,255,0.2); color:#fff; cursor:pointer; padding:2px 8px; font-family:'Courier New',monospace; font-size:11px;">✕</button>
        </div>

        <div style="display:flex; gap:6px; margin-bottom:8px;">
          <button class="sbtn active" id="filter-all-btn" style="flex:1; padding:4px; font-size:10px;">ALL</button>
          <button class="sbtn" id="filter-known-btn" style="flex:1; padding:4px; font-size:10px; border-color:#22D3EE; color:#22D3EE;">KNOWN</button>
          <button class="sbtn" id="filter-unknown-btn" style="flex:1; padding:4px; font-size:10px; border-color:#E0A526; color:#E0A526;">UNKNOWN</button>
        </div>

        <div style="margin-bottom:8px;">
          <input type="text" id="movers-search-input" placeholder="Search ID / name..." style="width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; font-family:'Courier New',monospace; font-size:11px; padding:5px 8px; border-radius:2px;">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:#8899aa; margin-bottom:4px;">
          <span>CONFIDENCE ≥ <span id="conf-val-label">0%</span></span>
          <input type="range" id="conf-slider" min="0" max="100" value="0" style="width:140px;">
        </div>

        <div id="movers-list-container" style="flex:1; overflow-y:auto; max-height:420px; display:flex; flex-direction:column; gap:6px; padding-right:4px;">
          <!-- Mover cards rendered dynamically -->
        </div>
      `;

      document.body.appendChild(drawer);

      // Event listeners for Drawer
      document.getElementById('close-movers-drawer').addEventListener('click', () => {
        drawer.style.display = 'none';
      });

      let currentFilter = 'all';
      const btnAll = document.getElementById('filter-all-btn');
      const btnKnown = document.getElementById('filter-known-btn');
      const btnUnknown = document.getElementById('filter-unknown-btn');
      const searchInput = document.getElementById('movers-search-input');
      const confSlider = document.getElementById('conf-slider');
      const confLabel = document.getElementById('conf-val-label');

      function updateFilterUI() {
        [btnAll, btnKnown, btnUnknown].forEach(b => b.classList.remove('active'));
        if (currentFilter === 'all') btnAll.classList.add('active');
        if (currentFilter === 'known') btnKnown.classList.add('active');
        if (currentFilter === 'unknown') btnUnknown.classList.add('active');
        renderMoversDrawerList();
      }

      btnAll.addEventListener('click', () => { currentFilter = 'all'; updateFilterUI(); });
      btnKnown.addEventListener('click', () => { currentFilter = 'known'; updateFilterUI(); });
      btnUnknown.addEventListener('click', () => { currentFilter = 'unknown'; updateFilterUI(); });

      searchInput.addEventListener('input', () => renderMoversDrawerList());
      confSlider.addEventListener('input', (e) => {
        confLabel.textContent = `${e.target.value}%`;
        renderMoversDrawerList();
      });
    }

    function toggleMoversDrawer() {
      const drawer = document.getElementById('spherex-movers-drawer');
      if (!drawer) return;
      drawer.style.display = (drawer.style.display === 'flex') ? 'none' : 'flex';
      if (drawer.style.display === 'flex') {
        renderMoversDrawerList();
      }
    }

    function renderMoversDrawerList() {
      const container = document.getElementById('movers-list-container');
      if (!container || !candidatesData || !candidatesData.movers) return;

      const searchVal = (document.getElementById('movers-search-input')?.value || '').toLowerCase();
      const minConf = (parseInt(document.getElementById('conf-slider')?.value || '0', 10)) / 100.0;
      const btnKnown = document.getElementById('filter-known-btn');
      const btnUnknown = document.getElementById('filter-unknown-btn');
      let filterMode = 'all';
      if (btnKnown?.classList.contains('active')) filterMode = 'known';
      if (btnUnknown?.classList.contains('active')) filterMode = 'unknown';

      container.innerHTML = '';

      const filtered = candidatesData.movers.filter(m => {
        if (filterMode === 'known' && m.type !== 'known') return false;
        if (filterMode === 'unknown' && m.type !== 'unknown') return false;
        if (m.confidence < minConf) return false;
        if (searchVal) {
          const matchId = m.object_id.toLowerCase().includes(searchVal);
          const matchName = m.match_name && m.match_name.toLowerCase().includes(searchVal);
          if (!matchId && !matchName) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="color:#667788; font-size:11px; padding:12px 0; text-align:center;">No matching movers found.</div>';
        return;
      }

      filtered.forEach(m => {
        const isKnown = m.type === 'known';
        const card = document.createElement('div');
        card.style.cssText = `
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid ${isKnown ? 'rgba(34, 211, 238, 0.3)' : 'rgba(224, 165, 38, 0.3)'};
          border-left: 3px solid ${isKnown ? '#22D3EE' : '#E0A526'};
          border-radius: 3px;
          padding: 8px 10px;
          cursor: pointer;
          transition: background 0.2s ease;
        `;
        card.addEventListener('mouseenter', () => card.style.background = 'rgba(255,255,255,0.08)');
        card.addEventListener('mouseleave', () => card.style.background = 'rgba(255,255,255,0.04)');

        const rate = m.motion ? SphereEngine.computeTotalRate(m.motion.ra_rate_arcsec_per_day, m.motion.dec_rate_arcsec_per_day) : 0;
        const pa = m.motion ? SphereEngine.computePositionAngle(m.motion.ra_rate_arcsec_per_day, m.motion.dec_rate_arcsec_per_day) : 0;
        const compass = SphereEngine.positionAngleToCompass(pa);

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold; font-size:11px; color:${isKnown ? '#22D3EE' : '#E0A526'}">${m.object_id}</span>
            <span style="font-size:9px; padding:1px 4px; border-radius:2px; background:${isKnown ? 'rgba(34,211,238,0.15)' : 'rgba(224,165,38,0.15)'}; color:${isKnown ? '#22D3EE' : '#E0A526'}">
              ${isKnown ? '✓ ' + (m.match_name || 'KNOWN') : '⚠ UNKNOWN'}
            </span>
          </div>
          <div style="font-size:10px; color:#8899aa; margin-top:3px; display:flex; justify-content:space-between;">
            <span>Rate: ${rate.toFixed(1)}"/d (${compass})</span>
            <span>Conf: ${(m.confidence * 100).toFixed(0)}%</span>
          </div>
          <div style="background:rgba(255,255,255,0.1); height:3px; border-radius:1px; margin-top:4px; overflow:hidden;">
            <div style="background:${isKnown ? '#22D3EE' : '#E0A526'}; width:${m.confidence * 100}%; height:100%;"></div>
          </div>
        `;

        card.addEventListener('click', () => {
          selectMoverById(m.object_id);
        });

        container.appendChild(card);
      });
    }

    // ── 7. Extended Info Panel Tabs (Telemetry, 102-CH Spectra, Blink) ───────
    function injectInfoTabsDOM() {
      const infoPanel = document.getElementById('planet-info');
      if (!infoPanel) return;

      // Expand info panel max width for chart display
      infoPanel.style.width = 'min(440px, 94vw)';
      infoPanel.style.maxHeight = 'min(640px, 85vh)';

      // Tab selector header
      const tabsWrap = document.createElement('div');
      tabsWrap.id = 'pi-tabs-wrap';
      tabsWrap.style.cssText = `
        display: flex;
        gap: 4px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.12);
        padding-bottom: 6px;
      `;

      tabsWrap.innerHTML = `
        <button class="pi-btn active" id="tab-btn-telemetry" style="flex:1;">TELEMETRY</button>
        <button class="pi-btn" id="tab-btn-spectra" style="flex:1;">102-CH SED</button>
        <button class="pi-btn" id="tab-btn-blink" style="flex:1;">BLINK/FILM</button>
      `;

      // Insert tabs right after #planet-info-head
      const head = document.getElementById('planet-info-head');
      if (head && head.nextSibling) {
        infoPanel.insertBefore(tabsWrap, head.nextSibling);
      }

      // Container for custom tab views
      const customViewContainer = document.createElement('div');
      customViewContainer.id = 'pi-custom-tab-view';
      customViewContainer.style.cssText = 'display:none;';
      infoPanel.appendChild(customViewContainer);

      // Tab click events
      const btnTelem = document.getElementById('tab-btn-telemetry');
      const btnSpec = document.getElementById('tab-btn-spectra');
      const btnBlink = document.getElementById('tab-btn-blink');

      function setTab(tab) {
        currentInfoTab = tab;
        [btnTelem, btnSpec, btnBlink].forEach(b => b.classList.remove('active'));

        const standardRows = infoPanel.querySelectorAll('.pi-row');

        if (tab === 'telemetry') {
          btnTelem.classList.add('active');
          standardRows.forEach(r => r.style.display = 'flex');
          customViewContainer.style.display = 'none';
          stopBlinking();
        } else if (tab === 'spectra') {
          btnSpec.classList.add('active');
          standardRows.forEach(r => r.style.display = 'none');
          customViewContainer.style.display = 'block';
          renderSpectraTabContent(customViewContainer);
          stopBlinking();
        } else if (tab === 'blink') {
          btnBlink.classList.add('active');
          standardRows.forEach(r => r.style.display = 'none');
          customViewContainer.style.display = 'block';
          renderBlinkTabContent(customViewContainer);
          startBlinking();
        }
      }

      btnTelem.addEventListener('click', () => setTab('telemetry'));
      btnSpec.addEventListener('click', () => setTab('spectra'));
      btnBlink.addEventListener('click', () => setTab('blink'));
    }

    // ── 8. Render 102-Channel Spectrophotometry SVG Curve & CSV Export ──────
    function renderSpectraTabContent(container) {
      if (!selectedMover || !selectedMover.spectrum) {
        container.innerHTML = `
          <div style="font-size:11px; color:#8899aa; padding:20px 0; text-align:center;">
            Spectrophotometry is available for SPHEREx mover candidates.<br>
            Please select a detected mover (e.g. 1 Ceres or SPX-MOV-0002).
          </div>
        `;
        return;
      }

      const m = selectedMover;
      const spec = m.spectrum;
      const wls = spec.wavelength_um || [];
      const fluxes = spec.flux || spec.flux_mjy || [];
      const errs = spec.flux_err || spec.flux_err_mjy || [];

      if (wls.length === 0 || fluxes.length === 0) {
        container.innerHTML = '<div style="font-size:11px; color:#8899aa;">No spectral channels available for this candidate.</div>';
        return;
      }

      // Detect water ice and CO2 features
      const features = SphereEngine.detectSpectralFeatures(wls, fluxes);

      // Dimensions for SVG
      const width = 390;
      const height = 190;
      const padL = 45;
      const padR = 15;
      const padT = 20;
      const padB = 35;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      const minWl = 0.75;
      const maxWl = 5.00;
      const minFlux = 0;
      let maxFlux = Math.max(...fluxes);
      maxFlux = maxFlux > 0 ? maxFlux * 1.15 : 100;

      const scaleX = (wl) => padL + ((wl - minWl) / (maxWl - minWl)) * plotW;
      const scaleY = (fl) => padT + plotH - (fl / maxFlux) * plotH;

      // Polyline coordinates
      const polyPoints = [];
      const upperPoints = [];
      const lowerPoints = [];

      for (let i = 0; i < wls.length; i++) {
        const x = scaleX(wls[i]);
        const y = scaleY(fluxes[i]);
        const err = errs[i] || 0;
        const yUp = scaleY(fluxes[i] + err);
        const yLow = scaleY(Math.max(0, fluxes[i] - err));

        polyPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        upperPoints.push(`${x.toFixed(1)},${yUp.toFixed(1)}`);
        lowerPoints.push(`${x.toFixed(1)},${yLow.toFixed(1)}`);
      }

      const lineStr = polyPoints.join(' ');
      const envelopeStr = `${upperPoints.join(' ')} ${lowerPoints.reverse().join(' ')}`;

      // Spectral Band Shading (Bands 1-6)
      let bandRectsSvg = '';
      SphereEngine.SPHEREx_BANDS.forEach((b, idx) => {
        const bx = scaleX(b.minWl);
        const bw = scaleX(b.maxWl) - bx;
        const fill = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(34,211,238,0.03)';
        bandRectsSvg += `<rect x="${bx}" y="${padT}" width="${bw}" height="${plotH}" fill="${fill}" />`;
      });

      // Feature marker annotations (e.g. Water Ice at 1.5 um and 2.0 um)
      let featureMarkersSvg = '';
      features.forEach(f => {
        const fx = scaleX(f.wavelength);
        featureMarkersSvg += `
          <line x1="${fx}" y1="${padT}" x2="${fx}" y2="${padT + plotH}" stroke="#E0A526" stroke-dasharray="2,2" opacity="0.6"/>
          <text x="${fx}" y="${padT - 4}" fill="#E0A526" font-size="8" text-anchor="middle" font-family="'Courier New', monospace">${f.name}</text>
        `;
      });

      container.innerHTML = `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:#22D3EE;">102-CH INFRARED SED (0.75 – 5.0 µm)</span>
            <button id="btn-export-csv" class="pi-btn" style="color:#22D3EE; border-color:#22D3EE; padding:3px 8px;">EXPORT CSV ⤓</button>
          </div>
          <div style="font-size:9px; color:#8899aa; margin-top:2px;">SPHEREx spectrophotometric flux [mJy] vs wavelength [µm]</div>
        </div>

        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:2px;">
          <!-- Band Backgrounds -->
          ${bandRectsSvg}

          <!-- Grid Lines -->
          <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="rgba(255,255,255,0.2)"/>
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="rgba(255,255,255,0.2)"/>

          <!-- Error Envelope -->
          <polygon points="${envelopeStr}" fill="rgba(34, 211, 238, 0.12)"/>

          <!-- Flux Line -->
          <polyline fill="none" stroke="#22D3EE" stroke-width="1.8" points="${lineStr}"/>

          <!-- Feature Markers -->
          ${featureMarkersSvg}

          <!-- Axes Labels -->
          <text x="${scaleX(1.0)}" y="${height - 10}" fill="#8899aa" font-size="9" text-anchor="middle" font-family="'Courier New', monospace">1.0</text>
          <text x="${scaleX(2.0)}" y="${height - 10}" fill="#8899aa" font-size="9" text-anchor="middle" font-family="'Courier New', monospace">2.0</text>
          <text x="${scaleX(3.0)}" y="${height - 10}" fill="#8899aa" font-size="9" text-anchor="middle" font-family="'Courier New', monospace">3.0</text>
          <text x="${scaleX(4.0)}" y="${height - 10}" fill="#8899aa" font-size="9" text-anchor="middle" font-family="'Courier New', monospace">4.0</text>
          <text x="${scaleX(5.0)}" y="${height - 10}" fill="#8899aa" font-size="9" text-anchor="middle" font-family="'Courier New', monospace">5.0 µm</text>

          <text x="${padL - 6}" y="${padT + 10}" fill="#8899aa" font-size="9" text-anchor="end" font-family="'Courier New', monospace">${maxFlux.toFixed(0)}</text>
          <text x="${padL - 6}" y="${padT + plotH}" fill="#8899aa" font-size="9" text-anchor="end" font-family="'Courier New', monospace">0</text>
        </svg>

        <div style="font-size:10px; color:#8899aa; margin-top:8px; line-height:1.4;">
          Features: ${features.length > 0 ? features.map(f => `<strong style="color:#E0A526">${f.name}</strong>`).join(', ') : 'Continuous infrared continuum. No sharp water-ice absorption dips detected.'}
        </div>
      `;

      document.getElementById('btn-export-csv').addEventListener('click', () => {
        SphereEngine.exportSpectrumCsv(selectedMover);
      });
    }

    // ── 9. Render Multi-Epoch Blink Comparator & Filmstrip ───────────────────
    function renderBlinkTabContent(container) {
      if (!selectedMover || !selectedMover.detections || selectedMover.detections.length === 0) {
        container.innerHTML = '<div style="font-size:11px; color:#8899aa; padding:16px 0; text-align:center;">No multi-epoch cutout detections available.</div>';
        return;
      }

      const m = selectedMover;
      const dets = m.detections;
      const paDeg = SphereEngine.computePositionAngle(
        m.motion?.ra_rate_arcsec_per_day || 0,
        m.motion?.dec_rate_arcsec_per_day || 0
      );

      container.innerHTML = `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:#22D3EE;">MULTI-EPOCH BLINK COMPARATOR</span>
            <span id="blink-epoch-tag" style="font-size:10px; color:#E0A526; font-weight:bold;">${dets[blinkCurrentEpochIdx]?.epoch_id || 'EPOCH 1'}</span>
          </div>
          <div style="font-size:9px; color:#8899aa; margin-top:2px;">Alternating SPHEREx survey epochs to isolate moving transients</div>
        </div>

        <!-- Blink Viewport Frame -->
        <div style="position:relative; width:100%; height:180px; background:#000; border:1px solid rgba(255,255,255,0.15); border-radius:2px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
          <img id="blink-active-img" src="${dets[blinkCurrentEpochIdx]?.cutout_url || ''}" style="max-width:100%; max-height:100%; object-fit:contain; image-rendering:pixelated;" alt="Epoch Cutout">

          <!-- Reticle Crosshair -->
          <div style="position:absolute; width:24px; height:24px; border:1px solid rgba(34,211,238,0.7); border-radius:50%; pointer-events:none;"></div>
          <div style="position:absolute; width:36px; height:1px; background:rgba(34,211,238,0.7); pointer-events:none;"></div>
          <div style="position:absolute; height:36px; width:1px; background:rgba(34,211,238,0.7); pointer-events:none;"></div>

          <!-- Motion Vector Arrow Overlay -->
          <div style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.75); padding:2px 6px; font-size:9px; color:#22D3EE; border:1px solid rgba(34,211,238,0.3); border-radius:2px;">
            PA: ${paDeg.toFixed(0)}° (${SphereEngine.positionAngleToCompass(paDeg)})
          </div>
        </div>

        <!-- Blink Controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <div style="display:flex; gap:4px;">
            <button id="btn-blink-play" class="pi-btn" style="padding:3px 8px;">${isBlinking ? 'PAUSE' : 'PLAY'}</button>
            <button id="btn-blink-prev" class="pi-btn" style="padding:3px 6px;">◀</button>
            <button id="btn-blink-next" class="pi-btn" style="padding:3px 6px;">▶</button>
          </div>
          <div style="display:flex; gap:4px; align-items:center; font-size:10px; color:#8899aa;">
            <span>RATE:</span>
            <button class="pi-btn ${blinkRateHz === 1 ? 'active' : ''}" id="btn-rate-1hz" style="padding:2px 6px;">1Hz</button>
            <button class="pi-btn ${blinkRateHz === 2 ? 'active' : ''}" id="btn-rate-2hz" style="padding:2px 6px;">2Hz</button>
            <button class="pi-btn ${blinkRateHz === 4 ? 'active' : ''}" id="btn-rate-4hz" style="padding:2px 6px;">4Hz</button>
          </div>
        </div>

        <!-- Filmstrip Row -->
        <div style="font-size:10px; font-weight:bold; color:#8899aa; margin-top:10px; margin-bottom:4px;">FILMSTRIP TIMELAPSE:</div>
        <div id="filmstrip-row" style="display:flex; gap:6px; overflow-x:auto; padding-bottom:6px;">
          ${dets.map((d, i) => `
            <div class="film-thumb" data-idx="${i}" style="flex:0 0 65px; cursor:pointer; background:rgba(255,255,255,0.05); border:1px solid ${i === blinkCurrentEpochIdx ? '#22D3EE' : 'rgba(255,255,255,0.1)'}; border-radius:2px; padding:3px; text-align:center;">
              <img src="${d.cutout_url}" style="width:100%; height:45px; object-fit:cover; display:block;" alt="${d.epoch_id}">
              <div style="font-size:8px; color:#fff; margin-top:2px;">${d.epoch_id}</div>
            </div>
          `).join('')}
        </div>
      `;

      // Blink event listeners
      document.getElementById('btn-blink-play')?.addEventListener('click', () => {
        isBlinking = !isBlinking;
        document.getElementById('btn-blink-play').textContent = isBlinking ? 'PAUSE' : 'PLAY';
        if (isBlinking) startBlinking();
        else stopBlinking();
      });

      document.getElementById('btn-blink-prev')?.addEventListener('click', () => {
        stepBlink(-1);
      });
      document.getElementById('btn-blink-next')?.addEventListener('click', () => {
        stepBlink(1);
      });

      const setRate = (hz) => {
        blinkRateHz = hz;
        [1, 2, 4].forEach(r => document.getElementById(`btn-rate-${r}hz`)?.classList.remove('active'));
        document.getElementById(`btn-rate-${hz}hz`)?.classList.add('active');
        if (isBlinking) startBlinking();
      };

      document.getElementById('btn-rate-1hz')?.addEventListener('click', () => setRate(1));
      document.getElementById('btn-rate-2hz')?.addEventListener('click', () => setRate(2));
      document.getElementById('btn-rate-4hz')?.addEventListener('click', () => setRate(4));

      // Filmstrip clicks
      container.querySelectorAll('.film-thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
          const idx = parseInt(thumb.getAttribute('data-idx'), 10);
          blinkCurrentEpochIdx = idx;
          updateBlinkDisplay();
        });
      });
    }

    function startBlinking() {
      stopBlinking();
      if (!isBlinking) return;
      blinkTimer = setInterval(() => {
        if (!selectedMover || !selectedMover.detections || selectedMover.detections.length === 0) return;
        blinkCurrentEpochIdx = (blinkCurrentEpochIdx + 1) % selectedMover.detections.length;
        updateBlinkDisplay();
      }, 1000 / blinkRateHz);
    }

    function stopBlinking() {
      if (blinkTimer) {
        clearInterval(blinkTimer);
        blinkTimer = null;
      }
    }

    function stepBlink(dir) {
      if (!selectedMover || !selectedMover.detections || selectedMover.detections.length === 0) return;
      const n = selectedMover.detections.length;
      blinkCurrentEpochIdx = (blinkCurrentEpochIdx + dir + n) % n;
      updateBlinkDisplay();
    }

    function updateBlinkDisplay() {
      if (!selectedMover || !selectedMover.detections) return;
      const det = selectedMover.detections[blinkCurrentEpochIdx];
      const img = document.getElementById('blink-active-img');
      const tag = document.getElementById('blink-epoch-tag');
      if (img && det) img.src = det.cutout_url;
      if (tag && det) tag.textContent = `${det.epoch_id} (${det.date ? det.date.slice(0, 10) : ''})`;

      // Update filmstrip highlight
      document.querySelectorAll('.film-thumb').forEach((thumb, i) => {
        thumb.style.borderColor = (i === blinkCurrentEpochIdx) ? '#22D3EE' : 'rgba(255,255,255,0.1)';
      });
    }

    // ── 10. Selection & Camera Focus for Mover Objects ──────────────────────
    function selectMoverById(objectId) {
      if (!candidatesData || !candidatesData.movers) return;
      const mover = candidatesData.movers.find(m => m.object_id === objectId);
      if (!mover) return;

      selectedMover = mover;
      const isKnown = mover.type === 'known';

      // Find mesh
      const mesh = moverMeshes.find(m => m.userData.mover.object_id === objectId);
      if (mesh) {
        sol.focusObject('planet', {
          mesh: mesh,
          d: mesh.userData.obj.d
        });
      }

      // Populate Telemetry info in SOL info card
      populateMoverTelemetry(mover);

      // If active tab is spectra or blink, refresh
      const customView = document.getElementById('pi-custom-tab-view');
      if (currentInfoTab === 'spectra' && customView) {
        renderSpectraTabContent(customView);
      } else if (currentInfoTab === 'blink' && customView) {
        renderBlinkTabContent(customView);
        startBlinking();
      }
    }

    function populateMoverTelemetry(mover) {
      const isKnown = mover.type === 'known';
      const nameEl = document.getElementById('pi-name');
      if (nameEl) {
        nameEl.innerHTML = `
          <span>${mover.object_id}</span>
          <span style="font-size:10px; margin-left:8px; padding:2px 6px; border-radius:2px; background:${isKnown ? 'rgba(34,211,238,0.2)' : 'rgba(224,165,38,0.2)'}; color:${isKnown ? '#22D3EE' : '#E0A526'}; border:1px solid ${isKnown ? '#22D3EE' : '#E0A526'};">
            ${isKnown ? '✓ ' + (mover.match_name || 'KNOWN') : '⚠ UNKNOWN CANDIDATE'}
          </span>
        `;
      }

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
      const setLbl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };

      const rate = mover.motion ? SphereEngine.computeTotalRate(mover.motion.ra_rate_arcsec_per_day, mover.motion.dec_rate_arcsec_per_day) : 0;
      const pa = mover.motion ? SphereEngine.computePositionAngle(mover.motion.ra_rate_arcsec_per_day, mover.motion.dec_rate_arcsec_per_day) : 0;
      const compass = SphereEngine.positionAngleToCompass(pa);
      const sexa = SphereEngine.formatSexagesimalCoords(mover.ra, mover.dec);

      setLbl('pi-lbl-diam', 'COORDINATES');
      set('pi-diam', `${mover.ra.toFixed(4)}°, ${mover.dec >= 0 ? '+' : ''}${mover.dec.toFixed(4)}°`);

      setLbl('pi-lbl-dist', 'SEXAGESIMAL');
      set('pi-dist', sexa.combined);

      setLbl('pi-lbl-year', 'MOTION RATE');
      set('pi-year', `${rate.toFixed(1)}"/day (${compass} ${pa.toFixed(0)}°)`);

      setLbl('pi-lbl-moons', 'CONFIDENCE');
      set('pi-moons', `${(mover.confidence * 100).toFixed(0)}% [${mover.is_synthetic ? 'TEST DATA' : 'OBSERVED'}]`);

      setLbl('pi-lbl-peri', 'DETECTIONS');
      set('pi-peri', `${mover.detections ? mover.detections.length : 0} survey epochs`);

      setLbl('pi-lbl-eta-peri', 'SPECTRAL BANDS');
      set('pi-eta-peri', `${mover.spectrum?.wavelength_um?.length || 102} channels (0.75-5.0 µm)`);

      setLbl('pi-lbl-ap', 'CATALOG MATCH');
      set('pi-ap', mover.match_name || 'None (Candidate for follow-up)');

      setLbl('pi-lbl-eta-ap', 'SCIENCE STATUS');
      set('pi-eta-ap', isKnown ? 'Confirmed Minor Planet' : 'Planet X / Trans-Neptunian Candidate');

      setLbl('pi-lbl-vel', 'SURVEY FOV');
      set('pi-vel', 'Deep Field North (1.0° FOV)');

      setLbl('pi-lbl-type', 'TAXONOMY');
      set('pi-type', isKnown ? 'C-type Carbonaceous' : 'Unclassified SED Candidate');
    }

    function focusOnSpherex() {
      if (!spherexMesh) return;
      sol.focusObject('probe', {
        mesh: spherexMesh,
        vd: { name: 'SPHEREx Observatory' }
      });

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
      const setLbl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };

      const nameEl = document.getElementById('pi-name');
      if (nameEl) nameEl.textContent = 'SPHEREx OBSERVATORY';

      setLbl('pi-lbl-diam', 'INSTRUMENT');
      set('pi-diam', '0.2m f/3 Spectrophotometer');

      setLbl('pi-lbl-dist', 'SURVEY COVERAGE');
      set('pi-dist', 'All-Sky (96+ passes/field)');

      setLbl('pi-lbl-year', 'SPECTRAL RANGE');
      set('pi-year', '0.75 to 5.0 µm (102 bands)');

      setLbl('pi-lbl-moons', 'MISSION CLASS');
      set('pi-moons', 'NASA MIDEX Space Astrophysics');

      setLbl('pi-lbl-peri', 'ORBIT ALTITUDE');
      set('pi-peri', '700 km Sun-synchronous');

      setLbl('pi-lbl-eta-peri', 'TARGETS');
      set('pi-eta-peri', 'Ice Lines & Distant Transients');

      setLbl('pi-lbl-ap', 'CADENCE');
      set('pi-ap', 'Multi-epoch differencing');

      setLbl('pi-lbl-eta-ap', 'SPONSOR');
      set('pi-eta-ap', 'NASA Astrophysics / JPL / Caltech');

      setLbl('pi-lbl-vel', 'ORBITAL SPEED');
      set('pi-vel', '7.5 km/s');

      setLbl('pi-lbl-type', 'MISSION TYPE');
      set('pi-type', 'All-Sky Spectral Survey');

      const infoPanel = document.getElementById('planet-info');
      if (infoPanel) {
        infoPanel.classList.add('show');
        infoPanel.style.display = 'block';
      }
    }

    function focusOnNeossat() {
      if (!neossatMesh) return;
      sol.focusObject('probe', {
        mesh: neossatMesh,
        vd: { name: 'NEOSSat (CSA)' }
      });

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
      const setLbl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };

      const nameEl = document.getElementById('pi-name');
      if (nameEl) nameEl.textContent = 'NEOSSat (CSA / DRDC)';

      setLbl('pi-lbl-diam', 'TELESCOPE');
      set('pi-diam', '15 cm f/5.8 Maksutov (C00)');

      setLbl('pi-lbl-dist', 'PRIMARY OBJECTIVE');
      set('pi-dist', 'Near-Earth Asteroids & Debris');

      setLbl('pi-lbl-year', 'ORBIT CLASSIFICATION');
      set('pi-year', '720 km Polar Sun-Sync (98.6°)');

      setLbl('pi-lbl-moons', 'CADENCE');
      set('pi-moons', 'Asteroid Rate Tracking (Tracklets)');

      setLbl('pi-lbl-peri', 'ORBIT PERIOD');
      set('pi-peri', '99.1 minutes');

      setLbl('pi-lbl-eta-peri', 'KEY TARGETS');
      set('pi-eta-peri', '99942 Apophis, 65803 Didymos');

      setLbl('pi-lbl-ap', 'ASTROMETRY CODE');
      set('pi-ap', 'MPC C00 (Spacecraft Code)');

      setLbl('pi-lbl-eta-ap', 'SPONSOR');
      set('pi-eta-ap', 'Canadian Space Agency (CSA)');

      setLbl('pi-lbl-vel', 'ORBITAL SPEED');
      set('pi-vel', '7.49 km/s');

      setLbl('pi-lbl-type', 'MISSION TYPE');
      set('pi-type', 'Surveillance Space Telescope');

      const infoPanel = document.getElementById('planet-info');
      if (infoPanel) {
        infoPanel.classList.add('show');
        infoPanel.style.display = 'block';
      }
    }

    // ── 11. Hook Raycaster for Mover Clicks ──────────────────────────────────
    function hookRaycasterClicks() {
      renderer.domElement.addEventListener('dblclick', onSceneClick);
      renderer.domElement.addEventListener('click', onSceneClick);

      function onSceneClick(e) {
        if (pitchTourActive) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const m = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const ray = new THREE.Raycaster();
        ray.setFromCamera(m, camera);

        // Intersect mover meshes, SPHEREx, and NEOSSat
        const targets = [...moverMeshes, spherexMesh, neossatMesh].filter(Boolean);
        const hits = ray.intersectObjects(targets, true);

        if (hits.length > 0) {
          let top = hits[0].object;
          while (top.parent && top.parent !== moversGroup && top.parent !== spherexGroup && top.parent !== neossatGroup && top.parent !== scene) {
            top = top.parent;
          }
          if (top.userData) {
            if (top.userData.type === 'mover' && top.userData.mover) {
              selectMoverById(top.userData.mover.object_id);
            } else if (top.userData.type === 'spherex') {
              focusOnSpherex();
            } else if (top.userData.type === 'neossat') {
              focusOnNeossat();
            }
          }
        }
      }
    }

    // ── 12. Enhanced Search Autocomplete (Candidates & RA/Dec Coordinates) ───
    function enhanceSearchAutocomplete() {
      const searchInput = sol.searchInputEl || document.getElementById('search-input');
      const dropdown = sol.searchDropdownEl || document.getElementById('search-dropdown');
      if (!searchInput || !dropdown) return;

      const originalInputHandler = searchInput.oninput;

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (!query) return;

        // Try coordinate parsing
        try {
          const coords = SphereEngine.parseCoordinates(query);
          const coordItem = document.createElement('div');
          coordItem.className = 'search-item';
          coordItem.style.borderLeft = '3px solid #22D3EE';
          coordItem.innerHTML = `
            <span style="color:#22D3EE;">🔭 POINT TO RA/DEC:</span>
            <span style="color:#fff; margin-left:6px;">${SphereEngine.formatDecimalCoordinates(coords.ra, coords.dec)}</span>
          `;
          coordItem.addEventListener('click', () => {
            flyCameraToCoords(coords.ra, coords.dec);
            dropdown.style.display = 'none';
          });
          dropdown.insertBefore(coordItem, dropdown.firstChild);
          dropdown.style.display = 'block';
        } catch (e) {
          // Not coordinates, check candidate movers
          if (candidatesData && candidatesData.movers) {
            const q = query.toLowerCase();
            const matchedMovers = candidatesData.movers.filter(m =>
              m.object_id.toLowerCase().includes(q) || (m.match_name && m.match_name.toLowerCase().includes(q))
            );
            matchedMovers.slice(0, 4).forEach(m => {
              const item = document.createElement('div');
              item.className = 'search-item';
              item.style.borderLeft = m.type === 'known' ? '3px solid #22D3EE' : '3px solid #E0A526';
              item.innerHTML = `
                <span style="color:${m.type === 'known' ? '#22D3EE' : '#E0A526'}; font-weight:bold;">${m.object_id}</span>
                <span style="color:#8899aa; margin-left:6px;">${m.match_name ? m.match_name + ' [Known]' : 'Candidate [Unknown]'}</span>
              `;
              item.addEventListener('click', () => {
                selectMoverById(m.object_id);
                dropdown.style.display = 'none';
              });
              dropdown.insertBefore(item, dropdown.firstChild);
              dropdown.style.display = 'block';
            });
          }

          // Check Challenge targets
          SphereEngine.CHALLENGE_TARGETS.forEach(t => {
            if (t.name.toLowerCase().includes(query.toLowerCase())) {
              const item = document.createElement('div');
              item.className = 'search-item';
              item.style.borderLeft = '3px solid #CCA040';
              item.innerHTML = `
                <span style="color:#CCA040; font-weight:bold;">✦ ${t.name}</span>
                <span style="color:#8899aa; margin-left:6px;">${t.category} (${t.distanceLy})</span>
              `;
              item.addEventListener('click', () => {
                flyCameraToCoords(t.ra, t.dec, t.name);
                dropdown.style.display = 'none';
              });
              dropdown.insertBefore(item, dropdown.firstChild);
              dropdown.style.display = 'block';
            }
          });
        }
      });
    }

    function flyCameraToCoords(ra, dec, label = '') {
      const pos = SphereEngine.raDecToVector3(ra, dec, 300);
      const cam = sol.camera;
      cam.position.set(pos.x * 0.4, pos.y * 0.4 + 20, pos.z * 0.4);
      cam.lookAt(pos.x, pos.y, pos.z);

      // Create a temporary targeting reticle
      const reticleGeom = new THREE.RingGeometry(2, 2.5, 16);
      const reticleMat = new THREE.MeshBasicMaterial({ color: 0x22D3EE, side: THREE.DoubleSide });
      const reticle = new THREE.Mesh(reticleGeom, reticleMat);
      reticle.position.set(pos.x, pos.y, pos.z);
      reticle.lookAt(0, 0, 0);
      scene.add(reticle);

      setTimeout(() => scene.remove(reticle), 6000);
    }

    // ── 13. Automated 3-Minute Scripted Pitch Presentation ───────────────────
    function injectPitchTourOverlayDOM() {
      const overlay = document.createElement('div');
      overlay.id = 'pitch-tour-overlay';
      overlay.style.cssText = `
        position: fixed;
        bottom: 75px;
        left: 50%;
        transform: translateX(-50%);
        width: min(720px, 94vw);
        background: rgba(4, 8, 16, 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(224, 165, 38, 0.4);
        border-radius: 4px;
        padding: 12px 18px;
        color: #fff;
        font-family: 'Courier New', monospace;
        z-index: 110;
        display: none;
        box-shadow: 0 4px 24px rgba(0,0,0,0.8);
      `;

      overlay.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="font-size:12px; font-weight:bold; color:#E0A526; letter-spacing:2px;">
            SPHEREx SKY DIARY — PITCH TOUR (<span id="tour-step-idx">1</span>/7)
          </div>
          <button id="btn-skip-tour" class="pi-btn" style="padding:2px 8px; color:#E0A526; border-color:#E0A526;">SKIP TOUR ✕</button>
        </div>
        <div id="tour-title" style="font-size:13px; font-weight:bold; color:#22D3EE; margin-bottom:4px;">1. Deep Field Overview</div>
        <div id="tour-desc" style="font-size:11px; color:#CCDDEE; line-height:1.4;">Aligning SPHEREx survey telescope with the Ecliptic North Pole deep field.</div>
        <div style="background:rgba(255,255,255,0.1); height:3px; border-radius:1px; margin-top:8px; overflow:hidden;">
          <div id="tour-progress-bar" style="background:#E0A526; width:14%; height:100%; transition:width 0.4s ease;"></div>
        </div>
      `;

      document.body.appendChild(overlay);

      document.getElementById('btn-skip-tour').addEventListener('click', () => {
        stopPitchTour();
      });
    }

    const PITCH_STEPS = [
      {
        step: 1,
        title: "1. Deep Field Overview (0:00 - 0:25)",
        desc: "SPHEREx scans the entire sky in 102 infrared bands. Here we align with the SPHEREx Deep Field North (RA 269.45°, Dec +66.56°), capturing repeated multi-epoch visits.",
        action: () => {
          focusOnSpherex();
          celestialGridGroup.visible = true;
          fovRaysGroup.visible = true;
        }
      },
      {
        step: 2,
        title: "2. Multi-Epoch Blink Comparator (0:25 - 0:50)",
        desc: "By rapidly blinking consecutive survey epochs against static background stars, transient moving objects immediately stand out.",
        action: () => {
          selectMoverById('SPX-MOV-0001');
          document.getElementById('tab-btn-blink')?.click();
        }
      },
      {
        step: 3,
        title: "3. Motion Vector & Tracklet Linking (0:50 - 1:20)",
        desc: "Extracted transients are linked across epochs into high-confidence motion tracklets. Proper motion rate is computed: 32.7 arcsec/day at Position Angle 66° (NE).",
        action: () => {
          document.getElementById('tab-btn-telemetry')?.click();
        }
      },
      {
        step: 4,
        title: "4. Known Catalog Match: 1 Ceres (1:20 - 1:50)",
        desc: "Tracklet ephemerides are cross-matched against SkyBoT and JPL Horizons. SPX-MOV-0001 is positively identified as dwarf planet 1 Ceres (Confidence: 91%).",
        action: () => {
          selectMoverById('SPX-MOV-0001');
          document.getElementById('tab-btn-telemetry')?.click();
        }
      },
      {
        step: 5,
        title: "5. Unknown Candidate & Scientific Honesty (1:50 - 2:20)",
        desc: "SPX-MOV-0002 has no catalog match. Transparently labeled 'TEST DATA / UNKNOWN CANDIDATE' — candidate for follow-up verification, not a false discovery claim.",
        action: () => {
          selectMoverById('SPX-MOV-0002');
          document.getElementById('tab-btn-telemetry')?.click();
        }
      },
      {
        step: 6,
        title: "6. 102-Channel Spectrophotometry SED (2:20 - 2:45)",
        desc: "SPHEREx provides 102 spectral channels (0.75 - 5.0 µm) across 6 infrared bands. Examining water-ice absorption dips at 1.5 µm and 2.0 µm confirms surface ice properties.",
        action: () => {
          selectMoverById('SPX-MOV-0001');
          document.getElementById('tab-btn-spectra')?.click();
        }
      },
      {
        step: 7,
        title: "7. Science Summary & Data Export (2:45 - 3:00)",
        desc: "Researchers and citizen scientists can export calibrated SED CSV data with one click. Ready for planetary defense and Planet X orbital modeling.",
        action: () => {
          document.getElementById('tab-btn-spectra')?.click();
        }
      }
    ];

    function startPitchTour() {
      pitchTourActive = true;
      pitchTourStep = 0;
      const overlay = document.getElementById('pitch-tour-overlay');
      if (overlay) overlay.style.display = 'block';
      runTourStep();
    }

    function runTourStep() {
      if (!pitchTourActive || pitchTourStep >= PITCH_STEPS.length) {
        stopPitchTour();
        return;
      }

      const s = PITCH_STEPS[pitchTourStep];
      document.getElementById('tour-step-idx').textContent = s.step;
      document.getElementById('tour-title').textContent = s.title;
      document.getElementById('tour-desc').textContent = s.desc;
      document.getElementById('tour-progress-bar').style.width = `${((s.step) / PITCH_STEPS.length) * 100}%`;

      s.action();

      pitchTourStep++;
      pitchTourTimeout = setTimeout(runTourStep, 18000); // 18 seconds per step (~2.1 min total)
    }

    function stopPitchTour() {
      pitchTourActive = false;
      if (pitchTourTimeout) clearTimeout(pitchTourTimeout);
      const overlay = document.getElementById('pitch-tour-overlay');
      if (overlay) overlay.style.display = 'none';
    }

    // ── 14. Animation Loop Integration ───────────────────────────────────────
    // Animate SPHEREx orbit and mover beacons
    function updateSpherexAnimation() {
      requestAnimationFrame(updateSpherexAnimation);

      // Rotate SPHEREx in orbit around Earth
      if (spherexGroup && sol.planets) {
        const earth = sol.planets.find(p => p.d.name === 'EARTH');
        if (earth && earth.mesh) {
          const earthPos = earth.mesh.position;
          const t = Date.now() * 0.001;
          const orbitR = 2.4; // LEO scene distance
          spherexGroup.position.set(
            earthPos.x + Math.cos(t * 0.8) * orbitR,
            earthPos.y + Math.sin(t * 0.6) * (orbitR * 0.5),
            earthPos.z + Math.sin(t * 0.8) * orbitR
          );
        }
      }

      // Rotate NEOSSat in polar sun-synchronous orbit around Earth (CSA)
      if (neossatGroup && sol.planets) {
        const earth = sol.planets.find(p => p.d.name === 'EARTH');
        if (earth && earth.mesh) {
          const earthPos = earth.mesh.position;
          const t = Date.now() * 0.0009;
          const orbitR = 2.8; // 720 km Polar LEO scene distance
          neossatGroup.position.set(
            earthPos.x + Math.sin(t * 0.85) * (orbitR * 0.18),
            earthPos.y + Math.sin(t * 0.85) * orbitR,
            earthPos.z + Math.cos(t * 0.85) * orbitR
          );
        }
      }

      // Pulse mover marker rings
      if (moversGroup.visible && moverMeshes.length > 0) {
        const pulse = 1.0 + Math.sin(Date.now() * 0.004) * 0.15;
        moverMeshes.forEach(m => {
          if (m.children && m.children[0]) {
            m.children[0].scale.set(pulse, pulse, pulse);
          }
        });
      }
    }
    updateSpherexAnimation();

    window.SPHEREx = {
      selectMoverById,
      focusOnSpherex,
      focusOnNeossat,
      getCandidatesData: () => candidatesData,
      getMoverMeshes: () => moverMeshes
    };
  }
})();
