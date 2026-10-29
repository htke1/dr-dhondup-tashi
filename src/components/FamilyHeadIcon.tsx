import React from "react";

interface FamilyHeadIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Mobile-friendly vector icon representing the Father & Family Head Health Initiative.
 * Renders crisply across all mobile viewports (iOS, Android, Retina displays) without emoji fragmentation.
 */
export default function FamilyHeadIcon({ size = 20, className = "", style }: FamilyHeadIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Primary adult / Father figure */}
      <path d="M3 20v-1.5a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5V20" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      {/* Child / Family member */}
      <path d="M16 20v-1a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1" />
      <circle cx="19.5" cy="10" r="2.5" />
    </svg>
  );
}
