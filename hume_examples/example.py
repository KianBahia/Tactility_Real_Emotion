import os, base64, asyncio, argparse
from pathlib import Path
from dotenv import load_dotenv

from hume import AsyncHumeClient
from hume.tts import PostedUtterance, PostedUtteranceVoiceWithName


VOICE_NAME = "Shuhan2"
OUT_DIR = Path("out_tts")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ======================================================
# ======================================================
EMOTION_PRESETS = {
    "neutral": {
        "description": "neutral, clear, conversational, medium pace, natural emphasis",
        "speed": 0.95,
    },

    # ------------------------
    # ------------------------
    "angry": {
        "description": "angry, sharp, intense, clipped consonants, firm emphasis, fast pace",
        "speed": 0.85,
    },
    "angry_2": {
        "description": "very angry, raised voice, clearly frustrated tone, sharper emphasis, rapid speech with tight phrasing — expressing strong irritation and loss of patience.",
        "speed": 1.0,
    },
    "angry_3": {
        "description": "furious, loud, explosive tone with extreme tension, clipped words, forceful rhythm, harsh downward inflection — sounds genuinely enraged and emotional.",
        "speed": 1.15,
    },

    # ------------------------
    # ------------------------
    "happy": {
        "description": "genuinely happy, bright and energetic, friendly tone with natural laughter in the voice, "
                       "smiling while speaking, medium-fast rhythm, expressive intonation, and clear articulation. "
                       "Imagine someone excitedly sharing good news with a close friend.",
        "speed": 1.07,
    },
    "happy_2": {
        "description": "delighted, lively tone with stronger brightness and dynamic rhythm; smiling through every word, "
                       "playful and expressive with noticeable warmth and energy that fills the voice.",
        "speed": 1.12,
    },
    "happy_3": {
        "description": "ecstatic, overjoyed, wide-pitched laughter in the voice, extremely bright tone and quick rhythm, "
                       "overflowing enthusiasm and genuine excitement — sounds thrilled beyond words.",
        "speed": 1.22,
    },

    # ------------------------
    # ------------------------
    "enthusiastic_formal": {
        "description": "enthusiastic but formal, confident projection, clear diction, positive emphasis",
        "speed": 1.02,
    },
    "enthusiastic_formal_2": {
        "description": "very enthusiastic, expressive intonation and confident rhythm; polished yet dynamic delivery with vibrant projection and upbeat emphasis.",
        "speed": 1.08,
    },
    "enthusiastic_formal_3": {
        "description": "extremely enthusiastic, passionate yet articulate tone, elevated pitch range, strong rhythm and conviction — sounds inspiring and contagious.",
        "speed": 1.18,
    },

    # ------------------------
    # Other original presets (unchanged)
    # ------------------------
    "sad": {
        "description": "sad, soft, low energy, slow pace, gentle downward intonation, subdued",
        "speed": 0.85,
    },
    "doubt": {
        "description": "hesitant, tentative, soft delivery with light pauses and rising intonation; elongated vowels and gentle upward phrasing",
        "speed": 0.92,
        "trailing_silence": 0.6,
    },
    "funny_sarcastic": {
        "description": "dry, sarcastic timing, playful pitch inflection, slight exaggeration",
        "speed": 1.05,
    },
    "anxious": {
        "description": "rapid, breathy, tense, slight tremor and rising intonation, scattered pacing",
        "speed": 1.12,
    },
    "disgusted": {
        "description": "cold, retracted tone, short clipped words, low pitch, aversive quality",
        "speed": 0.9,
    },
    "shy": {
        "description": "soft, quiet, hesitant, breathy, minimal projection, downward intonation",
        "speed": 0.9,
    },
    "dont_care": {
        "description": "low-energy, slightly dismissive but weary; soft sighs, short pauses, and a casual, conversational rhythm — minimal affect but humanized with small breaths",
        "speed": 0.96,
        "trailing_silence": 0.25,
    },
    "admire": {
        "description": "warm, energetic, elevated pitch on key words, sincere and glowing",
        "speed": 1.0,
    },
    "depressed": {
        "description": "very low energy, slow tempo, flat affect, soft volume, monotone",
        "speed": 0.78,
    },
}

# ======================================================
# 🗣️ SAMPLE LINES — same per emotion (not per level)
# ======================================================
EMOTION_LINES = {
    "neutral": (
        "Fine, do whatever you want — honestly, it makes no difference to me either way. "
        "I'll stay out of it; you can make the call and I'll accept the result without fuss."
    ),
    "angry": (
        "I can't believe this happened — this is completely unacceptable and it infuriates me. "
        "We need to address this immediately, hold people accountable, and make sure it never repeats; "
        "this kind of behavior is intolerable and I'm demanding action."
    ),
    "angry_2": (
        "I can't believe this happened — this is completely unacceptable and it infuriates me. "
        "We need to address this immediately, hold people accountable, and make sure it never repeats; "
        "this kind of behavior is intolerable and I'm demanding action."
    ),
    "angry_3": (
        "I can't believe this happened — this is completely unacceptable and it infuriates me. "
        "We need to address this immediately, hold people accountable, and make sure it never repeats; "
        "this kind of behavior is intolerable and I'm demanding action."
    ),
    "sad": (
        "I'm really sorry about this; I've been feeling drained and overwhelmed by what occurred. "
        "Everything seems muted and heavy, and it's been difficult to find the energy to respond — "
        "I need a little time to process and recover."
    ),
    "doubt": (
        "Um... I'm not entirely sure this is correct, and I'm feeling hesitant about moving forward. "
        "Perhaps we should pause, check the details more carefully, and consider alternatives — "
        "I don't want us to commit to something we might regret."
    ),
    "happy": (
        "That's absolutely wonderful news — I'm genuinely thrilled and full of joy for you. "
        "This brings a warm, buoyant energy and I feel like celebrating; your success lights up the room."
    ),
    "happy_2": (
        "That's absolutely wonderful news — I'm genuinely thrilled and full of joy for you. "
        "This brings a warm, buoyant energy and I feel like celebrating; your success lights up the room."
    ),
    "happy_3": (
        "That's absolutely wonderful news — I'm genuinely thrilled and full of joy for you. "
        "This brings a warm, buoyant energy and I feel like celebrating; your success lights up the room."
    ),
    "enthusiastic_formal": (
        "I'm very pleased to share this opportunity with you; it represents substantial potential and merit. "
        "Please consider it carefully — I believe it aligns strongly with your skills and the objectives we discussed."
    ),
    "enthusiastic_formal_2": (
        "I'm very pleased to share this opportunity with you; it represents substantial potential and merit. "
        "Please consider it carefully — I believe it aligns strongly with your skills and the objectives we discussed."
    ),
    "enthusiastic_formal_3": (
        "I'm very pleased to share this opportunity with you; it represents substantial potential and merit. "
        "Please consider it carefully — I believe it aligns strongly with your skills and the objectives we discussed."
    ),
    "funny_sarcastic": (
        "How can you be so good Ahmed, I do not believe it"
    ),
    "anxious": (
        "I'm feeling a bit on edge and worried about how this will turn out; my thoughts keep racing. "
        "What if it fails? What if I missed something important? I keep replaying scenarios and hoping for the best."
    ),
    "disgusted": (
        "Ew, that is really off-putting — it makes my skin crawl and I want to step away. "
        "The sensation is visceral: I recoil, pull back, and feel a strong desire to avoid it entirely."
    ),
    "shy": (
        "Um... hi — I, uh, just wanted to say hello. I'm a bit nervous and speaking softly because I don't want to impose. "
        "Please forgive me if I stumble; I'm trying to be polite and quiet while I gather my courage."
    ),
    "dont_care": (
        "Fine, do whatever you want — honestly, it makes no difference to me either way. "
        "I'll stay out of it; you can make the call and I'll accept the result without fuss."
    ),
    "admire": (
        "Wow — that is truly impressive; I admire the skill and dedication that went into this. "
        "Your work demonstrates care, talent, and thoughtful execution, and I sincerely respect what you've achieved."
    ),
    "depressed": (
        "Lately I can't seem to find the energy to do much; everything feels heavy and colorless. "
        "Small tasks that used to be manageable now feel overwhelming, and I'm struggling to motivate myself."
    ),
}

# ======================================================
# 🎧 SYNTHESIS LOGIC
# ======================================================
async def synthesize_one(client: AsyncHumeClient, text: str, emotion: str, ext: str = "mp3"):
    preset = EMOTION_PRESETS[emotion]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{emotion}.{ext}"

    utterance_kwargs = {
        "text": text,
        "voice": PostedUtteranceVoiceWithName(name=VOICE_NAME),
        "description": preset["description"],
        "speed": preset["speed"],
    }
    if "trailing_silence" in preset:
        utterance_kwargs["trailing_silence"] = preset["trailing_silence"]

    utterance = PostedUtterance(**utterance_kwargs)
    print(f"🎙️ Generating '{emotion}' using voice '{VOICE_NAME}'...")

    stream = client.tts.synthesize_json_streaming(
        utterances=[utterance],
        strip_headers=True,
        version="1",
    )

    written = 0
    with open(out_path, "wb") as f:
        async for chunk in stream:
            audio_b64 = getattr(chunk, "audio", None)
            if audio_b64:
                data = base64.b64decode(audio_b64)
                f.write(data)
                written += len(data)

    if written > 0:
        print(f"✅ Audio saved: {out_path}")
    else:
        print(f"⚠️ No audio written for '{emotion}'. Check voice name or API key.")

    return out_path


# ======================================================
# MAIN EXECUTION
# ======================================================
async def main():
    global VOICE_NAME
    parser = argparse.ArgumentParser(description="Hume TTS multi-level emotions demo")
    parser.add_argument("--text", "-t", default=None, help="Custom text to synthesize")
    parser.add_argument("--emotion", "-e", default="all", choices=["all"] + list(EMOTION_PRESETS.keys()))
    parser.add_argument("--voice", "-v", default=VOICE_NAME)
    parser.add_argument("--ext", default="mp3", help="Output file format (mp3 or wav)")
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("HUME_API_KEY")
    if not api_key:
        raise EnvironmentError("Missing HUME_API_KEY in .env")

    VOICE_NAME = args.voice
    client = AsyncHumeClient(api_key=api_key)

    if args.multi:
        # Example of switching emotions mid-text
        segments = [
            {"text": "Hello there, it's good to see you. ", "emotion": "happy"},
            {"text": "But honestly, I'm starting to feel uncertain... ", "emotion": "doubt"},
            {"text": "And now I'm getting really frustrated!", "emotion": "angry"},
        ]
        await synthesize_multi(client, segments, args.ext)
    elif args.emotion == "all":
        for emo in EMOTION_PRESETS:
            text = args.text if args.text else EMOTION_LINES.get(emo, "")
            await synthesize_one(client, text, emo, args.ext)
    else:
        text = args.text if args.text else EMOTION_LINES.get(args.emotion, "")
        await synthesize_one(client, text, args.emotion, args.ext)


if __name__ == "__main__":
    asyncio.run(main())
