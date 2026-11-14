# Solar System & Celestial Coordinate Transformation Documentation

## 1. Ephemeris Engine
- **Library**: `astronomy-engine` (v2.1.19)
- **Reference**: Don Cross, Astronomy Engine (https://github.com/cosinekitty/astronomy)
- **Algorithm & Ephemeris Model**: 
  - Planetary positions are calculated using analytical approximations based on **VSOP87** (Variations Séculaires des Orbites Planétaires).
  - Pluto coordinates are derived from numerical fits to the JPL Development Ephemerides (DE405/DE406).
  - Geocentric lunar positions use the **ELP2000-82B** lunar theory.
- **Accuracy Limits**:
  - Inner and outer planets: Typically within $\pm 1$ arcminute of JPL DE405 over years 1900–2100.
  - Pluto: Within ~0.001 AU over the 20th and 21st centuries.
  - Light-travel time and relativistic corrections are omitted in heliocentric geometric coordinates, which is appropriate for macroscopic spatial scene rendering.
- **Offline & Zero Network Guarantee**:
  - The calculation runs 100% client-side with no external network calls, API keys, or remote telemetry fetches.

---

## 2. Coordinate System Transformations & Scene Axes

### 2.1 ICRS / Equatorial J2000 ($EQJ$) to Ecliptic J2000 ($ECL$)
A celestial object with Right Ascension $\alpha$ and Declination $\delta$ in the International Celestial Reference System (ICRS / J2000 Equatorial) corresponds to a unit directional vector:
$$\mathbf{v}_{EQJ} = \begin{pmatrix} \cos \delta \cos \alpha \\ \cos \delta \sin \alpha \\ \sin \delta \end{pmatrix}$$

The transformation from J2000 Mean Equator to J2000 Mean Ecliptic is performed via the standard obliquity rotation matrix $\mathbf{R}_{EQJ \to ECL}$, parameterized by the J2000 obliquity of the ecliptic $\epsilon_0 \approx 23^\circ 26' 21.406''$ ($23.4392911^\circ$):
$$\mathbf{R}_{EQJ \to ECL} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos \epsilon_0 & \sin \epsilon_0 \\ 0 & -\sin \epsilon_0 & \cos \epsilon_0 \end{pmatrix}$$

$$\mathbf{v}_{ECL} = \mathbf{R}_{EQJ \to ECL} \cdot \mathbf{v}_{EQJ}$$

### 2.2 Ecliptic Coordinates to Three.js Scene Coordinates
In standard 3D solar system rendering conventions (and NASA Eyes on the Solar System):
- The **Orbital Plane (Ecliptic)** lies in the horizontal Three.js $(X, Z)$ plane.
- The **North Ecliptic Pole** points in the positive $+Y$ direction.
- The **Vernal Equinox Direction** ($\alpha = 0^\circ, \delta = 0^\circ$) aligns with the positive $+X$ axis.

Therefore, for any heliocentric ecliptic position $\mathbf{p}_{ECL} = (x_{ecl}, y_{ecl}, z_{ecl})$:
$$\mathbf{P}_{ThreeJS} = \begin{pmatrix} X \\ Y \\ Z \end{pmatrix} = \begin{pmatrix} x_{ecl} \\ z_{ecl} \\ -y_{ecl} \end{pmatrix} \quad \text{or} \quad \begin{pmatrix} x_{ecl} \\ z_{ecl} \\ y_{ecl} \end{pmatrix}$$
*(In this implementation, $X = x_{ecl}$, $Y = z_{ecl}$, and $Z = y_{ecl}$ to ensure a standard right-handed orientation).*

---

## 3. Scale Modes: True Scale vs. Schematic Scale

1. **Schematic Scale (Default)**:
   - Planetary distances in our solar system span orders of magnitude: Mercury is at $\approx 0.387$ AU, whereas Neptune is at $\approx 30.1$ AU and Pluto reaches $> 39$ AU.
   - In True Scale, displaying Pluto causes the terrestrial planets (Mercury, Venus, Earth, Mars) to collapse into a sub-pixel clump around the Sun.
   - In Schematic Scale, heliocentric distances $r$ (in AU) are mapped through a non-linear power compression:
     $$r_{schematic} = S_0 \cdot \left(\frac{r}{1.0\text{ AU}}\right)^{0.52}$$
     This maintains the strict ordering and relative spacing while ensuring all planetary orbits from Mercury to Pluto remain clearly legible in a single viewport.
2. **True Scale (Linear AU)**:
   - When toggled, distances are strictly proportional to astronomical units:
     $$r_{true} = S_{base} \cdot r_{\text{AU}}$$

---

## 4. Scientific Honesty & SPHEREx Line-of-Sight Rays

1. **Direction-Only Celestial Rays**:
   - SPHEREx infrared surveys detect candidates via 2D sky coordinates (RA/Dec) and multi-epoch angular proper motion (arcsec/day).
   - Without a known parallax or heliocentric orbit determination, **true physical distance from Earth is unknown**.
   - **Rule**: Candidates and targets are never placed at arbitrary made-up depths in the solar system. Instead, they are rendered as **thin line-of-sight rays originating from Earth** in the direction of their ICRS $(\alpha, \delta)$, terminating at an indicator ring on the outer celestial sphere ($R_{sphere}$).
   - Tooltip & UI readout explicitly states: *"Direction only. Distance unknown."*
2. **Asteroid Belt**:
   - Rendered as a procedural particle swarm between 2.2 AU and 3.2 AU.
   - Clearly labelled as a **Schematic Particle Belt**, not individual real ephemeris asteroids.
3. **SPHEREx Spacecraft**:
   - Operates in a Low-Earth Sun-Synchronous Polar Orbit (~650 km).
   - In the solar system view, it is rendered as a hexagon-marked marker attached to Earth with the label: *"SPHEREx Spacecraft (LEO Sun-Synchronous Orbit)"*.

