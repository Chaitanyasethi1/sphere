"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { DESIGN_TOKENS } from "@/design/tokens";

interface SolarSystemOrbits3DProps {
  showLabels?: boolean;
}

export function SolarSystemOrbits3D({ showLabels = true }: SolarSystemOrbits3DProps) {
  // References for revolving planetary bodies & spacecraft
  const sunCoreRef = useRef<THREE.Mesh>(null);
  const sunCoronaRef = useRef<THREE.Mesh>(null);
  const mercuryRef = useRef<THREE.Group>(null);
  const venusRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Group>(null);
  const earthCloudsRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Group>(null);
  const marsRef = useRef<THREE.Group>(null);
  const jupiterRef = useRef<THREE.Group>(null);
  const jupiterMoonsRef = useRef<THREE.Group>(null);
  const ceresRef = useRef<THREE.Group>(null);
  const voyagerRef = useRef<THREE.Group>(null);
  const clipperRef = useRef<THREE.Group>(null);
  const romanRef = useRef<THREE.Group>(null);
  const parkerRef = useRef<THREE.Group>(null);
  const radioWaveRef = useRef<THREE.Group>(null);

  const obliquity = (23.43928 * Math.PI) / 180;

  // 1. Orbital ellipses for the planets (thin "littler" lines with NASA Eyes colors)
  const orbitLines = useMemo(() => {
    const segments = 144;
    const orbits = [
      { name: "mercury", a: 7.5, b: 7.2, e: 0.2056, color: DESIGN_TOKENS.colors.orbits.mercury }, // #a278b5
      { name: "venus", a: 12.5, b: 12.4, e: 0.0068, color: DESIGN_TOKENS.colors.orbits.venus },   // #e8d5a3
      { name: "earth", a: 18.0, b: 17.9, e: 0.0167, color: DESIGN_TOKENS.colors.orbits.earth },   // #68a8cf
      { name: "mars", a: 25.5, b: 25.1, e: 0.0934, color: DESIGN_TOKENS.colors.orbits.mars },     // #d96b43
      { name: "ceres", a: 32.0, b: 31.8, e: 0.0758, color: "#d4a373" },                           // Asteroid Belt
      { name: "jupiter", a: 44.0, b: 43.8, e: 0.0489, color: DESIGN_TOKENS.colors.orbits.jupiter },// #cca06a
    ];

    return orbits.map((o) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const lx = o.a * Math.cos(theta) - o.a * o.e;
        const lz = o.b * Math.sin(theta);
        const x = lx;
        const y = lz * Math.sin(obliquity);
        const z = lz * Math.cos(obliquity);
        points.push(new THREE.Vector3(x, y, z));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({
          color: o.color,
          transparent: true,
          opacity: 0.65,
          linewidth: 1,
        })
      );

      return { name: o.name, line, a: o.a, b: o.b, e: o.e };
    });
  }, [obliquity]);

  // 2. Spacecraft Trajectory Curves
  const spacecraftTrajectories = useMemo(() => {
    // Parker Solar Probe eccentric solar dive
    const pPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const theta = (i / 120) * Math.PI * 2;
      const lx = 9.8 * Math.cos(theta) - 9.8 * 0.72;
      const lz = 5.2 * Math.sin(theta);
      const x = lx;
      const y = lz * Math.sin(obliquity + 0.1);
      const z = lz * Math.cos(obliquity + 0.1);
      pPoints.push(new THREE.Vector3(x, y, z));
    }
    const parkerLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pPoints),
      new THREE.LineBasicMaterial({
        color: DESIGN_TOKENS.colors.orbits.parker, // #cbd5e1 silver
        transparent: true,
        opacity: 0.65,
        linewidth: 1,
      })
    );

    // Voyager 1 Hyperbolic Escape Path
    const vPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const dist = 20 + i * 0.9;
      const angle = 2.4 + (i / 60) * 0.45;
      const x = dist * Math.cos(angle);
      const y = (dist * 0.35 + i * 0.2) * Math.sin(obliquity + 0.35);
      const z = dist * Math.sin(angle) * Math.cos(obliquity);
      vPoints.push(new THREE.Vector3(x, y, z));
    }
    const voyagerLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(vPoints),
      new THREE.LineBasicMaterial({
        color: "#d4a373",
        transparent: true,
        opacity: 0.7,
        linewidth: 1,
      })
    );

    // Europa Clipper Transfer Trajectory
    const cPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const rad = 18.0 + t * 24.0;
      const ang = 0.8 + t * 3.8;
      const x = rad * Math.cos(ang);
      const y = rad * Math.sin(ang) * Math.sin(obliquity);
      const z = rad * Math.sin(ang) * Math.cos(obliquity);
      cPoints.push(new THREE.Vector3(x, y, z));
    }
    const clipperLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(cPoints),
      new THREE.LineBasicMaterial({
        color: "#68a8cf",
        transparent: true,
        opacity: 0.65,
        linewidth: 1,
      })
    );

    return { parkerLine, voyagerLine, clipperLine };
  }, [obliquity]);

  // 3. Asteroid Belt Particles (Thousands of delicate micro-asteroids)
  const asteroidBeltPoints = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 30.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const inclination = (Math.random() - 0.5) * 1.8;
      const lx = r * Math.cos(theta);
      const lz = r * Math.sin(theta);
      const x = lx;
      const y = lz * Math.sin(obliquity) + inclination;
      const z = lz * Math.cos(obliquity);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [obliquity]);

  // 4. Detailed 3D procedural Asteroid geometry for 1 Ceres
  const ceresGeometry = useMemo(() => {
    const geom = new THREE.DodecahedronGeometry(0.55, 2);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + y * y + z * z);
      const noise =
        Math.sin(x * 4.5) * Math.cos(y * 4.2) * 0.15 +
        Math.sin(z * 5.1 + y * 2.8) * 0.1;
      const factor = (dist + noise) / dist;
      pos.setXYZ(i, x * factor, y * factor, z * factor);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 5. Continuous Real-time Orbital Revolution Animation (Facing the Sun)
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Pulse & Rotate Sun Core & Corona
    if (sunCoreRef.current) {
      sunCoreRef.current.rotation.y += delta * 0.08;
    }
    if (sunCoronaRef.current) {
      sunCoronaRef.current.rotation.z -= delta * 0.04;
      const pulse = 1.0 + Math.sin(t * 2.2) * 0.04;
      sunCoronaRef.current.scale.set(pulse, pulse, pulse);
    }

    // Helper to calculate orbital position on inclined ellipse
    const calcOrbitalPos = (a: number, b: number, e: number, angle: number) => {
      const lx = a * Math.cos(angle) - a * e;
      const lz = b * Math.sin(angle);
      return new THREE.Vector3(
        lx,
        lz * Math.sin(obliquity),
        lz * Math.cos(obliquity)
      );
    };

    // 1. Mercury revolving
    if (mercuryRef.current) {
      const angle = t * 0.42;
      const pos = calcOrbitalPos(7.5, 7.2, 0.2056, angle);
      mercuryRef.current.position.copy(pos);
      mercuryRef.current.rotation.y += delta * 0.5;
    }

    // 2. Venus revolving
    if (venusRef.current) {
      const angle = t * 0.28 + 1.2;
      const pos = calcOrbitalPos(12.5, 12.4, 0.0068, angle);
      venusRef.current.position.copy(pos);
      venusRef.current.rotation.y += delta * 0.3;
    }

    // 3. Earth & Moon revolving
    if (earthRef.current) {
      const angle = t * 0.18 + 2.5;
      const pos = calcOrbitalPos(18.0, 17.9, 0.0167, angle);
      earthRef.current.position.copy(pos);
      earthRef.current.rotation.y += delta * 0.8; // Earth diurnal rotation
      if (earthCloudsRef.current) {
        earthCloudsRef.current.rotation.y += delta * 1.1; // Cloud rotation
      }

      // Moon revolving around Earth
      if (moonRef.current) {
        const moonAngle = t * 1.5;
        moonRef.current.position.set(
          Math.cos(moonAngle) * 1.6,
          Math.sin(moonAngle) * 0.3,
          Math.sin(moonAngle) * 1.6
        );
      }
    }

    // 4. Mars revolving
    if (marsRef.current) {
      const angle = t * 0.12 + 0.4;
      const pos = calcOrbitalPos(25.5, 25.1, 0.0934, angle);
      marsRef.current.position.copy(pos);
      marsRef.current.rotation.y += delta * 0.7;
    }

    // 5. 1 Ceres revolving in Asteroid Belt
    if (ceresRef.current) {
      const angle = t * 0.09 + 3.8;
      const pos = calcOrbitalPos(32.0, 31.8, 0.0758, angle);
      ceresRef.current.position.copy(pos);
      ceresRef.current.rotation.y += delta * 0.6;
    }

    // 6. Jupiter revolving
    if (jupiterRef.current) {
      const angle = t * 0.05 + 5.1;
      const pos = calcOrbitalPos(44.0, 43.8, 0.0489, angle);
      jupiterRef.current.position.copy(pos);
      jupiterRef.current.rotation.y += delta * 0.9;
    }

    // 7. Spacecraft dynamic motion
    // Parker Solar Probe
    if (parkerRef.current) {
      const pAngle = t * 0.55;
      const lx = 9.8 * Math.cos(pAngle) - 9.8 * 0.72;
      const lz = 5.2 * Math.sin(pAngle);
      parkerRef.current.position.set(
        lx,
        lz * Math.sin(obliquity + 0.1),
        lz * Math.cos(obliquity + 0.1)
      );
      parkerRef.current.lookAt(0, 0, 0); // Heat shield always faces Sun!
    }

    // Voyager 1
    if (voyagerRef.current) {
      const vDist = 58 + Math.sin(t * 0.05) * 2;
      const vAngle = 2.55;
      voyagerRef.current.position.set(
        vDist * Math.cos(vAngle),
        (vDist * 0.35) * Math.sin(obliquity + 0.35),
        vDist * Math.sin(vAngle) * Math.cos(obliquity)
      );
      voyagerRef.current.lookAt(0, 0, 0); // Antenna aims back toward Earth & Sun!
    }

    // Voyager Radio Wave Pulse
    if (radioWaveRef.current) {
      radioWaveRef.current.rotation.z += delta * 3.5;
      const waveScale = 1.0 + Math.sin(t * 4.0) * 0.15;
      radioWaveRef.current.scale.set(waveScale, waveScale, waveScale);
    }

    // Europa Clipper
    if (clipperRef.current) {
      const cAngle = t * 0.14 + 1.8;
      const cDist = 21.0;
      clipperRef.current.position.set(
        cDist * Math.cos(cAngle),
        cDist * Math.sin(cAngle) * Math.sin(obliquity),
        cDist * Math.sin(cAngle) * Math.cos(obliquity)
      );
      clipperRef.current.rotation.y += delta * 0.2;
    }

    // Roman Space Telescope (L2 orbit)
    if (romanRef.current) {
      const rAngle = t * 0.18 + 2.5;
      const rDist = 19.8;
      romanRef.current.position.set(
        rDist * Math.cos(rAngle),
        rDist * Math.sin(rAngle) * Math.sin(obliquity),
        rDist * Math.sin(rAngle) * Math.cos(obliquity)
      );
      romanRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <group name="solar-system-realistic">
      {/* ========================================================
          1. CENTRAL SUN WITH LUMINOUS CORONA & INTENSE LIGHTING
          ======================================================== */}
      <group position={[0, 0, 0]}>
        {/* Core Solar Sphere */}
        <mesh ref={sunCoreRef}>
          <sphereGeometry args={[1.8, 36, 36]} />
          <meshBasicMaterial color="#fffbe6" />
        </mesh>

        {/* Pulsing Coronal Atmosphere Shell */}
        <mesh ref={sunCoronaRef}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial
            color="#ffb830"
            transparent
            opacity={0.45}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Outer Solar Flare Glow Aura */}
        <mesh>
          <sphereGeometry args={[3.8, 24, 24]} />
          <meshBasicMaterial
            color="#ff9900"
            transparent
            opacity={0.18}
            side={THREE.BackSide}
          />
        </mesh>

        {/* High-intensity omnidirectional solar illumination */}
        <pointLight color="#fff7d6" intensity={4.5} distance={300} decay={1.2} />

        {showLabels && (
          <Html position={[0, 2.8, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-bold text-xs tracking-[0.25em] text-[#ffea78] uppercase drop-shadow-[0_2px_8px_rgba(255,200,50,0.8)]">
              SUN
            </span>
          </Html>
        )}
      </group>

      {/* ========================================================
          2. DELICATE ORBITAL ELLIPSES ("LITTLER" LINES)
          ======================================================== */}
      {orbitLines.map((o) => (
        <primitive key={`orbit-line-${o.name}`} object={o.line} />
      ))}
      <primitive object={spacecraftTrajectories.parkerLine} />
      <primitive object={spacecraftTrajectories.voyagerLine} />
      <primitive object={spacecraftTrajectories.clipperLine} />

      {/* Asteroid Belt Particle Field */}
      <points geometry={asteroidBeltPoints}>
        <pointsMaterial
          size={0.16}
          color="#d4a373"
          transparent
          opacity={0.55}
          sizeAttenuation
        />
      </points>

      {/* ========================================================
          3. HIGH-DETAIL 3D PLANETS (Revolving around the Sun)
          ======================================================== */}

      {/* --- MERCURY --- */}
      <group ref={mercuryRef}>
        {/* Cratered Rocky Sphere */}
        <mesh>
          <sphereGeometry args={[0.42, 20, 20]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        {showLabels && (
          <Html position={[0, 1.0, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[10px] tracking-[0.2em] text-[#a278b5] uppercase drop-shadow-md">
              MERCURY
            </span>
          </Html>
        )}
      </group>

      {/* --- VENUS --- */}
      <group ref={venusRef}>
        {/* Swirling Golden-Cream Atmospheric Cloud Sphere */}
        <mesh>
          <sphereGeometry args={[0.6, 24, 24]} />
          <meshStandardMaterial
            color="#e8d5a3"
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        {/* Atmospheric Rim Glow */}
        <mesh>
          <sphereGeometry args={[0.66, 20, 20]} />
          <meshBasicMaterial
            color="#ffe8a8"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
        {showLabels && (
          <Html position={[0, 1.2, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[10px] tracking-[0.2em] text-[#e8d5a3] uppercase drop-shadow-md">
              VENUS
            </span>
          </Html>
        )}
      </group>

      {/* --- EARTH & THE MOON --- */}
      <group ref={earthRef}>
        {/* Blue Oceans & Landmass Surface */}
        <mesh>
          <sphereGeometry args={[0.68, 28, 28]} />
          <meshStandardMaterial
            color="#1d4ed8"
            roughness={0.5}
            metalness={0.15}
          />
        </mesh>

        {/* Continents Green/Brown Relief Patch */}
        <mesh scale={[1.002, 1.002, 1.002]}>
          <dodecahedronGeometry args={[0.68, 2]} />
          <meshStandardMaterial
            color="#15803d"
            roughness={0.8}
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Rotating Cloud Deck Layer */}
        <mesh ref={earthCloudsRef} scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[0.68, 24, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
            roughness={0.9}
          />
        </mesh>

        {/* Atmosphere Blue Rim Glow */}
        <mesh scale={[1.06, 1.06, 1.06]}>
          <sphereGeometry args={[0.68, 20, 20]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.25}
            side={THREE.BackSide}
          />
        </mesh>

        {/* The Moon revolving around Earth */}
        <group ref={moonRef}>
          <mesh>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.95} />
          </mesh>
        </group>

        {showLabels && (
          <Html position={[0, 1.3, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] text-[#68a8cf] uppercase drop-shadow-md">
              EARTH
            </span>
          </Html>
        )}
      </group>

      {/* --- MARS --- */}
      <group ref={marsRef}>
        {/* Red-Orange Ferric Oxide Sphere */}
        <mesh>
          <sphereGeometry args={[0.48, 24, 24]} />
          <meshStandardMaterial
            color="#c2410c"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
        {/* North & South Polar Ice Caps */}
        <mesh position={[0, 0.44, 0]}>
          <sphereGeometry args={[0.16, 12, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.44, 0]}>
          <sphereGeometry args={[0.14, 12, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {showLabels && (
          <Html position={[0, 1.1, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[10px] tracking-[0.2em] text-[#d96b43] uppercase drop-shadow-md">
              MARS
            </span>
          </Html>
        )}
      </group>

      {/* --- 1 CERES (Asteroid Belt Dwarf Planet) --- */}
      <group ref={ceresRef}>
        <mesh geometry={ceresGeometry}>
          <meshStandardMaterial
            color="#64748b"
            roughness={0.9}
            metalness={0.15}
          />
        </mesh>
        {/* Bright Occator Cryovolcanic Faculae (White Spot) */}
        <mesh position={[0.35, 0.2, 0.2]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        {showLabels && (
          <Html position={[0, 1.0, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[9.5px] tracking-[0.2em] text-[#d4a373] uppercase drop-shadow-md">
              1 CERES
            </span>
          </Html>
        )}
      </group>

      {/* --- JUPITER --- */}
      <group ref={jupiterRef}>
        {/* Main Banded Giant Sphere */}
        <mesh scale={[1.0, 0.94, 1.0]}>
          <sphereGeometry args={[1.25, 32, 32]} />
          <meshStandardMaterial
            color="#d97706"
            roughness={0.7}
          />
        </mesh>

        {/* Great Red Spot Storm */}
        <mesh position={[0.7, -0.3, 0.9]}>
          <sphereGeometry args={[0.22, 12, 8]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.6} />
        </mesh>

        {/* Equatorial Belt Rings */}
        <mesh scale={[1.002, 0.25, 1.002]}>
          <sphereGeometry args={[1.25, 32, 12]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>

        {/* 4 Galilean Moons (Io, Europa, Ganymede, Callisto) */}
        <group ref={jupiterMoonsRef}>
          {[-2.2, -1.8, 2.0, 2.6].map((dist, idx) => (
            <mesh key={`galilean-${idx}`} position={[dist, 0, (idx % 2) * 0.4]}>
              <sphereGeometry args={[0.08 + idx * 0.02, 8, 8]} />
              <meshStandardMaterial color={idx === 1 ? "#38bdf8" : "#fef08a"} />
            </mesh>
          ))}
        </group>

        {showLabels && (
          <Html position={[0, 1.9, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[11px] tracking-[0.2em] text-[#cca06a] uppercase drop-shadow-md">
              JUPITER
            </span>
          </Html>
        )}
      </group>

      {/* ========================================================
          4. DETAILED 3D SPACECRAFT MODELS (With NASA Eyes Art)
          ======================================================== */}

      {/* --- VOYAGER 1 (With Iconic Golden Spiral Radio Wave) --- */}
      <group ref={voyagerRef}>
        {/* Parabolic High-Gain Antenna Dish */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.75, 0.25, 24, 1, true]} />
          <meshStandardMaterial
            color="#f1f5f9"
            side={THREE.DoubleSide}
            roughness={0.4}
          />
        </mesh>
        {/* Subreflector feed horn */}
        <mesh position={[0, 0, 0.35]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#d4a373" />
        </mesh>

        {/* Gold Thermal Blanket Bus */}
        <mesh position={[0, 0, -0.25]}>
          <boxGeometry args={[0.4, 0.4, 0.3]} />
          <meshStandardMaterial
            color="#d97706"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        {/* Golden RTG Nuclear Power Boom */}
        <mesh position={[0.7, 0, -0.2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
          <meshStandardMaterial color="#cca06a" metalness={0.8} />
        </mesh>

        {/* Magnetometer Boom */}
        <mesh position={[-0.8, 0, -0.2]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>

        {/* Animated Golden Spiral Radio Wave Beam shooting from antenna */}
        <group ref={radioWaveRef} position={[0, 0, 0.8]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.03, 8, 24]} />
            <meshBasicMaterial color="#fde047" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.025, 8, 24]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.05, 0.02, 8, 24]} />
            <meshBasicMaterial color="#eab308" transparent opacity={0.3} />
          </mesh>
        </group>

        {showLabels && (
          <Html position={[0, 1.2, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[10px] tracking-wider text-[#d4a373] uppercase drop-shadow-md whitespace-nowrap">
              VOYAGER 1 (1 LIGHT-DAY)
            </span>
          </Html>
        )}
      </group>

      {/* --- EUROPA CLIPPER (Massive Solar Wings) --- */}
      <group ref={clipperRef}>
        {/* Central Avionics Bus */}
        <mesh>
          <boxGeometry args={[0.5, 0.45, 0.6]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.3} />
        </mesh>

        {/* Massive Dual Solar Array Wings */}
        <mesh position={[-1.6, 0, 0]}>
          <boxGeometry args={[2.4, 0.03, 0.7]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[1.6, 0, 0]}>
          <boxGeometry args={[2.4, 0.03, 0.7]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.2} />
        </mesh>

        {/* High Gain Antenna Dish */}
        <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.28, 0.08, 16]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {showLabels && (
          <Html position={[0, 1.1, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[10px] tracking-wider text-[#68a8cf] uppercase drop-shadow-md whitespace-nowrap">
              EUROPA CLIPPER
            </span>
          </Html>
        )}
      </group>

      {/* --- ROMAN SPACE TELESCOPE --- */}
      <group ref={romanRef}>
        {/* Cylindrical Optical Assembly Tube */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.25, 0.25, 0.9, 20]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Wrapped Curved Solar Panel Sunshield */}
        <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.28, 0.28, 0.7, 16, 1, true, 0, Math.PI]} />
          <meshStandardMaterial color="#0ea5e9" side={THREE.DoubleSide} />
        </mesh>

        {showLabels && (
          <Html position={[0, 1.0, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[9.5px] tracking-wider text-[#a278b5] uppercase drop-shadow-md whitespace-nowrap">
              ROMAN SPACE TELESCOPE
            </span>
          </Html>
        )}
      </group>

      {/* --- PARKER SOLAR PROBE (Heat Shield Facing Sun) --- */}
      <group ref={parkerRef}>
        {/* Hexagonal White Ceramic Heat Shield */}
        <mesh position={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.06, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>

        {/* Spacecraft Bus in Heat Shield Shadow */}
        <mesh position={[0, 0, -0.15]}>
          <boxGeometry args={[0.25, 0.25, 0.35]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Angled Solar Radiator Wings */}
        <mesh position={[0.38, 0, -0.1]}>
          <boxGeometry args={[0.45, 0.02, 0.2]} />
          <meshStandardMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[-0.38, 0, -0.1]}>
          <boxGeometry args={[0.45, 0.02, 0.2]} />
          <meshStandardMaterial color="#38bdf8" />
        </mesh>

        {showLabels && (
          <Html position={[0, 0.9, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[9.5px] tracking-wider text-slate-300 uppercase drop-shadow-md whitespace-nowrap">
              PARKER SOLAR PROBE
            </span>
          </Html>
        )}
      </group>
    </group>
  );
}
