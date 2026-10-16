import React from "react";
import {
  X,
  Cloud,
  Folder,
  Zap,
  Sparkles,
  Info,
  Palette,
  BookOpen,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  FolderCheck,
  RefreshCw,
  LogOut,
  FolderSync,
  Download,
  Key,
} from "lucide-react";
import { DriveAuthState, FolderConfig, TranscriptionEngine, ThemeMode, AccentColor } from "../types";
import { GoogleDriveSyncBanner } from "./GoogleDriveSyncBanner";
import { FolderSelector } from "./FolderSelector";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // Drive sync
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
  onOpenAuthHelpModal,
  onShowMessage,
  accentColorHex = "#6366F1",
  onPullFromDrive,
  isPullingDrive = false,
  autoDownloadFiles = false,
  onToggleAutoDownloadFiles,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vornal Vault Sidebar"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-stone-50 dark:bg-stone-900 h-full shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: accentColorHex }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
            >
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Vault Sync &amp; Storage
              </h2>
              <p className="text-[11px] text-stone-400">
                Manage cloud drives, offline engine, and local files
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Section 1: Default Transcription Engine Switcher */}
          <section className="bg-white dark:bg-stone-800/80 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Speech Engine
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {transcriptionEngine === "native"
                      ? "Native Speech (Default · 100% Offline)"
                      : "Gemini AI Engine (Enhanced structure)"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                {transcriptionEngine === "native" ? "Native Default" : "AI Active"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-900/60 rounded-xl mt-3">
              <button
                type="button"
                onClick={() => onToggleEngine("native")}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  transcriptionEngine === "native"
                    ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Native Speech</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleEngine("gemini")}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  transcriptionEngine === "gemini"
                    ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Gemini AI</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2.5 leading-relaxed">
              {transcriptionEngine === "native"
                ? "Your voice is transcribed locally on your device without any external API calls. If you are ever unhappy with a transcript, you can 1-click enhance it with Gemini AI anytime!"
                : "Gemini AI produces executive summaries, emotional tone detection, action items, and timestamped transcripts."}
            </p>
          </section>

          {/* Section 2: Google Drive Cloud Vault Sync */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                Google Drive Vault
              </span>
              {driveState.isAuthenticated && (
                <button
                  onClick={onOpenFolderManager}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Manage Folders
                </button>
              )}
            </div>

            <GoogleDriveSyncBanner
              driveState={driveState}
              autoSyncDrive={autoSyncDrive}
              onToggleAutoSync={onToggleAutoSync}
              onSignIn={async () => { await onSignInDrive(); }}
              onSignOut={async () => { await onSignOutDrive(); }}
              onSyncAll={async () => { await onSyncAllToDrive(); }}
              onOpenFolderManager={onOpenFolderManager}
              totalRecordingsCount={totalJournalsCount}
              unsyncedCount={unsyncedDriveCount}
            />

            {/* Pull from Drive button when authenticated */}
            {driveState.isAuthenticated && onPullFromDrive && (
              <button
                type="button"
                onClick={onPullFromDrive}
                disabled={isPullingDrive}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPullingDrive ? "animate-spin" : ""}`} />
                <span>{isPullingDrive ? "Pulling notes from Drive..." : "Pull notes & audio from Drive folder"}</span>
              </button>
            )}

            {/* GitHub Pages Auth Helper link */}
            {onOpenAuthHelpModal && (
              <button
                type="button"
                onClick={onOpenAuthHelpModal}
                className="w-full text-left text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1.5 py-1 px-1 transition-colors"
              >
                <Key className="w-3 h-3 text-stone-400" />
                <span>GitHub Pages domain or custom Client ID setup</span>
              </button>
            )}
          </section>

          {/* Section 3: Phone Folder & Downloads */}
          <section className="space-y-2">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-stone-500" />
              Local Device &amp; Downloads
            </span>

            <FolderSelector
              folderConfig={folderConfig}
              onUpdateConfig={onUpdateFolderConfig}
              onShowMessage={onShowMessage}
            />

            {/* Auto-download toggle */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3 shadow-xs">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300 shrink-0" />
                  <span>Auto-download files on record</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  {autoDownloadFiles
                    ? "Enabled: automatically triggers browser downloads after recording."
                    : "Disabled (Recommended): recordings stay safely in your private vault. Click download whenever you need files."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoDownloadFiles}
                aria-label="Toggle auto download"
                onClick={() => onToggleAutoDownloadFiles?.(!autoDownloadFiles)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 ${
                  autoDownloadFiles ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    autoDownloadFiles ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Section 4: Quick Shortcuts & Customization */}
          <section className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
              Preferences &amp; Info
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenThemeModal();
                }}
                className="p-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-2.5 text-left"
              >
                <Palette className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Theme &amp; Colors
                  </div>
                  <div className="text-[10px] text-stone-400">Light / Dark / Custom</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenAboutModal();
                }}
                className="p-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-2.5 text-left"
              >
                <Info className="w-4 h-4 text-stone-500" />
                <div>
                  <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    About &amp; Privacy
                  </div>
                  <div className="text-[10px] text-stone-400">Ideated by Ravi Nair</div>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 text-center text-xs text-stone-400 flex items-center justify-between">
          <span>Vornal Vault</span>
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            Ideated by <strong>Ravi Nair</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
