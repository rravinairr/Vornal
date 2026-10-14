export type TranscriptionEngine = "gemini" | "native";

export type ThemeMode = "light" | "dark" | "system";

export type AccentColor = "rose" | "indigo" | "emerald" | "amber" | "sky" | "stone";

export interface JournalEntry {
  id: string;
  timestamp: number;
  dateFormatted: string;
  title: string;
  mood: string;
  keyThemes: string[];
  userTags: string[]; // User-defined custom tags
  summary: string;
  actionItems: string[];
  transcript: string;
  markdown: string;
  audioBlob: Blob;
  audioDuration: number;
  audioFileName: string;
  mdFileName: string;
  savedToFolder: boolean;
  folderName: string | null;
  transcriptionStatus?: "completed" | "processing" | "failed";
  errorMessage?: string;
  engineUsed?: TranscriptionEngine;
  // Google Drive integration
  driveSyncStatus?: "synced" | "syncing" | "failed";
  driveAudioFileId?: string;
  driveMdFileId?: string;
  driveParentFolderId?: string;
  driveWebViewLink?: string;
  waveformSamples?: number[];
}

export interface TranscriptionResponse {
  title: string;
  mood: string;
  keyThemes: string[];
  summary: string;
  actionItems: string[];
  transcript: string;
  markdown: string;
}

export interface FolderConfig {
  isSupported: boolean;
  handle: FileSystemDirectoryHandle | null;
  folderName: string | null;
  permissionGranted: boolean;
  autoSave: boolean;
  isIframeRestricted?: boolean;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveAuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  driveFolderId: string | null;
  driveFolderName: string | null;
  driveFolderLink: string | null;
  isSyncingAll: boolean;
  syncProgress?: { current: number; total: number };
}
