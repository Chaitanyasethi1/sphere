"use client";

import React from "react";

export type BadgeVariant =
  | "known"
  | "unknown"
  | "test-data"
  | "neutral"
  | "success"
  | "info";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  children,
  className = "",
  variant = "neutral",
  size = "md",
  dot,
  ...props
}: BadgeProps) {
  void dot;
  // NASA Eyes square text tag (radius 2px)
  const baseStyles =
    "inline-flex items-center font-sans uppercase font-medium rounded-[2px] border transition-colors select-none tracking-[0.18em]";

  const variantStyles: Record<BadgeVariant, string> = {
    known:
      "bg-[rgba(34,211,238,0.12)] text-[#22D3EE] border-[rgba(34,211,238,0.35)]",
    unknown:
      "bg-[rgba(224,165,38,0.12)] text-[#E0A526] border-[rgba(224,165,38,0.35)]",
    "test-data":
      "bg-[rgba(148,163,184,0.14)] text-[#94A3B8] border-[rgba(148,163,184,0.3)]",
    neutral:
      "bg-white/[0.04] text-[#B8BCC4] border-white/10",
    success:
      "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
    info:
      "bg-sky-950/60 text-sky-300 border-sky-500/30",
  };

  const nonColorIcons: Record<BadgeVariant, string> = {
    known: "●",
    unknown: "◆",
    "test-data": "■",
    neutral: "·",
    success: "✓",
    info: "ℹ",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-[11px] px-2 py-0.5 gap-1.5",
    lg: "text-xs px-2.5 py-1 gap-2",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <span className="text-[8px] opacity-80" aria-hidden="true">
        {nonColorIcons[variant]}
      </span>
      <span>{children}</span>
    </span>
  );
}

/**
 * Global TEST DATA badge with unmistakable clear visibility.
 */
export function TestDataBadge({ className = "" }: { className?: string }) {
  return (
    <Badge
      variant="test-data"
      size="sm"
      className={`tracking-[0.2em] font-semibold ${className}`}
      role="status"
      aria-label="Simulation test data active"
    >
      TEST DATA
    </Badge>
  );
}
