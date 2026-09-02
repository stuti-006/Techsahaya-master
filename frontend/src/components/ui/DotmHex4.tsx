import React, { useState, useEffect, useId } from "react";

export interface DotmHex4Props {
  size?: number;
  dotSize?: number;
  color?: string;
  ariaLabel?: string;
  className?: string;
  speed?: number;
  animated?: boolean;
}

const ROW_COUNTS = [3, 4, 5, 4, 3] as const;
const BASE_OPACITY = 0.08;
const MID_OPACITY = 0.35;
const HIGH_OPACITY = 1;
const HEX_ROW_PITCH_RATIO = Math.sqrt(3) / 2;

function pointForCell(row: number, col: number) {
  const count = ROW_COUNTS[row] ?? 1;
  return {
    x: col - (count - 1) / 2,
    y: (row - 2) * HEX_ROW_PITCH_RATIO,
  };
}

function opacityForCell(row: number, col: number, phase: number): number {
  const { x, y } = pointForCell(row, col);
  const distance = Math.sqrt(x * x + y * y);
  const maxDist = 2.2;
  const normalized = distance / maxDist;

  // Outer to inner wave
  const wave = Math.cos((normalized - phase) * Math.PI * 2);
  const pulse = Math.max(0, wave);

  let opacity = BASE_OPACITY + pulse * (HIGH_OPACITY - BASE_OPACITY);

  // Center glow (join point)
  if (row === 2 && col === 2) {
    const centerPulse = 0.6 + 0.4 * Math.sin(phase * Math.PI * 2);
    opacity = Math.max(opacity, MID_OPACITY + centerPulse * 0.4);
  }

  // Soft radial fill
  const softFill = Math.max(0, 1 - normalized) * 0.12;
  return Math.min(HIGH_OPACITY, opacity + softFill);
}

export function DotmHex4({
  size = 48,
  dotSize = 7,
  color = "#1A3D2E",
  ariaLabel = "Loading",
  className = "",
  speed = 1.2,
  animated = true,
}: DotmHex4Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!animated) return;
    let animationFrameId: number;
    let startTime = performance.now();
    const cycleMs = 1800 / speed;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const currentPhase = (elapsed % cycleMs) / cycleMs;
      setPhase(currentPhase);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [animated, speed]);

  const gap = Math.max(2, Math.floor((size - dotSize * ROW_COUNTS[2]) / (ROW_COUNTS[2] - 1)));
  const colPitch = dotSize + gap;
  const rowGap = Math.max(2, colPitch * HEX_ROW_PITCH_RATIO - dotSize);
  const matrixWidth = dotSize * ROW_COUNTS[2] + gap * (ROW_COUNTS[2] - 1);
  const matrixHeight = dotSize * ROW_COUNTS.length + rowGap * (ROW_COUNTS.length - 1);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: matrixWidth, height: matrixHeight }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${rowGap}px`,
          width: "100%",
          height: "100%",
        }}
      >
        {ROW_COUNTS.map((count, row) => (
          <div key={row} style={{ display: "flex", gap: `${gap}px` }}>
            {Array.from({ length: count }).map((_, col) => {
              const opacity = opacityForCell(row, col, phase);
              const isCenter = row === 2 && col === 2;

              return (
                <span
                  key={`${row},${col}`}
                  style={{
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                    borderRadius: "9999px",
                    backgroundColor: color,
                    opacity,
                    transform: `scale(${0.85 + opacity * 0.25})`,
                    boxShadow:
                      isCenter && opacity > 0.6
                        ? `0 0 10px ${color}`
                        : opacity > 0.8
                        ? `0 0 6px ${color}80`
                        : "none",
                    transition: "opacity 0.05s ease-out, transform 0.05s ease-out",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Modal / Overlay loader helper for authentication and document generation / downloads
 */
export function DotMatrixLoaderModal({
  title = "Authenticating...",
  subtitle = "Please wait while we verify your session",
  color = "#1A3D2E",
}: {
  title?: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-8 py-7 shadow-2xl shadow-slate-900/20 backdrop-blur-md">
        <DotmHex4 size={54} dotSize={8} color={color} />
        <div className="text-center">
          <div className="font-serif text-lg font-bold text-[#1A3D2E]">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
