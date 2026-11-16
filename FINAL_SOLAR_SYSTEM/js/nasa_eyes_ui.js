/**
 * NASA Eyes on the Solar System UI Controller
 * Implements the official NASA Eyes layout, buttons, dials, navigation, and story cards.
 */

(function () {
  'use strict';

  function initWhenReady() {
    if (!window.SOL_APP) {
      setTimeout(initWhenReady, 50);
      return;
    }
    initNasaEyesUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady);
  } else {
    initWhenReady();
  }

  function initNasaEyesUI() {
    const sol = window.SOL_APP;

    // ── HUD Notification Toast ──────────────────────────────────────────────
    function showHudToast(text) {
      let toast = document.getElementById('nasa-hud-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nasa-hud-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '84px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(7, 12, 22, 0.94)';
        toast.style.border = '1px solid rgba(0, 229, 255, 0.5)';
        toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.75), 0 0 16px rgba(0, 229, 255, 0.25)';
        toast.style.borderRadius = '20px';
        toast.style.padding = '8px 22px';
        toast.style.color = '#E2E8F0';
        toast.style.fontFamily = "'Barlow', 'Inter', -apple-system, sans-serif";
        toast.style.fontSize = '12px';
        toast.style.fontWeight = '600';
        toast.style.letterSpacing = '1px';
        toast.style.zIndex = '99999';
        toast.style.pointerEvents = 'none';
        toast.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
        document.body.appendChild(toast);
      }
      toast.textContent = text;
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(8px)';
      }, 2400);
    }

    // ── 1. Connect Minimal Header Actions ───────────────────────────────────
    const btnSearch = document.getElementById('btn-head-search');
    const btnShare = document.getElementById('btn-head-share');
    const btnMenu = document.getElementById('btn-head-menu');
    const menuDrawer = document.getElementById('nasa-menu-drawer');
    const closeMenuBtn = document.getElementById('btn-close-menu');

    if (btnSearch) {
      btnSearch.addEventListener('click', () => {
        toggleNamesDrawer();
      });
    }

    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'Eyes on the Solar System - SPHEREx Sky Diary',
            url: window.location.href
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => {
            showHudToast('Mission view URL copied to clipboard!');
          });
        }
      });
    }

    if (btnMenu && menuDrawer) {
      btnMenu.addEventListener('click', () => {
        menuDrawer.classList.toggle('open');
      });
    }

    if (closeMenuBtn && menuDrawer) {
      closeMenuBtn.addEventListener('click', () => {
        menuDrawer.classList.remove('open');
      });
    }

    // ── 2. Connect Left Panel Featured Stories ──────────────────────────────
    const storiesPanel = document.getElementById('nasa-stories-panel');
    const toggleStoriesBtn = document.getElementById('btn-toggle-stories');
    const storiesToggleTab = document.getElementById('nasa-stories-toggle-tab');

    function toggleStoriesSidebar(forceState) {
      if (!storiesPanel) return;
      const willCollapse = (forceState !== undefined) ? forceState : !storiesPanel.classList.contains('collapsed');
      storiesPanel.classList.toggle('collapsed', willCollapse);
      if (storiesToggleTab) {
        storiesToggleTab.style.display = willCollapse ? 'flex' : 'none';
      }
    }

    if (toggleStoriesBtn) {
      toggleStoriesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStoriesSidebar(true);
      });
    }

    if (storiesToggleTab) {
      storiesToggleTab.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStoriesSidebar(false);
      });
    }

    // Story 1: Voyager 1
    const storyVoyager = document.getElementById('story-voyager');
    if (storyVoyager) {
      storyVoyager.addEventListener('click', () => {
        const v1 = sol.probes?.find(p => p.vd && p.vd.name && p.vd.name.includes('Voyager 1'));
        if (v1) {
          sol.focusObject('probe', v1);
        }
      });
    }

    // Story 2: Europa Clipper / Jupiter
    const storyClipper = document.getElementById('story-clipper');
    if (storyClipper) {
      storyClipper.addEventListener('click', () => {
        const jup = sol.planets?.find(p => p.d && p.d.name === 'JUPITER');
        if (jup) {
          sol.focusObject('planet', jup);
        }
      });
    }

    // Story 3: Roman Space Telescope / SPHEREx
    const storyRoman = document.getElementById('story-roman');
    if (storyRoman) {
      storyRoman.addEventListener('click', () => {
        const fbtnSpherex = document.getElementById('fbtn-spherex');
        if (fbtnSpherex) fbtnSpherex.click();
      });
    }

    // Story 4: NEOSSat Asteroid Surveillance
    const storyNeossat = document.getElementById('story-neossat');
    if (storyNeossat) {
      storyNeossat.addEventListener('click', () => {
        if (window.SPHEREx && window.SPHEREx.focusNeossat) {
          window.SPHEREx.focusNeossat();
        } else {
          const fbtn = document.getElementById('fbtn-neossat');
          if (fbtn) fbtn.click();
        }
      });
    }

    // SPHEREx Movers Toggle Button in Sidebar
    const btnStoriesMoverToggle = document.getElementById('btn-stories-spherex-toggle');
    if (btnStoriesMoverToggle) {
      btnStoriesMoverToggle.addEventListener('click', () => {
        const drawer = document.getElementById('spherex-movers-drawer');
        if (drawer) {
          drawer.style.display = (drawer.style.display === 'flex') ? 'none' : 'flex';
        }
      });
    }

    // ── 3. Connect Bottom Center Time Bar & Dial Widget ─────────────────────
    const btnLive = document.getElementById('nasa-btn-live');
    const dateText = document.getElementById('nasa-date-text');
    const timeText = document.getElementById('nasa-time-text');
    const rateStatus = document.getElementById('nasa-rate-status');
    const dialContainer = document.querySelector('.nasa-dial-container');
    const dialKnob = document.getElementById('nasa-dial-knob');

    // Live Button: jump to NOW
    if (btnLive) {
      btnLive.addEventListener('click', () => {
        const realtimeBtn = document.getElementById('realtime-btn');
        if (realtimeBtn) realtimeBtn.click();
        const nowBtn = document.querySelector('.tlhp[data-now]');
        if (nowBtn) nowBtn.click();
        if (rateStatus) rateStatus.textContent = 'REAL RATE';
        updateDialKnobPosition(0.5);
      });
    }

    // Dial Click: cycle speed modes (Real Rate -> 1 Day/s -> 1 Mo/s -> 1 Yr/s -> Pause)
    const SPEED_MODES = [
      { name: 'REAL RATE', spdVal: 31 },
      { name: '1 DAY / S', spdVal: 52 },
      { name: '1 MO / S', spdVal: 68 },
      { name: '1 YR / S', spdVal: 82 },
      { name: 'PAUSED', spdVal: 0 }
    ];
    let currentSpeedModeIdx = 0;

    if (dialContainer) {
      dialContainer.addEventListener('click', () => {
        currentSpeedModeIdx = (currentSpeedModeIdx + 1) % SPEED_MODES.length;
        const mode = SPEED_MODES[currentSpeedModeIdx];
        if (rateStatus) rateStatus.textContent = mode.name;

        if (mode.name === 'PAUSED') {
          sol.setPaused(true);
        } else {
          sol.setPaused(false);
          const spdSlider = document.getElementById('spd');
          if (spdSlider) {
            spdSlider.value = mode.spdVal;
            spdSlider.dispatchEvent(new Event('input'));
          }
        }
        updateDialKnobPosition(currentSpeedModeIdx / (SPEED_MODES.length - 1));
      });
    }

    function updateDialKnobPosition(ratio) {
      if (!dialKnob) return;
      // Map 0..1 to -32px .. +32px
      const offsetPx = (ratio - 0.5) * 64;
      dialKnob.style.transform = `translate(calc(-50% + ${offsetPx}px), -50%)`;
    }

    // Update Date and Time displays continuously from simulation time
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    function updateNasaTimeLoop() {
      requestAnimationFrame(updateNasaTimeLoop);

      const simT = sol.getSimTime ? sol.getSimTime() : 26.29; // years since J2000
      const simMs = Date.UTC(2000, 0, 1, 12, 0, 0) + simT * (365.25 * 24 * 3600 * 1000);
      const d = new Date(simMs);

      if (dateText) {
        const mon = MONTHS[d.getUTCMonth()] || 'NOV';
        const day = d.getUTCDate();
        const yr = d.getUTCFullYear();
        const era = yr < 0 ? ` ${Math.abs(yr)} BC` : ` ${yr}`;
        dateText.textContent = `${mon} ${day},${era}`;
      }

      if (timeText) {
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        const ss = String(d.getUTCSeconds()).padStart(2, '0');
        timeText.textContent = `${hh}:${mm}:${ss} UTC`;
      }
    }
    updateNasaTimeLoop();

    // ── 4. Connect Right Vertical Floating Toolbar ──────────────────────────
    const btnToolInfo = document.getElementById('btn-tool-info');
    const btnToolZoomIn = document.getElementById('btn-tool-zoomin');
    const btnToolZoomOut = document.getElementById('btn-tool-zoomout');
    const btnToolFullscreen = document.getElementById('btn-tool-fullscreen');
    const btnToolLayers = document.getElementById('btn-tool-layers');
    const btnToolMovers = document.getElementById('btn-tool-movers');
    const layersPopover = document.getElementById('nasa-layers-popover');

    // Info toggle
    if (btnToolInfo) {
      btnToolInfo.addEventListener('click', () => {
        const info = sol.infoPanel || document.getElementById('planet-info');
        if (info) {
          info.classList.toggle('show');
          btnToolInfo.classList.toggle('active', info.classList.contains('show'));
        }
      });
    }

    // Zoom In
    if (btnToolZoomIn) {
      btnToolZoomIn.addEventListener('click', () => {
        if (sol.zoomIn) sol.zoomIn();
      });
    }

    // Zoom Out
    if (btnToolZoomOut) {
      btnToolZoomOut.addEventListener('click', () => {
        if (sol.zoomOut) sol.zoomOut();
      });
    }

    // Fullscreen
    if (btnToolFullscreen) {
      btnToolFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          btnToolFullscreen.classList.add('active');
        } else {
          document.exitFullscreen().catch(() => {});
          btnToolFullscreen.classList.remove('active');
        }
      });
    }

    // Layers Popover toggle
    if (btnToolLayers && layersPopover) {
      btnToolLayers.addEventListener('click', () => {
        const isShown = layersPopover.style.display === 'flex';
        layersPopover.style.display = isShown ? 'none' : 'flex';
        btnToolLayers.classList.toggle('active', !isShown);
      });
    }

    // SPHEREx Movers Drawer Toggle
    if (btnToolMovers) {
      btnToolMovers.addEventListener('click', () => {
        const drawer = document.getElementById('spherex-movers-drawer');
        if (drawer) {
          drawer.style.display = (drawer.style.display === 'flex') ? 'none' : 'flex';
          btnToolMovers.classList.toggle('active', drawer.style.display === 'flex');
        }
      });
    }

    // ── 5. Connect Layers Popover Toggles ────────────────────────────────────
    const connectLayerToggle = (rowId, toggleId, legacyBtnId, initialOn = true) => {
      const row = document.getElementById(rowId);
      const sw = document.getElementById(toggleId);
      const legacyBtn = document.getElementById(legacyBtnId);

      if (sw && initialOn) sw.classList.add('on');

      if (row && sw) {
        row.addEventListener('click', () => {
          sw.classList.toggle('on');
          if (legacyBtn) legacyBtn.click();
        });
      }
    };

    connectLayerToggle('layer-row-orbits', 'toggle-orbits', 'orbits-btn', true);
    connectLayerToggle('layer-row-const', 'toggle-const', 'const-btn', false);
    connectLayerToggle('layer-row-realsize', 'toggle-realsize', 'real-size-btn', false);
    connectLayerToggle('layer-row-fov', 'toggle-fov', 'btn-toggle-fov', true);
    connectLayerToggle('layer-row-grid', 'toggle-grid', 'btn-toggle-grid', false);
    connectLayerToggle('layer-row-movers', 'toggle-movers', 'btn-toggle-movers-3d', true);

    // Trajectory Hover Inspect Mode Switch (Visual Layers & Menu Drawer)
    const rowTraj = document.getElementById('layer-row-traj');
    const swTraj = document.getElementById('toggle-traj-inspect');
    const menuTraj = document.getElementById('menu-opt-traj');

    function syncTrajectoryModeUI(enabled) {
      if (swTraj) swTraj.classList.toggle('on', enabled);
      if (menuTraj) {
        menuTraj.textContent = enabled ? '🛰️ Trajectory Inspect Mode: ON (T)' : '🕊️ Free Navigation Mode (T)';
      }
      showHudToast(enabled ? '🛰️ TRAJECTORY INSPECT MODE: ON (Hover trajectory to inspect)' : '🕊️ FREE NAVIGATION MODE (Trajectories Passive)');
    }

    if (rowTraj) {
      rowTraj.addEventListener('click', () => {
        const nextState = typeof sol.toggleTrajectoryMode === 'function' ? sol.toggleTrajectoryMode() : true;
        syncTrajectoryModeUI(nextState);
      });
    }

    if (menuTraj) {
      menuTraj.addEventListener('click', () => {
        const nextState = typeof sol.toggleTrajectoryMode === 'function' ? sol.toggleTrajectoryMode() : true;
        syncTrajectoryModeUI(nextState);
        if (menuDrawer) menuDrawer.classList.remove('open');
      });
    }

    // 3D Object Names Switch (Visual Layers)
    const row3DLabels = document.getElementById('layer-row-3d-labels');
    const sw3DLabels = document.getElementById('toggle-3d-labels');
    if (row3DLabels && sw3DLabels) {
      row3DLabels.addEventListener('click', () => {
        show3DLabels = !show3DLabels;
        sw3DLabels.classList.toggle('on', show3DLabels);
        const chk = document.getElementById('chk-3d-labels');
        if (chk) chk.checked = show3DLabels;
        if (!show3DLabels && labelElements) {
          labelElements.forEach(el => { el.style.display = 'none'; });
        }
        showHudToast(show3DLabels ? '🏷️ 3D Object Names: Visible' : '🏷️ 3D Object Names: Hidden');
      });
    }

    const layerPitchTour = document.getElementById('layer-row-pitch-tour');
    if (layerPitchTour) {
      layerPitchTour.addEventListener('click', () => {
        const btnTour = document.getElementById('btn-pitch-tour');
        if (btnTour) btnTour.click();
        if (layersPopover) layersPopover.style.display = 'none';
      });
    }

    // Close layers popover on outside click
    document.addEventListener('click', (e) => {
      if (layersPopover && layersPopover.style.display === 'flex') {
        if (!layersPopover.contains(e.target) && e.target !== btnToolLayers && !btnToolLayers?.contains(e.target)) {
          layersPopover.style.display = 'none';
          if (btnToolLayers) btnToolLayers.classList.remove('active');
        }
      }
    });

    // ── 6. Connect Camera Views Popover & Enhanced Navigation ────────────────
    const btnToolCamera = document.getElementById('btn-tool-camera');
    const cameraPopover = document.getElementById('nasa-camera-popover');
    const btnCamReset = document.getElementById('btn-cam-reset');
    const btnCamTop = document.getElementById('btn-cam-top');
    const btnCamSide = document.getElementById('btn-cam-side');
    const btnCamFollow = document.getElementById('btn-cam-follow');
    const btnCamFree = document.getElementById('btn-cam-free');

    const btnPanUp = document.getElementById('btn-pan-up');
    const btnPanDown = document.getElementById('btn-pan-down');
    const btnPanLeft = document.getElementById('btn-pan-left');
    const btnPanRight = document.getElementById('btn-pan-right');
    const btnPanCenter = document.getElementById('btn-pan-center');

    if (btnToolCamera && cameraPopover) {
      btnToolCamera.addEventListener('click', () => {
        const isShown = cameraPopover.style.display === 'flex';
        cameraPopover.style.display = isShown ? 'none' : 'flex';
        btnToolCamera.classList.toggle('active', !isShown);
      });
    }

    if (btnCamReset) {
      btnCamReset.addEventListener('click', () => {
        if (sol.clearFocusSelection) sol.clearFocusSelection();
        if (sol.resetPan) sol.resetPan();
        if (sol.setCamAngles) sol.setCamAngles(0.4, 1.08);
        if (sol.setCamR) sol.setCamR(800);
      });
    }

    if (btnCamTop) {
      btnCamTop.addEventListener('click', () => {
        if (sol.setCamAngles) sol.setCamAngles(null, 0.005);
      });
    }

    if (btnCamSide) {
      btnCamSide.addEventListener('click', () => {
        if (sol.setCamAngles) sol.setCamAngles(null, Math.PI / 2);
      });
    }

    if (btnCamFollow) {
      btnCamFollow.addEventListener('click', () => {
        const focusMesh = sol.getFocusMesh ? sol.getFocusMesh() : null;
        if (!focusMesh && sol.planets) {
          const earth = sol.planets.find(p => p.d && p.d.name === 'EARTH');
          if (earth) sol.focusObject('planet', earth);
        }
      });
    }

    if (btnCamFree) {
      btnCamFree.addEventListener('click', () => {
        if (sol.clearFocusSelection) sol.clearFocusSelection();
      });
    }

    // Directional pan controls
    if (btnPanUp) {
      btnPanUp.addEventListener('click', () => {
        if (sol.panCamera) sol.panCamera(0, 1);
      });
    }
    if (btnPanDown) {
      btnPanDown.addEventListener('click', () => {
        if (sol.panCamera) sol.panCamera(0, -1);
      });
    }
    if (btnPanLeft) {
      btnPanLeft.addEventListener('click', () => {
        if (sol.panCamera) sol.panCamera(-1, 0);
      });
    }
    if (btnPanRight) {
      btnPanRight.addEventListener('click', () => {
        if (sol.panCamera) sol.panCamera(1, 0);
      });
    }
    if (btnPanCenter) {
      btnPanCenter.addEventListener('click', () => {
        if (sol.resetPan) sol.resetPan();
      });
    }

    // Close camera popover on outside click
    document.addEventListener('click', (e) => {
      if (cameraPopover && cameraPopover.style.display === 'flex') {
        if (!cameraPopover.contains(e.target) && e.target !== btnToolCamera && !btnToolCamera?.contains(e.target)) {
          cameraPopover.style.display = 'none';
          if (btnToolCamera) btnToolCamera.classList.remove('active');
        }
      }
    });

    // ── 7. Connect Date-to-Date Timelapse Simulation Modal ───────────────────
    const btnToolTimelapse = document.getElementById('btn-tool-timelapse');
    const btnTimeBarTimelapse = document.getElementById('nasa-btn-timelapse-open');
    const timelapseModal = document.getElementById('nasa-timelapse-modal');
    const btnCloseTimelapse = document.getElementById('btn-close-timelapse-modal');

    const tlTargetSelect = document.getElementById('tl-target-select');
    const tlStartInput = document.getElementById('tl-start-datetime');
    const tlEndInput = document.getElementById('tl-end-datetime');
    const tlSpeedBtns = document.querySelectorAll('.nasa-tl-speed-btn');
    const tlDrawTrailCheck = document.getElementById('tl-draw-trail');
    const tlLoopCheck = document.getElementById('tl-loop');
    const tlProgressBarWrap = document.getElementById('tl-progress-bar-wrap');
    const tlProgressBarFill = document.getElementById('tl-progress-bar-fill');
    const tlCurrentTimeReadout = document.getElementById('tl-current-time-readout');
    const tlPercentReadout = document.getElementById('tl-percent-readout');

    const btnTlPlay = document.getElementById('btn-tl-play');
    const btnTlPause = document.getElementById('btn-tl-pause');
    const btnTlStop = document.getElementById('btn-tl-stop');

    let currentTlSpeed = 100000;

    function openTimelapseModal(targetTypeAndName) {
      if (!timelapseModal) return;
      timelapseModal.style.display = 'block';
      if (btnToolTimelapse) btnToolTimelapse.classList.add('active');

      if (targetTypeAndName && tlTargetSelect) {
        for (let i = 0; i < tlTargetSelect.options.length; i++) {
          if (tlTargetSelect.options[i].value === targetTypeAndName ||
              tlTargetSelect.options[i].value.endsWith(':' + targetTypeAndName)) {
            tlTargetSelect.selectedIndex = i;
            break;
          }
        }
      }
    }

    function closeTimelapseModal() {
      if (!timelapseModal) return;
      timelapseModal.style.display = 'none';
      if (btnToolTimelapse) btnToolTimelapse.classList.remove('active');
    }

    if (btnToolTimelapse) {
      btnToolTimelapse.addEventListener('click', () => {
        if (timelapseModal.style.display === 'block') {
          closeTimelapseModal();
        } else {
          openTimelapseModal();
        }
      });
    }

    if (btnTimeBarTimelapse) {
      btnTimeBarTimelapse.addEventListener('click', () => {
        openTimelapseModal();
      });
    }

    if (btnCloseTimelapse) {
      btnCloseTimelapse.addEventListener('click', closeTimelapseModal);
    }

    // Preset starting buttons
    document.querySelectorAll('[data-set-start]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (tlStartInput) tlStartInput.value = btn.dataset.setStart;
      });
    });

    // Preset ending buttons
    document.querySelectorAll('[data-set-end]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (tlEndInput) tlEndInput.value = btn.dataset.setEnd;
      });
    });

    document.querySelectorAll('[data-add-years]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!tlStartInput || !tlEndInput) return;
        const addYears = parseInt(btn.dataset.addYears, 10);
        const st = new Date(tlStartInput.value);
        if (!isNaN(st.getTime())) {
          st.setUTCFullYear(st.getUTCFullYear() + addYears);
          tlEndInput.value = window.TimelapseEngine ? window.TimelapseEngine.formatDatetimeLocal(st) : st.toISOString().slice(0, 16);
        }
      });
    });

    // Speed multiplier buttons
    tlSpeedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tlSpeedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTlSpeed = Number(btn.dataset.speed);
        if (window.TimelapseEngine && window.TimelapseEngine.active) {
          window.TimelapseEngine.setSpeed(currentTlSpeed);
        }
      });
    });

    // Scrubber click on progress bar
    if (tlProgressBarWrap) {
      tlProgressBarWrap.addEventListener('click', (e) => {
        if (!window.TimelapseEngine || !window.TimelapseEngine.active) return;
        const rect = tlProgressBarWrap.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        window.TimelapseEngine.scrubToRatio(ratio);
        if (tlProgressBarFill) tlProgressBarFill.style.width = `${ratio * 100}%`;
        if (tlPercentReadout) tlPercentReadout.textContent = `${(ratio * 100).toFixed(0)}%`;
      });
    }

    // Start / Play Timelapse
    if (btnTlPlay) {
      btnTlPlay.addEventListener('click', () => {
        if (!window.TimelapseEngine) {
          alert('Timelapse Engine is loading. Please retry.');
          return;
        }

        const startVal = tlStartInput ? tlStartInput.value : '2020-01-01T00:00';
        const endVal = tlEndInput ? tlEndInput.value : '2030-01-01T00:00';
        const startDate = new Date(startVal);
        const endDate = new Date(endVal);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          alert('Please enter valid start and end dates.');
          return;
        }
        if (endDate <= startDate) {
          alert('End date must be chronologically after start date.');
          return;
        }

        // Parse target
        const rawTarget = tlTargetSelect ? tlTargetSelect.value : 'planet:EARTH';
        const parts = rawTarget.split(':');
        const tType = parts[0];
        const tName = parts.slice(1).join(':');

        let targetObj = null;
        if (tType === 'planet' && sol.planets) {
          targetObj = sol.planets.find(p => p.d && p.d.name === tName);
        } else if (tType === 'moon' && sol.moons) {
          targetObj = sol.moons.find(m => m.md && m.md.name === tName);
        } else if (tType === 'dwarf' && sol.dwarfs) {
          targetObj = sol.dwarfs.find(d => d.d && d.d.name === tName);
        } else if (tType === 'comet' && sol.comets) {
          targetObj = sol.comets.find(c => c.cd && c.cd.name && c.cd.name.includes(tName));
        } else if (tType === 'probe' && sol.probes) {
          targetObj = sol.probes.find(p => p.vd && p.vd.name && p.vd.name.includes(tName));
        } else if (tType === 'mover') {
          if (window.SPHEREx && window.SPHEREx.selectMoverById) {
            window.SPHEREx.selectMoverById(tName);
          }
          const meshes = window.SPHEREx?.getMoverMeshes ? window.SPHEREx.getMoverMeshes() : [];
          targetObj = meshes.find(m => m.userData && m.userData.mover && m.userData.mover.object_id === tName);
        }

        try {
          window.TimelapseEngine.start({
            targetType: tType,
            targetObj: targetObj,
            targetName: tName,
            startDate: startDate,
            endDate: endDate,
            speedMultiplier: currentTlSpeed,
            loop: tlLoopCheck ? tlLoopCheck.checked : false,
            drawTrail: tlDrawTrailCheck ? tlDrawTrailCheck.checked : true,
            onProgress: ({ progressRatio, currentDate }) => {
              if (tlProgressBarFill) tlProgressBarFill.style.width = `${progressRatio * 100}%`;
              if (tlPercentReadout) tlPercentReadout.textContent = `${(progressRatio * 100).toFixed(0)}%`;
              if (tlCurrentTimeReadout && window.TimelapseEngine.formatDisplayDate) {
                tlCurrentTimeReadout.textContent = window.TimelapseEngine.formatDisplayDate(currentDate);
              }
            },
            onComplete: ({ targetName }) => {
              if (tlProgressBarFill) tlProgressBarFill.style.width = '100%';
              if (tlPercentReadout) tlPercentReadout.textContent = '100%';
              if (tlCurrentTimeReadout) tlCurrentTimeReadout.textContent = `TIMELAPSE COMPLETE (${targetName})`;
              if (btnTlPlay) btnTlPlay.style.display = 'inline-flex';
              if (btnTlPause) {
                btnTlPause.style.display = 'none';
                btnTlPause.innerHTML = '<span>⏸</span> PAUSE';
              }
            }
          });

          if (btnTlPlay) btnTlPlay.style.display = 'none';
          if (btnTlPause) {
            btnTlPause.style.display = 'inline-flex';
            btnTlPause.innerHTML = '<span>⏸</span> PAUSE';
          }
        } catch (err) {
          alert('Timelapse error: ' + err.message);
        }
      });
    }

    // Pause / Resume Timelapse
    if (btnTlPause) {
      btnTlPause.addEventListener('click', () => {
        if (!window.TimelapseEngine || !window.TimelapseEngine.active) return;
        if (window.TimelapseEngine.paused) {
          window.TimelapseEngine.resume();
          btnTlPause.innerHTML = '<span>⏸</span> PAUSE';
        } else {
          window.TimelapseEngine.pause();
          btnTlPause.innerHTML = '<span>▶</span> RESUME';
        }
      });
    }

    // Stop / Reset Timelapse
    if (btnTlStop) {
      btnTlStop.addEventListener('click', () => {
        if (window.TimelapseEngine) {
          window.TimelapseEngine.reset();
        }
        if (tlProgressBarFill) tlProgressBarFill.style.width = '0%';
        if (tlPercentReadout) tlPercentReadout.textContent = '0%';
        if (tlCurrentTimeReadout) tlCurrentTimeReadout.textContent = 'SIMULATION TIME: READY';
        if (btnTlPlay) btnTlPlay.style.display = 'inline-flex';
        if (btnTlPause) {
          btnTlPause.style.display = 'none';
          btnTlPause.innerHTML = '<span>⏸</span> PAUSE';
        }
      });
    }

    // ── 8. Connect Info Panel Action Buttons ─────────────────────────────────
    const piBtnFocus = document.getElementById('pi-btn-focus');
    const piBtnFollow = document.getElementById('pi-btn-follow');
    const piBtnTimelapse = document.getElementById('pi-btn-timelapse');
    const piBtnOrbit = document.getElementById('pi-btn-orbit');
    const piBtnDeselect = document.getElementById('pi-btn-deselect');

    if (piBtnFocus) {
      piBtnFocus.addEventListener('click', () => {
        const ft = sol.getFocusTarget ? sol.getFocusTarget() : null;
        if (ft && ft.type && ft.obj) {
          sol.focusObject(ft.type, ft.obj);
        } else {
          if (sol.planets) {
            const earth = sol.planets.find(p => p.d && p.d.name === 'EARTH');
            if (earth) sol.focusObject('planet', earth);
          }
        }
      });
    }

    if (piBtnFollow) {
      piBtnFollow.addEventListener('click', () => {
        const ft = sol.getFocusTarget ? sol.getFocusTarget() : null;
        if (ft && ft.type && ft.obj) {
          sol.focusObject(ft.type, ft.obj);
        }
      });
    }

    if (piBtnTimelapse) {
      piBtnTimelapse.addEventListener('click', () => {
        const ft = sol.getFocusTarget ? sol.getFocusTarget() : null;
        let targetKey = null;
        if (ft && ft.obj) {
          if (ft.type === 'planet' && ft.obj.d) targetKey = `planet:${ft.obj.d.name}`;
          else if (ft.type === 'moon' && ft.obj.md) targetKey = `moon:${ft.obj.md.name}`;
          else if (ft.type === 'dwarf' && ft.obj.d) targetKey = `dwarf:${ft.obj.d.name}`;
          else if (ft.type === 'comet' && ft.obj.cd) targetKey = `comet:${ft.obj.cd.name}`;
          else if (ft.type === 'probe' && ft.obj.vd) targetKey = `probe:${ft.obj.vd.name}`;
        }
        openTimelapseModal(targetKey);
      });
    }

    if (piBtnOrbit) {
      piBtnOrbit.addEventListener('click', () => {
        const orbitsBtn = document.getElementById('orbits-btn');
        if (orbitsBtn) orbitsBtn.click();
      });
    }

    if (piBtnDeselect) {
      piBtnDeselect.addEventListener('click', () => {
        if (sol.clearFocusSelection) sol.clearFocusSelection();
        const info = sol.infoPanel || document.getElementById('planet-info');
        if (info) info.classList.remove('show');
      });
    }

    // ── 9. Celestial Names & Objects Directory Controller ────────────────────
    const namesDrawer = document.getElementById('nasa-names-drawer');
    const btnCloseNames = document.getElementById('btn-close-names');
    const namesSearchInput = document.getElementById('names-search-input');
    const namesGrid = document.getElementById('nasa-names-grid');
    const chk3DLabels = document.getElementById('chk-3d-labels');
    const filterPills = document.querySelectorAll('.nasa-names-filter-tabs .nasa-filter-pill');
    const labelsOverlay = document.getElementById('nasa-3d-labels-overlay');

    let currentFilter = 'all';
    let currentSearchTerm = '';
    show3DLabels = true;
    if (chk3DLabels) chk3DLabels.checked = true;

    const CELESTIAL_CATALOG = [
      // Major Planets & Sun
      { id: 'sun', name: 'SUN', category: 'planet', color: '#FFE050', type: 'STAR · G2V SPECTRAL CLASS', dist: '0.00 AU', diam: '1,392,700 km', focus: () => sol.focusObject('sun') },
      { id: 'mercury', name: 'MERCURY', category: 'planet', color: '#AAAAAA', type: 'TERRESTRIAL PLANET', dist: '0.39 AU', diam: '4,879 km', focus: () => sol.focusByName('MERCURY') },
      { id: 'venus', name: 'VENUS', category: 'planet', color: '#E8C068', type: 'TERRESTRIAL PLANET', dist: '0.72 AU', diam: '12,104 km', focus: () => sol.focusByName('VENUS') },
      { id: 'earth', name: 'EARTH', category: 'planet', color: '#3377BB', type: 'TERRESTRIAL PLANET · HOME', dist: '1.00 AU', diam: '12,742 km', focus: () => sol.focusByName('EARTH') },
      { id: 'mars', name: 'MARS', category: 'planet', color: '#C1440E', type: 'TERRESTRIAL PLANET', dist: '1.52 AU', diam: '6,779 km', focus: () => sol.focusByName('MARS') },
      { id: 'jupiter', name: 'JUPITER', category: 'planet', color: '#C99040', type: 'GAS GIANT', dist: '5.20 AU', diam: '139,820 km', focus: () => sol.focusByName('JUPITER') },
      { id: 'saturn', name: 'SATURN', category: 'planet', color: '#E4D191', type: 'RINGED GAS GIANT', dist: '9.58 AU', diam: '116,460 km', focus: () => sol.focusByName('SATURN') },
      { id: 'uranus', name: 'URANUS', category: 'planet', color: '#7DCCCC', type: 'ICE GIANT', dist: '19.2 AU', diam: '50,724 km', focus: () => sol.focusByName('URANUS') },
      { id: 'neptune', name: 'NEPTUNE', category: 'planet', color: '#4466FF', type: 'ICE GIANT', dist: '30.1 AU', diam: '49,244 km', focus: () => sol.focusByName('NEPTUNE') },

      // Spacecraft & Observatories
      { id: 'spherex', name: 'SPHEREx', category: 'probe', color: '#22D3EE', type: 'NASA ALL-SKY IR TELESCOPE · 700 KM POLAR', dist: '700 km LEO', diam: '102 BANDS', focus: () => { const b = document.getElementById('fbtn-spherex'); if (b) b.click(); else window.SPHEREx?.focusSpherex?.(); } },
      { id: 'neossat', name: 'NEOSSat (CSA)', category: 'probe', color: '#FF6B6B', type: 'CSA ASTEROID TRACKER · 720 KM POLAR', dist: '720 km LEO', diam: '15 cm TEL', focus: () => { if (window.SPHEREx?.focusNeossat) window.SPHEREx.focusNeossat(); else document.getElementById('fbtn-neossat')?.click(); } },
      { id: 'voyager1', name: 'VOYAGER 1', category: 'probe', color: '#AADDFF', type: 'INTERSTELLAR PROBE · HELIOPAUSE', dist: '162+ AU', diam: 'LAUNCH 1977', focus: () => sol.focusObject('probe', sol.probes?.find(p => p.vd?.name?.includes('Voyager 1'))) },
      { id: 'voyager2', name: 'VOYAGER 2', category: 'probe', color: '#FFDDAA', type: 'INTERSTELLAR PROBE · HELIOSPHERE', dist: '136+ AU', diam: 'LAUNCH 1977', focus: () => sol.focusObject('probe', sol.probes?.find(p => p.vd?.name?.includes('Voyager 2'))) },

      // Dwarf Planets
      { id: 'ceres', name: '1 CERES', category: 'dwarf', color: '#998877', type: 'ASTEROID BELT DWARF PLANET', dist: '2.77 AU', diam: '939 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'CERES')) },
      { id: 'pluto', name: 'PLUTO', category: 'dwarf', color: '#BBAA88', type: 'KUIPER BELT DWARF PLANET', dist: '39.5 AU', diam: '2,376 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'PLUTO')) },
      { id: 'eris', name: 'ERIS', category: 'dwarf', color: '#CCCCCC', type: 'SCATTERED DISC DWARF PLANET', dist: '67.7 AU', diam: '2,326 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'ERIS')) },
      { id: 'makemake', name: 'MAKEMAKE', category: 'dwarf', color: '#BB9966', type: 'KUIPER BELT DWARF PLANET', dist: '45.8 AU', diam: '1,430 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'MAKEMAKE')) },
      { id: 'haumea', name: 'HAUMEA', category: 'dwarf', color: '#DDDDCC', type: 'FAST-SPINNING ELONGATED DWARF', dist: '43.2 AU', diam: '1,595 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'HAUMEA')) },
      { id: 'sedna', name: 'SEDNA', category: 'dwarf', color: '#CC6644', type: 'EXTREME TRANS-NEPTUNIAN OBJECT', dist: '85.5 AU', diam: '995 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'SEDNA')) },
      { id: 'gonggong', name: 'GONGGONG', category: 'dwarf', color: '#AA8877', type: 'RESONANT TNO DWARF PLANET', dist: '88.7 AU', diam: '1,230 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'GONGGONG')) },
      { id: 'quaoar', name: 'QUAOAR', category: 'dwarf', color: '#997766', type: 'CUBEWANO DWARF PLANET', dist: '43.7 AU', diam: '1,110 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'QUAOAR')) },
      { id: 'orcus', name: 'ORCUS', category: 'dwarf', color: '#888899', type: 'PLUTINO MINOR PLANET', dist: '39.4 AU', diam: '910 km', focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'ORCUS')) },

      // Comets
      { id: 'halley', name: "HALLEY'S", category: 'comet', color: '#AADDFF', type: '1P/HALLEY PERIODIC COMET', dist: '0.59–35 AU', diam: '11 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === "Halley's")) },
      { id: 'halebopp', name: 'HALE-BOPP', category: 'comet', color: '#CCEEFF', type: 'C/1995 O1 GREAT COMET', dist: '0.91–370 AU', diam: '60 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'Hale-Bopp')) },
      { id: 'hyakutake', name: 'HYAKUTAKE', category: 'comet', color: '#BBEEFF', type: 'C/1996 B2 LONG-PERIOD COMET', dist: '0.23–3400 AU', diam: '4.2 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'Hyakutake')) },
      { id: 'encke', name: 'ENCKE', category: 'comet', color: '#DDEEAA', type: '2P/ENCKE SHORT-PERIOD COMET', dist: '0.33–4.1 AU', diam: '4.8 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'Encke')) },
      { id: '67p', name: '67P/C-G', category: 'comet', color: '#BBBBAA', type: '67P/CHURYUMOV-GERASIMENKO', dist: '1.24–5.7 AU', diam: '4.1 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === '67P/C-G')) },
      { id: 'tempel1', name: 'TEMPEL 1', category: 'comet', color: '#CCBBAA', type: '9P/TEMPEL 1 DEEP IMPACT TARGET', dist: '1.54–5.4 AU', diam: '6.0 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'Tempel 1')) },
      { id: 'wild2', name: 'WILD 2', category: 'comet', color: '#BBCCAA', type: '81P/WILD 2 STARDUST MISSION', dist: '1.60–5.3 AU', diam: '5.5 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'Wild 2')) },
      { id: 'sl9', name: 'SHOEMAKER-LEVY 9', category: 'comet', color: '#DDCCBB', type: 'D/1993 F2 JUPITER COLLISION', dist: 'COLLIDED 1994', diam: 'FRAGMENTS', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'Shoemaker-Levy 9')) },
      { id: 'neowise', name: 'NEOWISE', category: 'comet', color: '#AADDEE', type: 'C/2020 F3 RETROGRADE COMET', dist: '0.29–715 AU', diam: '5.0 km', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'NEOWISE')) },
      { id: 'ikeyaseki', name: 'IKEYA-SEKI', category: 'comet', color: '#FFEEBB', type: 'C/1965 S1 KREUTZ SUNGRAZER', dist: '0.008–183 AU', diam: 'SUN-GRAZER', focus: () => sol.focusObject('comet', sol.comets?.find(c => c.cd.name === 'Ikeya-Seki')) },

      // SPHEREx Benchmark & Discovery Targets
      { id: 'wise0855', name: 'WISE 0855-0714', category: 'spherex', color: '#22D3EE', type: 'SUB-STELLAR BROWN DWARF (Y2)', dist: '7.27 ly · H2O ICE', diam: '250 K TEMP', focus: () => { window.SphereSkyViewer?.selectTarget?.('wise-0855'); window.SphereSkyViewer?.open?.(); } },
      { id: 'barnard', name: "BARNARD'S STAR", category: 'spherex', color: '#FF7766', type: 'HIGH PROPER MOTION STAR (10.3″/YR)', dist: '5.96 ly', diam: 'M4.0V RED DWARF', focus: () => { window.SphereSkyViewer?.selectTarget?.('barnards-star'); window.SphereSkyViewer?.open?.(); } },
      { id: 'epsindi', name: 'EPSILON INDI B', category: 'spherex', color: '#E0A526', type: 'BINARY BROWN DWARF SYSTEM (T1+T6)', dist: '11.8 ly', diam: 'DUAL DWARF', focus: () => { window.SphereSkyViewer?.selectTarget?.('eps-indi-b'); window.SphereSkyViewer?.open?.(); } },
      { id: 'rwaur', name: 'RW AURIGAE', category: 'spherex', color: '#FFAA44', type: 'ACTIVE T TAURI VARIABLE STAR', dist: '530 ly', diam: 'YSO PROTO-STAR', focus: () => { window.SphereSkyViewer?.selectTarget?.('rw-aurigae'); window.SphereSkyViewer?.open?.(); } },
      { id: 'rdraconis', name: 'R DRACONIS', category: 'spherex', color: '#EE5577', type: 'MIRA-TYPE PULSATING VARIABLE STAR', dist: '2,100 ly', diam: 'PERIOD 245d', focus: () => { window.SphereSkyViewer?.selectTarget?.('r-draconis'); window.SphereSkyViewer?.open?.(); } },
      { id: 'spx0002', name: 'SPX-MOV-0002', category: 'spherex', color: '#22D3EE', type: 'SPHEREx FAST-MOVING ASTEROID CANDIDATE', dist: '1.42 AU · SCORE 98.4%', diam: 'DIFFERENCE HIT', focus: () => { document.getElementById('fbtn-cand-unknown')?.click(); } },
      { id: 'spx0003', name: 'SPX-MOV-0003', category: 'spherex', color: '#22D3EE', type: 'SPHEREx TRANS-NEPTUNIAN CANDIDATE', dist: '41.8 AU · SCORE 95.1%', diam: 'SNR 24.2', focus: () => { document.getElementById('btn-tool-movers')?.click(); } },
      { id: 'spx0004', name: 'SPX-MOV-0004', category: 'spherex', color: '#E0A526', type: 'SPHEREx HIGH-PM TRANSIENT CANDIDATE', dist: 'SCORE 93.8%', diam: 'SNR 19.5', focus: () => { document.getElementById('btn-tool-movers')?.click(); } },
      { id: 'spx0005', name: 'SPX-MOV-0005', category: 'spherex', color: '#E0A526', type: 'SPHEREx INFRARED VARIABLE CANDIDATE', dist: 'SCORE 91.2%', diam: 'SNR 18.0', focus: () => { document.getElementById('btn-tool-movers')?.click(); } }
    ];

    function renderNamesDirectory() {
      if (!namesGrid) return;
      namesGrid.innerHTML = '';

      const term = currentSearchTerm.trim().toLowerCase();
      const filtered = CELESTIAL_CATALOG.filter(item => {
        const matchCategory = currentFilter === 'all' || item.category === currentFilter;
        if (!matchCategory) return false;
        if (!term) return true;
        return item.name.toLowerCase().includes(term) ||
               item.type.toLowerCase().includes(term) ||
               (item.dist && item.dist.toLowerCase().includes(term)) ||
               (item.diam && item.diam.toLowerCase().includes(term));
      });

      if (filtered.length === 0) {
        namesGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align:center; padding:32px 16px; color:#64748b; font-size:12px; letter-spacing:1px;">
            NO CELESTIAL BODIES FOUND MATCHING "${term.toUpperCase()}"
          </div>
        `;
        return;
      }

      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'nasa-name-card';
        card.setAttribute('data-id', item.id);
        card.setAttribute('data-category', item.category);

        card.innerHTML = `
          <div class="nasa-name-info">
            <div class="nasa-name-dot" style="background:${item.color};"></div>
            <div class="nasa-name-text">
              <span class="nasa-name-title">${item.name}</span>
              <span class="nasa-name-meta">${item.type}</span>
            </div>
          </div>
          <button type="button" class="nasa-name-action" title="Focus ${item.name} in 3D">⊕ FOCUS</button>
        `;

        card.addEventListener('mouseenter', () => {
          if (typeof window.SOL_APP?.highlightTrajectory === 'function') {
            window.SOL_APP.highlightTrajectory(item.name);
          }
        });
        card.addEventListener('mouseleave', () => {
          if (typeof window.SOL_APP?.unhighlightTrajectory === 'function') {
            window.SOL_APP.unhighlightTrajectory();
          }
        });

        card.addEventListener('click', () => {
          if (typeof item.focus === 'function') {
            item.focus();
          }
          // Highlight active card
          document.querySelectorAll('.nasa-name-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          if (window.innerWidth < 768) {
            namesDrawer?.classList.remove('open');
            btnToolNames?.classList.remove('active');
          }
        });

        namesGrid.appendChild(card);
      });
    }

    function toggleNamesDrawer() {
      if (!namesDrawer) return;
      const isOpen = namesDrawer.classList.toggle('open');
      if (btnSearch) btnSearch.classList.toggle('active', isOpen);
      if (isOpen) {
        renderNamesDirectory();
        namesSearchInput?.focus();
      }
    }

    if (btnCloseNames) {
      btnCloseNames.addEventListener('click', () => {
        namesDrawer?.classList.remove('open');
        if (btnSearch) btnSearch.classList.remove('active');
      });
    }

    if (namesSearchInput) {
      namesSearchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        renderNamesDirectory();
      });
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.getAttribute('data-filter') || 'all';
        renderNamesDirectory();
      });
    });

    // Close names drawer on outside click
    document.addEventListener('click', (e) => {
      if (namesDrawer && namesDrawer.classList.contains('open')) {
        if (!namesDrawer.contains(e.target) &&
            e.target !== btnSearch && !btnSearch?.contains(e.target)) {
          namesDrawer.classList.remove('open');
          if (btnSearch) btnSearch.classList.remove('active');
        }
      }
    });

    // Initial render of directory items
    renderNamesDirectory();

    // ── 10. Dynamic 3D Celestial Map Labels Controller ──────────────────────
    const LABEL_BODIES = [
      { id: 'SUN', name: 'SUN', color: '#FFE050', getPos: () => sol.sunMesh ? sol.sunMesh.getWorldPosition(new THREE.Vector3()) : null, focus: () => sol.focusObject('sun') },
      { id: 'MERCURY', name: 'MERCURY', color: '#90CAF9', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='MERCURY')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('MERCURY') },
      { id: 'VENUS', name: 'VENUS', color: '#FFE082', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='VENUS')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('VENUS') },
      { id: 'EARTH', name: 'EARTH', color: '#00E5FF', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='EARTH')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('EARTH') },
      { id: 'MARS', name: 'MARS', color: '#FF5D38', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='MARS')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('MARS') },
      { id: 'JUPITER', name: 'JUPITER', color: '#FFAA33', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='JUPITER')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('JUPITER') },
      { id: 'SATURN', name: 'SATURN', color: '#F5E29E', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='SATURN')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('SATURN') },
      { id: 'URANUS', name: 'URANUS', color: '#4DEEEA', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='URANUS')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('URANUS') },
      { id: 'NEPTUNE', name: 'NEPTUNE', color: '#2979FF', getPos: () => sol.planets?.find(p=>p.d && p.d.name==='NEPTUNE')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusByName('NEPTUNE') },
      { id: 'CERES', name: 'CERES', color: '#E2E8F0', getPos: () => sol.dwarfs?.find(d => d.d.name === 'CERES')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'CERES')) },
      { id: 'PLUTO', name: 'PLUTO', color: '#E0AAFF', getPos: () => sol.dwarfs?.find(d => d.d.name === 'PLUTO')?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusObject('dwarf', sol.dwarfs?.find(d => d.d.name === 'PLUTO')) },
      { id: 'SPHEREX', name: 'SPHEREx', color: '#00E5FF', getPos: () => window.SPHEREx?.probeMesh ? window.SPHEREx.probeMesh.getWorldPosition(new THREE.Vector3()) : null, focus: () => document.getElementById('fbtn-spherex')?.click() },
      { id: 'NEOSSAT', name: 'NEOSSat', color: '#FF6B6B', getPos: () => window.SPHEREx?.neossatMesh ? window.SPHEREx.neossatMesh.getWorldPosition(new THREE.Vector3()) : null, focus: () => window.SPHEREx?.focusNeossat?.() },
      { id: 'VOYAGER 1', name: 'Voyager 1', color: '#AADDFF', getPos: () => sol.probes?.find(p => p.vd?.name?.includes('Voyager 1'))?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusObject('probe', sol.probes?.find(p => p.vd?.name?.includes('Voyager 1'))) },
      { id: 'VOYAGER 2', name: 'Voyager 2', color: '#FFDDAA', getPos: () => sol.probes?.find(p => p.vd?.name?.includes('Voyager 2'))?.mesh?.getWorldPosition(new THREE.Vector3()), focus: () => sol.focusObject('probe', sol.probes?.find(p => p.vd?.name?.includes('Voyager 2'))) }
    ];

    const labelElements = new Map();
    if (labelsOverlay) {
      LABEL_BODIES.forEach(item => {
        const el = document.createElement('div');
        el.className = 'nasa-3d-label';
        el.style.display = 'none';
        el.innerHTML = `<span class="label-dot" style="background:${item.color};"></span><span>${item.name}</span>`;
        el.addEventListener('mouseenter', () => {
          if (typeof window.SOL_APP?.highlightTrajectory === 'function') {
            window.SOL_APP.highlightTrajectory(item.id);
          }
        });
        el.addEventListener('mouseleave', () => {
          if (typeof window.SOL_APP?.unhighlightTrajectory === 'function') {
            window.SOL_APP.unhighlightTrajectory();
          }
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          item.focus();
        });
        labelsOverlay.appendChild(el);
        labelElements.set(item.id, el);
      });
    }

    if (chk3DLabels) {
      chk3DLabels.addEventListener('change', (e) => {
        show3DLabels = e.target.checked;
        if (!show3DLabels) {
          labelElements.forEach(el => { el.style.display = 'none'; });
        }
      });
    }

    function update3DMapLabels() {
      requestAnimationFrame(update3DMapLabels);
      if (!show3DLabels || !sol.camera) {
        if (!show3DLabels) {
          labelElements.forEach(el => { el.style.display = 'none'; });
        }
        return;
      }

      const isTrajMode = typeof sol.isTrajectoryMode === 'function' ? sol.isTrajectoryMode() : true;
      const activeHoveredName = (isTrajMode && typeof sol.getHoveredBodyName === 'function') ? sol.getHoveredBodyName() : null;

      LABEL_BODIES.forEach(item => {
        const el = labelElements.get(item.id);
        if (!el) return;

        // Check if this body is currently hovered/highlighted by trajectory inspection
        const isHighlighted = isTrajMode && activeHoveredName && (
          item.id.toUpperCase() === activeHoveredName.toUpperCase() ||
          item.name.toUpperCase() === activeHoveredName.toUpperCase() ||
          activeHoveredName.toUpperCase().includes(item.id.toUpperCase()) ||
          item.id.toUpperCase().includes(activeHoveredName.toUpperCase())
        );

        if (isHighlighted) {
          el.classList.add('trajectory-highlighted');
          el.style.setProperty('--traj-color', item.color || '#00E5FF');
        } else {
          el.classList.remove('trajectory-highlighted');
        }

        const worldPos = item.getPos();
        if (!worldPos) {
          el.style.display = 'none';
          return;
        }

        const screenV = worldPos.clone().project(sol.camera);
        if (screenV.z > 1.0 || screenV.z < -1.0) {
          el.style.display = 'none';
          return;
        }

        const sx = (screenV.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-screenV.y * 0.5 + 0.5) * window.innerHeight;

        if (sx < -40 || sx > window.innerWidth + 40 || sy < -40 || sy > window.innerHeight + 40) {
          el.style.display = 'none';
          return;
        }

        el.style.left = `${Math.round(sx)}px`;
        el.style.top = `${Math.round(sy)}px`;
        el.style.display = 'flex';
      });
    }
    update3DMapLabels();

    // ── 11. Global Keyboard Shortcuts ────────────────────────────────────────
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      const key = e.key.toLowerCase();
      if (key === 'n' || key === '/') {
        e.preventDefault();
        toggleNamesDrawer();
      } else if (key === 't') {
        e.preventDefault();
        const nextState = typeof sol.toggleTrajectoryMode === 'function' ? sol.toggleTrajectoryMode() : true;
        syncTrajectoryModeUI(nextState);
      } else if (key === 'h') {
        e.preventDefault();
        toggleStoriesSidebar();
      } else if (key === 'l') {
        e.preventDefault();
        if (layersPopover) {
          const isShown = layersPopover.style.display === 'flex';
          layersPopover.style.display = isShown ? 'none' : 'flex';
          if (btnToolLayers) btnToolLayers.classList.toggle('active', !isShown);
        }
      } else if (key === 'k') {
        e.preventDefault();
        if (window.SphereSkyViewer?.open) window.SphereSkyViewer.open();
      } else if (key === 'i') {
        e.preventDefault();
        const irsaModal = document.getElementById('nasa-irsa-resources-modal');
        if (irsaModal) irsaModal.style.display = (irsaModal.style.display === 'block') ? 'none' : 'block';
      } else if (key === 'v') {
        e.preventDefault();
        if (cameraPopover) {
          const isShown = cameraPopover.style.display === 'flex';
          cameraPopover.style.display = isShown ? 'none' : 'flex';
          if (btnToolCamera) btnToolCamera.classList.toggle('active', !isShown);
        }
      } else if (key === 'arrowup') {
        if (sol.panCamera) sol.panCamera(0, 0.5);
      } else if (key === 'arrowdown') {
        if (sol.panCamera) sol.panCamera(0, -0.5);
      } else if (key === 'arrowleft') {
        if (sol.panCamera) sol.panCamera(-0.5, 0);
      } else if (key === 'arrowright') {
        if (sol.panCamera) sol.panCamera(0.5, 0);
      }
    });
  }
})();
