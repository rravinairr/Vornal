/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Mic,
  Folder,
  Search,
  DownloadCloud,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Volume2,
  Tag,
  Filter,
  Cloud,
  Palette,
  Sun,
  Moon,
  ShieldCheck,
  Award,
  Zap,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import {
  JournalEntry,
  FolderConfig,
  DriveAuthState,
  TranscriptionEngine,
  ThemeMode,
  AccentColor,
  DriveFolderInfo,
} from "./types";
import { useAudioRecorder, blobToBase64 } from "./hooks/useAudioRecorder";
import {
  isDirectoryPickerSupported,
  getSavedDirectoryHandle,
  writeFilesToFolder,
  downloadJournalFiles,
  isRunningInIframe,
} from "./utils/fileSync";
import {
  saveJournalToDB,
  getAllJournalsFromDB,
  deleteJournalFromDB,
  saveSettingToDB,
  getSettingFromDB,
} from "./utils/db";
import { getSampleJournalEntry, rebuildMarkdown } from "./utils/sampleEntry";
import {
  initDriveAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getOrCreateDriveFolder,
  uploadJournalToDrive,
} from "./utils/googleDrive";
import {
  isNativeSpeechSupported,
  createSpeechRecognizer,
  formatNativeMarkdown,
} from "./utils/nativeSpeech";

// Components
import { FolderSelector } from "./components/FolderSelector";
import { RecordingConsole } from "./components/RecordingConsole";
import { JournalCard } from "./components/JournalCard";
import { JournalDetailModal } from "./components/JournalDetailModal";
import { GoogleDriveSyncBanner } from "./components/GoogleDriveSyncBanner";
import { DriveFolderManagerModal } from "./components/DriveFolderManagerModal";
import { BreathingOrb } from "./components/BreathingOrb";
import { AboutPrivacyModal } from "./components/AboutPrivacyModal";
import { ThemeCustomizerModal } from "./components/ThemeCustomizerModal";

interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

const ACCENT_HEX_MAP: Record<AccentColor, string> = {
  indigo: "#6366F1",
  emerald: "#059669",
  rose: "#E11D48",
  amber: "#D97706",
  sky: "#0284C7",
  stone: "#57534E",
};

export default function App() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [activeRecordingTags, setActiveRecordingTags] = useState<string[]>(["reflection"]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Transcription Engine: Gemini AI vs Native Browser Speech
  const [transcriptionEngine, setTranscriptionEngine] = useState<TranscriptionEngine>("gemini");
  const nativeTranscriptRef = useRef<string>("");
  const recognizerRef = useRef<any>(null);

  // Appearance & Theme State
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [accentColor, setAccentColor] = useState<AccentColor>("indigo");
  const [customHex, setCustomHex] = useState("#6366F1");

  // Modals state
  const [isDriveFolderModalOpen, setIsDriveFolderModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Google Drive state
  const [driveState, setDriveState] = useState<DriveAuthState>({
    isAuthenticated: false,
    userEmail: null,
    userName: null,
    userPhoto: null,
    driveFolderId: null,
    driveFolderName: "Vornal Voice Vault",
    driveFolderLink: null,
    isSyncingAll: false,
  });
  const [autoSyncDrive, setAutoSyncDrive] = useState(true);

  // Phone Folder configuration state
  const [folderConfig, setFolderConfig] = useState<FolderConfig>({
    isSupported: isDirectoryPickerSupported(),
    handle: null,
    folderName: null,
    permissionGranted: false,
    autoSave: true,
    isIframeRestricted: isRunningInIframe(),
  });

  const {
    isRecording,
    isPaused,
    recordingDuration,
    analyserNode,
    error: recorderError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const currentAccentHex = useMemo(() => {
    return customHex || ACCENT_HEX_MAP[accentColor] || "#6366F1";
  }, [accentColor, customHex]);

  // Apply theme mode (light/dark) and CSS variable
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary-accent", currentAccentHex);

    if (themeMode === "dark") {
      root.classList.add("dark");
    } else if (themeMode === "light") {
      root.classList.remove("dark");
    } else {
      // System
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [themeMode, currentAccentHex]);

  // Load storage & settings on mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        const storedJournals = await getAllJournalsFromDB();
        if (storedJournals && storedJournals.length > 0) {
          const normalized = storedJournals.map((j) => ({
            ...j,
            userTags: j.userTags || [],
            transcriptionStatus: j.transcriptionStatus || "completed",
            driveSyncStatus: j.driveSyncStatus || "failed",
          }));
          setJournals(normalized);
        } else {
          const sample = getSampleJournalEntry();
          await saveJournalToDB(sample);
          setJournals([sample]);
        }

        // Restore settings
        const savedAutoSync = await getSettingFromDB<boolean>("vornal_auto_sync_drive");
        if (savedAutoSync !== null) setAutoSyncDrive(savedAutoSync);

        const savedEngine = await getSettingFromDB<TranscriptionEngine>("vornal_transcription_engine");
        if (savedEngine) setTranscriptionEngine(savedEngine);

        const savedTheme = await getSettingFromDB<ThemeMode>("vornal_theme_mode");
        if (savedTheme) setThemeMode(savedTheme);

        const savedAccent = await getSettingFromDB<AccentColor>("vornal_accent_color");
        if (savedAccent) setAccentColor(savedAccent);

        const savedHex = await getSettingFromDB<string>("vornal_custom_hex");
        if (savedHex) setCustomHex(savedHex);

        const savedFolderId = await getSettingFromDB<string>("vornal_drive_folder_id");
        const savedFolderName = await getSettingFromDB<string>("vornal_drive_folder_name");

        // Restore directory handle if supported
        if (isDirectoryPickerSupported()) {
          const { handle, name, hasPermission } = await getSavedDirectoryHandle();
          if (handle && name) {
            setFolderConfig((prev) => ({
              ...prev,
              handle,
              folderName: name,
              permissionGranted: hasPermission,
            }));
          }
        }

        // Initialize Google Drive auth listener
        initDriveAuth(
          async (user, token) => {
            try {
              let targetFolderName = savedFolderName || "Vornal Voice Vault";
              const folder = await getOrCreateDriveFolder(token, targetFolderName);
              setDriveState((prev) => ({
                ...prev,
                isAuthenticated: true,
                userEmail: user.email,
                userName: user.displayName,
                userPhoto: user.photoURL,
                driveFolderId: savedFolderId || folder.folderId,
                driveFolderName: savedFolderName || folder.folderName,
                driveFolderLink: folder.webViewLink || null,
              }));
            } catch (err) {
              console.warn("Could not retrieve Drive folder on startup:", err);
            }
          },
          () => {
            setDriveState((prev) => ({
              ...prev,
              isAuthenticated: false,
              userEmail: null,
              userName: null,
              userPhoto: null,
            }));
          }
        );
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    initStorage();
  }, []);

  const handleUpdateFolderConfig = (updates: Partial<FolderConfig>) => {
    setFolderConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleToggleAutoSyncDrive = async (val: boolean) => {
    setAutoSyncDrive(val);
    await saveSettingToDB("vornal_auto_sync_drive", val);
  };

  const handleToggleEngine = async (engine: TranscriptionEngine) => {
    setTranscriptionEngine(engine);
    await saveSettingToDB("vornal_transcription_engine", engine);
    showToast(
      engine === "native"
        ? "Switched to Native Browser Speech (100% offline, zero API keys)"
        : "Switched to Gemini AI (Executive summaries & tone insights)",
      "info"
    );
  };

  const handleChangeThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await saveSettingToDB("vornal_theme_mode", mode);
  };

  const handleChangeAccentColor = async (accent: AccentColor) => {
    setAccentColor(accent);
    await saveSettingToDB("vornal_accent_color", accent);
  };

  const handleChangeCustomHex = async (hex: string) => {
    setCustomHex(hex);
    await saveSettingToDB("vornal_custom_hex", hex);
  };

  const handleSignInDrive = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        showToast("Connecting to Google Drive...", "info");
        const folder = await getOrCreateDriveFolder(res.accessToken, driveState.driveFolderName || "Vornal Voice Vault");
        setDriveState({
          isAuthenticated: true,
          userEmail: res.user.email,
          userName: res.user.displayName,
          userPhoto: res.user.photoURL,
          driveFolderId: folder.folderId,
          driveFolderName: folder.folderName,
          driveFolderLink: folder.webViewLink || null,
          isSyncingAll: false,
        });
        showToast(`Connected as ${res.user.displayName || res.user.email}! Folder ready.`, "success");
      }
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      showToast(err.message || "Failed to sign in with Google", "error");
    }
  };

  const handleSignOutDrive = async () => {
    try {
      await googleSignOut();
      setDriveState({
        isAuthenticated: false,
        userEmail: null,
        userName: null,
        userPhoto: null,
        driveFolderId: null,
        driveFolderName: "Vornal Voice Vault",
        driveFolderLink: null,
        isSyncingAll: false,
      });
      showToast("Signed out of Google Drive", "info");
    } catch (err: any) {
      showToast(err.message || "Sign out failed", "error");
    }
  };

  // Google Drive folder selection & moving files
  const handleSelectDriveFolder = async (folder: DriveFolderInfo) => {
    setDriveState((prev) => ({
      ...prev,
      driveFolderId: folder.id,
      driveFolderName: folder.name,
      driveFolderLink: folder.webViewLink || null,
    }));
    await saveSettingToDB("vornal_drive_folder_id", folder.id);
    await saveSettingToDB("vornal_drive_folder_name", folder.name);
  };

  const handleJournalsMoved = async (updatedJournals: JournalEntry[]) => {
    setJournals(updatedJournals);
    for (const j of updatedJournals) {
      await saveJournalToDB(j);
    }
  };

  // Start recording handler (attaches Native Speech if selected)
  const handleStartRecording = async () => {
    nativeTranscriptRef.current = "";
    if (transcriptionEngine === "native" && isNativeSpeechSupported()) {
      try {
        const recognizer = createSpeechRecognizer();
        if (recognizer) {
          recognizer.onresult = (event: any) => {
            let fullText = "";
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + " ";
            }
            nativeTranscriptRef.current = fullText.trim();
          };
          recognizer.onerror = (e: any) => {
            console.warn("Native speech warning:", e.error);
          };
          recognizer.start();
          recognizerRef.current = recognizer;
        }
      } catch (e) {
        console.warn("Could not start native speech recognizer:", e);
      }
    }
    await startRecording();
  };

  const handleSyncSingleToDrive = async (entry: JournalEntry) => {
    const token = await getAccessToken();
    if (!token) {
      await handleSignInDrive();
      return;
    }

    try {
      showToast(`Uploading ${entry.title} to Google Drive...`, "info");
      const folderId = driveState.driveFolderId || (await getOrCreateDriveFolder(token, driveState.driveFolderName || "Vornal Voice Vault")).folderId;
      const res = await uploadJournalToDrive(token, entry, folderId);

      const updated: JournalEntry = {
        ...entry,
        driveSyncStatus: "synced",
        driveAudioFileId: res.audioFileId,
        driveMdFileId: res.mdFileId,
        driveParentFolderId: folderId,
        driveWebViewLink: res.webViewLink,
      };

      await saveJournalToDB(updated);
      setJournals((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      if (selectedEntry?.id === updated.id) {
        setSelectedEntry(updated);
      }
      showToast("Saved recording and .md to Google Drive!", "success");
    } catch (err: any) {
      console.error("Drive upload error:", err);
      showToast(`Drive upload failed: ${err.message}`, "error");
      throw err;
    }
  };

  const handleSyncAllToDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      await handleSignInDrive();
      return;
    }

    setDriveState((prev) => ({
      ...prev,
      isSyncingAll: true,
      syncProgress: { current: 0, total: journals.length },
    }));

    try {
      const folderId = driveState.driveFolderId || (await getOrCreateDriveFolder(token, driveState.driveFolderName || "Vornal Voice Vault")).folderId;
      let successCount = 0;

      for (let i = 0; i < journals.length; i++) {
        const item = journals[i];
        setDriveState((prev) => ({
          ...prev,
          syncProgress: { current: i + 1, total: journals.length },
        }));

        try {
          const res = await uploadJournalToDrive(token, item, folderId);
          item.driveSyncStatus = "synced";
          item.driveAudioFileId = res.audioFileId;
          item.driveMdFileId = res.mdFileId;
          item.driveParentFolderId = folderId;
          item.driveWebViewLink = res.webViewLink;
          await saveJournalToDB(item);
          successCount++;
        } catch (itemErr) {
          console.warn(`Failed to upload ${item.title} to Drive:`, itemErr);
        }
      }

      setJournals([...journals]);
      showToast(`Successfully backed up ${successCount} recording(s) to "${driveState.driveFolderName || "Vornal Voice Vault"}"!`, "success");
    } catch (err: any) {
      showToast(`Batch sync error: ${err.message}`, "error");
    } finally {
      setDriveState((prev) => ({
        ...prev,
        isSyncingAll: false,
        syncProgress: undefined,
      }));
    }
  };

  const handleToggleActiveTag = (tag: string) => {
    setActiveRecordingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomRecordingTag = (tag: string) => {
    if (!activeRecordingTags.includes(tag)) {
      setActiveRecordingTags((prev) => [...prev, tag]);
    }
  };

  const handleFinishRecording = async () => {
    try {
      setIsProcessing(true);
      setProcessingStep("Saving raw voice recording...");

      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {}
      }

      const { audioBlob, duration, mimeType } = await stopRecording();

      const timestamp = Date.now();
      const date = new Date(timestamp);
      const isoDate = date.toISOString().replace(/[:.]/g, "-").slice(0, 16);

      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "webm";
      const audioFileName = `journal_${isoDate}.${ext}`;
      const mdFileName = `journal_${isoDate}.md`;

      const dateFormatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const currentTags = [...activeRecordingTags];

      // If user chose native offline engine (or no api key)
      if (transcriptionEngine === "native") {
        setProcessingStep("Formatting local native speech into Markdown...");
        const nativeFormatted = formatNativeMarkdown(
          nativeTranscriptRef.current,
          date,
          audioFileName,
          currentTags
        );

        const nativeEntry: JournalEntry = {
          id: `journal_${timestamp}`,
          timestamp,
          dateFormatted,
          title: nativeFormatted.title,
          mood: nativeFormatted.mood,
          keyThemes: nativeFormatted.keyThemes,
          userTags: currentTags,
          summary: nativeFormatted.summary,
          actionItems: nativeFormatted.actionItems,
          transcript: nativeFormatted.transcript,
          markdown: nativeFormatted.markdown,
          audioBlob,
          audioDuration: duration,
          audioFileName,
          mdFileName,
          savedToFolder: false,
          folderName: folderConfig.folderName,
          transcriptionStatus: "completed",
          engineUsed: "native",
          driveSyncStatus: "failed",
        };

        // Auto-save to phone folder or download
        if (folderConfig.handle) {
          try {
            const writeResult = await writeFilesToFolder(
              folderConfig.handle,
              audioFileName,
              audioBlob,
              mdFileName,
              nativeEntry.markdown
            );
            if (writeResult.success) {
              nativeEntry.savedToFolder = true;
              showToast(`Saved ${mdFileName} & audio to ${folderConfig.folderName}!`, "success");
            } else {
              downloadJournalFiles(audioBlob, audioFileName, nativeEntry.markdown, mdFileName);
            }
          } catch {
            downloadJournalFiles(audioBlob, audioFileName, nativeEntry.markdown, mdFileName);
          }
        } else {
          downloadJournalFiles(audioBlob, audioFileName, nativeEntry.markdown, mdFileName);
          showToast(`Voice note & ${mdFileName} saved to device!`, "success");
        }

        // Auto-sync to Drive if connected
        if (driveState.isAuthenticated && autoSyncDrive) {
          try {
            const token = await getAccessToken();
            if (token) {
              const folderId = driveState.driveFolderId || (await getOrCreateDriveFolder(token, driveState.driveFolderName || "Vornal Voice Vault")).folderId;
              const driveRes = await uploadJournalToDrive(token, nativeEntry, folderId);
              nativeEntry.driveSyncStatus = "synced";
              nativeEntry.driveAudioFileId = driveRes.audioFileId;
              nativeEntry.driveMdFileId = driveRes.mdFileId;
              nativeEntry.driveParentFolderId = folderId;
              nativeEntry.driveWebViewLink = driveRes.webViewLink;
              showToast("Backed up recording & note to Google Drive!", "success");
            }
          } catch (e) {
            console.warn("Drive sync error:", e);
          }
        }

        await saveJournalToDB(nativeEntry);
        setJournals((prev) => [nativeEntry, ...prev]);
        setSelectedEntry(nativeEntry);
        return;
      }

      // Default: Gemini AI transcription
      const initialEntry: JournalEntry = {
        id: `journal_${timestamp}`,
        timestamp,
        dateFormatted,
        title: `Voice Journal (${dateFormatted})`,
        mood: "Reflective",
        keyThemes: [],
        userTags: currentTags,
        summary: "Processing AI transcription and markdown structure...",
        actionItems: [],
        transcript: "Transcribing your audio...",
        markdown: rebuildMarkdown(
          `Voice Journal (${dateFormatted})`,
          dateFormatted,
          "Reflective",
          audioFileName,
          currentTags,
          "Voice journal session.",
          [],
          [],
          "Processing..."
        ),
        audioBlob,
        audioDuration: duration,
        audioFileName,
        mdFileName,
        savedToFolder: false,
        folderName: folderConfig.folderName,
        transcriptionStatus: "processing",
        engineUsed: "gemini",
        driveSyncStatus: "failed",
      };

      setJournals((prev) => [initialEntry, ...prev]);
      await saveJournalToDB(initialEntry);

      setProcessingStep("Transcribing speech & analyzing reflections with Gemini AI...");
      const base64Data = await blobToBase64(audioBlob);

      try {
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType,
            dateString: date.toISOString(),
            audioFileName,
            userTags: currentTags,
          }),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with ${response.status}`);
        }

        const aiResult = await response.json();

        const completedEntry: JournalEntry = {
          ...initialEntry,
          title: aiResult.title || `Voice Journal (${dateFormatted})`,
          mood: aiResult.mood || "Reflective",
          keyThemes: aiResult.keyThemes || [],
          summary: aiResult.summary || "Voice journal session.",
          actionItems: aiResult.actionItems || [],
          transcript: aiResult.transcript || "",
          markdown: aiResult.markdown || initialEntry.markdown,
          transcriptionStatus: "completed",
        };

        // Auto-save to phone folder
        if (folderConfig.handle) {
          setProcessingStep(`Writing files to ${folderConfig.folderName}...`);
          try {
            const writeResult = await writeFilesToFolder(
              folderConfig.handle,
              audioFileName,
              audioBlob,
              mdFileName,
              completedEntry.markdown
            );
            if (writeResult.success) {
              completedEntry.savedToFolder = true;
              showToast(`Saved ${mdFileName} & audio to ${folderConfig.folderName}!`, "success");
            } else {
              downloadJournalFiles(audioBlob, audioFileName, completedEntry.markdown, mdFileName);
              showToast(`Saved to vault & downloaded files to device!`, "info");
            }
          } catch {
            downloadJournalFiles(audioBlob, audioFileName, completedEntry.markdown, mdFileName);
            showToast(`Downloaded files to device!`, "info");
          }
        } else {
          downloadJournalFiles(audioBlob, audioFileName, completedEntry.markdown, mdFileName);
          showToast(`Voice note & ${mdFileName} downloaded to device!`, "success");
        }

        // Auto-sync to Google Drive
        if (driveState.isAuthenticated && autoSyncDrive) {
          try {
            const token = await getAccessToken();
            if (token) {
              const folderId = driveState.driveFolderId || (await getOrCreateDriveFolder(token, driveState.driveFolderName || "Vornal Voice Vault")).folderId;
              const driveRes = await uploadJournalToDrive(token, completedEntry, folderId);
              completedEntry.driveSyncStatus = "synced";
              completedEntry.driveAudioFileId = driveRes.audioFileId;
              completedEntry.driveMdFileId = driveRes.mdFileId;
              completedEntry.driveParentFolderId = folderId;
              completedEntry.driveWebViewLink = driveRes.webViewLink;
              showToast("Backed up recording & .md to Google Drive!", "success");
            }
          } catch (driveErr) {
            console.warn("Auto Drive sync warning:", driveErr);
          }
        }

        await saveJournalToDB(completedEntry);
        setJournals((prev) => prev.map((j) => (j.id === completedEntry.id ? completedEntry : j)));
        setSelectedEntry(completedEntry);
      } catch (aiErr: any) {
        console.error("AI Transcription failed:", aiErr);
        const failedEntry: JournalEntry = {
          ...initialEntry,
          summary: "Audio recording saved! AI transcription can be retried or converted using Native Speech.",
          transcript: "Audio recorded safely. Click 'Transcribe Now' to retry or switch engine.",
          transcriptionStatus: "failed",
          errorMessage: aiErr.message,
        };
        await saveJournalToDB(failedEntry);
        setJournals((prev) => prev.map((j) => (j.id === failedEntry.id ? failedEntry : j)));
        showToast(`Voice note saved to vault! (${aiErr.message || "transient error"})`, "error");
        setSelectedEntry(failedEntry);
      }
    } catch (err: any) {
      console.error("Recording error:", err);
      showToast(err.message || "Could not complete recording", "error");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleRetryTranscription = async (entry: JournalEntry) => {
    try {
      setIsProcessing(true);
      setProcessingStep("Retrying Gemini transcription...");

      const base64Data = await blobToBase64(entry.audioBlob);
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: entry.audioBlob.type || "audio/webm",
          dateString: new Date(entry.timestamp).toISOString(),
          audioFileName: entry.audioFileName,
          userTags: entry.userTags || [],
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Retry failed");
      }

      const aiResult = await response.json();
      const updated: JournalEntry = {
        ...entry,
        title: aiResult.title || entry.title,
        mood: aiResult.mood || entry.mood,
        keyThemes: aiResult.keyThemes || entry.keyThemes,
        summary: aiResult.summary || entry.summary,
        actionItems: aiResult.actionItems || entry.actionItems,
        transcript: aiResult.transcript || entry.transcript,
        markdown: aiResult.markdown || entry.markdown,
        transcriptionStatus: "completed",
        errorMessage: undefined,
      };

      await saveJournalToDB(updated);
      setJournals((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      setSelectedEntry(updated);
      showToast("Transcription completed successfully!", "success");
    } catch (err: any) {
      showToast(`Retry failed: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleDeleteJournal = async (id: string) => {
    await deleteJournalFromDB(id);
    setJournals((prev) => prev.filter((j) => j.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  const handleUpdateEntry = async (updated: JournalEntry) => {
    await saveJournalToDB(updated);
    setJournals((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    if (selectedEntry?.id === updated.id) {
      setSelectedEntry(updated);
    }
  };

  // Extract all distinct tags across journals
  const allDistinctTags = useMemo(() => {
    const set = new Set<string>();
    journals.forEach((j) => {
      j.userTags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [journals]);

  // Filter journals based on search query & tag filter
  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const matchesSearch =
        searchQuery === "" ||
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.userTags && j.userTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesTag =
        selectedTagFilter === null ||
        (j.userTags && j.userTags.includes(selectedTagFilter));

      return matchesSearch && matchesTag;
    });
  }, [journals, searchQuery, selectedTagFilter]);

  const unsyncedDriveCount = useMemo(() => {
    return journals.filter((j) => j.driveSyncStatus !== "synced").length;
  }, [journals]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col selection:bg-indigo-500/20">
      {/* 4-5-6 Calming Breathing Orb (Smartly adapts and appears anywhere on the page) */}
      <BreathingOrb
        accentColorHex={currentAccentHex}
        isRecording={isRecording}
      />

      {/* Top Bar Contract (3 Zones) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 pt-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand & Ideator */}
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: currentAccentHex }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-xs"
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg font-serif">Vornal</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-md">
                  Vault
                </span>
              </div>
              <p className="text-[11px] text-stone-400 flex items-center gap-1 -mt-0.5">
                <span>Ideated by</span>
                <strong className="text-stone-600 dark:text-stone-300 font-medium">Ravi Nair</strong>
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <a
              href="#vault-feed"
              className="px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Journal Feed ({journals.length})
            </a>
            <button
              onClick={() => setIsDriveFolderModalOpen(true)}
              className="px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span>Drive Folders</span>
            </button>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>About &amp; Privacy</span>
            </button>
          </nav>

          {/* Zone 3: User Authentication & Theme Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Theme & Palette trigger */}
            <button
              onClick={() => setIsThemeModalOpen(true)}
              aria-label="Theme & Colors"
              title="Change theme mode & primary color"
              className="min-h-[40px] min-w-[40px] rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors"
            >
              <Palette className="w-4 h-4" style={{ color: currentAccentHex }} />
            </button>

            {/* Google Login for anyone accessing the app */}
            {!driveState.isAuthenticated ? (
              <button
                onClick={handleSignInDrive}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/80 p-1 pl-2 rounded-2xl border border-stone-200/80 dark:border-stone-700/80">
                {driveState.userPhoto ? (
                  <img
                    src={driveState.userPhoto}
                    alt={driveState.userName || "User"}
                    className="w-6 h-6 rounded-full border border-stone-300 dark:border-stone-600 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {(driveState.userName || driveState.userEmail || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 hidden sm:inline max-w-[100px] truncate">
                  {driveState.userName?.split(" ")[0] || "User"}
                </span>
                <button
                  onClick={handleSignOutDrive}
                  title="Sign out of Google"
                  aria-label="Sign out"
                  className="w-6 h-6 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-8">
        {/* Native Speech vs Gemini Clarification Callout */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Native Speech &amp; No-API-Key Operation</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Fully Supported
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                Vornal can run 100% natively without Gemini or external API keys using your browser's Web Speech API. Everything processes on your device!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleToggleEngine(transcriptionEngine === "native" ? "gemini" : "native")}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                transcriptionEngine === "native"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{transcriptionEngine === "native" ? "Using Native Engine" : "Switch to Native Speech"}</span>
            </button>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-2"
              title="Read Privacy Policy & Who this app is for"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Google Drive Cloud Vault Sync Banner */}
        <GoogleDriveSyncBanner
          driveState={driveState}
          autoSyncDrive={autoSyncDrive}
          onToggleAutoSync={handleToggleAutoSyncDrive}
          onSignIn={handleSignInDrive}
          onSignOut={handleSignOutDrive}
          onSyncAll={handleSyncAllToDrive}
          onOpenFolderManager={() => setIsDriveFolderModalOpen(true)}
          totalRecordingsCount={journals.length}
          unsyncedCount={unsyncedDriveCount}
        />

        {/* Phone Folder Auto-Save Selector */}
        <FolderSelector
          folderConfig={folderConfig}
          onUpdateConfig={handleUpdateFolderConfig}
          onShowMessage={showToast}
        />

        {/* Voice Journal Recording Console with thumb ergonomics */}
        <section aria-label="Recording Console">
          <RecordingConsole
            isRecording={isRecording}
            isPaused={isPaused}
            recordingDuration={recordingDuration}
            analyserNode={analyserNode}
            isProcessing={isProcessing}
            processingStep={processingStep}
            activeTags={activeRecordingTags}
            transcriptionEngine={transcriptionEngine}
            onToggleEngine={handleToggleEngine}
            onToggleTag={handleToggleActiveTag}
            onAddCustomTag={handleAddCustomRecordingTag}
            onStartRecording={handleStartRecording}
            onPauseRecording={pauseRecording}
            onResumeRecording={resumeRecording}
            onStopRecording={handleFinishRecording}
            onCancelRecording={cancelRecording}
            accentColorHex={currentAccentHex}
          />
        </section>

        {/* Journal Vault Feed Section */}
        <section id="vault-feed" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
                Journal Vault
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {journals.length} reflection{journals.length === 1 ? "" : "s"} preserved with raw audio &amp; Markdown (.md)
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections, tags, mood..."
                className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {/* Tag Filter Pills */}
          {allDistinctTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-stone-400 font-medium shrink-0 flex items-center gap-1 text-[11px]">
                <Filter className="w-3 h-3" />
                Tags:
              </span>
              <button
                onClick={() => setSelectedTagFilter(null)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  selectedTagFilter === null
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800"
                }`}
              >
                All
              </button>
              {allDistinctTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    selectedTagFilter === tag
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Grid of Journal Cards with Tone Coloring & Frequency Visualizers */}
          {filteredJournals.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 rounded-3xl p-6">
              <Mic className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
                No matching journal entries found
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedTagFilter
                  ? "Try clearing your search filters or record a new voice reflection above."
                  : "Start recording your thoughts above to build your private voice and markdown vault."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJournals.map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  isDriveConnected={driveState.isAuthenticated}
                  onSelect={(e) => setSelectedEntry(e)}
                  onDelete={handleDeleteJournal}
                  onSyncToDrive={handleSyncSingleToDrive}
                  onTagClick={(tag) => setSelectedTagFilter(tag)}
                  onShowMessage={showToast}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/80 dark:border-stone-800 py-6 px-4 sm:px-6 text-xs text-stone-500 dark:text-stone-400 text-center pb-safe">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800 dark:text-stone-200">Vornal</span>
            <span>•</span>
            <span>The Mindful Voice Journal &amp; Markdown Vault</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="hover:text-stone-800 dark:hover:text-stone-200 underline font-medium"
            >
              Ideated by Ravi Nair • Privacy Policy
            </button>
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="hover:text-stone-800 dark:hover:text-stone-200 font-medium"
            >
              Theme &amp; Colors
            </button>
          </div>
        </div>
      </footer>

      {/* Journal Detail Modal */}
      {selectedEntry && (
        <JournalDetailModal
          entry={selectedEntry}
          folderConfig={folderConfig}
          isProcessing={isProcessing}
          isDriveConnected={driveState.isAuthenticated}
          onClose={() => setSelectedEntry(null)}
          onUpdateEntry={handleUpdateEntry}
          onRetryTranscription={handleRetryTranscription}
          onUploadToDrive={handleSyncSingleToDrive}
          onShowMessage={showToast}
        />
      )}

      {/* Google Drive Folder Manager & Move Files Modal */}
      <DriveFolderManagerModal
        isOpen={isDriveFolderModalOpen}
        onClose={() => setIsDriveFolderModalOpen(false)}
        currentFolderId={driveState.driveFolderId}
        currentFolderName={driveState.driveFolderName}
        currentFolderLink={driveState.driveFolderLink}
        journals={journals}
        onSelectFolder={handleSelectDriveFolder}
        onJournalsMoved={handleJournalsMoved}
        onShowToast={showToast}
      />

      {/* About & Privacy Policy Modal */}
      <AboutPrivacyModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Theme & Custom Colors Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themeMode={themeMode}
        onChangeThemeMode={handleChangeThemeMode}
        accentColor={accentColor}
        onChangeAccentColor={handleChangeAccentColor}
        customHex={customHex}
        onChangeCustomHex={handleChangeCustomHex}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl text-xs font-semibold shadow-lg border flex items-center gap-2.5 transition-all animate-in slide-in-from-bottom-2 duration-150 ${
              toast.type === "success"
                ? "bg-emerald-900 text-emerald-100 border-emerald-700"
                : toast.type === "error"
                ? "bg-rose-900 text-rose-100 border-rose-700"
                : "bg-stone-900 text-stone-100 border-stone-700"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === "info" && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
