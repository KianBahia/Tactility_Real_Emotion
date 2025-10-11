// humeTTS.js
// Equivalent of your Python script in Node.js
// Uses the official Hume API (streaming JSON chunks) exactly as the Python SDK does.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";
import base64 from "base64-js";
import { argv } from "process";

dotenv.config();

// --- Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VOICE_NAME_DEFAULT = "Ava Song"; // can later be changed dynamically
const OUT_DIR = path.join(__dirname, "out_tts");

const EMOTION_PRESETS = {
  neutral: {
    description: "neutral, clear, conversational, medium pace, natural emphasis",
    speed: 1.0,
  },
  angry: {
    description:
      "angry, sharp, intense, clipped consonants, firm emphasis, fast pace",
    speed: 1.15,
  },
  sad: {
    description:
      "sad, soft, low energy, slow pace, gentle downward intonation, subdued",
    speed: 0.85,
  },
  doubt: {
    description:
      "uncertain, hesitant, thoughtful, light pauses, rising intonation at phrase ends",
    speed: 0.95,
  },
  happy: {
    description:
      "happy, bright, upbeat, smiling tone, lively rhythm, warm and friendly",
    speed: 1.1,
  },
};

// --- Helpers ---
function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--emotion" || arg === "-e") args.emotion = argv[++i];
    else if (arg === "--text" || arg === "-t") args.text = argv[++i];
    else if (arg === "--voice" || arg === "-v") args.voice = argv[++i];
    else if (arg === "--multi" || arg === "-m") args.multi = true;
    else if (arg === "--ext") args.ext = argv[++i];
  }
  return {
    text: args.text || "This is a demo line for the selected emotion.",
    emotion: args.emotion || "all",
    voice: args.voice || VOICE_NAME_DEFAULT,
    ext: args.ext || "mp3",
    multi: args.multi || false,
  };
}

// --- Core function (streaming) ---
async function synthesizeOne(clientKey, text, emotion, ext = "mp3", voiceName = VOICE_NAME_DEFAULT) {
  const preset = EMOTION_PRESETS[emotion];
  if (!preset) throw new Error(`Unknown emotion: ${emotion}`);

  ensureOutDir();
  const outPath = path.join(OUT_DIR, `${emotion}.${ext}`);
  console.log(`Generating [${emotion}] voice → ${outPath}`);

  // Streaming version (matches Python’s synthesize_json_streaming)
const response = await fetch("https://api.hume.ai/v0/tts", {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": clientKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      utterances: [
        {
          text,
          voice: { name: voiceName, provider: "HUME_AI" },
          description: preset.description,
          speed: preset.speed,
        },
      ],
      strip_headers: true,
    }),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Request failed: ${response.status} - ${msg}`);
  }

  const file = fs.createWriteStream(outPath);
  let written = 0;

  // Stream JSON lines (SSE-like)
  for await (const chunk of response.body) {
    const textChunk = chunk.toString();
    try {
      const jsonChunk = JSON.parse(textChunk.trim());
      if (jsonChunk.audio) {
        const audioData = Buffer.from(jsonChunk.audio, "base64");
        file.write(audioData);
        written += audioData.length;
      }
    } catch (_) {
      // Some lines may not be JSON; ignore them
    }
  }

  file.end();
  console.log(`✅ Saved ${written} bytes to ${outPath}`);
  return outPath;
}

// --- Multi-emotion ---
async function synthesizeMulti(clientKey, segments, ext = "mp3", voiceName = VOICE_NAME_DEFAULT) {
  ensureOutDir();
  const outPath = path.join(OUT_DIR, `mixed_emotions.${ext}`);

  const utterances = segments.map((seg) => {
    const emo = seg.emotion;
    const preset = EMOTION_PRESETS[emo];
    if (!preset) throw new Error(`Unknown emotion: ${emo}`);
    return {
      text: seg.text,
      voice: { name: voiceName, provider: "HUME_AI" },
      description: preset.description,
      speed: preset.speed,
    };
  });

  console.log(`Generating mixed emotions → ${outPath}`);
const response = await fetch("https://api.hume.ai/v0/tts", {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": clientKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      utterances,
      strip_headers: true,
    }),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Request failed: ${response.status} - ${msg}`);
  }

  const file = fs.createWriteStream(outPath);
  for await (const chunk of response.body) {
    const textChunk = chunk.toString();
    try {
      const jsonChunk = JSON.parse(textChunk.trim());
      if (jsonChunk.audio) {
        file.write(Buffer.from(jsonChunk.audio, "base64"));
      }
    } catch (_) {}
  }

  file.end();
  console.log(`✅ Mixed emotions audio saved → ${outPath}`);
  return outPath;
}

// --- Main ---
async function main() {
  const args = parseArgs();
  const apiKey = process.env.HUME_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: Missing HUME_API_KEY in .env");
    process.exit(1);
  }

  if (args.multi) {
    const segments = [
      { text: "Hello there, it's good to see you. ", emotion: "happy" },
      { text: "But honestly, I'm starting to feel uncertain... ", emotion: "doubt" },
      { text: "And now I'm getting really frustrated!", emotion: "angry" },
    ];
    await synthesizeMulti(apiKey, segments, args.ext, args.voice);
  } else if (args.emotion === "all") {
    for (const emo of Object.keys(EMOTION_PRESETS)) {
      await synthesizeOne(apiKey, args.text, emo, args.ext, args.voice);
    }
  } else {
    await synthesizeOne(apiKey, args.text, args.emotion, args.ext, args.voice);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("❌", err);
    process.exit(1);
  });
}

