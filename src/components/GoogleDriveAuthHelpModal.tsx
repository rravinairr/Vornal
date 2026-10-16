import React, { useState } from "react";
import {
  X,
  Cloud,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Key,
  HelpCircle,
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

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {}
  };

  const handleSaveCustomId = () => {
    setCustomOAuthClientId(customId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    if (onRetryWithCustomId && customId.trim()) {
      onRetryWithCustomId();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Google Drive on GitHub Pages
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Authorize your domain for Google OAuth login
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diagnostic info */}
        <div className="mt-4 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Why Google login requires authorization on GitHub Pages:</span>
            </p>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
              Google security policies only permit OAuth popups from pre-approved domains. By default,
              Google blocks authentication requests originating from new GitHub Pages URLs until
              either the domain is added to authorized domains or a client ID with that origin is used.
            </p>
          </div>

          {/* Quick Domain Copy */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              Your Current Deployment Domain:
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 select-all truncate">
                {currentHostname || "your-site.github.io"}
              </div>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shrink-0"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? "Copied!" : "Copy Domain"}</span>
              </button>
            </div>
          </div>

          {/* Solution 1 */}
          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
              <span>Solution 1: Add Domain to Firebase (Recommended)</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
              <li>Open your Firebase Console project.</li>
              <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized domains</strong>.</li>
              <li>Click <strong>Add domain</strong> and paste <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.2 rounded font-mono">{currentHostname}</code>.</li>
              <li>Reload this page and click <strong>Login to save</strong>. It will immediately work!</li>
            </ol>
          </div>

          {/* Solution 2 */}
          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              <span>Solution 2: Use Custom Google Cloud Client ID</span>
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-2 leading-relaxed">
              If you have your own Google Cloud project, create an OAuth 2.0 Web Client ID with{" "}
              <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.2 rounded font-mono">https://{currentHostname}</code> in Authorized JavaScript origins and paste it below:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="button"
                onClick={handleSaveCustomId}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedSuccess ? "Saved!" : "Save & Retry"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <p className="text-[11px] text-stone-400">
            Offline vault is always active and safe.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-xs transition-colors"
          >
            Got it / Continue
          </button>
        </div>
      </div>
    </div>
  );
};
