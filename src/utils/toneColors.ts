export interface ToneStyle {
  category: string;
  cardBg: string;
  borderColor: string;
  hoverBorder: string;
  accentText: string;
  badgeBg: string;
  waveActive: string;
  waveInactive: string;
  dotColor: string;
}

export function getToneStyle(mood: string): ToneStyle {
  const m = (mood || "").toLowerCase();

  // 1. Calm / Serene / Grounded / Peaceful
  if (
    m.includes("calm") ||
    m.includes("serene") ||
    m.includes("ground") ||
    m.includes("peace") ||
    m.includes("tranquil") ||
    m.includes("settled")
  ) {
    return {
      category: "Calm & Grounded",
      cardBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200/80 dark:border-emerald-800/40",
      hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
      accentText: "text-emerald-700 dark:text-emerald-300",
      badgeBg: "bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
      waveActive: "#059669",
      waveInactive: "#6EE7B7",
      dotColor: "bg-emerald-500",
    };
  }

  // 2. Energized / Excited / Driven / Passionate / Confident
  if (
    m.includes("energ") ||
    m.includes("excit") ||
    m.includes("driven") ||
    m.includes("motivat") ||
    m.includes("passion") ||
    m.includes("dynamic")
  ) {
    return {
      category: "Energized & Driven",
      cardBg: "bg-rose-50/50 dark:bg-rose-950/20",
      borderColor: "border-rose-200/80 dark:border-rose-800/40",
      hoverBorder: "hover:border-rose-300 dark:hover:border-rose-700",
      accentText: "text-rose-700 dark:text-rose-300",
      badgeBg: "bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200",
      waveActive: "#E11D48",
      waveInactive: "#FDA4AF",
      dotColor: "bg-rose-500",
    };
  }

  // 3. Creative / Visionary / Inspiring / Curious
  if (
    m.includes("creat") ||
    m.includes("vision") ||
    m.includes("inspir") ||
    m.includes("curio") ||
    m.includes("playful") ||
    m.includes("imagin")
  ) {
    return {
      category: "Creative & Visionary",
      cardBg: "bg-violet-50/50 dark:bg-violet-950/20",
      borderColor: "border-violet-200/80 dark:border-violet-800/40",
      hoverBorder: "hover:border-violet-300 dark:hover:border-violet-700",
      accentText: "text-violet-700 dark:text-violet-300",
      badgeBg: "bg-violet-100/60 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200",
      waveActive: "#7C3AED",
      waveInactive: "#C4B5FD",
      dotColor: "bg-violet-500",
    };
  }

  // 4. Grateful / Warm / Content / Joyful
  if (
    m.includes("grat") ||
    m.includes("warm") ||
    m.includes("joy") ||
    m.includes("happy") ||
    m.includes("content") ||
    m.includes("appreciat")
  ) {
    return {
      category: "Grateful & Warm",
      cardBg: "bg-amber-50/50 dark:bg-amber-950/20",
      borderColor: "border-amber-200/80 dark:border-amber-800/40",
      hoverBorder: "hover:border-amber-300 dark:hover:border-amber-700",
      accentText: "text-amber-700 dark:text-amber-300",
      badgeBg: "bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
      waveActive: "#D97706",
      waveInactive: "#FCD34D",
      dotColor: "bg-amber-500",
    };
  }

  // 5. Vulnerable / Processing / Emotional / Raw / Heavy
  if (
    m.includes("vulner") ||
    m.includes("process") ||
    m.includes("raw") ||
    m.includes("emotion") ||
    m.includes("heavy") ||
    m.includes("tender")
  ) {
    return {
      category: "Vulnerable & Processing",
      cardBg: "bg-orange-50/50 dark:bg-orange-950/20",
      borderColor: "border-orange-200/80 dark:border-orange-800/40",
      hoverBorder: "hover:border-orange-300 dark:hover:border-orange-700",
      accentText: "text-orange-700 dark:text-orange-300",
      badgeBg: "bg-orange-100/60 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
      waveActive: "#EA580C",
      waveInactive: "#FDBA74",
      dotColor: "bg-orange-500",
    };
  }

  // 6. Focused / Strategic / Analytical / Productive
  if (
    m.includes("focus") ||
    m.includes("strateg") ||
    m.includes("analyt") ||
    m.includes("product") ||
    m.includes("intent") ||
    m.includes("clear")
  ) {
    return {
      category: "Focused & Strategic",
      cardBg: "bg-sky-50/50 dark:bg-sky-950/20",
      borderColor: "border-sky-200/80 dark:border-sky-800/40",
      hoverBorder: "hover:border-sky-300 dark:hover:border-sky-700",
      accentText: "text-sky-700 dark:text-sky-300",
      badgeBg: "bg-sky-100/60 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200",
      waveActive: "#0284C7",
      waveInactive: "#7DD3FC",
      dotColor: "bg-sky-500",
    };
  }

  // 7. Default: Reflective / Contemplative
  return {
    category: "Reflective",
    cardBg: "bg-stone-50/60 dark:bg-stone-900/50",
    borderColor: "border-stone-200 dark:border-stone-800",
    hoverBorder: "hover:border-stone-300 dark:hover:border-stone-700",
    accentText: "text-stone-700 dark:text-stone-300",
    badgeBg: "bg-stone-200/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200",
    waveActive: "#57534E",
    waveInactive: "#D6D3D1",
    dotColor: "bg-stone-500",
  };
}
