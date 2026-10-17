import React, { useState } from "react";
import {
  X,
  Cloud,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Key,
  HardDrive,
} from "lucide-react";
import { getCustomOAuthClientId, setCustomOAuthClientId } from "../utils/googleDrive";

interface GoogleDriveAuthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryWithCustomId?: () => void;
  currentHostname?: string;
}

export const GoogleDriveAuthHelpModal: React.FC<GoogleDriveAuthHelpModalProps> = ({
  isOpen,
  onClose,
  onRetryWithCustomId,
  currentHostname = typeof window !== "undefined" ? window.location.hostname : "",
}) => {
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [customId, setCustomId] = useState(getCustomOAuthClientId());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : `https://${currentHostname}`;

  const handleCopyOrigin = async () => {
    try {
      await navigator.clipboard.writeText(currentOrigin);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {}
  };

  const handleSaveCustomId = () => {
    if (!customId.trim()) return;
    setCustomOAuthClientId(customId);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onRetryWithCustomId) {
        onRetryWithCustomId();
      }
      onClose();
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Google Drive GitHub Pages Authorization"
      className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Google Drive on GitHub Pages
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Connect your personal Google Drive in 2 minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200 leading-relaxed space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Why is this needed?</span>
          </p>
          <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90">
            Google security requires any web app accessing Google Drive from a custom domain or GitHub Pages to use an OAuth Client ID that lists your URL in its <strong>Authorized JavaScript Origins</strong>.
          </p>
        </div>

        {/* Quick Origin Copy */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
            1. Your GitHub Pages Origin to Authorize:
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-xs bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 select-all truncate">
              {currentOrigin}
            </div>
            <button
              type="button"
              onClick={handleCopyOrigin}
              className="px-3.5 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
            >
              {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDomain ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900 dark:text-stone-100">
              2. Create Free OAuth Client ID:
            </span>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
            <li>Click <strong>+ CREATE CREDENTIALS</strong> &rarr; <strong>OAuth client ID</strong>.</li>
            <li>Application type: <strong>Web application</strong>.</li>
            <li>Under <strong>Authorized JavaScript origins</strong>, click <strong>+ ADD URI</strong> and paste <code className="font-mono bg-stone-200 dark:bg-stone-700 px-1 py-0.2 rounded text-[10px]">{currentOrigin}</code>.</li>
            <li>Click <strong>Create</strong>, copy the Client ID, and paste it below:</li>
          </ol>
        </div>

        {/* Paste Client ID Form */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-blue-500" />
            <span>3. Paste Your Google OAuth Client ID:</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="xxxx-xxxx.apps.googleusercontent.com"
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="button"
              onClick={handleSaveCustomId}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Cloud className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? "Saved!" : "Connect"}</span>
            </button>
          </div>
        </div>

        {/* Local Sovereign Vault note */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1 text-[11px]">
            <HardDrive className="w-3 h-3 text-stone-400" />
            <span>Offline device vault is always active and safe.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-stone-600 dark:text-stone-300 hover:underline font-semibold cursor-pointer"
          >
            Continue Offline
          </button>
        </div>
      </div>
    </div>
  );
};
