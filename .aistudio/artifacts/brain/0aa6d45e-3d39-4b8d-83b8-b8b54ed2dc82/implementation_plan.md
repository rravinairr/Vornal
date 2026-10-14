# Voice Journal & Automatic Markdown Sync (.md)

A mobile-optimized voice journaling application that captures audio thoughts, generates structured Markdown notes (.md) with AI transcription and rich summaries, preserves the original voice recordings, and saves both files automatically into a user-selected folder on their device.

> [!IMPORTANT]
> **Confirmed User Decisions & Defaults**:
> - **Markdown Structure**: Rich journal format featuring an executive summary, mood & key themes, actionable reflections, and a complete verbatim transcript with timestamps.
> - **Folder Saving Strategy**: Native File System Access API (`showDirectoryPicker`) for direct, automatic file writing into the user's chosen folder on supported devices (Android Chrome / desktop), paired with instant automatic mobile downloads and Web Share API ("Save to Files") fallback for iOS Safari and other browsers.
> - **Triggering Behavior**: Fully automated workflow—transcription and disk saving initiate immediately upon stopping recording, while maintaining an active review player and history feed.

---

### 1. Overview & Core Concept

- **What It Does**: The user taps a single thumb-friendly microphone button to record a voice journal. While speaking, an interactive real-time audio waveform visualizer displays dynamic sound input. As soon as recording stops, the audio is preserved, streamed to the server-side Gemini 3.8 Flash model for speech-to-text synthesis, formatted into an elegant `.md` file, and automatically saved together with the audio recording into the user's chosen folder on their device.
- **Target Audience / Persona**: Mobile journalers, thinkers, students, writers, and Obsidian/Logseq/Notion users who prefer voice reflection and want their audio notes and Markdown files synced directly to their local vault or phone directory.
- **Key Value**: Zero-friction thought capture. Speak freely, tap stop, and your thoughts are immediately filed in Markdown and audio on your phone without copy-pasting or manual uploads.

---

### 2. User Experience & Visual Design

#### Visual Identity & Theme
- **Aesthetic Direction**: Refined, warm utilitarian editorial. Calm, distraction-free environment with high daylight contrast for mobile readability.
- **Color Palette (60-30-10 Rule)**:
  - *Dominant Canvas (60%)*: Warm slate/stone canvas (`#F8F9FA` light / `#0F172A` dark) with tactile soft surfaces.
  - *Structural Surfaces (30%)*: Crisp card containers with subtle hairline borders (`border-stone-200 dark:border-stone-800`), muted typography (`stone-500` / `stone-400`), and zero-pill clean metadata lines.
  - *Accent Budget (10%)*: Deep terracotta / warm ember accent (`#DC2626` / `#E11D48` recording active states, `#2563EB` action highlights) reserved strictly for recording controls and primary triggers.
- **Typography**:
  - *Display*: Plus Jakarta Sans / Outfit for balanced modern titles.
  - *Prose & Markdown*: Clean serif / sans-serif reading scale with generous 1.6x line-height.
  - *Metrics & Timers*: `tabular-nums font-mono` for stable, non-jumping recording counters and audio seekbars.

#### Key User Flows & Touch-Zone Ergonomics
1. **Target Folder Setup**:
   - A persistent folder indicator card in the upper workspace allows the user to tap "Choose Folder" (`showDirectoryPicker()`).
   - If supported, the user picks a folder (e.g. `Journals`, `Vault/Daily`); the folder name and permissions are remembered in IndexedDB.
   - If the browser does not support Directory Picker (e.g., iOS Safari), the app clearly displays "Direct Download & Share Sheet Mode", offering automatic saving to the Downloads folder or 1-tap "Save to Files" export.
2. **Recording Flow (Natural Thumb Zone)**:
   - A prominent 64px central record button anchored in the thumb reach zone (bottom 40% of viewport).
   - Live canvas-based audio wave frequency visualizer, real-time elapsed timer (`00:42`), pause/resume toggle, and cancel button.
3. **Auto-Transcribe & Auto-Save**:
   - Immediately upon tapping "Finish Recording", the app stores the audio Blob in local IndexedDB.
   - It streams the audio to `/api/transcribe`, generating a rich Markdown document.
   - The app automatically writes `YYYY-MM-DD_HH-mm_journal.webm` and `YYYY-MM-DD_HH-mm_journal.md` into the user's selected folder (or triggers the instant download fallback).
   - A tactile completion toast appears: *"Saved audio & transcript to [FolderName]!"*
4. **Journal Library & Detail View**:
   - Scrollable feed of previous journal sessions with audio playback, waveform scrubbing, interactive Markdown preview / raw editor, clipboard copying, and re-export tools.

---

### 3. Key Product Decisions & Trade-Offs

- **Multi-Tier File Saving Architecture**:
  - *Approach*: Combine the File System Access API with automatic HTML5 blob downloads and Web Share API.
  - *Why*: Web security sandboxes restrict arbitrary background file system writes unless granted via `showDirectoryPicker()`. By implementing native directory handles for Chromium/Android and seamless fallback for iOS/Safari, the app operates reliably on 100% of mobile and desktop browsers.
- **Server-Side Gemini Audio Processing**:
  - *Approach*: Send the recorded audio (`audio/webm` or `audio/wav`) to a server proxy endpoint (`/api/transcribe`) utilizing `@google/genai` with `gemini-3.8-flash`.
  - *Why*: Direct multimodal audio reasoning produces vastly superior results compared to client Web Speech API: it handles background noise, punctuates properly, identifies themes, drafts a concise executive summary, and produces formatted Markdown with frontmatter. The API key remains strictly server-side.
- **Dual Persistence (Local IndexedDB + File System)**:
  - *Approach*: Every recording and markdown transcript is saved in IndexedDB as well as written to the disk folder.
  - *Why*: If file permissions expire or the user changes folders, all historical voice notes and transcripts remain intact and searchable offline in the browser.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client Viewport (Web/Mobile)              │
│                                                                 │
│  ┌────────────────────────┐         ┌────────────────────────┐  │
│  │ Folder Configuration   │         │ Live Audio Visualizer  │  │
│  │ (showDirectoryPicker)  │         │ (Web Audio API Canvas) │  │
│  └───────────┬────────────┘         └───────────┬────────────┘  │
│              │                                  │               │
│              ▼                                  ▼               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               MediaRecorder & Audio Pipeline              │  │
│  │          (Record, Pause, Stop -> Blob & Base64)           │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                  │
│   ┌─────────────────────┐         ┌─────────────────────┐       │
│   │ IndexedDB Storage   │         │ Target Folder Sync  │       │
│   │ (Notes, Audio Blob) │         │ (FileSystemAccess)  │       │
│   └─────────────────────┘         └──────────▲──────────┘       │
│                                              │                  │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                 POST /api/transcribe (Audio Base64)
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express / Vite API Server                    │
│                                                                 │
│   GoogleGenAI ({ apiKey: process.env.GEMINI_API_KEY })          │
│   Model: "gemini-3.8-flash"                                     │
│   Input: Audio InlineData (audio/webm) + Rich Markdown Prompt   │
│   Output: { title, summary, themes, transcript, markdown }      │
└─────────────────────────────────────────────────────────────────┘
```

#### Markdown Document Structure Generated
```markdown
---
title: Voice Journal - Morning Strategy Session
date: 2026-10-14 10:02
audio_file: 2026-10-14_10-02_voice-note.webm
duration: 02:45
mood: Focused & Optimistic
tags: [journal, planning, strategy]
---

# Voice Journal - Morning Strategy Session

## Executive Summary
A concise 2-3 sentence overview of the voice note.

## Key Themes & Highlights
- Primary insight or talking point
- Second observation or thought thread

## Action Items & Next Steps
- [ ] Next step derived from the voice journal

## Full Transcript
[00:00] Complete, punctuated, and paragraph-formatted verbatim transcript...
```

#### Planned Deliverables
1. **Server-Side API (`/api/transcribe`)**: Express & Vite handler utilizing `@google/genai` to receive audio and return the structured markdown payload.
2. **Audio Recorder Hook (`useAudioRecorder`)**: MediaRecorder integration with real-time frequency analysis (`AnalyserNode`), pause/resume, and blob generation.
3. **Folder Management Engine (`folderSyncService`)**: Manages `FileSystemDirectoryHandle`, file creation, permission verification, and mobile fallback triggers.
4. **App UI & Interactive Features**:
   - Folder selector with persistent permission status.
   - Recording console with real-time waveform and ergonomic thumb controls.
   - Auto-transcribe and auto-save notification sequence.
   - History viewer with audio scrubbing, markdown rendering, copy-to-clipboard, and manual download triggers.
