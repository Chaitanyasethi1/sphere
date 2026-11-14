"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface CameraControllerProps {
  flyToPosition?: [number, number, number] | null;
  flyToDistance?: number;
  resetTrigger?: number;
  onResetComplete?: () => void;
  reducedMotion?: boolean;
}

export function CameraController({
  flyToPosition,
  flyToDistance = 14,
  resetTrigger = 0,
  onResetComplete,
  reducedMotion = false,
}: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isTransitioning = useRef(false);

  // Default Full Solar System Camera Position: elevated angle facing Sun at (0, 0, 0)
  const defaultCamPos = useRef(new THREE.Vector3(0, 36, 75));
  const defaultTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Reset to full solar system
  useEffect(() => {
    if (!controlsRef.current) return;
    if (resetTrigger > 0) {
      if (reducedMotion) {
        camera.position.copy(defaultCamPos.current);
        controlsRef.current.target.copy(defaultTarget.current);
        controlsRef.current.update();
        onResetComplete?.();
        return;
      }

      isTransitioning.current = true;
      const startCamPos = camera.position.clone();
      const startTarget = controlsRef.current.target.clone();
      const startTime = performance.now();
      const duration = 750; // 750ms smooth transition

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1.0, elapsed / duration);
        const ease = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(startCamPos, defaultCamPos.current, ease);
        controlsRef.current?.target.lerpVectors(startTarget, defaultTarget.current, ease);

        if (t < 1.0) {
          requestAnimationFrame(step);
        } else {
          isTransitioning.current = false;
          onResetComplete?.();
        }
      };

      requestAnimationFrame(step);
    }
  }, [resetTrigger, camera, reducedMotion, onResetComplete]);

  // Fly-to target position (planet or Earth)
  useEffect(() => {
    if (!controlsRef.current || !flyToPosition) return;

    const targetPos = new THREE.Vector3(...flyToPosition);
    // Position camera offset from the target
    const offsetDir = targetPos.lengthSq() > 0.001
      ? targetPos.clone().normalize()
      : new THREE.Vector3(0, 0.4, 1).normalize();

    const desiredCamPos = targetPos.clone().add(
      offsetDir.multiplyScalar(flyToDistance)
    );
    desiredCamPos.y += flyToDistance * 0.35; // slightly elevated angle

    if (reducedMotion) {
      camera.position.copy(desiredCamPos);
      controlsRef.current.target.copy(targetPos);
      controlsRef.current.update();
      return;
    }

    isTransitioning.current = true;
    const startCamPos = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const startTime = performance.now();
    const duration = 800; // 800ms smooth fly-to

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startCamPos, desiredCamPos, ease);
      controlsRef.current?.target.lerpVectors(startTarget, targetPos, ease);

      if (t < 1.0) {
        requestAnimationFrame(step);
      } else {
        isTransitioning.current = false;
      }
    };

    requestAnimationFrame(step);
  }, [flyToPosition, flyToDistance, camera, reducedMotion]);

  // Keyboard navigation (+/- zoom, Arrow keys orbit, Escape resets)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (!controlsRef.current) return;

      const controls = controlsRef.current;
      const rotateDelta = 0.05;

      switch (e.key) {
        case "ArrowLeft":
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotateDelta);
          controls.update();
          break;
        case "ArrowRight":
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotateDelta);
          controls.update();
          break;
        case "+":
        case "=":
          camera.position.lerp(controls.target, 0.1);
          controls.update();
          break;
        case "-":
        case "_":
          {
            const dir = camera.position.clone().sub(controls.target).normalize();
            camera.position.add(dir.multiplyScalar(5));
            controls.update();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [camera]);

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
      rotateSpeed={0.7}
      zoomSpeed={0.85}
      panSpeed={0.5}
      minDistance={3}
      maxDistance={250}
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      makeDefault
    />
  );
}
