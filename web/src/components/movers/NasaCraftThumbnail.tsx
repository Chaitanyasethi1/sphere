"use client";

import React from "react";

interface NasaCraftThumbnailProps {
  type: "voyager" | "clipper" | "roman" | "parker" | "ceres" | "candidate" | string;
  className?: string;
  size?: number;
}

export function NasaCraftThumbnail({
  type,
  className = "",
  size = 80,
}: NasaCraftThumbnailProps) {
  const normType = type.toLowerCase();

  // 1. Voyager 1 with iconic golden spiral transmission wave
  if (normType.includes("voyager") || normType === "voyager-1") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center select-none shrink-0 ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(212,163,115,0.3)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Deep space background subtle glow */}
          <circle cx="50" cy="50" r="45" fill="#080a10" fillOpacity="0.8" />

          {/* Golden spiral radio transmission wave from the dish */}
          <path
            d="M 62 40 Q 68 35 74 30 T 82 22 T 90 14"
            stroke="#ffdd55"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />
          <path
            d="M 64 38 Q 69 44 75 38 T 83 30 T 92 22"
            stroke="#ffc83b"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          <path
            d="M 66 36 C 72 32 76 42 82 36 S 88 26 94 20"
            stroke="#ffe680"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />

          {/* Magnetometer & RTG Booms */}
          <line x1="45" y1="52" x2="16" y2="70" stroke="#8892a4" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="48" y1="50" x2="30" y2="22" stroke="#8892a4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="56" y1="58" x2="78" y2="76" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />

          {/* RTG Golden Nuclear Generator unit */}
          <rect x="74" y="72" width="10" height="7" rx="1.5" fill="#d4a373" stroke="#f59e0b" strokeWidth="1" />
          <line x1="77" y1="72" x2="77" y2="79" stroke="#78350f" strokeWidth="0.8" />
          <line x1="80" y1="72" x2="80" y2="79" stroke="#78350f" strokeWidth="0.8" />

          {/* Golden Central Bus Module */}
          <polygon points="46,46 56,48 58,58 48,60 42,54" fill="#cca06a" stroke="#d4a373" strokeWidth="1.2" />

          {/* White High-Gain Parabolic Antenna Dish (Tilted 3D perspective) */}
          <ellipse
            cx="54"
            cy="44"
            rx="18"
            ry="11"
            transform="rotate(-28 54 44)"
            fill="#e2e8f0"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Dish Interior Shadow & Feed Horn */}
          <ellipse
            cx="53"
            cy="43"
            rx="14"
            ry="7.5"
            transform="rotate(-28 53 43)"
            fill="#94a3b8"
            opacity="0.4"
          />
          {/* Sub-reflector Feed Horn tripod */}
          <line x1="54" y1="44" x2="62" y2="39" stroke="#475569" strokeWidth="1.5" />
          <circle cx="62" cy="39" r="2.2" fill="#d4a373" stroke="#ffffff" strokeWidth="0.8" />
        </svg>
      </div>
    );
  }

  // 2. Europa Clipper with massive solar array wings & magnetometer
  if (normType.includes("clipper")) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center select-none shrink-0 ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(104,168,207,0.3)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" fill="#080a10" fillOpacity="0.8" />

          {/* Radar Antennas cross sticks */}
          <line x1="46" y1="20" x2="54" y2="80" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="20" y1="56" x2="80" y2="44" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />

          {/* Large Solar Panel Array - Left Wing */}
          <g transform="rotate(-18 50 50)">
            {/* Wing boom */}
            <line x1="10" y1="50" x2="42" y2="50" stroke="#94a3b8" strokeWidth="2.5" />
            {/* 5 solar cell segments */}
            <rect x="12" y="42" width="28" height="16" rx="1.5" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1="18" y1="42" x2="18" y2="58" stroke="#0284c7" strokeWidth="0.8" />
            <line x1="25" y1="42" x2="25" y2="58" stroke="#0284c7" strokeWidth="0.8" />
            <line x1="32" y1="42" x2="32" y2="58" stroke="#0284c7" strokeWidth="0.8" />
            <line x1="12" y1="50" x2="40" y2="50" stroke="#0284c7" strokeWidth="0.8" />

            {/* Large Solar Panel Array - Right Wing */}
            <line x1="58" y1="50" x2="90" y2="50" stroke="#94a3b8" strokeWidth="2.5" />
            <rect x="60" y="42" width="28" height="16" rx="1.5" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1="67" y1="42" x2="67" y2="58" stroke="#0284c7" strokeWidth="0.8" />
            <line x1="74" y1="42" x2="74" y2="58" stroke="#0284c7" strokeWidth="0.8" />
            <line x1="81" y1="42" x2="81" y2="58" stroke="#0284c7" strokeWidth="0.8" />
            <line x1="60" y1="50" x2="88" y2="50" stroke="#0284c7" strokeWidth="0.8" />

            {/* Central Spacecraft Avionics Bus */}
            <rect x="44" y="43" width="12" height="14" rx="2" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="1.5" />
            <rect x="46" y="45" width="8" height="10" fill="#cca06a" opacity="0.9" />

            {/* High-Gain Antenna Dish on top of Bus */}
            <ellipse cx="50" cy="38" rx="7" ry="3.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
            <line x1="50" y1="38" x2="50" y2="33" stroke="#64748b" strokeWidth="1.2" />
          </g>
        </svg>
      </div>
    );
  }

  // 3. Nancy Grace Roman Space Telescope
  if (normType.includes("roman")) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center select-none shrink-0 ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(162,120,181,0.3)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" fill="#080a10" fillOpacity="0.8" />

          <g transform="rotate(-35 50 50)">
            {/* Outer Curved Sunshield / Solar Array */}
            <path
              d="M 32 30 C 44 24, 56 24, 68 30 L 68 76 C 56 72, 44 72, 32 76 Z"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            {/* Photovoltaic panel textures on sunshield */}
            <line x1="36" y1="35" x2="64" y2="35" stroke="#0284c7" strokeWidth="1" />
            <line x1="36" y1="47" x2="64" y2="47" stroke="#0284c7" strokeWidth="1" />
            <line x1="36" y1="59" x2="64" y2="59" stroke="#0284c7" strokeWidth="1" />
            <line x1="36" y1="71" x2="64" y2="71" stroke="#0284c7" strokeWidth="1" />

            {/* Cylindrical Optical Telescope Assembly (OTA) Tube */}
            <rect x="40" y="28" width="20" height="42" rx="3" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Primary Mirror Baffle Opening on Top */}
            <ellipse cx="50" cy="28" rx="10" ry="4" fill="#020617" stroke="#e2e8f0" strokeWidth="1.5" />
            <ellipse cx="50" cy="28" rx="6" ry="2.2" fill="#38bdf8" opacity="0.6" />

            {/* Spacecraft Service Bus at Base */}
            <polygon points="40,70 60,70 64,82 36,82" fill="#cca06a" stroke="#d4a373" strokeWidth="1.2" />

            {/* Aperture Cover Flap open */}
            <line x1="40" y1="28" x2="30" y2="16" stroke="#94a3b8" strokeWidth="1.8" />
          </g>
        </svg>
      </div>
    );
  }

  // 4. Parker Solar Probe with heat shield
  if (normType.includes("parker")) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center select-none shrink-0 ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(255,200,80,0.3)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" fill="#080a10" fillOpacity="0.8" />

          {/* Solar wind radiation glow */}
          <path d="M 50 15 L 50 2" stroke="#ffea78" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
          <path d="M 38 18 L 30 6" stroke="#ffea78" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
          <path d="M 62 18 L 70 6" stroke="#ffea78" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />

          {/* Hexagonal Thermal Protection System (TPS) Heat Shield */}
          <polygon
            points="50,20 68,26 68,44 50,50 32,44 32,26"
            fill="#f8fafc"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          {/* Carbon-composite foam core shadow */}
          <polygon
            points="50,23 65,28 65,42 50,47 35,42 35,28"
            fill="#94a3b8"
            opacity="0.3"
          />

          {/* Spacecraft Body tucked in shadow behind the shield */}
          <rect x="43" y="47" width="14" height="24" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />

          {/* Angled Solar Array Wings */}
          <polygon points="43,54 22,62 24,72 43,62" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.2" />
          <polygon points="57,54 78,62 76,72 57,62" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.2" />

          {/* Magnetometer Boom */}
          <line x1="50" y1="71" x2="50" y2="88" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="50" cy="88" r="2" fill="#f59e0b" />
        </svg>
      </div>
    );
  }

  // 5. 1 Ceres / Asteroid / Planet X Candidate with illuminated craters & cryomagma
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(217,107,67,0.3)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" fill="#080a10" fillOpacity="0.8" />

        {/* Irregular Rocky Asteroid Body */}
        <path
          d="M 50 18 C 65 17, 80 28, 83 45 C 86 62, 74 80, 56 83 C 38 86, 20 76, 17 58 C 14 40, 32 19, 50 18 Z"
          fill="#334155"
          stroke="#94a3b8"
          strokeWidth="1.5"
        />

        {/* Shaded terminator / 3D light & shadow */}
        <path
          d="M 50 18 C 65 17, 80 28, 83 45 C 86 62, 74 80, 56 83 C 58 68, 52 48, 50 18 Z"
          fill="#0f172a"
          opacity="0.6"
        />

        {/* Occator Bright Faculae / Sodium Carbonate Ice Dome */}
        <circle cx="42" cy="42" r="5" fill="#f8fafc" opacity="0.95" />
        <circle cx="42" cy="42" r="8" fill="#67e8f9" opacity="0.4" />

        {/* Surface Impact Craters */}
        <ellipse cx="62" cy="35" rx="5" ry="3" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
        <ellipse cx="34" cy="62" rx="6" ry="4" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
        <ellipse cx="65" cy="65" rx="4" ry="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
        <circle cx="28" cy="36" r="3" fill="#1e293b" />
      </svg>
    </div>
  );
}

