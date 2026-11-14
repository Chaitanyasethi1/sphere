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

    // ── 1. Connect Header Actions ───────────────────────────────────────────
    const btnSearch = document.getElementById('btn-head-search');
    const btnShare = document.getElementById('btn-head-share');
    const btnMenu = document.getElementById('btn-head-menu');
    const menuDrawer = document.getElementById('nasa-menu-drawer');
    const closeMenuBtn = document.getElementById('btn-close-menu');

    if (btnSearch) {
      btnSearch.addEventListener('click', () => {
        const searchInput = sol.searchInputEl || document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
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
            alert('Mission view URL copied to clipboard!');
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

    if (toggleStoriesBtn && storiesPanel) {
      toggleStoriesBtn.addEventListener('click', () => {
        storiesPanel.classList.add('collapsed');
        if (storiesToggleTab) storiesToggleTab.style.display = 'flex';
      });
    }

    if (storiesToggleTab && storiesPanel) {
      storiesToggleTab.addEventListener('click', () => {
        storiesPanel.classList.remove('collapsed');
        storiesToggleTab.style.display = 'none';
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

    // ── 9. Global Keyboard Shortcuts ─────────────────────────────────────────
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      const key = e.key.toLowerCase();
      if (key === 't') {
        e.preventDefault();
        if (timelapseModal && timelapseModal.style.display === 'block') {
          closeTimelapseModal();
        } else {
          openTimelapseModal();
        }
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
