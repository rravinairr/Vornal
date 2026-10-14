import React from "react";
import { Folder, FolderCheck, AlertCircle, RefreshCw, Smartphone, ShieldCheck } from "lucide-react";
import { FolderConfig } from "../types";
import { pickJournalFolder, requestFolderPermission, isRunningInIframe } from "../utils/fileSync";

interface FolderSelectorProps {
  folderConfig: FolderConfig;
  onUpdateConfig: (config: Partial<FolderConfig>) => void;
  onShowMessage: (msg: string, type?: "success" | "info" | "error") => void;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  folderConfig,
  onUpdateConfig,
  onShowMessage,
}) => {
  const inIframe = isRunningInIframe();

  const handleSelectFolder = async () => {
    if (inIframe) {
      onShowMessage(
        "Direct folder picker is restricted in embedded frames by browser security. Automatic file download & Files share are enabled.",
        "info"
      );
      return;
    }

    if (!folderConfig.isSupported) {
      onShowMessage(
        "Directory Picker is not available on this browser. Direct download and Files share sheet are automatically enabled.",
        "info"
      );
      return;
    }

    const result = await pickJournalFolder();
    if (result.handle && result.name) {
      onUpdateConfig({
        handle: result.handle,
        folderName: result.name,
        permissionGranted: true,
      });
      onShowMessage(`Folder connected: ${result.name}. Auto-save is active!`, "success");
    } else if (result.error) {
      onShowMessage(result.error, result.isIframe ? "info" : "error");
    }
  };

  const handleRecheckPermission = async () => {
    if (!folderConfig.handle) return;
    const granted = await requestFolderPermission(folderConfig.handle);
    onUpdateConfig({ permissionGranted: granted });
    if (granted) {
      onShowMessage("Folder permission renewed successfully!", "success");
    } else {
      onShowMessage("Permission was denied. Please re-select the folder.", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start gap-3.5">
          <div className="min-w-[44px] min-h-[44px] rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 mt-0.5 shrink-0">
            {folderConfig.folderName ? (
              <FolderCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : inIframe ? (
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : folderConfig.isSupported ? (
              <Folder className="w-5 h-5 text-stone-600 dark:text-stone-300" />
            ) : (
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {folderConfig.folderName
                  ? `Target Folder: ${folderConfig.folderName}`
                  : inIframe
                  ? "Automatic Download & Files Save Mode"
                  : folderConfig.isSupported
                  ? "Target Folder on Device"
                  : "Mobile Files & Download Mode"}
              </span>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
              {folderConfig.folderName ? (
                folderConfig.permissionGranted ? (
                  "Voice notes (.webm) and Markdown notes (.md) save automatically directly into this folder."
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                    Permission needed to write to folder
                  </span>
                )
              ) : inIframe ? (
                "Browser sandboxes restrict directory pickers inside sub-frames. Your voice notes and .md transcripts are automatically downloaded to your device Downloads/Files folder upon stopping."
              ) : folderConfig.isSupported ? (
                "Select a folder on your phone or PC (e.g. Obsidian vault or Documents) to auto-save files directly."
              ) : (
                "Direct mobile download and iOS/Android 'Save to Files' sheet active automatically."
              )}
            </p>
          </div>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {folderConfig.folderName && !folderConfig.permissionGranted && (
            <button
              onClick={handleRecheckPermission}
              className="min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Grant Access
            </button>
          )}

          {!inIframe && folderConfig.isSupported ? (
            <button
              onClick={handleSelectFolder}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors whitespace-nowrap shadow-xs"
            >
              {folderConfig.folderName ? "Change Folder" : "Select Folder"}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-3 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Auto-Download Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
