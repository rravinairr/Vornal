import { saveSettingToDB, getSettingFromDB } from "./db";

const DIR_HANDLE_KEY = "vocalis_directory_handle";
const DIR_NAME_KEY = "vocalis_directory_name";

export function isRunningInIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true; // Cross-origin access blocked = inside cross-origin iframe
  }
}

export function isDirectoryPickerSupported(): boolean {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
    return false;
  }
  // If in an iframe, the browser security policy strictly forbids showDirectoryPicker
  if (isRunningInIframe()) {
    return false;
  }
  return true;
}

export async function pickJournalFolder(): Promise<{
  handle: FileSystemDirectoryHandle | null;
  name: string | null;
  error?: string;
  isIframe?: boolean;
}> {
  if (isRunningInIframe()) {
    return {
      handle: null,
      name: null,
      isIframe: true,
      error:
        "Preview is running inside a frame where browsers prohibit direct directory access. Direct mobile download & Files share sheet are automatically enabled.",
    };
  }

  if (!isDirectoryPickerSupported()) {
    return {
      handle: null,
      name: null,
      error: "Directory Picker is not supported in this browser. Mobile download fallback is enabled.",
    };
  }

  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: "readwrite",
      startIn: "documents",
    });

    await saveSettingToDB(DIR_HANDLE_KEY, handle);
    await saveSettingToDB(DIR_NAME_KEY, handle.name);

    return { handle, name: handle.name };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { handle: null, name: null };
    }
    if (
      err.name === "SecurityError" ||
      err.message?.includes("sub frames") ||
      err.message?.includes("Cross origin")
    ) {
      return {
        handle: null,
        name: null,
        isIframe: true,
        error:
          "Browser security restricts folder picking in sub-frames. Direct mobile download & Files share sheet are active.",
      };
    }
    return { handle: null, name: null, error: err.message };
  }
}

export async function getSavedDirectoryHandle(): Promise<{
  handle: FileSystemDirectoryHandle | null;
  name: string | null;
  hasPermission: boolean;
}> {
  if (!isDirectoryPickerSupported()) {
    return { handle: null, name: null, hasPermission: false };
  }

  try {
    const handle = await getSettingFromDB<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
    const name = await getSettingFromDB<string>(DIR_NAME_KEY);

    if (!handle) {
      return { handle: null, name: null, hasPermission: false };
    }

    // Verify permission
    let permission = await (handle as any).queryPermission({ mode: "readwrite" });
    return {
      handle,
      name: name || handle.name,
      hasPermission: permission === "granted",
    };
  } catch (err) {
    console.warn("Failed to retrieve stored directory handle:", err);
    return { handle: null, name: null, hasPermission: false };
  }
}

export async function requestFolderPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const status = await (handle as any).requestPermission({ mode: "readwrite" });
    return status === "granted";
  } catch (err) {
    console.warn("Permission request failed:", err);
    return false;
  }
}

export async function writeFilesToFolder(
  dirHandle: FileSystemDirectoryHandle,
  audioFileName: string,
  audioBlob: Blob,
  mdFileName: string,
  markdownContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Write the audio file
    const audioHandle = await dirHandle.getFileHandle(audioFileName, { create: true });
    const audioWritable = await (audioHandle as any).createWritable();
    await audioWritable.write(audioBlob);
    await audioWritable.close();

    // 2. Write the Markdown file
    const mdHandle = await dirHandle.getFileHandle(mdFileName, { create: true });
    const mdWritable = await (mdHandle as any).createWritable();
    await mdWritable.write(markdownContent);
    await mdWritable.close();

    return { success: true };
  } catch (err: any) {
    console.error("Failed to write files to folder:", err);
    return { success: false, error: err.message || "Failed to write files" };
  }
}

/**
 * Fallback automatic file download for browsers without File System Access API
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export function downloadJournalFiles(
  audioBlob: Blob,
  audioFileName: string,
  markdownContent: string,
  mdFileName: string
): void {
  // Download audio
  downloadFile(audioBlob, audioFileName);

  // Slight delay so mobile browser doesn't block second download
  setTimeout(() => {
    const mdBlob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    downloadFile(mdBlob, mdFileName);
  }, 500);
}

/**
 * Share files via Web Share API (allows "Save to Files" on iOS Safari and Android)
 */
export async function shareJournalFiles(
  audioBlob: Blob,
  audioFileName: string,
  markdownContent: string,
  mdFileName: string,
  title: string
): Promise<{ shared: boolean; error?: string }> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return { shared: false, error: "Web Share API not supported on this browser" };
  }

  try {
    const audioFile = new File([audioBlob], audioFileName, {
      type: audioBlob.type || "audio/webm",
    });
    const mdFile = new File([markdownContent], mdFileName, { type: "text/markdown" });

    if (navigator.canShare && navigator.canShare({ files: [audioFile, mdFile] })) {
      await navigator.share({
        title: title || "Voice Journal Note",
        text: `Voice journal note & transcript: ${title}`,
        files: [audioFile, mdFile],
      });
      return { shared: true };
    } else {
      // Fallback share text
      await navigator.share({
        title: title,
        text: markdownContent,
      });
      return { shared: true };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { shared: false };
    }
    return { shared: false, error: err.message };
  }
}
