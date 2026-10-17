import React, { useState } from "react";
import {
  X,
  Sparkles,
  Key,
  ExternalLink,
  Check,
  Zap,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { getUserGeminiApiKey, setUserGeminiApiKey } from "../utils/geminiClient";

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySavedAndTranscribe: () => void;
  onUseNativeSpeechFallback?: () => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySavedAndTranscribe,
  onUseNativeSpeechFallback,
}) => {
  const [apiKey, setApiKey] = useState(getUserGeminiApiKey());
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setError("Please paste a valid Gemini API key (starts with AIzaSy...)");
      return;
    }
    if (!cleanKey.startsWith("AIzaSy")) {
      setError("Gemini API keys typically start with 'AIzaSy'. Please verify your key.");
    } else {
      setError("");
    }

    setUserGeminiApiKey(cleanKey);
    setIsSaved(true);
    setTimeout(() => {
      onKeySavedAndTranscribe();
      onClose();
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gemini AI API Key Setup"
      className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Gemini AI Transcription Key
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Run AI summaries directly in your browser on GitHub Pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Why is an API key needed on GitHub Pages?</span>
          </p>
          <p className="text-[11px] text-indigo-800/90 dark:text-indigo-300/90">
            GitHub Pages is a static host without a backend server. To generate executive summaries, emotional tone, and action items with Gemini AI, your browser connects directly to Google using your personal free key. Your key is stored strictly on your device.
          </p>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              <span>Your Gemini API Key</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Get free key in 1 click</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError("");
            }}
            placeholder="AIzaSy..."
            className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
          />

          {error && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaved ? "Saved! Transcribing..." : "Save Key & Transcribe with Gemini"}</span>
          </button>
        </div>

        {/* Alternative: 100% Free Native Speech Engine */}
        {onUseNativeSpeechFallback && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-center space-y-2">
            <p className="text-[11px] text-stone-400">Don't want to get an API key right now?</p>
            <button
              type="button"
              onClick={() => {
                onUseNativeSpeechFallback();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span>Use Free On-Device Speech Transcription (100% Offline)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
