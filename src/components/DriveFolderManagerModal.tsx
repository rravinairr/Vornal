import React, { useState, useEffect } from "react";
import {
  X,
  FolderPlus,
  Folder,
  Check,
  MoveRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  FolderCheck,
} from "lucide-react";
import { DriveFolderInfo, JournalEntry } from "../types";
import {
  listDriveFolders,
  createDriveFolder,
  moveJournalsToFolder,
  getAccessToken,
} from "../utils/googleDrive";

interface DriveFolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  currentFolderName: string | null;
  currentFolderLink: string | null;
  journals: JournalEntry[];
  onSelectFolder: (folder: DriveFolderInfo) => void;
  onJournalsMoved: (updatedJournals: JournalEntry[]) => void;
  onShowToast: (msg: string, type: "success" | "info" | "error") => void;
}

export const DriveFolderManagerModal: React.FC<DriveFolderManagerModalProps> = ({
  isOpen,
  onClose,
  currentFolderId,
  currentFolderName,
  currentFolderLink,
  journals,
  onSelectFolder,
  onJournalsMoved,
  onShowToast,
}) => {
  const [folders, setFolders] = useState<DriveFolderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<DriveFolderInfo | null>(null);

  // Move files confirmation modal state
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // Count synced items
  const syncedJournals = journals.filter((j) => j.driveSyncStatus === "synced" && (j.driveAudioFileId || j.driveMdFileId));

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) {
        onShowToast("Please sign in to Google Drive first", "error");
        return;
      }
      const fetched = await listDriveFolders(token);
      setFolders(fetched);
    } catch (err: any) {
      console.error("Failed to load folders:", err);
      onShowToast(err.message || "Could not list Google Drive folders", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFolders();
      setSelectedTargetFolder(null);
      setShowMoveConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setIsCreating(true);
      const token = await getAccessToken();
      if (!token) throw new Error("No Google Drive access token");
      const created = await createDriveFolder(token, newFolderName.trim());
      setFolders((prev) => [created, ...prev]);
      setSelectedTargetFolder(created);
      setNewFolderName("");
      onShowToast(`Created folder "${created.name}" in Google Drive!`, "success");
    } catch (err: any) {
      onShowToast(err.message || "Could not create folder", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleApplySelectedFolder = () => {
    if (!selectedTargetFolder) return;
    onSelectFolder(selectedTargetFolder);
    onShowToast(`Active Drive folder set to "${selectedTargetFolder.name}"`, "success");
    onClose();
  };

  const handleExecuteMove = async () => {
    if (!selectedTargetFolder) return;

    try {
      setIsMoving(true);
      const token = await getAccessToken();
      if (!token) throw new Error("Google Drive access token missing");

      const { movedCount, errors } = await moveJournalsToFolder(
        token,
        syncedJournals,
        selectedTargetFolder.id,
        currentFolderId || undefined
      );

      // Update local journals state
      const updated = journals.map((j) => {
        if (j.driveSyncStatus === "synced") {
          return {
            ...j,
            driveParentFolderId: selectedTargetFolder.id,
          };
        }
        return j;
      });

      onJournalsMoved(updated);
      onSelectFolder(selectedTargetFolder);

      if (errors.length > 0) {
        onShowToast(
          `Moved ${movedCount} files to "${selectedTargetFolder.name}", but encountered ${errors.length} warning(s).`,
          "info"
        );
      } else {
        onShowToast(
          `Successfully moved all ${syncedJournals.length} synced entries to "${selectedTargetFolder.name}"!`,
          "success"
        );
      }

      setShowMoveConfirm(false);
      onClose();
    } catch (err: any) {
      onShowToast(err.message || "Failed to move files in Google Drive", "error");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Google Drive Folders
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Choose destination folder & move existing synced files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close folder manager modal"
            className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Folder Info */}
        <div className="my-4 p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Active Sync Folder:
            </span>
            {currentFolderLink && (
              <a
                href={currentFolderLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                View in Drive
              </a>
            )}
          </div>
          <p className="text-stone-900 dark:text-stone-100 font-bold text-sm mt-1 flex items-center gap-2">
            <FolderCheck className="w-4 h-4 text-emerald-500" />
            {currentFolderName || "Vornal Voice Vault"}
          </p>
          <p className="text-stone-500 text-[11px] mt-1">
            New recordings and Markdown entries will sync directly into this folder.
          </p>
        </div>

        {/* Create New Folder Form */}
        <form onSubmit={handleCreateNewFolder} className="mb-4">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Create a New Drive Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Morning Musings, Work Audio Notes"
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isCreating || !newFolderName.trim()}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white flex items-center gap-1.5 transition-all disabled:opacity-40 shrink-0"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
              <span>Create</span>
            </button>
          </div>
        </form>

        {/* Existing Folder List */}
        <div className="flex-1 overflow-y-auto min-h-[160px] border border-stone-100 dark:border-stone-800 rounded-2xl p-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-stone-400 font-medium">
            <span>AVAILABLE DRIVE FOLDERS</span>
            <button
              onClick={loadFolders}
              disabled={isLoading}
              className="hover:text-stone-600 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-xs text-stone-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Scanning your Google Drive folders...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">
              No custom folders found yet. Use the field above to create one!
            </div>
          ) : (
            folders.map((f) => {
              const isCurrent = f.id === currentFolderId || f.name === currentFolderName;
              const isSelected = selectedTargetFolder?.id === f.id;

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedTargetFolder(f)}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                      : isCurrent
                      ? "bg-stone-100/70 dark:bg-stone-800/70 border border-transparent text-stone-900 dark:text-stone-100"
                      : "hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-600" : "text-stone-400"}`} />
                    <span className="font-medium truncate">{f.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500 dark:text-stone-400 text-center sm:text-left">
            {selectedTargetFolder ? (
              <span>
                Selected: <strong className="text-stone-800 dark:text-stone-200">{selectedTargetFolder.name}</strong>
              </span>
            ) : (
              <span>Select a folder above</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Move files button */}
            {selectedTargetFolder && selectedTargetFolder.id !== currentFolderId && syncedJournals.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMoveConfirm(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <MoveRight className="w-3.5 h-3.5" />
                <span>Move {syncedJournals.length} Synced Items Here</span>
              </button>
            )}

            {/* Set as Active Destination */}
            <button
              type="button"
              disabled={!selectedTargetFolder}
              onClick={handleApplySelectedFolder}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Set as Active Folder</span>
            </button>
          </div>
        </div>

        {/* Explicit User Confirmation Dialog for Moving Files (Workspace integration guideline requirement) */}
        {showMoveConfirm && selectedTargetFolder && (
          <div className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Move Synced Files in Google Drive?
                </h4>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                Are you sure you want to move <strong>{syncedJournals.length} voice recordings and Markdown notes</strong> from{" "}
                <strong>"{currentFolderName || "Vornal Voice Vault"}"</strong> to{" "}
                <strong>"{selectedTargetFolder.name}"</strong>?
              </p>

              <p className="text-[11px] text-stone-500 mb-6 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
                This operation will update the parent folder of these files in your Google Drive with your permission.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isMoving}
                  onClick={() => setShowMoveConfirm(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isMoving}
                  onClick={handleExecuteMove}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isMoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoveRight className="w-4 h-4" />}
                  <span>{isMoving ? "Moving Files..." : "Confirm & Move Files"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
