# Vornal — The Sovereign Voice Journal & Markdown Vault

> *"Our most profound reflections and sudden epiphanies happen when we speak freely, not when we stare at an intimidating blank screen."*  
> — **Ideated & Envisioned by Ravi Nair**

---

## 🌿 The Philosophy Behind Vornal

In a digital landscape dominated by algorithmic noise, rigid templates, and proprietary walled gardens, **Vornal** was conceived with a single guiding principle: **radical cognitive sovereignty**.

When we sit before an empty text editor, an inner critic awakens. We backspace, we hesitate, we restructure sentences, and we censor our own emotional truth. But when we speak aloud—walking in the woods, driving home from work, pacing a room, or winding down before sleep—our thoughts flow in an unfiltered stream of consciousness.

Vornal serves as a mindful, zero-friction sanctuary:
1. **Voice-First Empathy**: Speaking is 3–4× faster than typing. It bypasses executive dysfunction and cognitive fatigue.
2. **Neurodivergent & ADHD Friendly**: Eliminates the cognitive penalty of formatting, categorizing, and typing during moments of mental overwhelm.
3. **Dual Preservation**: Every reflection preserves both the **raw authentic human voice recording** and a **structured, clean Markdown note (`.md`)**.
4. **Data Sovereignty (Local-First)**: Your recordings, transcripts, and reflections never belong to a proprietary SaaS silo. They belong entirely to you.

---

## 💎 Core Architectural Pillars

### 1. Dual Speech Engine Architecture
* **Native Speech Engine (100% Offline & Free)**: Powered directly by the browser's native Web Speech API. Zero audio leaves your computer or phone. Zero server calls, zero telemetry, and zero API costs.
* **Gemini AI Engine (Structured Reflection)**: For deep introspection, Gemini parses stream-of-consciousness audio to extract:
  - Emotional Mood & Tone
  - Key Reflection Themes
  - Executive TL;DR Summary
  - Concrete Action Items
  - Full Verbatim Transcript

### 2. Personal Quota Sovereignty (BYOK — Bring Your Own Key)
* **Zero Credit Leakage**: When deployed to static platforms (such as GitHub Pages), your personal server API credits are never exposed or consumed by other visitors.
* **Client-Side BYOK**: Any user can enter their own free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). The key is stored solely in their personal browser's `localStorage` and sent directly to Google from the client.

### 3. Google Drive Cloud Vault
* **Two-Way Reflection Sovereignty**: Connect your Google account to automatically back up recordings and notes into your custom Google Drive folder (`/Vornal Voice Vault`).
* **Cross-Device Reflection Pull**: Click **"Pull from Drive"** to download your existing reflections and audio files onto any device or fresh browser session.
* **Privacy By Default**: First-time visitors can choose to continue offline without logging in. When offline, all Google Drive sync buttons and indicators are cleanly hidden, leaving only a non-intrusive "Login to save" option.

### 4. Direct Device Storage & On-Demand Downloads
* **File System Access**: Connect a local folder directly on your computer or Android phone (such as your **Obsidian vault**, **Logseq directory**, or **Documents folder**).
* **No Auto-Spam Downloads**: Notes and audio are safely stored inside your browser's persistent IndexedDB vault. Files are downloaded only when you click **"Download"**, or if you intentionally toggle on **"Auto-download files on record"**.

### 5. Mindful Pacing (The 4-5-6 Breathing Orb)
* Integrated into the vault is a gentle, bio-rhythmic **4-5-6 Breathing Orb** (Inhale 4s, Hold 5s, Exhale 6s) designed to ground your nervous system before, during, or after vocal journaling.

---

## 📂 Vault File Structure

Every voice session generates standard, future-proof artifacts:

```text
📁 Vornal Voice Vault / (Local Folder or Google Drive)
├── 🎵 journal_2026-10-16T14-30.webm    # Original high-fidelity voice recording
└── 📝 journal_2026-10-16T14-30.md      # Portable, human-readable Markdown file
```

### Sample Markdown Note
```markdown
# Late Night Reflections on Creative Focus

- **Date**: Oct 16, 2026, 02:30 PM
- **Mood**: Calm & Inspired
- **Themes**: Focus, Minimalism, Sovereignty
- **Recording**: `journal_2026-10-16T14-30.webm`

## 🧠 Executive Summary
Spoke through the mental exhaustion of trying to balance five concurrent projects. Realized that cutting down to one primary focus produces higher clarity and lower anxiety.

## ✅ Action Items
- [ ] Decline the non-essential design committee request
- [ ] Spend morning blocks exclusively on core writing

## 🎙️ Transcript
Today was one of those days where everything felt slightly out of rhythm until I took a quiet walk...
```

---

## 🚀 Deployment Guide (GitHub Pages & Static Hosts)

Vornal is built as a lightning-fast React + TypeScript application packaged with Vite and styled with Tailwind CSS v4.

### 1. Building for GitHub Pages
```bash
# Install dependencies
npm install

# Build static production bundle
npm run build
```

The compiled assets in `dist/` can be deployed directly to GitHub Pages, Cloudflare Pages, Vercel, or Netlify.

### 2. Authorizing Your Domain for Google Drive OAuth
Google OAuth popups enforce strict domain origin policies. When deploying to a new GitHub Pages URL (`https://<username>.github.io/<repo>/`):

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Select your project and click on your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized JavaScript Origins**, add:
   - `https://<your-username>.github.io`
4. Under **Authorized Redirect URIs**, add:
   - `https://<your-username>.github.io/<repo>/`
5. Click **Save**. (Changes take 2–5 minutes to propagate).

---

## 🎨 Theme Customization & Accessibility

* **Instant Light/Dark Mode**: Single-click toggle in the header with persistent state.
* **Curated Palette**: Switch between Obsidian Indigo, Forest Green, Terracotta Rose, Amber Honey, Ocean Sky, and Warm Stone, or pick any custom hex code.
* **Ergonomic Header**: Fixed, responsive layout that never clips the navigation options menu or glitched on tablet screens.

---

## 📜 Sovereignty Statement

* Your reflections are yours.
* Your voice is yours.
* No walled gardens. No proprietary formats. No lock-in.

*Ideated by **Ravi Nair** for free thinkers, deep reflectors, and sovereign creators.*
