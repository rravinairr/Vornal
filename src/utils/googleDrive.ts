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

export const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.file");
// Prompt to select account
provider.setCustomParameters({
  prompt: "select_account",
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // In-memory token cleared on reload; user can sign in via 1 click
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google Drive access token from sign in");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Drive sign-in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
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
