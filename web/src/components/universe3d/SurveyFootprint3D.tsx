"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { raDecToVector3, CELESTIAL_SPHERE_RADIUS } from "./coords3d";

interface SurveyFootprint3DProps {
  centerRa?: number;
  centerDec?: number;
  sizeDeg?: number;
}

export function SurveyFootprint3D({
  centerRa = 269.452,
  centerDec = 66.561,
  sizeDeg = 1.2,
}: SurveyFootprint3DProps) {
  // Compute four corners of the survey footprint in RA/Dec
  const { boundaryLine, centerPos } = useMemo(() => {
    const half = sizeDeg / 2;
    const cosDec = Math.cos((centerDec * Math.PI) / 180);
    const dRa = half / cosDec;
    const dDec = half;

    const corners = [
      { ra: centerRa - dRa, dec: centerDec - dDec },
      { ra: centerRa + dRa, dec: centerDec - dDec },
      { ra: centerRa + dRa, dec: centerDec + dDec },
      { ra: centerRa - dRa, dec: centerDec + dDec },
      { ra: centerRa - dRa, dec: centerDec - dDec }, // loop back
    ];

    const points = corners.map((c) =>
      raDecToVector3(c.ra, c.dec, CELESTIAL_SPHERE_RADIUS * 0.99)
    );

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: "#087EAC", linewidth: 2, transparent: true, opacity: 0.75 })
    );
    const center = raDecToVector3(centerRa, centerDec, CELESTIAL_SPHERE_RADIUS * 0.99);
    const norm = center.clone().normalize();

    return {
      boundaryLine: line,
      centerPos: center,
      normalVector: norm,
    };
  }, [centerRa, centerDec, sizeDeg]);

  return (
    <group name="survey-footprint">
      {/* 1. Translucent Survey Boundary Box */}
      <primitive object={boundaryLine} />

      {/* 2. Survey Center Reticle Target */}
      <group position={centerPos}>
        <mesh>
          <ringGeometry args={[0.3, 0.38, 16]} />
          <meshBasicMaterial
            color="#087EAC"
            side={THREE.DoubleSide}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}
