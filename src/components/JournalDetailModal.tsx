import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  FolderDown,
  FileText,
  Headphones,
  Code2,
  CheckSquare,
  Sparkles,
  Tag,
  Plus,
  RefreshCw,
  Cloud,
} from "lucide-react";
import { JournalEntry, FolderConfig } from "../types";
import { AudioPlayer } from "./AudioPlayer";
import {
  downloadFile,
  writeFilesToFolder,
  shareJournalFiles,
} from "../utils/fileSync";
import { rebuildMarkdown } from "../utils/sampleEntry";

interface JournalDetailModalProps {
  entry: JournalEntry | null;
  folderConfig: FolderConfig;
  isProcessing?: boolean;
  isDriveConnected?: boolean;
  onClose: () => void;
  onUpdateEntry: (updated: JournalEntry) => void;
  onRetryTranscription?: (entry: JournalEntry) => void;
  onEnhanceWithGemini?: (entry: JournalEntry) => void;
  onUploadToDrive?: (entry: JournalEntry) => Promise<void>;
  onShowMessage: (msg: string, type?: "success" | "info" | "error") => void;
}

const COMMON_TAGS = ["reflection", "ideas", "work", "personal", "gratitude", "goals", "health", "insights"];

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({
  entry,
  folderConfig,
  isProcessing = false,
  isDriveConnected = false,
  onClose,
  onUpdateEntry,
  onRetryTranscription,
  onEnhanceWithGemini,
  onUploadToDrive,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<"formatted" | "raw" | "transcript">("formatted");
  const [copied, setCopied] = useState(false);
  const [isSavingToFolder, setIsSavingToFolder] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  if (!entry) return null;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/^#/, "");
    if (!clean) return;
    const currentTags = entry.userTags || [];
    if (currentTags.includes(clean)) return;

    const updatedTags = [...currentTags, clean];
    const updatedMarkdown = rebuildMarkdown(
      entry.title,
      entry.dateFormatted,
      entry.mood,
      entry.audioFileName,
      updatedTags,
      entry.summary,
      entry.keyThemes,
      entry.actionItems,
      entry.transcript
    );

    const updatedEntry: JournalEntry = {
      ...entry,
      userTags: updatedTags,
      markdown: updatedMarkdown,
    };

    onUpdateEntry(updatedEntry);
    setNewTagInput("");
    onShowMessage(`Added #${clean} to entry`, "success");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = entry.userTags || [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);
    const updatedMarkdown = rebuildMarkdown(
      entry.title,
      entry.dateFormatted,
      entry.mood,
      entry.audioFileName,
      updatedTags,
      entry.summary,
      entry.keyThemes,
      entry.actionItems,
      entry.transcript
    );

    const updatedEntry: JournalEntry = {
      ...entry,
      userTags: updatedTags,
      markdown: updatedMarkdown,
    };

    onUpdateEntry(updatedEntry);
    onShowMessage(`Removed #${tagToRemove}`, "info");
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(entry.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowMessage("Markdown copied to clipboard!", "success");
    } catch {
      onShowMessage("Failed to copy to clipboard", "error");
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([entry.markdown], { type: "text/markdown;charset=utf-8" });
    downloadFile(blob, entry.mdFileName);
    onShowMessage(`Downloaded ${entry.mdFileName}`, "success");
  };

  const handleDownloadAudio = () => {
    downloadFile(entry.audioBlob, entry.audioFileName);
    onShowMessage(`Downloaded ${entry.audioFileName}`, "success");
  };

  const handleSaveToFolder = async () => {
    if (!folderConfig.handle) {
      onShowMessage("No folder is currently selected. Using direct download instead.", "info");
      handleDownloadMd();
      handleDownloadAudio();
      return;
    }
    setIsSavingToFolder(true);
    const result = await writeFilesToFolder(
      folderConfig.handle,
      entry.audioFileName,
      entry.audioBlob,
      entry.mdFileName,
      entry.markdown
    );
    setIsSavingToFolder(false);

    if (result.success) {
      onShowMessage(`Saved ${entry.mdFileName} & audio to folder!`, "success");
    } else {
      onShowMessage(result.error || "Failed to save to folder. Download fallback triggered.", "info");
      handleDownloadMd();
      handleDownloadAudio();
    }
  };

  const handleShare = async () => {
    const res = await shareJournalFiles(
      entry.audioBlob,
      entry.audioFileName,
      entry.markdown,
      entry.mdFileName,
      entry.title
    );
    if (res.shared) {
      onShowMessage("Shared successfully!", "success");
    } else if (res.error) {
      onShowMessage(res.error, "info");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
              {entry.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <span>{entry.dateFormatted}</span>
              <span aria-hidden="true">·</span>
              <span>{entry.mood}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{Math.round(entry.audioDuration)}s audio</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Segmented View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/60 dark:bg-stone-800 rounded-xl">
            <button
              onClick={() => setActiveTab("formatted")}
              className={`min-h-[36px] px-3 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "formatted"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Journal View
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`min-h-[36px] px-3 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "raw"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Raw .md
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`min-h-[36px] px-3 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "transcript"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              Transcript
            </button>
          </div>

          {/* Export / Sync Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="min-h-[36px] px-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy .md"}
            </button>

            <button
              onClick={() => {
                handleDownloadMd();
                handleDownloadAudio();
              }}
              className="min-h-[36px] px-3 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              title="Download both markdown note and audio recording to your device"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Files</span>
            </button>

            {folderConfig.handle && (
              <button
                onClick={handleSaveToFolder}
                disabled={isSavingToFolder}
                className="min-h-[36px] px-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                <FolderDown className="w-3.5 h-3.5" />
                {isSavingToFolder ? "Saving..." : "Save to Folder"}
              </button>
            )}

            {isDriveConnected && onUploadToDrive && (
              <button
                onClick={async () => {
                  try {
                    await onUploadToDrive(entry);
                  } catch (e: any) {
                    onShowMessage(e.message || "Drive upload failed", "error");
                  }
                }}
                className={`min-h-[36px] px-3 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                  entry.driveSyncStatus === "synced"
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                }`}
                title="Backup to Google Drive"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{entry.driveSyncStatus === "synced" ? "In Drive" : "Save to Drive"}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="min-h-[36px] min-w-[36px] px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center justify-center"
              title="Share / Save to Mobile Files"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Audio Player always on top */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Preserved Voice Recording ({entry.audioFileName})
              </span>
              <button
                onClick={handleDownloadAudio}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                title="Download raw audio file"
              >
                <Download className="w-3 h-3" />
                <span>Download Audio</span>
              </button>
            </div>
            <AudioPlayer audioBlob={entry.audioBlob} duration={entry.audioDuration} />
          </div>

          {/* User Defined Tags Editor */}
          <div className="bg-stone-50 dark:bg-stone-900/40 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                User Category Tags
              </span>
              <span className="text-[11px] text-stone-400">
                Synced into Markdown frontmatter
              </span>
            </div>

            {/* Current Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {(entry.userTags || []).length === 0 ? (
                <span className="text-xs text-stone-400 italic">No tags added yet.</span>
              ) : (
                entry.userTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-2.5 py-1 rounded-lg"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-300 dark:hover:text-rose-600 transition-colors"
                      title={`Remove #${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add tag form & quick suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="New tag..."
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 w-28"
                />
                <button
                  type="submit"
                  className="min-h-[28px] px-2.5 text-xs font-medium rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-1">
                {COMMON_TAGS.filter((t) => !(entry.userTags || []).includes(t))
                  .slice(0, 5)
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddTag(t)}
                      className="text-[11px] font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 px-2 py-0.5 rounded-md transition-colors"
                    >
                      +{t}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* If failed transcription, provide retry */}
          {entry.transcriptionStatus === "failed" && onRetryTranscription && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Audio saved · AI transcription pending
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Your audio recording was securely preserved. Tap below to generate the structured Markdown transcript with Gemini.
                </p>
                {entry.errorMessage && (
                  <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1 truncate max-w-md">
                    Notice: {entry.errorMessage}
                  </p>
                )}
              </div>
              <button
                onClick={() => onRetryTranscription(entry)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                <span>{isProcessing ? "Transcribing..." : "Transcribe Now"}</span>
              </button>
            </div>
          )}

          {/* Engine & Transcription Upgrade Option (Switch to API if unhappy with native speech) */}
          <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {entry.engineUsed === "native" ? "Transcribed with Native Speech (Offline)" : "Transcribed with Gemini AI"}
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  {entry.engineUsed === "native" ? "Native (Local)" : "Gemini AI"}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {entry.engineUsed === "native"
                  ? "Unhappy with the native browser transcription? You can re-analyze this audio recording with Gemini AI for deeper summaries, tone analysis, and formatted action items."
                  : "Processed with Gemini AI. You can re-run analysis if desired."}
              </p>
            </div>
            {(onEnhanceWithGemini || onRetryTranscription) && (
              <button
                onClick={() => (onEnhanceWithGemini ? onEnhanceWithGemini(entry) : onRetryTranscription?.(entry))}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
                title="Re-transcribe and format with Gemini AI"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                <span>{isProcessing ? "Processing AI..." : "Enhance with Gemini AI"}</span>
              </button>
            )}
          </div>

          {/* Formatted View */}
          {activeTab === "formatted" && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-stone-50 dark:bg-stone-900/40 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Executive Summary
                </div>
                <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif">
                  {entry.summary}
                </p>
              </div>

              {/* Themes & Insights */}
              {entry.keyThemes && entry.keyThemes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Key Themes &amp; Reflections
                  </h4>
                  <ul className="space-y-1.5">
                    {entry.keyThemes.map((theme, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-stone-700 dark:text-stone-300 flex items-start gap-2"
                      >
                        <span className="text-stone-400 mt-1 select-none">·</span>
                        <span>{theme}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action items */}
              {entry.actionItems && entry.actionItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Action Items &amp; Next Steps
                  </h4>
                  <div className="space-y-2">
                    {entry.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-stone-700 dark:text-stone-300 flex items-start gap-2"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 rounded accent-stone-900 dark:accent-stone-100"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verbatim Transcript */}
              <div>
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Transcript
                </h4>
                <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200/70 dark:border-stone-800 text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap font-serif">
                  {entry.transcript}
                </div>
              </div>
            </div>
          )}

          {/* Raw Markdown (.md) View */}
          {activeTab === "raw" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-stone-400">
                  Target File: {entry.mdFileName}
                </span>
                <button
                  onClick={handleDownloadMd}
                  className="text-xs text-stone-600 dark:text-stone-300 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download .md file
                </button>
              </div>
              <pre className="p-4 bg-stone-950 text-stone-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap border border-stone-800">
                {entry.markdown}
              </pre>
            </div>
          )}

          {/* Transcript Only View */}
          {activeTab === "transcript" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Full Speech Audio Transcript
                </span>
                <button
                  onClick={handleDownloadAudio}
                  className="text-xs text-stone-600 dark:text-stone-300 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download Audio Note
                </button>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-sm leading-loose whitespace-pre-wrap font-serif">
                {entry.transcript}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span>Audio: {entry.audioFileName}</span>
            <span>·</span>
            <span>Note: {entry.mdFileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAudio}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              Audio (.webm)
            </button>
            <span>·</span>
            <button
              onClick={handleDownloadMd}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              Markdown (.md)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
