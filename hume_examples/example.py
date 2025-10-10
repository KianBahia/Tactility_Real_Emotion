import os, base64, asyncio, argparse
from pathlib import Path
from dotenv import load_dotenv

from hume import AsyncHumeClient
from hume.tts import PostedUtterance, PostedUtteranceVoiceWithName

VOICE_NAME = "Ava Song"  # this is a standard voice, for the future we can updating it using shuhan voice 
OUT_DIR = Path("out_tts")

# here you can find various prompts to test how the emotional token works.
EMOTION_PRESETS = {
    "neutral": {
        "description": "neutral, clear, conversational, medium pace, natural emphasis",
        "speed": 1.0,
    },
    "angry": {
        "description": "angry, sharp, intense, clipped consonants, firm emphasis, fast pace",
        "speed": 1.15,
    },
    "sad": {
        "description": "sad, soft, low energy, slow pace, gentle downward intonation, subdued",
        "speed": 0.85,
    },
    "doubt": {
        "description": "uncertain, hesitant, thoughtful, light pauses, rising intonation at phrase ends",
        "speed": 0.95,
    },
    "happy": {
        "description": "happy, bright, upbeat, smiling tone, lively rhythm, warm and friendly",
        "speed": 1.1,
    },
}

async def synthesize_one(client: AsyncHumeClient, text: str, emotion: str, ext: str = "mp3"):
    
    
    preset = EMOTION_PRESETS[emotion]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{emotion}.{ext}"

    # setting up 
    utterance = PostedUtterance(
        text=text,
        voice=PostedUtteranceVoiceWithName(name=VOICE_NAME, provider="HUME_AI"),
        description=preset["description"],
        speed=preset["speed"],
        # trailing_silence=1.0,  # optional
    )
    # with this it sends your utterance to Hume’s API using the asynchronous client
    # sends the result little by little instead of waiting to finish generating everything
    stream = client.tts.synthesize_json_streaming(
        utterances=[utterance],
        strip_headers=True,
        version="1",
    )

    # write the audio message
    written = 0
    with open(out_path, "wb") as f:
        async for chunk in stream:
            audio_b64 = getattr(chunk, "audio", None)
            if audio_b64:
                data = base64.b64decode(audio_b64)
                f.write(data)
                written += len(data)

    return out_path

async def main():
    global VOICE_NAME
    parser = argparse.ArgumentParser(description="Hume TTS emotions demo")
    parser.add_argument("--text", "-t", default="This is a demo line for the selected emotion.")
    parser.add_argument("--emotion", "-e",
                        default="all",
                        choices=["all"] + list(EMOTION_PRESETS.keys()))
    parser.add_argument("--voice", "-v", default=VOICE_NAME)
    parser.add_argument("--ext", default="mp3", help="Output extension (mp3 or wav)")
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("HUME_API_KEY")
    if not api_key:
        raise EnvironmentError("Missing HUME_API_KEY in .env")

    VOICE_NAME = args.voice

    client = AsyncHumeClient(api_key=api_key)

    if args.emotion == "all":
        for emo in EMOTION_PRESETS:
            await synthesize_one(client, args.text, emo, args.ext)
    else:
        await synthesize_one(client, args.text, args.emotion, args.ext)

if __name__ == "__main__":
    asyncio.run(main())