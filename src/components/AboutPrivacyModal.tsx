import React from "react";
import {
  X,
  ShieldCheck,
  Heart,
  Sparkles,
  Zap,
  Users,
  HardDrive,
  Cpu,
  Lock,
  ExternalLink,
  Award,
} from "lucide-react";

interface AboutPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutPrivacyModal: React.FC<AboutPrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
                Vornal
              </span>
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                Voice Journal & Vault
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Ideated & envisioned by <strong>Ravi Nair</strong></span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close about modal"
            className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-6 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          {/* Ravi Nair's Vision Section */}
          <section className="bg-gradient-to-br from-indigo-50/70 to-rose-50/50 dark:from-indigo-950/20 dark:to-rose-950/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              The Vision Behind Vornal
            </h4>
            <p className="text-stone-700 dark:text-stone-300">
              Conceived by <strong>Ravi Nair</strong>, Vornal was built to solve a modern human dilemma: our most profound reflections and sudden epiphanies happen when we speak freely, not when we stare at an intimidating blank screen. Vornal acts as a calm, mindful sanctuary where you speak your truth, keep your raw voice recordings forever, and automatically receive cleanly formatted Markdown notes (.md) synced straight into your phone's storage and Google Drive.
            </p>
          </section>

          {/* Who This App Is For */}
          <section>
            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Who Is Vornal For?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/80 dark:border-stone-800">
                <p className="font-semibold text-stone-800 dark:text-stone-200 mb-0.5">Stream-of-Consciousness Thinkers</p>
                <p className="text-stone-500 text-[11px]">People who think out loud while walking, driving, paced around the room, or winding down before sleep.</p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/80 dark:border-stone-800">
                <p className="font-semibold text-stone-800 dark:text-stone-200 mb-0.5">Neurodivergent & ADHD Minds</p>
                <p className="text-stone-500 text-[11px]">Bypass the friction of typing and formatting. Unload racing thoughts into audio and let Vornal structure them.</p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/80 dark:border-stone-800">
                <p className="font-semibold text-stone-800 dark:text-stone-200 mb-0.5">Markdown & Obsidian Lovers</p>
                <p className="text-stone-500 text-[11px]">Users of Obsidian, Logseq, Bear, or Notion who want interoperable .md files with YAML frontmatter and zero vendor lock-in.</p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/80 dark:border-stone-800">
                <p className="font-semibold text-stone-800 dark:text-stone-200 mb-0.5">Mindfulness & Mental Health Seekers</p>
                <p className="text-stone-500 text-[11px]">Journalers practicing emotional regulation with the integrated 4-5-6 calming breathing orb.</p>
              </div>
            </div>
          </section>

          {/* Running Without AI / Native Offline Engine */}
          <section className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-1.5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Can Vornal Run Without Gemini or API Keys?
            </h4>
            <p className="text-stone-700 dark:text-stone-300 mb-2">
              <strong>Yes! 100%.</strong> Vornal features a built-in <strong>Native Browser Speech Engine</strong> using the standardized Web Speech API (`SpeechRecognition`).
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400 text-[11px]">
              <li><strong>Zero API Keys Needed</strong>: When you toggle to "Native Browser Speech", speech transcription runs entirely on your device hardware.</li>
              <li><strong>Offline Capable</strong>: Transcribe thoughts and download `.md` + audio notes without an active internet connection.</li>
              <li><strong>Dual-Engine Architecture</strong>: You can freely switch between <em>Native Browser</em> (offline, zero keys) and <em>Gemini AI Studio</em> (deep tone detection, executive summaries, key themes).</li>
            </ul>
          </section>

          {/* Privacy Policy */}
          <section>
            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Privacy Policy & Data Sovereignty
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-stone-800 dark:text-stone-200">Local-First Storage</strong>: Your audio recordings and journal metadata reside in your browser's private IndexedDB database. They never leave your device unless you choose to sync with your personal Google Drive.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-stone-800 dark:text-stone-200">Personal Google Drive Only</strong>: When you connect Google Drive, Vornal requests only the restricted <code>drive.file</code> scope. It can only see and manage files created by this app in your chosen folder.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-stone-800 dark:text-stone-200">No Telemetry or Data Reselling</strong>: We do not track keystrokes, sell voice data, or inject advertising. Your journals are strictly your own personal intellectual property.
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Vornal • Built with mindful intent
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold text-xs hover:bg-stone-800 dark:hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
