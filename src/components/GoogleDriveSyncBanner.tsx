import React, { useState } from "react";
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  LogOut,
  FolderSync,
  Loader2,
  FolderOpen,
  MoveRight,
} from "lucide-react";
import { DriveAuthState } from "../types";

interface GoogleDriveSyncBannerProps {
  driveState: DriveAuthState;
  autoSyncDrive: boolean;
  onToggleAutoSync: (val: boolean) => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSyncAll: () => Promise<void>;
  onOpenFolderManager: () => void;
  totalRecordingsCount: number;
  unsyncedCount: number;
}

export const GoogleDriveSyncBanner: React.FC<GoogleDriveSyncBannerProps> = ({
  driveState,
  autoSyncDrive,
  onToggleAutoSync,
  onSignIn,
  onSignOut,
  onSyncAll,
  onOpenFolderManager,
  totalRecordingsCount,
  unsyncedCount,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await onSignIn();
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section: Drive status & description */}
        <div className="flex items-start gap-3.5">
          <div className="min-w-[44px] min-h-[44px] rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {driveState.isAuthenticated ? "Google Drive Cloud Vault" : "Google Drive Cloud Sync"}
              </span>

              {driveState.isAuthenticated ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {driveState.userName || driveState.userEmail || "Connected"}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                  Available for any Google account
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
              {driveState.isAuthenticated ? (
                <span>
                  Synchronized with Google Drive folder:{" "}
                  <strong className="text-stone-800 dark:text-stone-200 font-semibold">
                    "{driveState.driveFolderName || "Vornal Voice Vault"}"
                  </strong>
                  . Access your raw audio recordings and .md notes from any device.
                </span>
              ) : (
                "Sign in with Google to automatically back up all audio recordings and .md notes to your own chosen folder on Google Drive."
              )}
            </p>

            {/* Folder controls when authenticated */}
            {driveState.isAuthenticated && (
              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs">
                {/* Folder manager button */}
                <button
                  type="button"
                  onClick={onOpenFolderManager}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Choose Folder / Move Files</span>
                </button>

                {driveState.driveFolderId && (
                  <a
                    href={`https://drive.google.com/drive/folders/${driveState.driveFolderId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Drive
                  </a>
                )}

                <label className="flex items-center gap-1.5 cursor-pointer text-stone-600 dark:text-stone-400 ml-1">
                  <input
                    type="checkbox"
                    checked={autoSyncDrive}
                    onChange={(e) => onToggleAutoSync(e.target.checked)}
                    className="rounded text-blue-600 accent-blue-600 w-3.5 h-3.5"
                  />
                  <span>Auto-sync new entries</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
          {!driveState.isAuthenticated ? (
            /* Official Google Sign-In button per Workspace spec */
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 text-xs font-semibold shadow-xs flex items-center gap-2.5 transition-all"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoggingIn ? "Signing in..." : "Sign in with Google"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Sync All button */}
              <button
                onClick={onSyncAll}
                disabled={driveState.isSyncingAll}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {driveState.isSyncingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderSync className="w-4 h-4" />
                )}
                <span>
                  {driveState.isSyncingAll
                    ? `Syncing (${driveState.syncProgress?.current || 0}/${
                        driveState.syncProgress?.total || totalRecordingsCount
                      })...`
                    : unsyncedCount > 0
                    ? `Sync All (${unsyncedCount} pending)`
                    : "Re-sync All"}
                </span>
              </button>

              {/* Sign out */}
              <button
                onClick={onSignOut}
                aria-label="Sign out of Google"
                title="Disconnect Google Drive"
                className="min-h-[44px] min-w-[44px] rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
