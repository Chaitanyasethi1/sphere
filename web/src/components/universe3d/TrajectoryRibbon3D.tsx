"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import type { MoverCandidate, EpochInfo } from "@/types";
import { raDecToVector3, CELESTIAL_SPHERE_RADIUS } from "./coords3d";
import { getOrbitColor } from "@/design/tokens";

interface TrajectoryRibbon3DProps {
  movers: MoverCandidate[];
  activeEpochIndex: number;
  epochs: EpochInfo[];
  selectedObjectId: string | null;
}

export function TrajectoryRibbon3D({
  movers,
  activeEpochIndex,
  epochs,
  selectedObjectId,
}: TrajectoryRibbon3DProps) {
  // Generate 3D curve paths and epoch node positions for each mover with individual orbit colors
  const trails = useMemo(() => {
    return movers.map((mover, index) => {
      const isKnown = mover.type === "known";
      const isSelected = mover.object_id === selectedObjectId;
      // Assign distinct authentic NASA Eyes orbit color per candidate
      const primaryColor = getOrbitColor(mover.object_id, index);

      // Sort detections chronologically by date
      const sortedDets = [...mover.detections].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Map each detection to 3D point on the celestial sphere
      const nodes = sortedDets.map((d, nodeIndex) => {
        const pos = raDecToVector3(d.ra, d.dec, CELESTIAL_SPHERE_RADIUS * 0.985);
        return {
          epochId: d.epoch_id,
          index: nodeIndex,
          pos,
          ra: d.ra,
          dec: d.dec,
        };
      });

      // Construct smooth, thin ("littler") curve line between nodes
      let curveLine: THREE.Line | null = null;
      if (nodes.length >= 2) {
        const points = nodes.map((n) => n.pos);
        // CatmullRomCurve3 for organic orbital curvature
        const curve = new THREE.CatmullRomCurve3(points);
        const curvePoints = curve.getPoints(36);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const material = new THREE.LineBasicMaterial({
          color: primaryColor,
          linewidth: 1, // Delicately thin orbital line matching NASA Eyes
          transparent: true,
          opacity: isSelected ? 0.95 : 0.65,
        });
        curveLine = new THREE.Line(lineGeometry, material);
      }

      return {
        moverId: mover.object_id,
        isKnown,
        isSelected,
        primaryColor,
        nodes,
        curveLine,
      };
    });
  }, [movers, selectedObjectId]);

  const activeEpochId = epochs[activeEpochIndex]?.epoch_id;

  return (
    <group name="trajectory-ribbons">
      {trails.map((trail) => {
        const { moverId, primaryColor, nodes, curveLine, isSelected } = trail;

        return (
          <group key={`trail-${moverId}`}>
            {/* 1. Continuous 3D Trajectory Ribbon (Delicate and thin) */}
            {curveLine && <primitive object={curveLine} />}

            {/* 2. Delicate Epoch Waypoint Beads along the Trajectory */}
            {nodes.map((node) => {
              const isActive = node.epochId === activeEpochId;
              const nodeSize = isActive ? 0.28 : isSelected ? 0.2 : 0.14;

              return (
                <group key={`node-${moverId}-${node.epochId}`} position={node.pos}>
                  <mesh>
                    <sphereGeometry args={[nodeSize, 12, 12]} />
                    <meshBasicMaterial
                      color={isActive ? "#ffffff" : primaryColor}
                    />
                  </mesh>

                  {/* Active Epoch Pulse Ring */}
                  {isActive && (
                    <mesh>
                      <ringGeometry args={[0.35, 0.48, 16]} />
                      <meshBasicMaterial
                        color={primaryColor}
                        side={THREE.DoubleSide}
                        transparent
                        opacity={0.85}
                      />
                    </mesh>
                  )}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
