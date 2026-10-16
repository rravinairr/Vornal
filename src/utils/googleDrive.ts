import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { JournalEntry, DriveFolderInfo } from "../types";

export const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export interface DriveUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid?: string;
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.setCustomParameters({
  prompt: "select_account",
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

const TOKEN_KEY = "vornal_drive_token";
const TOKEN_EXPIRY_KEY = "vornal_drive_token_expiry";
const USER_KEY = "vornal_drive_user";
const CUSTOM_CLIENT_ID_KEY = "vornal_custom_client_id";

export const getCustomOAuthClientId = (): string => {
  try {
    return localStorage.getItem(CUSTOM_CLIENT_ID_KEY) || "";
  } catch {
    return "";
  }
};

export const setCustomOAuthClientId = (clientId: string): void => {
  try {
    if (clientId.trim()) {
      localStorage.setItem(CUSTOM_CLIENT_ID_KEY, clientId.trim());
    } else {
      localStorage.removeItem(CUSTOM_CLIENT_ID_KEY);
    }
  } catch {}
};

export const setCachedToken = (
  token: string,
  user: { displayName: string | null; email: string | null; photoURL: string | null },
  expiresInSeconds = 3500
) => {
  cachedAccessToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("Could not cache token to storage:", e);
  }
};

export const getCachedToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (token && expiry && Number(expiry) > Date.now()) {
      cachedAccessToken = token;
      return token;
    }
  } catch {}
  return null;
};

export const getCachedUser = (): DriveUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearCachedAuth = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
};

export const initDriveAuth = (
  onAuthSuccess?: (user: DriveUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check cached token first for instant reload support
  const storedToken = getCachedToken();
  const storedUser = getCachedUser();
  if (storedToken && storedUser) {
    if (onAuthSuccess) onAuthSuccess(storedUser, storedToken);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getCachedToken();
      if (token) {
        const driveUser: DriveUser = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid,
        };
        if (onAuthSuccess) onAuthSuccess(driveUser, token);
      } else if (!isSigningIn) {
        if (!storedToken && onAuthFailure) onAuthFailure();
      }
    } else {
      if (!getCachedToken()) {
        clearCachedAuth();
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Sign in using Google Identity Services (GIS) token client.
 * Highly robust on static hosts like GitHub Pages where Firebase Auth popups may hit unauthorized-domain.
 */
export const signInWithGIS = async (): Promise<{ user: DriveUser; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !(window as any).google?.accounts?.oauth2) {
      return reject(
        new Error(
          "Google Identity Services is still loading. Please check your internet connection and try again."
        )
      );
    }

    const clientId =
      getCustomOAuthClientId() || (firebaseConfig as any).oAuthClientId;

    if (!clientId) {
      return reject(new Error("No Google OAuth Client ID found."));
    }

    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }
          const accessToken = tokenResponse.access_token;
          if (!accessToken) {
            return reject(new Error("No access token returned by Google"));
          }

          // Fetch user profile from google userinfo endpoint
          try {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            let profile: DriveUser = { displayName: "Google User", email: "", photoURL: "" };
            if (userRes.ok) {
              const data = await userRes.json();
              profile = {
                displayName: data.name || data.given_name || "Google User",
                email: data.email || "",
                photoURL: data.picture || "",
              };
            }
            setCachedToken(accessToken, profile, Number(tokenResponse.expires_in) || 3500);
            resolve({ user: profile, accessToken });
          } catch {
            const fallbackUser: DriveUser = { displayName: "Google User", email: null, photoURL: null };
            setCachedToken(accessToken, fallbackUser);
            resolve({ user: fallbackUser, accessToken });
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err: any) {
      reject(err);
    }
  });
};

export const googleSignIn = async (
  forceGIS = false
): Promise<{ user: DriveUser; accessToken: string } | null> => {
  if (forceGIS) {
    return await signInWithGIS();
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google Drive access token from sign in");
    }

    const driveUser: DriveUser = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };

    setCachedToken(credential.accessToken, driveUser);
    return { user: driveUser, accessToken: credential.accessToken };
  } catch (error: any) {
    console.warn("Google Drive sign-in notice:", error?.code, error?.message);

    // If unauthorized domain (GitHub Pages) or popup error, try GIS fallback
    if (
      error?.code === "auth/unauthorized-domain" ||
      error?.code === "auth/popup-blocked" ||
      error?.message?.includes("unauthorized")
    ) {
      try {
        if ((window as any).google?.accounts?.oauth2) {
          const gisRes = await signInWithGIS();
          return gisRes;
        }
      } catch (gisErr: any) {
        console.warn("GIS fallback also failed:", gisErr);
      }

      const customError: any = new Error(
        `GitHub Pages domain "${window.location.hostname}" is not authorized for Google OAuth yet.`
      );
      customError.code = "auth/unauthorized-domain";
      customError.isDomainUnauthorized = true;
      customError.hostname = window.location.hostname;
      throw customError;
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getCachedToken();
};

export const googleSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Firebase sign out warning:", e);
  }
  clearCachedAuth();
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Finds or creates the default "Vornal Voice Vault" folder on user's Google Drive
 */
export async function getOrCreateDriveFolder(
  token: string,
  folderName = "Vornal Voice Vault"
): Promise<{ folderId: string; folderName: string; webViewLink?: string }> {
  // 1. Search for existing folder
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return {
        folderId: data.files[0].id,
        folderName: data.files[0].name,
        webViewLink: data.files[0].webViewLink,
      };
    }
  }

  // 2. Create new folder if not found
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      description: "Voice journal recordings (.webm/.wav) and Markdown (.md) notes from Vornal (Ideated by Ravi Nair)",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to create Google Drive folder");
  }

  const newFolder = await createRes.json();
  return { folderId: newFolder.id, folderName: newFolder.name || folderName, webViewLink: newFolder.webViewLink };
}

/**
 * List folders created or accessible in Google Drive with drive.file scope
 */
export async function listDriveFolders(token: string): Promise<DriveFolderInfo[]> {
  const query = `mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink)&orderBy=name`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to fetch folders from Google Drive");
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink,
  }));
}

/**
 * Creates a custom folder in Google Drive
 */
export async function createDriveFolder(
  token: string,
  folderName: string
): Promise<DriveFolderInfo> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName.trim(),
      mimeType: "application/vnd.google-apps.folder",
      description: "Voice journal folder created by Vornal",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to create new folder in Google Drive");
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink,
  };
}

/**
 * Moves an existing file from its current parent folder to a new parent folder in Google Drive.
 */
export async function moveDriveFile(
  token: string,
  fileId: string,
  newParentFolderId: string,
  previousParentFolderId?: string
): Promise<void> {
  // Query current parents if previousParentFolderId is unknown
  let prevParents = previousParentFolderId;
  if (!prevParents) {
    const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (fileRes.ok) {
      const fileData = await fileRes.json();
      if (fileData.parents && fileData.parents.length > 0) {
        prevParents = fileData.parents.join(",");
      }
    }
  }

  let patchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${encodeURIComponent(
    newParentFolderId
  )}`;
  if (prevParents) {
    patchUrl += `&removeParents=${encodeURIComponent(prevParents)}`;
  }

  const res = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to move file ${fileId} in Google Drive`);
  }
}

/**
 * Moves all synced files (audio and markdown) of specified journal entries to a target Google Drive folder.
 */
export async function moveJournalsToFolder(
  token: string,
  journals: JournalEntry[],
  newFolderId: string,
  previousFolderId?: string
): Promise<{ movedCount: number; errors: string[] }> {
  let movedCount = 0;
  const errors: string[] = [];

  for (const entry of journals) {
    // Move audio file if present
    if (entry.driveAudioFileId) {
      try {
        await moveDriveFile(token, entry.driveAudioFileId, newFolderId, entry.driveParentFolderId || previousFolderId);
        movedCount++;
      } catch (err: any) {
        errors.push(`Audio for "${entry.title}": ${err.message}`);
      }
    }

    // Move markdown file if present
    if (entry.driveMdFileId) {
      try {
        await moveDriveFile(token, entry.driveMdFileId, newFolderId, entry.driveParentFolderId || previousFolderId);
        movedCount++;
      } catch (err: any) {
        errors.push(`Note for "${entry.title}": ${err.message}`);
      }
    }
  }

  return { movedCount, errors };
}

/**
 * Uploads a file (Blob or string) into a specific Google Drive folder using multipart upload
 */
export async function uploadFileToDrive(
  token: string,
  fileName: string,
  blobOrText: Blob | string,
  mimeType: string,
  parentFolderId?: string
): Promise<{ fileId: string; webViewLink?: string }> {
  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const blob = typeof blobOrText === "string" ? new Blob([blobOrText], { type: mimeType }) : blobOrText;
  const arrayBuffer = await blob.arrayBuffer();

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBuffer = encoder.encode(metadataPart);
  const mediaHeaderBuffer = encoder.encode(mediaHeader);
  const closeBuffer = encoder.encode(closeDelimiter);

  const totalLength =
    metadataBuffer.byteLength +
    mediaHeaderBuffer.byteLength +
    arrayBuffer.byteLength +
    closeBuffer.byteLength;

  const combined = new Uint8Array(totalLength);
  let offset = 0;

  combined.set(metadataBuffer, offset);
  offset += metadataBuffer.byteLength;

  combined.set(mediaHeaderBuffer, offset);
  offset += mediaHeaderBuffer.byteLength;

  combined.set(new Uint8Array(arrayBuffer), offset);
  offset += arrayBuffer.byteLength;

  combined.set(closeBuffer, offset);

  const uploadUrl =
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: combined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload ${fileName} to Google Drive`);
  }

  const result = await res.json();
  return { fileId: result.id, webViewLink: result.webViewLink };
}

/**
 * Uploads a single journal entry's audio recording and markdown file to Google Drive
 */
export async function uploadJournalToDrive(
  token: string,
  entry: JournalEntry,
  folderId?: string
): Promise<{ audioFileId: string; mdFileId: string; webViewLink?: string }> {
  // 1. Upload audio recording
  const audioResult = await uploadFileToDrive(
    token,
    entry.audioFileName,
    entry.audioBlob,
    entry.audioBlob.type || "audio/webm",
    folderId
  );

  // 2. Upload markdown note
  const mdResult = await uploadFileToDrive(
    token,
    entry.mdFileName,
    entry.markdown,
    "text/markdown",
    folderId
  );

  return {
    audioFileId: audioResult.fileId,
    mdFileId: mdResult.fileId,
    webViewLink: mdResult.webViewLink || audioResult.webViewLink,
  };
}

/**
 * Pulls existing journal entries (markdown notes and audio recordings)
 * from the user's Google Drive folder into the app.
 */
export async function pullJournalsFromDrive(
  token: string,
  folderId: string
): Promise<{
  importedEntries: JournalEntry[];
  totalDriveFiles: number;
  errors: string[];
}> {
  // 1. List all files in folder
  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,webViewLink,createdTime,modifiedTime)&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to list files from Google Drive folder");
  }

  const data = await res.json();
  const files: any[] = data.files || [];

  const mdFiles = files.filter((f) => f.name.endsWith(".md"));
  const audioFiles = files.filter(
    (f) => !f.name.endsWith(".md") && f.mimeType !== "application/vnd.google-apps.folder"
  );

  const importedEntries: JournalEntry[] = [];
  const errors: string[] = [];

  for (const mdFile of mdFiles) {
    try {
      // Fetch markdown content
      const mdRes = await fetch(`https://www.googleapis.com/drive/v3/files/${mdFile.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!mdRes.ok) continue;
      const mdText = await mdRes.text();

      // Parse metadata from markdown
      const titleMatch = mdText.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : mdFile.name.replace(/\.md$/, "");

      const moodMatch = mdText.match(/\*\*Mood\s*\/\s*Tone:\*\*\s*(.+)$/m);
      const mood = moodMatch ? moodMatch[1].trim() : "Reflective";

      const tagsMatch = mdText.match(/\*\*Tags:\*\*\s*(.+)$/m);
      const userTags: string[] = tagsMatch
        ? tagsMatch[1]
            .split(/[, ]+/)
            .map((t) => t.replace(/^#/, "").trim())
            .filter(Boolean)
        : [];

      const summaryMatch = mdText.match(/## Executive Summary\s+([\s\S]*?)(?=##|$)/);
      const summary = summaryMatch ? summaryMatch[1].trim() : "Voice reflection restored from Google Drive.";

      const transcriptMatch = mdText.match(/## Transcript\s+([\s\S]*?)(?=##|$)/);
      const transcript = transcriptMatch ? transcriptMatch[1].trim() : summary;

      const audioNameMatch = mdText.match(/\*\*Audio File:\*\*\s*`([^`]+)`/);
      const audioFileName = audioNameMatch ? audioNameMatch[1].trim() : mdFile.name.replace(/\.md$/, ".webm");

      // Match corresponding audio file
      const baseStem = mdFile.name.replace(/\.md$/, "");
      const matchingAudio = audioFiles.find(
        (a) => a.name === audioFileName || a.name.startsWith(baseStem)
      );

      let audioBlob: Blob;
      let audioDuration = 10;

      if (matchingAudio) {
        try {
          const audioRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${matchingAudio.id}?alt=media`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (audioRes.ok) {
            audioBlob = await audioRes.blob();
          } else {
            audioBlob = new Blob([], { type: "audio/webm" });
          }
        } catch {
          audioBlob = new Blob([], { type: "audio/webm" });
        }
      } else {
        audioBlob = new Blob([], { type: "audio/webm" });
      }

      const createdTime = mdFile.createdTime ? new Date(mdFile.createdTime).getTime() : Date.now();
      const dateFormatted = new Date(createdTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const entry: JournalEntry = {
        id: `drive_${mdFile.id}`,
        timestamp: createdTime,
        dateFormatted,
        title,
        mood,
        keyThemes: [],
        userTags,
        summary,
        actionItems: [],
        transcript,
        markdown: mdText,
        audioBlob,
        audioDuration,
        audioFileName: matchingAudio?.name || audioFileName,
        mdFileName: mdFile.name,
        savedToFolder: false,
        folderName: null,
        transcriptionStatus: "completed",
        engineUsed: "native",
        driveSyncStatus: "synced",
        driveAudioFileId: matchingAudio?.id,
        driveMdFileId: mdFile.id,
        driveParentFolderId: folderId,
        driveWebViewLink: mdFile.webViewLink,
      };

      importedEntries.push(entry);
    } catch (err: any) {
      errors.push(`Error reading ${mdFile.name}: ${err.message}`);
    }
  }

  return {
    importedEntries,
    totalDriveFiles: files.length,
    errors,
  };
}

