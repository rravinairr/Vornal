import React, { useState } from "react";
import {
  Mic,
  Square,
  Pause,
  Play,
  X,
  Loader2,
  Sparkles,
  Tag,
  Plus,
  Zap,
  Info,
} from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { formatTime } from "../hooks/useAudioRecorder";
import { TranscriptionEngine } from "../types";

interface RecordingConsoleProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  analyserNode: AnalyserNode | null;
  isProcessing: boolean;
  processingStep: string;
  activeTags: string[];
  transcriptionEngine: TranscriptionEngine;
  onToggleEngine: (engine: TranscriptionEngine) => void;
  onToggleTag: (tag: string) => void;
  onAddCustomTag: (tag: string) => void;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  accentColorHex?: string;
}

const COMMON_TAG_SUGGESTIONS = [
  "reflection",
  "ideas",
  "work",
  "personal",
  "gratitude",
  "planning",
  "mindset",
];

export const RecordingConsole: React.FC<RecordingConsoleProps> = ({
  isRecording,
  isPaused,
  recordingDuration,
  analyserNode,
  isProcessing,
  processingStep,
  activeTags,
  transcriptionEngine,
  onToggleEngine,
  onToggleTag,
  onAddCustomTag,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onCancelRecording,
  accentColorHex = "#6366F1",
}) => {
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTechInfo, setShowTechInfo] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, "");
    if (clean) {
      onAddCustomTag(clean);
      setNewTagInput("");
      setShowTagInput(false);
    }
  };

  return (
    <div className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-hidden transition-all">
      {/* Background ambient glow when active recording */}
      {isRecording && (
        <div
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${accentColorHex}15 0%, transparent 70%)`,
          }}
          className="absolute inset-0 pointer-events-none transition-opacity"
        />
      )}

      {/* Engine Switcher bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 dark:border-stone-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
          <span className="font-medium">Transcription Engine:</span>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => onToggleEngine("gemini")}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-[11px] ${
              transcriptionEngine === "gemini"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Gemini AI</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleEngine("native")}
            title="Runs 100% locally on device with Web Speech API. Zero API keys required."
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-[11px] cursor-pointer ${
              transcriptionEngine === "native"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-500" />
            <span>Without AI</span>
          </button>
        </div>
      </div>

      {/* When processing transcription */}
      {isProcessing && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-900 dark:text-stone-100 mb-4 animate-pulse">
            <Loader2
              style={{ color: accentColorHex }}
              className="w-7 h-7 animate-spin"
            />
          </div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Synthesizing Voice Journal
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
            {processingStep ||
              (transcriptionEngine === "native"
                ? "Formatting local speech into structured Markdown note..."
                : "Transcribing audio and analyzing tone with Gemini AI...")}
          </p>
        </div>
      )}

      {/* Recording in progress */}
      {!isProcessing && isRecording && (
        <div className="flex flex-col items-center justify-center">
          {/* Live timer */}
          <div className="text-3xl font-mono font-bold tabular-nums tracking-tight text-stone-900 dark:text-stone-100 mb-2">
            {formatTime(recordingDuration)}
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5">
            {isPaused ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">Recording Paused</span>
            ) : (
              <span className="font-medium flex items-center gap-1.5" style={{ color: accentColorHex }}>
                <span
                  style={{ backgroundColor: accentColorHex }}
                  className="w-2 h-2 rounded-full animate-ping inline-block"
                />
                Listening to your reflections... ({transcriptionEngine === "native" ? "Without AI" : "Gemini AI"})
              </span>
            )}
          </div>

          {/* Audio Visualizer */}
          <div className="w-full max-w-sm mb-4">
            <AudioVisualizer
              analyserNode={analyserNode}
              isRecording={isRecording}
              isPaused={isPaused}
              height={48}
            />
          </div>

          {/* Tag Selector while recording */}
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2">
              <span className="flex items-center gap-1 font-medium">
                <Tag className="w-3.5 h-3.5" />
                Categorize this entry:
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {COMMON_TAG_SUGGESTIONS.map((tag) => {
                const isSelected = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className={`min-h-[32px] px-2.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      isSelected
                        ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ergonomic Thumb Controls */}
          <div className="flex items-center justify-center gap-6 w-full max-w-xs">
            {/* Cancel Button */}
            <button
              onClick={onCancelRecording}
              aria-label="Cancel recording"
              className="min-h-[48px] min-w-[48px] rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Finish & Save (Primary Stop Button) */}
            <button
              onClick={onStopRecording}
              aria-label="Finish recording and save journal"
              style={{ backgroundColor: accentColorHex }}
              className="h-16 px-6 rounded-full text-white font-semibold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2.5 whitespace-nowrap"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>Finish &amp; Save</span>
            </button>

            {/* Pause / Resume Button */}
            <button
              onClick={isPaused ? onResumeRecording : onPauseRecording}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
              className="min-h-[48px] min-w-[48px] rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center justify-center"
            >
              {isPaused ? <Play className="w-5 h-5 ml-0.5" /> : <Pause className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Idle state: Ready to record */}
      {!isProcessing && !isRecording && (
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <button
            onClick={onStartRecording}
            aria-label="Start voice journaling recording"
            style={{
              backgroundColor: accentColorHex,
              boxShadow: `0 8px 24px ${accentColorHex}40`,
            }}
            className="group relative w-20 h-20 rounded-full text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 mb-4"
          >
            <div
              style={{ backgroundColor: accentColorHex }}
              className="absolute inset-0 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-300 pointer-events-none"
            />
            <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
          </button>

          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Tap to Record Voice Journal
          </h3>
          <div className="mt-1 mb-4 max-w-sm text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400 inline-flex items-center justify-center gap-1.5 flex-wrap">
              <span>Reflect through your words and come back through your breath to your full being.</span>
              <button
                type="button"
                onClick={() => setShowTechInfo(!showTechInfo)}
                aria-label="Toggle technical information"
                title="Technical info on recording & formats"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer text-[10px] font-serif font-bold italic"
              >
                i
              </button>
            </p>
            {showTechInfo && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 text-left animate-in fade-in duration-150 leading-relaxed">
                Speak your reflections naturally. Finishing immediately transcribes, formats into Markdown (.md), and saves both audio and note to your device &amp; cloud.
              </p>
            )}
          </div>

          {/* Preset category tags */}
          <div className="w-full max-w-md pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2">
              <span className="flex items-center gap-1 font-medium">
                <Tag className="w-3.5 h-3.5" />
                Select tags for your next entry:
              </span>
              <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="text-stone-600 dark:text-stone-300 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                Custom tag
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {COMMON_TAG_SUGGESTIONS.map((tag) => {
                const isSelected = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className={`min-h-[32px] px-2.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      isSelected
                        ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                );
              })}

              {/* Custom active tags */}
              {activeTags
                .filter((t) => !COMMON_TAG_SUGGESTIONS.includes(t))
                .map((customTag) => (
                  <button
                    key={customTag}
                    type="button"
                    onClick={() => onToggleTag(customTag)}
                    style={{ backgroundColor: accentColorHex }}
                    className="min-h-[32px] px-2.5 text-xs font-medium rounded-lg text-white flex items-center gap-1"
                  >
                    <span>#{customTag}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
            </div>

            {showTagInput && (
              <form onSubmit={handleAddTag} className="mt-3 flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="e.g. breakthrough, clarity"
                  className="px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="min-h-[32px] px-3 text-xs font-medium rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                >
                  Add
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
