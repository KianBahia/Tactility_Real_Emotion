import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { argv } from "process"; // no dotenv, no node-fetch

// --- Constants ---
const HUME_API_KEY = "biZo4AG69GuaUAzLKmdt2ybfCbE3MDwVTBC6oGYO8SYYG9GV"; // ✅ semicolon

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VOICE_NAME_DEFAULT = "Ava Song";
const OUT_DIR = path.join(__dirname, "out_tts");

const EMOTION_PRESETS = {
  neutral: {
    description: "neutral, clear, conversational, medium pace, natural emphasis",
    speed: 1.0,
  },
  angry: {
    description: "angry, sharp, intense, clipped consonants, firm emphasis, fast pace",
    speed: 1.15,
  },
  sad: {
    description: "sad, soft, low energy, slow pace, gentle downward intonation, subdued",
    speed: 0.85,
  },
  doubt: {
    description: "uncertain, hesitant, thoughtful, light pauses, rising intonation at phrase ends",
    speed: 0.95,
  },
  happy: {
    description: "happy, bright, upbeat, smiling tone, lively rhythm, warm and friendly",
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
    emotion: args.emotion || "happy",
    voice: args.voice || VOICE_NAME_DEFAULT,
    ext: args.ext || "mp3",
  };
}

// --- Core function (single emotion) ---
async function synthesizeOne(apiKey, text, emotion, ext = "mp3", voiceName = VOICE_NAME_DEFAULT) {
  const preset = EMOTION_PRESETS[emotion];
  if (!preset) throw new Error(`Unknown emotion: ${emotion}`);

  ensureOutDir();
  const outPath = path.join(OUT_DIR, `${emotion}.${ext}`);
  console.log(`🎙️ Generating [${emotion}] → ${outPath}`);

  const payload = {
    utterances: [
      {
        text,
        description: preset.description,
        voice: { name: voiceName, provider: "HUME_AI" },
        speed: preset.speed,
      },
    ],
    format: { type: ext },
    num_generations: 1,
  };

  const response = await fetch("https://api.hume.ai/v0/tts", {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Request failed: ${response.status} - ${msg}`);
  }

  const data = await response.json();
  const audioBase64 = data?.generations?.[0]?.audio;

  if (!audioBase64) {
    console.error("❌ No audio data returned from API");
    return;
  }

  const buffer = Buffer.from(audioBase64, "base64");
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Saved ${buffer.length} bytes to ${outPath}`);
  return outPath;
}

// --- Main ---
async function main() {
  const args = parseArgs();
  const apiKey = HUME_API_KEY;
  await synthesizeOne(apiKey, args.text, args.emotion, args.ext, args.voice);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("❌", err);
    process.exit(1);
  });
}
