import React, { useState } from "react";
import {
  FileText,
  Trash2,
  Share2,
  Copy,
  Check,
  ChevronRight,
  FolderCheck,
  Cloud,
  CloudCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Download,
} from "lucide-react";
import { JournalEntry } from "../types";
import { AudioPlayer } from "./AudioPlayer";
import { shareJournalFiles, downloadJournalFiles } from "../utils/fileSync";
import { getToneStyle } from "../utils/toneColors";

interface JournalCardProps {
  entry: JournalEntry;
  isDriveConnected?: boolean;
  onSelect: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onSyncToDrive?: (entry: JournalEntry) => void;
  onEnhanceWithGemini?: (entry: JournalEntry) => void;
  onTagClick?: (tag: string) => void;
  onShowMessage: (msg: string, type?: "success" | "info" | "error") => void;
}

export const JournalCard: React.FC<JournalCardProps> = ({
  entry,
  isDriveConnected = false,
  onSelect,
  onDelete,
  onSyncToDrive,
  onEnhanceWithGemini,
  onTagClick,
  onShowMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  const tone = getToneStyle(entry.mood);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(entry.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowMessage("Markdown copied to clipboard!", "success");
    } catch {
      onShowMessage("Failed to copy", "error");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await shareJournalFiles(
      entry.audioBlob,
      entry.audioFileName,
      entry.markdown,
      entry.mdFileName,
      entry.title
    );
    if (res.shared) {
      onShowMessage("Shared successfully!", "success");
    }
  };

  const handleDriveSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSyncToDrive) return;
    setIsSyncingDrive(true);
    try {
      await onSyncToDrive(entry);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadJournalFiles(
      entry.audioBlob,
      entry.audioFileName,
      entry.markdown,
      entry.mdFileName
    );
    onShowMessage(`Downloaded ${entry.mdFileName} & audio!`, "success");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
    onShowMessage("Voice note removed from vault", "info");
  };

  return (
    <div
      onClick={() => onSelect(entry)}
      className={`group ${tone.cardBg} border ${tone.borderColor} ${tone.hoverBorder} rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
    >
      <div>
        {/* Top unboxed metadata line + tone badge */}
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2.5">
          <div className="flex items-center gap-2 truncate">
            <span>{entry.dateFormatted}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{Math.round(entry.audioDuration)}s</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tone Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${tone.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dotColor}`} />
              <span>{entry.mood}</span>
            </span>

            {/* Transcription Status */}
            {entry.transcriptionStatus === "processing" && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Transcribing...
              </span>
            )}

            {entry.transcriptionStatus === "failed" && (
              <span className="flex items-center gap-1 text-rose-500 text-[11px] font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Draft
              </span>
            )}

            {/* Google Drive Status Badge */}
            {isDriveConnected && entry.driveSyncStatus === "synced" && (
              <span
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[11px] font-medium"
                title="Synced to Google Drive folder"
              >
                <Cloud className="w-3.5 h-3.5" />
                Drive
              </span>
            )}

            {/* Speech Engine Badge */}
            {entry.engineUsed === "native" && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/50 dark:border-stone-700/50"
                title="Transcribed locally with Native Speech"
              >
                <Zap className="w-2.5 h-2.5 text-emerald-500" />
                <span>Native</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mb-1.5 line-clamp-1">
          {entry.title}
        </h3>

        {/* User Tags line if any */}
        {entry.userTags && entry.userTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {entry.userTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white/70 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 px-2 py-0.5 rounded-md transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Summary preview */}
        <p className="text-xs text-stone-600 dark:text-stone-300 font-serif line-clamp-2 leading-relaxed mb-3">
          {entry.summary}
        </p>

        {/* Embedded Audio Player with Small Audio Frequency Waveform Visualizer */}
        <div onClick={(e) => e.stopPropagation()} className="mb-4">
          <AudioPlayer
            audioBlob={entry.audioBlob}
            duration={entry.audioDuration}
            showVisualizer={true}
            waveActive={tone.waveActive}
            waveInactive={tone.waveInactive}
          />
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center justify-between text-xs text-stone-500">
        <span className="font-mono text-[11px] text-stone-400 truncate max-w-[140px]">
          {entry.mdFileName}
        </span>

        <div className="flex items-center gap-1">
          {/* Sync to Drive button if connected and not yet synced */}
          {isDriveConnected && entry.driveSyncStatus !== "synced" && (
            <button
              onClick={handleDriveSyncClick}
              disabled={isSyncingDrive}
              aria-label="Upload to Google Drive"
              title="Upload to Google Drive"
              className="min-h-[40px] px-2 flex items-center gap-1 rounded-lg text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-[11px] font-medium"
            >
              {isSyncingDrive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>Drive</span>
            </button>
          )}

          {/* Quick AI Enhance button if native speech or needs improvement */}
          {onEnhanceWithGemini && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEnhanceWithGemini(entry);
              }}
              aria-label="Enhance with Gemini AI"
              title="Enhance transcript & generate insights with Gemini AI"
              className="min-h-[40px] px-2 flex items-center gap-1 rounded-lg text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors text-[11px] font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI</span>
            </button>
          )}

          {/* Download Audio & Markdown */}
          <button
            onClick={handleDownload}
            aria-label="Download audio and markdown files"
            title="Download Audio & Markdown (.md)"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopy}
            aria-label="Copy markdown"
            title="Copy Markdown"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleShare}
            aria-label="Share files"
            title="Share files"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            aria-label="Delete entry"
            title="Delete entry"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="min-h-[40px] pl-1 flex items-center text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
