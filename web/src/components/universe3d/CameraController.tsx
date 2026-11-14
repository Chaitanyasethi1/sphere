"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { MoverCandidate } from "@/types";
import { raDecToVector3, CELESTIAL_SPHERE_RADIUS } from "./coords3d";

interface CameraControllerProps {
  selectedMover: MoverCandidate | null;
  targetRa?: number;
  targetDec?: number;
}

export function CameraController({
  selectedMover,
  targetRa,
  targetDec,
}: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Desired camera target and position for smooth slerp transitions
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  // When selected mover changes, trigger smooth cinematic camera transition
  useEffect(() => {
    if (!controlsRef.current) return;

    if (selectedMover) {
      // Calculate object 3D position on sphere
      const objPos = raDecToVector3(
        selectedMover.ra,
        selectedMover.dec,
        CELESTIAL_SPHERE_RADIUS * 0.985
      );

      // Camera positions along line from center through object, backed off slightly
      const dir = objPos.clone().normalize();
      const desiredCamPos = dir.clone().multiplyScalar(CELESTIAL_SPHERE_RADIUS * 0.72);

      targetLookAt.current.copy(objPos);
      isTransitioning.current = true;

      // Animate controls target and camera smoothly
      const startCamPos = camera.position.clone();
      const startTarget = controlsRef.current.target.clone();
      const startTime = performance.now();
      const duration = 1400; // ms

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1.0, elapsed / duration);
        // Smooth ease-out cubic
        const ease = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(startCamPos, desiredCamPos, ease);
        controlsRef.current?.target.lerpVectors(startTarget, targetLookAt.current, ease);

        if (t < 1.0) {
          requestAnimationFrame(step);
        } else {
          isTransitioning.current = false;
        }
      };

      requestAnimationFrame(step);
    } else if (typeof targetRa === "number" && typeof targetDec === "number") {
      // Focus on coordinate region
      const centerPos = raDecToVector3(targetRa, targetDec, CELESTIAL_SPHERE_RADIUS * 0.985);
      const dir = centerPos.clone().normalize();
      const desiredCamPos = dir.clone().multiplyScalar(CELESTIAL_SPHERE_RADIUS * 0.55);

      targetLookAt.current.copy(centerPos);
      isTransitioning.current = true;

      const startCamPos = camera.position.clone();
      const startTarget = controlsRef.current.target.clone();
      const startTime = performance.now();
      const duration = 1200;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1.0, elapsed / duration);
        const ease = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(startCamPos, desiredCamPos, ease);
        controlsRef.current?.target.lerpVectors(startTarget, targetLookAt.current, ease);

        if (t < 1.0) {
          requestAnimationFrame(step);
        } else {
          isTransitioning.current = false;
        }
      };

      requestAnimationFrame(step);
    }
  }, [selectedMover, targetRa, targetDec, camera]);

  useFrame(() => {
    if (controlsRef.current && !isTransitioning.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.65}
      zoomSpeed={0.85}
      panSpeed={0.5}
      minDistance={6}
      maxDistance={CELESTIAL_SPHERE_RADIUS * 1.3}
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      makeDefault
    />
  );
}
