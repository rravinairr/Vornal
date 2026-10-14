/**
 * Native Speech Recognition using the browser's built-in Web Speech API.
 * Runs 100% locally on device without any API keys or server calls.
 */

export function isNativeSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export function createSpeechRecognizer(): any {
  if (!isNativeSpeechSupported()) return null;
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognizer = new SpeechRec();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = "en-US";
  return recognizer;
}

/**
 * Builds a structured markdown entry from local transcript without any AI model calls
 */
export function formatNativeMarkdown(
  rawTranscript: string,
  date: Date,
  audioFileName: string,
  userTags: string[]
): {
  title: string;
  mood: string;
  keyThemes: string[];
  summary: string;
  actionItems: string[];
  transcript: string;
  markdown: string;
} {
  const dateFormatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cleanText = rawTranscript.trim() || "No speech detected in this recording.";
  const sentences = cleanText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Generate a title from the first sentence or keywords
  let title = "Voice Journal Reflection";
  if (sentences.length > 0 && sentences[0].length > 3) {
    const firstFew = sentences[0].split(" ").slice(0, 7).join(" ");
    title = firstFew.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (title.length > 40) title = title.slice(0, 40) + "...";
  }

  // Generate 2-3 key themes from sentences
  const keyThemes =
    sentences.length > 1
      ? sentences.slice(0, 3)
      : ["Personal reflection captured via native speech recognition"];

  const summary =
    sentences.length > 0
      ? sentences.slice(0, 2).join(" ")
      : "Native offline voice recording captured locally on device.";

  // Extract possible action items (sentences containing "need to", "should", "will", "todo", "plan")
  const actionItems: string[] = [];
  sentences.forEach((s) => {
    const lower = s.toLowerCase();
    if (
      lower.includes("need to ") ||
      lower.includes("have to ") ||
      lower.includes("will ") ||
      lower.includes("should ") ||
      lower.includes("plan to ")
    ) {
      actionItems.push(s);
    }
  });

  const allTags = Array.from(new Set(["voice-journal", "offline", ...userTags]));

  const markdown = `---
title: "${title}"
date: "${date.toISOString()}"
mood: "Grounded & Present"
audio_file: "${audioFileName}"
engine: "Native Browser Speech (Offline)"
tags: [${allTags.join(", ")}]
---

# ${title}

**Date**: ${dateFormatted}  
**Engine**: Native Browser Speech (100% Offline, No API Key)  
**Voice Recording**: \`${audioFileName}\`
**Tags**: ${userTags.length > 0 ? userTags.map((t) => `#${t}`).join(" ") : "None"}

## Summary
${summary}

## Key Points
${keyThemes.map((t) => `- ${t}`).join("\n")}

## Next Steps
${actionItems.length > 0 ? actionItems.map((a) => `- [ ] ${a}`).join("\n") : "- None noted"}

## Full Transcript
${cleanText}
`;

  return {
    title,
    mood: "Grounded & Present",
    keyThemes,
    summary,
    actionItems,
    transcript: cleanText,
    markdown,
  };
}
