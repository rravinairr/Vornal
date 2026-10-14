import { JournalEntry } from "../types";

/**
 * Creates a synthetic gentle chime WAV blob for demo playback
 */
export function createSampleAudioBlob(): Blob {
  const sampleRate = 22050;
  const duration = 3.5;
  const numSamples = Math.floor(sampleRate * duration);

  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier 'RIFF'
  view.setUint32(0, 0x52494646, false);
  // file length minus 8
  view.setUint32(4, 36 + numSamples * 2, true);
  // RIFF type 'WAVE'
  view.setUint32(8, 0x57415645, false);
  // format chunk identifier 'fmt '
  view.setUint32(12, 0x666d7420, false);
  // format chunk length 16
  view.setUint32(16, 16, true);
  // sample format (raw PCM = 1)
  view.setUint16(20, 1, true);
  // channel count (1 mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 2)
  view.setUint32(28, sampleRate * 2, true);
  // block align (2)
  view.setUint16(32, 2, true);
  // bits per sample (16)
  view.setUint16(34, 16, true);
  // data chunk identifier 'data'
  view.setUint32(36, 0x64617461, false);
  // data chunk length
  view.setUint32(40, numSamples * 2, true);

  // Synthesize chord frequencies (E4, G#4, B4, E5) with decaying envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 1.4);
    const s1 = Math.sin(2 * Math.PI * 329.63 * t);
    const s2 = Math.sin(2 * Math.PI * 415.3 * t) * 0.7;
    const s3 = Math.sin(2 * Math.PI * 493.88 * t) * 0.5;
    const s4 = Math.sin(2 * Math.PI * 659.25 * t) * 0.3;

    const sample = Math.max(-1, Math.min(1, (s1 + s2 + s3 + s4) * 0.3 * env));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function rebuildMarkdown(
  title: string,
  dateFormatted: string,
  mood: string,
  audioFileName: string,
  userTags: string[],
  summary: string,
  keyThemes: string[],
  actionItems: string[],
  transcript: string
): string {
  const allTags = Array.from(new Set(["voice-journal", ...userTags]));
  return `---
title: "${title}"
date: "${dateFormatted}"
mood: "${mood}"
audio_file: "${audioFileName}"
tags: [${allTags.join(", ")}]
---

# ${title}

**Date**: ${dateFormatted}  
**Tone & Mood**: ${mood}  
**Voice Recording**: \`${audioFileName}\`
**Tags**: ${userTags.length > 0 ? userTags.map((t) => `#${t}`).join(" ") : "None"}

## Executive Summary
${summary}

## Key Themes & Reflections
${keyThemes.map((t) => `- ${t}`).join("\n")}

## Action Items & Next Steps
${actionItems.length > 0 ? actionItems.map((a) => `- [ ] ${a}`).join("\n") : "- None noted"}

## Full Transcript
${transcript}
`;
}

export function getSampleJournalEntry(): JournalEntry {
  const date = new Date();
  const dateFormatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const title = "Setting Intentions for Clarity & Focus";
  const mood = "Grounding & Intentional";
  const userTags = ["intentions", "focus", "morning"];
  const keyThemes = [
    "Prioritizing deep creative flow over reactive notifications",
    "Allocating uninterrupted morning focus blocks",
    "Embracing iterative journaling to declutter mental space",
  ];
  const summary =
    "A reflective morning session exploring how voice journaling relieves cognitive overload. Outlined practical boundaries for the day to protect creative energy and complete critical milestones.";
  const actionItems = [
    "Block out two 90-minute deep work focus intervals on calendar",
    "Keep mobile notifications muted during morning work hours",
    "Review daily reflections in Markdown before winding down tonight",
  ];
  const transcript =
    "[00:00] Good morning. Starting today with a quick voice check-in.\n\n[00:15] I've noticed when I speak my thoughts out loud instead of bottling them up or typing frantically, I discover what actually matters much faster. Today the focus has to be on finishing the core project and saying no to shallow interruptions.\n\n[00:45] Feeling centered and ready to make meaningful progress.";

  const audioFileName = "journal_2026-10-14_sample.wav";
  const mdFileName = "journal_2026-10-14_sample.md";

  const markdown = rebuildMarkdown(
    title,
    dateFormatted,
    mood,
    audioFileName,
    userTags,
    summary,
    keyThemes,
    actionItems,
    transcript
  );

  return {
    id: "sample-entry-001",
    timestamp: date.getTime(),
    dateFormatted,
    title,
    mood,
    keyThemes,
    userTags,
    summary,
    actionItems,
    transcript,
    markdown,
    audioBlob: createSampleAudioBlob(),
    audioDuration: 3.5,
    audioFileName,
    mdFileName,
    savedToFolder: false,
    folderName: null,
    transcriptionStatus: "completed",
  };
}
