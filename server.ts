import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High payload limit for audio files
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

app.post("/api/transcribe", async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = "audio/webm",
      dateString,
      audioFileName,
      userTags = [],
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "No audio data provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server. Please check your environment variables.",
      });
    }

    // Correctly strip any data URL prefix regardless of codec parameters (e.g. data:audio/webm;codecs=opus;base64,)
    const cleanBase64 = audioBase64.includes(",")
      ? audioBase64.split(",")[1].trim()
      : audioBase64.trim();

    if (!cleanBase64 || cleanBase64.length < 100) {
      return res.status(400).json({
        error: "Audio recording was empty or too short. Please speak for at least 2-3 seconds.",
      });
    }

    let cleanMime = mimeType.split(";")[0].trim().toLowerCase();
    if (cleanMime === "video/mp4" || cleanMime === "audio/x-m4a") {
      cleanMime = "audio/mp4";
    } else if (!cleanMime.startsWith("audio/")) {
      cleanMime = "audio/webm";
    }

    console.log(`[Transcribe] Processing audio: mime=${cleanMime}, size=${Math.round(cleanBase64.length * 0.75)} bytes`);

    const tagsArray = Array.isArray(userTags) ? userTags : [];
    const formattedTags = Array.from(new Set(["voice-journal", "reflection", ...tagsArray]));

    const promptText = `
You are an empathetic, insightful voice journaling transcription and reflection assistant.
Listen carefully to the user's voice note recorded on ${dateString || new Date().toISOString()}.
User-defined category tags: ${tagsArray.join(", ") || "None specified"}.

Analyze the speech and provide:
1. title: A concise, poetic or clear title capturing the essence of the voice note (4 to 8 words).
2. mood: The overarching tone, emotional state, or energy (e.g. "Contemplative & Serene", "Excited & Driven", "Vulnerable & Processing", "Calm & Grounded").
3. keyThemes: An array of 3 to 5 core themes, talking points, or insights spoken about.
4. summary: A thoughtful, natural 2-3 sentence executive summary synthesizing what was spoken.
5. actionItems: An array of concrete next steps, realizations, or intentions mentioned (return empty array if none were discussed).
6. transcript: The verbatim, accurate speech-to-text transcript of everything said, properly punctuated into natural paragraphs with approximate time markers like [00:00], [00:30] where appropriate.
7. markdown: A complete, beautifully formatted Markdown note (.md) ready to be saved into the user's local Obsidian vault or files.
   The markdown must start with clean YAML frontmatter:
---
title: "<title>"
date: "${dateString || new Date().toISOString()}"
mood: "<mood>"
audio_file: "${audioFileName || "voice-note.webm"}"
tags: [${formattedTags.join(", ")}]
---

# <title>

**Date**: ${dateString || new Date().toISOString()}  
**Tone & Mood**: <mood>  
**Voice Recording**: \`${audioFileName || "voice-note.webm"}\`
**Tags**: ${tagsArray.length > 0 ? tagsArray.map((t: string) => `#${t}`).join(" ") : "None"}

## Executive Summary
<summary>

## Key Themes & Reflections
<bullet points of keyThemes>

## Action Items & Next Steps
<checkboxes if any action items exist, or "None noted">

## Full Transcript
    `;

    const audioPart = {
      inlineData: {
        mimeType: cleanMime,
        data: cleanBase64,
      },
    };

    const textPart = { text: promptText };

    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A concise, evocative title for the journal entry" },
        mood: { type: Type.STRING, description: "The emotional tone or energy" },
        keyThemes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "3-5 core takeaways or themes",
        },
        summary: { type: Type.STRING, description: "A 2-3 sentence executive summary" },
        actionItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Action items or next steps",
        },
        transcript: { type: Type.STRING, description: "Full verbatim transcript with timestamps" },
        markdown: { type: Type.STRING, description: "Complete formatted Markdown note content" },
      },
      required: ["title", "mood", "keyThemes", "summary", "actionItems", "transcript", "markdown"],
    };

    // Only use models that fully support JSON mode (gemini-3.5-transcribe does NOT support JSON mode)
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
    let lastError: any = null;
    let resultText: string | undefined;

    for (const model of candidateModels) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[Transcribe] Requesting model ${model} (attempt ${attempt}/3)...`);
          const response = await ai.models.generateContent({
            model,
            contents: { parts: [audioPart, textPart] },
            config: {
              responseMimeType: "application/json",
              responseSchema: schemaConfig,
            },
          });

          resultText = response.text;
          if (resultText && resultText.trim()) {
            break; // Success!
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Transcribe] Model ${model} attempt ${attempt} warning: ${err.message}`);

          const isTransient =
            err.message?.includes("503") ||
            err.message?.includes("429") ||
            err.message?.includes("high demand") ||
            err.message?.includes("ResourceExhausted") ||
            err.message?.includes("Unavailable");

          if (isTransient && attempt < 3) {
            // Wait with exponential backoff before retrying
            await new Promise((r) => setTimeout(r, attempt * 1000));
            continue;
          }
          // If fatal or 3rd attempt, move to fallback model
          break;
        }
      }

      if (resultText && resultText.trim()) {
        break;
      }
    }

    if (!resultText) {
      console.log("[Transcribe] Trying plain text fallback with gemini-3.8-flash...");
      try {
        const plainResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: {
            parts: [
              audioPart,
              {
                text: `${promptText}\n\nIMPORTANT: Return valid JSON only with keys: title, mood, keyThemes, summary, actionItems, transcript, markdown.`,
              },
            ],
          },
        });
        resultText = plainResponse.text;
      } catch (fallbackErr: any) {
        console.error("[Transcribe] Plain text fallback also failed:", fallbackErr);
      }
    }

    if (!resultText) {
      throw lastError || new Error("Unable to transcribe audio after multiple attempts");
    }

    let parsed: any;
    try {
      // Safely parse JSON even if surrounded by markdown fences
      let cleanJson = resultText.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```\s*/, "").replace(/```$/, "").trim();
      }
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn("[Transcribe] JSON parse error, building fallback structure:", parseErr);
      const rawText = resultText || "Voice journal recorded.";
      parsed = {
        title: `Voice Journal Reflection`,
        mood: "Reflective",
        keyThemes: ["Voice note reflection"],
        summary: rawText.slice(0, 180),
        actionItems: [],
        transcript: rawText,
        markdown: `# Voice Journal\n\n**Date**: ${dateString || new Date().toISOString()}\n\n## Transcript\n${rawText}`,
      };
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error("Transcription error:", error);
    return res.status(500).json({
      error: error.message || "Failed to transcribe audio note with Gemini",
    });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vocalis Voice Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
