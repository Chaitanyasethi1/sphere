"use client";

import React from "react";

export interface ConfidenceBarProps {
  /**
   * Confidence value between 0.0 and 1.0
   */
  value: number;
  /**
   * Whether to show the numerical percentage label.
   */
  showLabel?: boolean;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  value,
  showLabel = true,
  size = "sm",
  className = "",
}) => {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const pct = Math.round(clamped * 100);

  // Quiet NASA Eyes styling: thin 2px bar with cyan/teal accent
  const barColor = pct >= 80 ? "bg-[#22D3EE]" : pct >= 50 ? "bg-[#E0A526]" : "bg-slate-400";
  const heightClass = size === "sm" ? "h-[2px]" : size === "lg" ? "h-2" : "h-1";

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Detection confidence ${pct}%`}
        className={`flex-1 bg-white/10 overflow-hidden ${heightClass}`}
      >
        <div
          className={`${heightClass} ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span
          className="font-mono text-[10px] text-[#7E8492] tabular-nums shrink-0"
          aria-hidden="true"
        >
          {pct}%
        </span>
      )}
    </div>
  );
};
