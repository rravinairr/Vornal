import React, { useState } from "react";
import { X, Sun, Moon, Monitor, Palette, Check } from "lucide-react";
import { ThemeMode, AccentColor } from "../types";

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
  accentColor: AccentColor;
  onChangeAccentColor: (accent: AccentColor) => void;
  customHex: string;
  onChangeCustomHex: (hex: string) => void;
}

const PRESET_ACCENTS: { id: AccentColor; label: string; hex: string; bgClass: string }[] = [
  { id: "indigo", label: "Mindful Indigo", hex: "#6366F1", bgClass: "bg-indigo-600" },
  { id: "emerald", label: "Calm Emerald", hex: "#059669", bgClass: "bg-emerald-600" },
  { id: "rose", label: "Energized Rose", hex: "#E11D48", bgClass: "bg-rose-600" },
  { id: "amber", label: "Warm Amber", hex: "#D97706", bgClass: "bg-amber-600" },
  { id: "sky", label: "Ocean Sky", hex: "#0284C7", bgClass: "bg-sky-600" },
  { id: "stone", label: "Minimal Stone", hex: "#57534E", bgClass: "bg-stone-600" },
];

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  themeMode,
  onChangeThemeMode,
  accentColor,
  onChangeAccentColor,
  customHex,
  onChangeCustomHex,
}) => {
  const [localCustom, setLocalCustom] = useState(customHex || "#6366F1");

  if (!isOpen) return null;

  const handleCustomHexChange = (val: string) => {
    setLocalCustom(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChangeCustomHex(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Appearance & Colors
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Customize theme mode and primary accent color
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close theme customizer"
            className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Mode Selection */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2.5">
            THEME MODE
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onChangeThemeMode("light")}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                themeMode === "light"
                  ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                  : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60"
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              onClick={() => onChangeThemeMode("dark")}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                themeMode === "dark"
                  ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                  : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60"
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => onChangeThemeMode("system")}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                themeMode === "system"
                  ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                  : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60"
              }`}
            >
              <Monitor className="w-4 h-4 text-stone-400" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Primary Accent Color Presets */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2.5">
            PRIMARY ACCENT COLOR
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_ACCENTS.map((preset) => {
              const isSelected = accentColor === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onChangeAccentColor(preset.id);
                    onChangeCustomHex(preset.hex);
                    setLocalCustom(preset.hex);
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? "border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800/80 shadow-xs ring-1 ring-stone-900/10"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <div
                    style={{ backgroundColor: preset.hex }}
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                  <span className="truncate text-[11px] font-semibold">{preset.label.split(" ")[1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hex Color Picker */}
        <div className="mt-5 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-800">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Custom Hex Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={localCustom}
              onChange={(e) => {
                setLocalCustom(e.target.value);
                onChangeCustomHex(e.target.value);
              }}
              className="w-9 h-9 rounded-xl border border-stone-300 dark:border-stone-700 cursor-pointer p-0.5 bg-transparent shrink-0"
            />
            <input
              type="text"
              value={localCustom}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              placeholder="#6366F1"
              maxLength={7}
              className="flex-1 text-xs font-mono px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 uppercase"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
