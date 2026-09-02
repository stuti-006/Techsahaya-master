import React from "react";

interface TechSahayaLogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
  textColor?: string;
  glowing?: boolean;
  glowIntensity?: "subtle" | "medium" | "strong";
}

/**
 * Official Tech Sahaya Emblem Image Component
 * Features direct character-edge contour glowing (no enclosing box or container)
 */
export function TechSahayaEmblem({
  size = 44,
  className = "",
  glowing = true,
  glowIntensity = "medium",
}: {
  size?: number;
  className?: string;
  glowing?: boolean;
  glowIntensity?: "subtle" | "medium" | "strong";
}) {
  const glowFilters = {
    subtle:
      "drop-shadow(0 0 3px rgba(246, 188, 87, 0.75)) drop-shadow(0 0 7px rgba(148, 197, 157, 0.45))",
    medium:
      "drop-shadow(0 0 4px rgba(246, 188, 87, 0.95)) drop-shadow(0 0 8px rgba(241, 135, 135, 0.6)) drop-shadow(0 0 14px rgba(148, 197, 157, 0.55))",
    strong:
      "drop-shadow(0 0 5px rgba(246, 188, 87, 1)) drop-shadow(0 0 10px rgba(241, 135, 135, 0.8)) drop-shadow(0 0 20px rgba(148, 197, 157, 0.7))",
  };

  return (
    <img
      src="/tech-sahaya-emblem-clean.png"
      alt="Tech Sahaya Emblem"
      style={{
        height: `${size}px`,
        width: "auto",
        maxWidth: "none",
        objectFit: "contain",
        filter: glowing ? glowFilters[glowIntensity] : "none",
        transition: "filter 0.3s ease, transform 0.2s ease",
      }}
      className={`select-none shrink-0 transition-all duration-300 hover:scale-105 ${
        glowing ? "hover:brightness-110" : ""
      } ${className}`}
      draggable={false}
    />
  );
}

/**
 * Complete Tech Sahaya Brand Logo (Emblem with character-edge glow + Responsive Typography)
 */
export function TechSahayaLogo({
  size = 38,
  className = "",
  withText = true,
  textColor = "#1D2A5E",
  glowing = true,
  glowIntensity = "medium",
}: TechSahayaLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      {/* Floating Emblem with Character Edge Glow (No Box) */}
      <TechSahayaEmblem size={size} glowing={glowing} glowIntensity={glowIntensity} />

      {/* Responsive Typography Wordmark */}
      {withText && (
        <div className="flex flex-col justify-center min-w-0">
          <span
            className="font-bold tracking-wider leading-tight uppercase font-sans text-sm sm:text-base md:text-lg"
            style={{ color: textColor, letterSpacing: "0.06em" }}
          >
            TECH SAHAYA
          </span>
          <span className="hidden sm:inline-block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#E5832E] mt-0.5">
            Citizen Welfare Portal
          </span>
        </div>
      )}
    </div>
  );
}
