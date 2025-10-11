// mobile-compatible version (no fs/path, no Node-only features)

const HUME_API_KEY = "biZo4AG69GuaUAzLKmdt2ybfCbE3MDwVTBC6oGYO8SYYG9GV";

const EMOTION_PRESETS = {
  neutral: { description: "neutral, clear, conversational, medium pace, natural emphasis", speed: 1.0 },
  angry:   { description: "angry, sharp, intense, clipped consonants, firm emphasis, fast pace", speed: 1.15 },
  sad:     { description: "sad, soft, low energy, slow pace, gentle downward intonation, subdued", speed: 0.85 },
  doubt:   { description: "uncertain, hesitant, thoughtful, light pauses, rising intonation", speed: 0.95 },
  happy:   { description: "happy, bright, upbeat, smiling tone, lively rhythm, warm and friendly", speed: 1.1 },
} as const;

export async function synthesizeOne(
  text: string,
  emotion: keyof typeof EMOTION_PRESETS = "happy",
  voiceName = "Ava Song"
): Promise<string> {
  const preset = EMOTION_PRESETS[emotion];

  const payload = {
    utterances: [
      {
        text,
        description: preset.description,
        voice: { name: voiceName, provider: "HUME_AI" },
        speed: preset.speed,
      },
    ],
    format: { type: "mp3" },
    num_generations: 1,
  };

  const response = await fetch("https://api.hume.ai/v0/tts", {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": HUME_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Hume request failed: ${response.status}`);
  }

  const data = await response.json();
  const audioBase64 = data?.generations?.[0]?.audio;
  if (!audioBase64) throw new Error("No audio data returned");

  return audioBase64; // return the base64 MP3 data
}
