import React, { useState } from "react";
import {
  X,
  Zap,
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  LogOut,
  FolderCheck,
  Folder,
  HardDrive,
  Download,
  Palette,
  Info,
  ExternalLink,
  Key,
  Check,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { DriveAuthState, FolderConfig, TranscriptionEngine } from "../types";
import { getUserGeminiApiKey, setUserGeminiApiKey } from "../utils/geminiClient";
import { pickJournalFolder, requestFolderPermission, isRunningInIframe } from "../utils/fileSync";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // Google Drive
  driveState: DriveAuthState;
  autoSyncDrive: boolean;
  onToggleAutoSync: (val: boolean) => void;
  onSignInDrive: () => Promise<void> | void;
  onSignOutDrive: () => Promise<void> | void;
  onSyncAllToDrive: () => Promise<void> | void;
  onOpenFolderManager: () => void;
  totalJournalsCount: number;
  unsyncedDriveCount: number;
  // Phone folder
  folderConfig: FolderConfig;
  onUpdateFolderConfig: (updates: Partial<FolderConfig>) => void;
  // Engine
  transcriptionEngine: TranscriptionEngine;
  onToggleEngine: (engine: TranscriptionEngine) => void;
  // Modals
  onOpenThemeModal: () => void;
  onOpenAboutModal: () => void;
  onOpenAuthHelpModal?: () => void;
  onShowMessage: (msg: string, type?: "success" | "info" | "error") => void;
  accentColorHex?: string;
  // Pull from drive
  onPullFromDrive?: () => Promise<void>;
  isPullingDrive?: boolean;
  // Auto-download files
  autoDownloadFiles?: boolean;
  onToggleAutoDownloadFiles?: (val: boolean) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  driveState,
  autoSyncDrive,
  onToggleAutoSync,
  onSignInDrive,
  onSignOutDrive,
  onSyncAllToDrive,
  onOpenFolderManager,
  totalJournalsCount,
  unsyncedDriveCount,
  folderConfig,
  onUpdateFolderConfig,
  transcriptionEngine,
  onToggleEngine,
  onOpenThemeModal,
  onOpenAboutModal,
  onShowMessage,
  accentColorHex = "#6366F1",
  onPullFromDrive,
  isPullingDrive = false,
  autoDownloadFiles = false,
  onToggleAutoDownloadFiles,
}) => {
  const [userGeminiKey, setUserGeminiKeyState] = useState(getUserGeminiApiKey());
  const [keySaved, setKeySaved] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const inIframe = isRunningInIframe();

  if (!isOpen) return null;

  const handleSaveGeminiKey = () => {
    setUserGeminiApiKey(userGeminiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
    onShowMessage(
      userGeminiKey.trim()
        ? "Personal Gemini API key saved! Your own quota will be used for AI notes."
        : "Cleared personal Gemini API key.",
      "success"
    );
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await onSignInDrive();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSelectLocalFolder = async () => {
    if (inIframe) {
      onShowMessage(
        "Directory Picker is restricted inside embedded frames. Downloads and vault storage are active.",
        "info"
      );
      return;
    }
    if (!folderConfig.isSupported) {
      onShowMessage(
        "Directory Picker is not supported on this browser. On-demand downloads are available.",
        "info"
      );
      return;
    }
    const result = await pickJournalFolder();
    if (result.handle && result.name) {
      onUpdateFolderConfig({
        handle: result.handle,
        folderName: result.name,
        permissionGranted: true,
      });
      onShowMessage(`Connected folder: ${result.name}`, "success");
    } else if (result.error) {
      onShowMessage(result.error, result.isIframe ? "info" : "error");
    }
  };

  const handleRecheckPermission = async () => {
    if (!folderConfig.handle) return;
    const granted = await requestFolderPermission(folderConfig.handle);
    onUpdateFolderConfig({ permissionGranted: granted });
    if (granted) {
      onShowMessage("Folder permission renewed successfully!", "success");
    } else {
      onShowMessage("Permission denied. Please re-select the folder.", "error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vornal Vault Options & Settings"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-stone-50 dark:bg-stone-950 h-full shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: accentColorHex }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Vault Settings &amp; Options
              </h2>
              <p className="text-[11px] text-stone-400">
                Speech engines, storage sync, and preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close options menu"
            className="w-8 h-8 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content with uniform cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Card 1: Speech Engine & Transcription */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Speech Engine
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {transcriptionEngine === "native"
                      ? "Native Speech (100% Offline)"
                      : "Gemini AI (Structured Markdown)"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                {transcriptionEngine === "native" ? "Free & Offline" : "AI Mode"}
              </span>
            </div>

            {/* Segmented Control */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => onToggleEngine("native")}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transcriptionEngine === "native"
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Native Speech</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleEngine("gemini")}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transcriptionEngine === "gemini"
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Gemini AI</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              {transcriptionEngine === "native"
                ? "Processes audio entirely inside your browser via Web Speech API with zero server calls, zero data leaks, and zero cost."
                : "Extracts emotional tone, executive summaries, and action items directly into formatted Markdown."}
            </p>

            {/* Personal Gemini API Key (BYOK) */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-indigo-500" />
                  <span>Personal Gemini API Key (BYOK)</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Get free key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Optional: Enter your own Google AI key to run AI summaries directly in your browser. Stored strictly in your browser.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={userGeminiKey}
                  onChange={(e) => setUserGeminiKeyState(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveGeminiKey}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {keySaved ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : null}
                  <span>{keySaved ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Google Drive Cloud Vault */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Google Drive Cloud Vault
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {driveState.isAuthenticated
                      ? `Connected: "${driveState.driveFolderName || "Vornal Voice Vault"}"`
                      : "Optional cloud backup & cross-device pull"}
                  </p>
                </div>
              </div>

              {driveState.isAuthenticated ? (
                <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              )}
            </div>

            {/* When NOT Authenticated: Only show simple, clean Login button. Hide all Drive clutter */}
            {!driveState.isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  Cloud backup is entirely optional. If you log in, your voice recordings and Markdown notes are backed up to your personal Google Drive folder, and you can pull reflections to any device.
                </p>

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-100 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>{isLoggingIn ? "Signing into Google..." : "Sign in with Google to enable cloud sync"}</span>
                </button>
              </div>
            ) : (
              /* When Authenticated: Show active controls cleanly */
              <div className="space-y-3">
                {/* Active folder & user info */}
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">Drive Account:</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[200px]">
                      {driveState.userName || driveState.userEmail}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">Cloud Folder:</span>
                    <button
                      type="button"
                      onClick={onOpenFolderManager}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>"{driveState.driveFolderName || "Vornal Voice Vault"}"</span>
                    </button>
                  </div>
                </div>

                {/* Auto-sync toggle */}
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      Auto-sync reflections
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Upload audio and .md notes to Drive immediately upon finishing.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoSyncDrive}
                    aria-label="Toggle auto sync to Google Drive"
                    onClick={() => onToggleAutoSync(!autoSyncDrive)}
                    className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 cursor-pointer ${
                      autoSyncDrive ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform ${
                        autoSyncDrive ? "translate-x-4.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Pull from Drive button */}
                {onPullFromDrive && (
                  <button
                    type="button"
                    onClick={onPullFromDrive}
                    disabled={isPullingDrive}
                    className="w-full py-2 px-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPullingDrive ? "animate-spin" : ""}`} />
                    <span>{isPullingDrive ? "Pulling notes from Drive..." : "Pull reflections & audio from Drive"}</span>
                  </button>
                )}

                {/* Sync all unsynced if any */}
                {unsyncedDriveCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => { await onSyncAllToDrive(); }}
                    className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Sync {unsyncedDriveCount} unsynced note{unsyncedDriveCount === 1 ? "" : "s"} to Drive</span>
                  </button>
                )}

                {/* Sign out link */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={async () => { await onSignOutDrive(); }}
                    className="text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign out of Google Drive</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Local Storage & Downloads */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Device Storage &amp; Downloads
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Local folder auto-save and download controls
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full">
                Local-First
              </span>
            </div>

            {/* Folder selection details */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {folderConfig.folderName ? (
                    <FolderCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {folderConfig.folderName ? folderConfig.folderName : "No local folder selected"}
                  </span>
                </div>

                {!inIframe && folderConfig.isSupported && (
                  <button
                    type="button"
                    onClick={handleSelectLocalFolder}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                  >
                    {folderConfig.folderName ? "Change" : "Select"}
                  </button>
                )}
              </div>

              {folderConfig.folderName && !folderConfig.permissionGranted && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Permission needed to write
                  </span>
                  <button
                    type="button"
                    onClick={handleRecheckPermission}
                    className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 underline cursor-pointer"
                  >
                    Grant
                  </button>
                </div>
              )}
            </div>

            {/* Auto-download toggle row */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>Auto-download files on record</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                  {autoDownloadFiles
                    ? "Files trigger browser download immediately."
                    : "Notes stay safely in your vault. Click download whenever you want files."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoDownloadFiles}
                aria-label="Toggle auto download"
                onClick={() => onToggleAutoDownloadFiles?.(!autoDownloadFiles)}
                className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 cursor-pointer ${
                  autoDownloadFiles ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
                }`}
              >
                <span
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform ${
                    autoDownloadFiles ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card 4: Quick Appearance & Philosophy Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenThemeModal();
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors flex items-center gap-3 text-left shadow-xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Theme &amp; Colors
                </div>
                <div className="text-[10px] text-stone-400">Palette &amp; mode</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAboutModal();
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors flex items-center gap-3 text-left shadow-xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  About &amp; Philosophy
                </div>
                <div className="text-[10px] text-stone-400">Mission &amp; ethos</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 text-center text-xs text-stone-400 flex items-center justify-between">
          <span className="font-serif font-bold text-stone-700 dark:text-stone-300">Vornal Vault</span>
          <span className="text-[11px] font-mono text-stone-400">
            Local-First &amp; Sovereign
          </span>
        </div>
      </div>
    </div>
  );
};
