import React, { useState, useEffect, useRef } from "react";
import { Wind, Play, Pause, Minimize2, Maximize2, Move, Sparkles, Volume2, VolumeX, CheckCircle } from "lucide-react";

export type OrbPlacement = "floating" | "topbar" | "zen";

interface BreathingOrbProps {
  accentColorHex?: string;
  isRecording?: boolean;
}

export const BreathingOrb: React.FC<BreathingOrbProps> = ({
  accentColorHex = "#6366F1",
  isRecording = false,
}) => {
  const [isActive, setIsActive] = useState(true);
  const [placement, setPlacement] = useState<OrbPlacement>("floating");
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  // Time in current 15s cycle: 0 -> 15000ms
  // 0 to 4000: Inhale (4s)
  // 4000 to 9000: Hold (5s)
  // 9000 to 15000: Exhale (6s)
  const [cycleTime, setCycleTime] = useState(0);
  const prevPhaseRef = useRef<"inhale" | "hold" | "exhale">("inhale");

  useEffect(() => {
    if (!isActive) return;

    const interval = 50; // 20fps for smooth clock
    const timer = setInterval(() => {
      setCycleTime((prev) => {
        const next = (prev + interval) % 15000;
        // If wrapped around, increment cycle count
        if (next < prev) {
          setCycleCount((c) => c + 1);
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isActive]);

  // Determine current phase and progress
  let phase: "inhale" | "hold" | "exhale" = "inhale";
  let phaseProgress = 0; // 0 to 1
  let secondsRemaining = 0;
  let phaseLabel = "Breathe In";
  let phaseSub = "Expand chest slowly";

  if (cycleTime < 4000) {
    phase = "inhale";
    phaseProgress = cycleTime / 4000;
    secondsRemaining = Math.ceil((4000 - cycleTime) / 1000);
    phaseLabel = "Inhale";
    phaseSub = "4 seconds";
  } else if (cycleTime < 9000) {
    phase = "hold";
    phaseProgress = (cycleTime - 4000) / 5000;
    secondsRemaining = Math.ceil((9000 - cycleTime) / 1000);
    phaseLabel = "Hold";
    phaseSub = "5 seconds";
  } else {
    phase = "exhale";
    phaseProgress = (cycleTime - 9000) / 6000;
    secondsRemaining = Math.ceil((15000 - cycleTime) / 1000);
    phaseLabel = "Exhale";
    phaseSub = "6 seconds";
  }

  // Soft chime on phase change if sound enabled
  useEffect(() => {
    if (soundEnabled && prevPhaseRef.current !== phase) {
      playSoftChime(phase);
    }
    prevPhaseRef.current = phase;
  }, [phase, soundEnabled]);

  const playSoftChime = (p: "inhale" | "hold" | "exhale") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = p === "inhale" ? 432 : p === "hold" ? 528 : 396;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.type = "sine";

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {}
  };

  // Scale of the orb:
  // Inhale: 1.0 -> 1.45
  // Hold: 1.45 with subtle organic breathing oscillation
  // Exhale: 1.45 -> 1.0
  let scale = 1.0;
  let opacity = 0.85;

  if (phase === "inhale") {
    // Smooth ease in out
    const ease = (1 - Math.cos(phaseProgress * Math.PI)) / 2;
    scale = 1.0 + ease * 0.45;
    opacity = 0.75 + ease * 0.25;
  } else if (phase === "hold") {
    const pulse = Math.sin(phaseProgress * Math.PI * 2) * 0.04;
    scale = 1.45 + pulse;
    opacity = 1.0;
  } else {
    // Exhale
    const ease = (1 - Math.cos(phaseProgress * Math.PI)) / 2;
    scale = 1.45 - ease * 0.45;
    opacity = 1.0 - ease * 0.25;
  }

  // Micro-orb view when minimized
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-stone-200 dark:border-stone-800 cursor-pointer select-none transition-all hover:scale-105"
        onClick={() => setIsMinimized(false)}
        title="4-5-6 Breathing Orb (Click to expand)"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <div
            style={{
              transform: `scale(${scale * 0.7})`,
              backgroundColor: accentColorHex,
              boxShadow: `0 0 12px ${accentColorHex}80`,
            }}
            className="w-4 h-4 rounded-full transition-transform duration-100"
          />
        </div>
        <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 tabular-nums">
          {phaseLabel} ({secondsRemaining}s)
        </span>
      </div>
    );
  }

  return (
    <aside
      aria-label="4-5-6 Breathing Guide Orb"
      className="fixed bottom-24 right-4 md:right-8 z-40 select-none transition-all"
    >
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800/90 rounded-3xl p-4 shadow-xl flex flex-col items-center gap-3 w-56">
        {/* Top controls header */}
        <div className="w-full flex items-center justify-between text-stone-500 dark:text-stone-400 text-[11px] font-medium border-b border-stone-100 dark:border-stone-800/80 pb-2">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <Wind className="w-3.5 h-3.5" style={{ color: accentColorHex }} />
            <span className="font-semibold">4-5-6 Breath</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Sound chime toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={soundEnabled ? "Mute chime" : "Enable gentle chime on phase change"}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3 text-emerald-600" /> : <VolumeX className="w-3 h-3 text-stone-400" />}
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => setIsActive(!isActive)}
              className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={isActive ? "Pause breathing orb" : "Resume"}
            >
              {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Minimize to micro-orb"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Breathing Orb Graphic */}
        <div className="relative w-32 h-32 flex items-center justify-center my-1">
          {/* Outer glow ring 1 */}
          <div
            style={{
              transform: `scale(${scale * 1.25})`,
              opacity: opacity * 0.25,
              borderColor: accentColorHex,
            }}
            className="absolute inset-0 rounded-full border border-dashed transition-transform duration-150"
          />

          {/* Outer glow aura */}
          <div
            style={{
              transform: `scale(${scale * 1.15})`,
              opacity: opacity * 0.4,
              background: `radial-gradient(circle, ${accentColorHex}40 0%, transparent 70%)`,
            }}
            className="absolute inset-2 rounded-full transition-transform duration-100 blur-sm"
          />

          {/* Central breathing orb */}
          <div
            style={{
              transform: `scale(${scale})`,
              opacity: opacity,
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${accentColorHex} 55%, #1e1b4b 100%)`,
              boxShadow: `0 0 24px ${accentColorHex}99, inset 0 0 12px rgba(255,255,255,0.6)`,
            }}
            className="w-16 h-16 rounded-full transition-transform duration-75 flex items-center justify-center cursor-default shadow-md"
          >
            {/* Center seconds countdown */}
            <span className="text-white font-mono font-bold text-sm drop-shadow-md select-none tabular-nums">
              {secondsRemaining}s
            </span>
          </div>

          {/* Subtly orbiting particles */}
          <div
            style={{
              transform: `rotate(${cycleTime * 0.04}deg)`,
            }}
            className="absolute w-24 h-24 rounded-full pointer-events-none opacity-40"
          >
            <div
              style={{ backgroundColor: accentColorHex }}
              className="w-1.5 h-1.5 rounded-full absolute top-0 left-1/2 -translate-x-1/2"
            />
          </div>
        </div>

        {/* Phase details */}
        <div className="w-full text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span
              style={{ color: accentColorHex }}
              className="text-xs font-bold uppercase tracking-wider"
            >
              {phaseLabel}
            </span>
            <span className="text-xs text-stone-400 font-mono">({phaseSub})</span>
          </div>

          {/* Progress bar for the 15s cycle */}
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
            {/* 4s Inhale section (4/15 = 26.6%) */}
            <div
              className={`h-full transition-all ${
                phase === "inhale" ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-700"
              }`}
              style={{ width: "26.7%" }}
            />
            {/* 5s Hold section (5/15 = 33.3%) */}
            <div
              className={`h-full transition-all ${
                phase === "hold" ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
              }`}
              style={{ width: "33.3%" }}
            />
            {/* 6s Exhale section (6/15 = 40%) */}
            <div
              className={`h-full transition-all ${
                phase === "exhale" ? "bg-indigo-500" : "bg-stone-300 dark:bg-stone-700"
              }`}
              style={{ width: "40%" }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5 px-0.5">
            <span>Inhale 4s</span>
            <span>Hold 5s</span>
            <span>Exhale 6s</span>
          </div>

          {cycleCount > 0 && (
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 flex items-center justify-center gap-1">
              <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
              <span>{cycleCount} mindful breath{cycleCount === 1 ? "" : "s"} completed</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
