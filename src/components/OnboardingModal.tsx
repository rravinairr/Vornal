import React from "react";
import { Mic, Cloud, HardDrive, ShieldCheck, ArrowRight, Sparkles, Check } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onLoginWithDrive: () => void;
  onContinueOffline: () => void;
  accentColorHex?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onLoginWithDrive,
  onContinueOffline,
  accentColorHex = "#6366F1",
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200">
        {/* Header badge & title */}
        <div className="text-center mb-6">
          <div
            style={{ backgroundColor: accentColorHex }}
            className="w-14 h-14 rounded-3xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg ring-8 ring-indigo-500/10"
          >
            <Mic className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Welcome to Vornal
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            Your mindful voice journal and structured Markdown vault.
            <br />
            <span className="font-medium text-stone-600 dark:text-stone-300">
              Ideated by Ravi Nair
            </span>
          </p>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 text-center">
          How would you like to use Vornal?
        </p>

        {/* Options */}
        <div className="space-y-3.5 mb-6">
          {/* Option 1: Login with Google Drive */}
          <div
            onClick={onLoginWithDrive}
            className="group p-4 sm:p-5 rounded-2xl border-2 border-blue-500/40 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-all cursor-pointer relative"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Connect Google Drive
                  </h3>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  Save audio recordings and .md notes to your private{" "}
                  <strong>"Vornal Voice Vault"</strong> folder on Drive. Pull your existing notes
                  across all your devices.
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign in to Drive &amp; Pull Data</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Continue Without Login */}
          <div
            onClick={onContinueOffline}
            className="group p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-stone-100/60 dark:hover:bg-stone-800/80 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Continue Without Logging In
                  </h3>
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full">
                    100% Offline
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Store notes safely in your browser's private vault (IndexedDB). Zero accounts or
                  external connections. You can log in anytime later if you want cloud backup.
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Start Journaling Offline</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center text-stone-400 dark:text-stone-500">
          Your reflections are your own. Audio is processed client-side with native speech by default.
        </p>
      </div>
    </div>
  );
};
