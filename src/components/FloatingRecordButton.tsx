import React from "react";
import { Mic, Square, Pause, Play, Sparkles } from "lucide-react";
import { formatTime } from "../hooks/useAudioRecorder";

interface FloatingRecordButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  accentColorHex?: string;
  isProcessing?: boolean;
}

export const FloatingRecordButton: React.FC<FloatingRecordButtonProps> = ({
  isRecording,
  isPaused,
  recordingDuration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  accentColorHex = "#6366F1",
  isProcessing = false,
}) => {
  // If recording is active, show the live floating pill with controls
  if (isRecording) {
    return (
      <div
        role="region"
        aria-label="Active Recording Controller"
        className="fixed bottom-5 right-4 sm:right-6 sm:bottom-6 z-30 flex items-center gap-2 p-2 bg-stone-900/95 dark:bg-stone-900/95 text-white backdrop-blur-xl border border-stone-700/80 rounded-full shadow-2xl animate-in slide-in-from-bottom-3 duration-200 select-none"
      >
        {/* Pulsating recording indicator & timer */}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPaused ? "bg-amber-400" : "bg-rose-500"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isPaused ? "bg-amber-400" : "bg-rose-500"
              }`}
            />
          </span>
          <span className="font-mono text-xs font-bold tabular-nums">
            {formatTime(recordingDuration)}
          </span>
        </div>

        {/* Pause / Resume Button */}
        <button
          onClick={isPaused ? onResumeRecording : onPauseRecording}
          aria-label={isPaused ? "Resume recording" : "Pause recording"}
          title={isPaused ? "Resume recording" : "Pause recording"}
          className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Finish / Stop Recording Button */}
        <button
          onClick={onStopRecording}
          aria-label="Finish recording and save note"
          title="Finish recording and save note"
          className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Save</span>
        </button>
      </div>
    );
  }

  // When idle, show the sleek floating record FAB that stays floating at all times
  return (
    <button
      onClick={() => {
        // Scroll smoothly to top recording console if not near top, or start directly
        const el = document.getElementById("recording-console-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        onStartRecording();
      }}
      disabled={isProcessing}
      aria-label="Start Voice Recording"
      title="Record new reflection (floating at all times)"
      className="fixed bottom-5 right-4 sm:right-6 sm:bottom-6 z-30 group flex items-center gap-2 p-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-108 active:scale-95 text-white disabled:opacity-50 select-none cursor-pointer"
      style={{
        backgroundColor: accentColorHex,
        boxShadow: `0 8px 24px ${accentColorHex}55`,
      }}
    >
      <div className="relative flex items-center justify-center">
        <Mic className="w-6 h-6 transition-transform group-hover:scale-110" />
      </div>
      <span className="hidden sm:inline-block font-semibold text-xs pr-1 drop-shadow-xs">
        Record
      </span>
    </button>
  );
};
