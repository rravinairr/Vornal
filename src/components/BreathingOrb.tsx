import React, { useState, useEffect, useRef } from "react";
import {
  Wind,
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

export type BreathingCadence = "calm-4-4-6-2" | "box-4-4-4-4" | "relax-4-5-6-3";

interface BreathingOrbProps {
  accentColorHex?: string;
  isRecording?: boolean;
}

export const BreathingOrb: React.FC<BreathingOrbProps> = ({
  accentColorHex = "#6366F1",
  isRecording = false,
}) => {
  // Whether the full Zen Mode (everything fades out) is open
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [cadence, setCadence] = useState<BreathingCadence>("calm-4-4-6-2");
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Breath counts - only increment and display during session
  const [breathCount, setBreathCount] = useState(1);
  const [completedBreaths, setCompletedBreaths] = useState(0);

  // Cadence timings in milliseconds
  // Calm: Inhale 4s (4000ms), Hold 4s (4000ms), Exhale 6s (6000ms), Hold 2s (2000ms) = Total 16000ms
  // Box: Inhale 4s (4000ms), Hold 4s (4000ms), Exhale 4s (4000ms), Hold 4s (4000ms) = Total 16000ms
  // Relax: Inhale 4s (4000ms), Hold 5s (5000ms), Exhale 6s (6000ms), Hold 3s (3000ms) = Total 18000ms
  const timings = {
    "calm-4-4-6-2": {
      inhale: 4000,
      holdIn: 4000,
      exhale: 6000,
      holdOut: 2000,
      total: 16000,
      name: "Calm Resonance (4-4-6-2)",
      description: "Inhale 4s · Hold 4s · Exhale 6s · Hold 2s",
    },
    "box-4-4-4-4": {
      inhale: 4000,
      holdIn: 4000,
      exhale: 4000,
      holdOut: 4000,
      total: 16000,
      name: "Box Breathing (4-4-4-4)",
      description: "Inhale 4s · Hold 4s · Exhale 4s · Hold 4s",
    },
    "relax-4-5-6-3": {
      inhale: 4000,
      holdIn: 5000,
      exhale: 6000,
      holdOut: 3000,
      total: 18000,
      name: "Deep Rest (4-5-6-3)",
      description: "Inhale 4s · Hold 5s · Exhale 6s · Hold 3s",
    },
  }[cadence];

  const [cycleTime, setCycleTime] = useState(0);
  const prevPhaseRef = useRef<"inhale" | "holdIn" | "exhale" | "holdOut">("inhale");

  // Timer loop
  useEffect(() => {
    if (!isActive) return;

    const interval = 40; // 25fps clock
    const timer = setInterval(() => {
      setCycleTime((prev) => {
        const next = (prev + interval) % timings.total;
        if (next < prev) {
          // Wrapped around: one full breath completed
          setBreathCount((b) => b + 1);
          setCompletedBreaths((c) => c + 1);
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, timings.total]);

  // Handle ESC key to exit Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZenModeOpen) {
        setIsZenModeOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZenModeOpen]);

  // Determine current phase
  type Phase = "inhale" | "holdIn" | "exhale" | "holdOut";
  let currentPhase: Phase = "inhale";
  let phaseProgress = 0;
  let secondsRemaining = 0;
  let phaseTitle = "Inhale";
  let phaseInstruction = "Breathe in slowly through your nose";

  const { inhale, holdIn, exhale, holdOut } = timings;
  const tHoldInEnd = inhale + holdIn;
  const tExhaleEnd = tHoldInEnd + exhale;

  if (cycleTime < inhale) {
    currentPhase = "inhale";
    phaseProgress = cycleTime / inhale;
    secondsRemaining = Math.ceil((inhale - cycleTime) / 1000);
    phaseTitle = "Inhale";
    phaseInstruction = "Breathe in slowly through your nose";
  } else if (cycleTime < tHoldInEnd) {
    currentPhase = "holdIn";
    phaseProgress = (cycleTime - inhale) / holdIn;
    secondsRemaining = Math.ceil((tHoldInEnd - cycleTime) / 1000);
    phaseTitle = "Hold";
    phaseInstruction = "Gently pause with full, quiet lungs";
  } else if (cycleTime < tExhaleEnd) {
    currentPhase = "exhale";
    phaseProgress = (cycleTime - tHoldInEnd) / exhale;
    secondsRemaining = Math.ceil((tExhaleEnd - cycleTime) / 1000);
    phaseTitle = "Exhale";
    phaseInstruction = "Slowly let everything go, softening your shoulders";
  } else {
    currentPhase = "holdOut";
    phaseProgress = (cycleTime - tExhaleEnd) / holdOut;
    secondsRemaining = Math.ceil((timings.total - cycleTime) / 1000);
    phaseTitle = "Hold (Empty)";
    phaseInstruction = "Rest in gentle, weightless stillness";
  }

  // Soft chime on phase change if sound enabled
  useEffect(() => {
    if (soundEnabled && isZenModeOpen && prevPhaseRef.current !== currentPhase) {
      playSoftChime(currentPhase);
    }
    prevPhaseRef.current = currentPhase;
  }, [currentPhase, soundEnabled, isZenModeOpen]);

  const playSoftChime = (p: Phase) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freqMap: Record<Phase, number> = {
        inhale: 432,
        holdIn: 528,
        exhale: 396,
        holdOut: 288,
      };

      osc.frequency.setValueAtTime(freqMap[p], ctx.currentTime);
      osc.type = "sine";

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  // Scale computation:
  // Inhale: 1.0 -> 1.5
  // HoldIn: 1.5 with subtle organic breathing wave
  // Exhale: 1.5 -> 0.95
  // HoldOut: 0.95 still resting pause
  let scale = 1.0;
  let glowOpacity = 0.6;

  if (currentPhase === "inhale") {
    const ease = (1 - Math.cos(phaseProgress * Math.PI)) / 2;
    scale = 1.0 + ease * 0.5;
    glowOpacity = 0.5 + ease * 0.45;
  } else if (currentPhase === "holdIn") {
    const pulse = Math.sin(phaseProgress * Math.PI * 2) * 0.03;
    scale = 1.5 + pulse;
    glowOpacity = 0.95;
  } else if (currentPhase === "exhale") {
    const ease = (1 - Math.cos(phaseProgress * Math.PI)) / 2;
    scale = 1.5 - ease * 0.55;
    glowOpacity = 0.95 - ease * 0.5;
  } else {
    // holdOut
    scale = 0.95;
    glowOpacity = 0.35;
  }

  return (
    <>
      {/* 
        1. MINIMAL BACKGROUND AMBIENT ORB
        "the animation thats going to be in the background on the app visually, minimal but there hiding but enough to draw attention"
      */}
      <aside
        aria-label="Zen Breathing Animation Guide"
        className="fixed bottom-6 left-6 z-30 select-none group pointer-events-auto"
      >
        <button
          onClick={() => {
            setIsZenModeOpen(true);
            setIsActive(true);
          }}
          className="relative flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/75 dark:bg-stone-900/75 backdrop-blur-md border border-stone-200/70 dark:border-stone-800/80 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-left cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
          title="Click to enter serene Zen Breathing mode"
        >
          {/* Subtle pulsating breathing orb in the background */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            {/* Ambient outer halo */}
            <div
              style={{
                transform: `scale(${scale * 1.35})`,
                opacity: glowOpacity * 0.4,
                backgroundColor: accentColorHex,
              }}
              className="absolute inset-0 rounded-full blur-xs transition-transform duration-100"
            />
            {/* Concentric subtle ring */}
            <div
              style={{
                transform: `scale(${scale * 1.15})`,
                borderColor: accentColorHex,
                opacity: glowOpacity * 0.6,
              }}
              className="absolute inset-0 rounded-full border border-dashed transition-transform duration-100"
            />
            {/* Central orb */}
            <div
              style={{
                transform: `scale(${scale * 0.75})`,
                backgroundColor: accentColorHex,
                boxShadow: `0 0 14px ${accentColorHex}aa`,
              }}
              className="w-5 h-5 rounded-full transition-transform duration-100 flex items-center justify-center"
            >
              <Wind className="w-2.5 h-2.5 text-white/90" />
            </div>
          </div>

          <div className="flex flex-col pr-1">
            <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1 leading-tight">
              <span>{phaseTitle}</span>
              <span className="text-stone-400 font-mono text-[10px]">({secondsRemaining}s)</span>
            </span>
            <span className="text-[9px] text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 font-medium leading-tight">
              Tap for Zen Breath
            </span>
          </div>
        </button>
      </aside>

      {/* 
        2. IMMERSIVE ZEN BREATHING MODE (CLICKED STATE)
        "also let there be a breath count only when the user clicks on the animation where everything fades and only the animation is on"
      */}
      {isZenModeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Zen Breathing Space"
          className="fixed inset-0 z-50 bg-stone-950/94 backdrop-blur-2xl text-stone-100 flex flex-col justify-between items-center p-6 md:p-12 animate-in fade-in duration-500 select-none overflow-hidden"
          onClick={(e) => {
            // Clicking background also gives an easy way to exit if clicking outer area
            if (e.target === e.currentTarget) {
              setIsZenModeOpen(false);
            }
          }}
        >
          {/* Top Bar: Breath Counter & Exit Controls */}
          <header className="w-full max-w-xl flex items-center justify-between z-10">
            {/* Breath Count Display (Only when user clicks into Zen Mode) */}
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: accentColorHex }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md shadow-indigo-500/30"
              >
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-stone-400 font-mono font-medium">
                    Breath Count
                  </span>
                  <span
                    style={{ backgroundColor: `${accentColorHex}33`, color: accentColorHex }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                  >
                    Active
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white font-serif">
                  Breath #{breathCount}
                  {completedBreaths > 0 && (
                    <span className="text-xs font-normal text-stone-400 ml-2 font-sans">
                      ({completedBreaths} completed)
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2">
              {/* Sound chime toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-2xl border transition-colors ${
                  soundEnabled
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-stone-400 hover:text-white"
                }`}
                title={soundEnabled ? "Mute phase transition chimes" : "Enable gentle Tibetan chimes"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Pause / Resume */}
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-stone-400 hover:text-white transition-colors"
                title={isActive ? "Pause breathing timer" : "Resume breathing timer"}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Close Zen Mode */}
              <button
                onClick={() => setIsZenModeOpen(false)}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-105"
                title="Return to Journal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Central Zen Breathing Orb with 4-phase hold cycle */}
          <main className="flex-1 flex flex-col items-center justify-center my-auto relative w-full max-w-lg">
            {/* Massive Ambient Background Aura */}
            <div
              style={{
                transform: `scale(${scale * 1.6})`,
                opacity: glowOpacity * 0.25,
                background: `radial-gradient(circle, ${accentColorHex} 0%, transparent 65%)`,
              }}
              className="absolute w-80 h-80 rounded-full blur-2xl pointer-events-none transition-transform duration-200"
            />

            {/* Outer harmonic dashed ring */}
            <div
              style={{
                transform: `scale(${scale * 1.35})`,
                opacity: glowOpacity * 0.45,
                borderColor: accentColorHex,
              }}
              className="absolute w-64 h-64 rounded-full border-2 border-dashed pointer-events-none transition-transform duration-150"
            />

            {/* Middle glowing aura ring */}
            <div
              style={{
                transform: `scale(${scale * 1.18})`,
                opacity: glowOpacity * 0.6,
                borderColor: `${accentColorHex}80`,
              }}
              className="absolute w-56 h-56 rounded-full border border-white/20 transition-transform duration-100"
            />

            {/* Main Central Orb */}
            <div
              style={{
                transform: `scale(${scale})`,
                background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${accentColorHex} 50%, #0f172a 100%)`,
                boxShadow: `0 0 60px ${accentColorHex}99, inset 0 0 24px rgba(255,255,255,0.7)`,
              }}
              className="w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-transform duration-100 relative z-10 cursor-pointer"
              onClick={() => setIsActive(!isActive)}
              title={isActive ? "Click to pause" : "Click to resume"}
            >
              {/* Inner Countdown */}
              <span className="text-4xl font-mono font-extrabold text-white drop-shadow-lg tabular-nums">
                {secondsRemaining}s
              </span>
              <span className="text-xs uppercase tracking-widest text-white/90 font-bold mt-0.5">
                {phaseTitle}
              </span>
            </div>

            {/* Instruction and Guidance Text */}
            <div className="mt-12 text-center max-w-sm space-y-2 z-10">
              <h2
                style={{ color: accentColorHex }}
                className="text-2xl font-bold tracking-tight font-serif capitalize"
              >
                {phaseTitle}
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed font-light">
                {phaseInstruction}
              </p>
            </div>

            {/* 4-Phase Harmonic Progress Track */}
            <div className="w-full max-w-md mt-8 px-4 z-10">
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex p-0.5 gap-1">
                {/* Phase 1: Inhale */}
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    currentPhase === "inhale" ? "bg-emerald-400 shadow-xs shadow-emerald-400" : "bg-white/20"
                  }`}
                  style={{ width: `${(timings.inhale / timings.total) * 100}%` }}
                />
                {/* Phase 2: Hold Full */}
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    currentPhase === "holdIn" ? "bg-amber-400 shadow-xs shadow-amber-400" : "bg-white/20"
                  }`}
                  style={{ width: `${(timings.holdIn / timings.total) * 100}%` }}
                />
                {/* Phase 3: Exhale */}
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    currentPhase === "exhale" ? "bg-indigo-400 shadow-xs shadow-indigo-400" : "bg-white/20"
                  }`}
                  style={{ width: `${(timings.exhale / timings.total) * 100}%` }}
                />
                {/* Phase 4: Hold Empty */}
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    currentPhase === "holdOut" ? "bg-sky-400 shadow-xs shadow-sky-400" : "bg-white/20"
                  }`}
                  style={{ width: `${(timings.holdOut / timings.total) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 font-mono">
                <span className={currentPhase === "inhale" ? "text-emerald-400 font-bold" : ""}>
                  Inhale {timings.inhale / 1000}s
                </span>
                <span className={currentPhase === "holdIn" ? "text-amber-400 font-bold" : ""}>
                  Hold {timings.holdIn / 1000}s
                </span>
                <span className={currentPhase === "exhale" ? "text-indigo-400 font-bold" : ""}>
                  Exhale {timings.exhale / 1000}s
                </span>
                <span className={currentPhase === "holdOut" ? "text-sky-400 font-bold" : ""}>
                  Hold (Empty) {timings.holdOut / 1000}s
                </span>
              </div>
            </div>
          </main>

          {/* Bottom Controls: Cadence Selector & Return Button */}
          <footer className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10 pt-4 border-t border-white/10">
            {/* Cadence options */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 text-xs">
              <button
                onClick={() => setCadence("calm-4-4-6-2")}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  cadence === "calm-4-4-6-2"
                    ? "bg-white text-stone-900 font-bold shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Optimal vagal calm: Inhale 4s, Hold 4s, Exhale 6s, Hold 2s"
              >
                Calm 4-4-6-2
              </button>
              <button
                onClick={() => setCadence("box-4-4-4-4")}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  cadence === "box-4-4-4-4"
                    ? "bg-white text-stone-900 font-bold shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Sama Vritti Box Breathing: 4s Inhale, 4s Hold, 4s Exhale, 4s Hold"
              >
                Box 4-4-4-4
              </button>
              <button
                onClick={() => setCadence("relax-4-5-6-3")}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  cadence === "relax-4-5-6-3"
                    ? "bg-white text-stone-900 font-bold shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Deep parasympathetic release: 4s Inhale, 5s Hold, 6s Exhale, 3s Hold"
              >
                Deep 4-5-6-3
              </button>
            </div>

            {/* Return to Journal Button */}
            <button
              onClick={() => setIsZenModeOpen(false)}
              className="px-5 py-2 rounded-2xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-200 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <span>Return to Journal</span>
              <span className="text-[10px] text-stone-500 font-mono">(Esc)</span>
            </button>
          </footer>
        </div>
      )}
    </>
  );
};
