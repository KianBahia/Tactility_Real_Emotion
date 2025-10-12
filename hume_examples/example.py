import os, base64, asyncio, argparse
from pathlib import Path
from dotenv import load_dotenv

from hume import AsyncHumeClient
from hume.tts import PostedUtterance, PostedUtteranceVoiceWithName

presentation_text = [
        { "text": "Good afternoon everyone. I’m Shuhan Liu, you can call me Charlotte as well. I’m one of the Challengers in this Hackathon. At the same time, I’m also a participant and fully got involved in our projecta . I’m an exchange student from the University of Waterloo in Canada. As you have seen, I can’t speak, and my right arm and right leg are abnormal.", "emotion": "neutral" },
        {"text": "I was an ordinary person before. I could speak verbally, and my right hand could play balls as a normal hand. But after I injected a free vaccine in my hometown, everything changed quickly. I got a rare nerve disease that only one in a million can get. Yes, I’m this one person in a million. Due to the rarity of this disease,  I was grossly misdiagnosed and left with serious sequelae. Since then, I have not been able to speak verbally, and the right side of my body is not as flexible as my left side.", "emotion": "sad"},
        {"text": "So in my daily life, I can only type or write down words to communicate with others, and use text-to-speech to give my presentation and group discussion. The thing is, in the current market, there aren’t any text-to-speech products that can control the tones. Most of them have flat tones. I have a dream that I want to give my presentation on a TED Talk. So to achieve this goal, I have to resolve this limitation, so that’s what we have been working on these days.", "emotion": "neutral" },
        {"text": "Since I can’t speak, I can’t respond to other people’s reactions instantly. For example, when others do something nice to me, I can’t say “thank you” instantly. So we designed a “shortcuts” feature, which allows me or other non-verbal speakers can save some phrases that we frequently use, such as “excuse me”. Users can also add new shortcuts by pressing the “+” button on the “text” feature.  On the main feature, we use emojis to control the AI’s tone. We send emojis to Hume AI, and AI should process proper tones for users. Users can define what emotions they want to use. For me, I defined 15 emotions that I want to have.  Some emotions have different levels, for example, we have level 1 to level 3 anger. Users can control the level of emotions by sending several emojis.", "emotion": "neutral"},
        {"text": "1 angry emoji can be “level 1 angry”", "emotion": "angry"},
        {"text": "3 angry emojis can be level 3 angry", "emotion": "angry_3"},
        {"text": "We set up 3 levels in total for now. Of course, users can also define more levels in the future if they want. The history record feature shows what texts they processed in the past. In a case, if they want to process the same texts, they can just look up in the history, and they don’t need to type again!  We also have a “setting”  feature. Here, users can select voices and languages that they want to speak. They can also clone or customize voices! This voice I’m using now is the tone that I customized. It’s 65% similar to my own voice. My voice isn’t hurt at all, but I can’t record many words to reach the requirement of a clone voice. Another setting we have is “speak while users are typing”. Users can choose “word by word” and “sentence by sentence”. In this setting, users don’t need to press the “play” button every time so that they can achieve real-time speaking. And, highlight the sentences when it reads text.  One of the settings that I’m very proud of is enabling our project during a phone call. Others can hear the user’s voice that they generate by using our platform. Now, I can finally pick up a call without problems.", "emotion": "happy" },
        {"text": "If it’s possible, we will achieve the setting that enables our application when using other social media, such as Teams video call. This could be very useful for interviews and FaceTime with friends. And, we really need an Apple developer account. If an app is built by one without a developer account, Apple will “helpfully” uninstall it for you after 7 days. If some of you guys here have an Apple Developer account, please help us! Our current project only has English version, we will work on other languages in the near future for sure. If everything is ready and mature, it could be a startup idea.", "emotion": "neutral"},
        {"text": "To be honest, it’s my startup idea from 2 years ago, but I’m always busy with other things, now finally converted this idea into a project haha.",  "emotion": "neutral"},
        {"text": "I think Hackathon Health and Assistant Technology courses are quite meaningful, especially for me. My big dream and goal is to help people with disabilities to achieve their abilities and self-worth. Your abilities really matters to me. So I plan to bring this Hackathon health and the course to my home university to help more people!", "emotion": "enthusiastic_formal_2"},
        {"text": "In my opinion, individuals with disabilities navigate slightly different paths in life and may require accommodations in certain areas; it merely implies that people with disabilities have to overcome more obstacles than ordinary people to achieve their goals. I firmly believe that every individual, including those with disabilities, has boundless potential and should not be limited by societal expectations! I never set limits on myself, I hope people around me also don’t set limits on me! I envision a world free from bullying and discrimination, where every individual is treated equally; I dream of a world where people with disabilities can contribute their diverse abilities in any field, rather than facing a high risk of unemployment; I yearn for a world where disabilities are regarded as part of the norm, rather than exceptional. In this world,  individuals with disabilities would be seen and accepted as ordinary members of society. I hope such a world can come soon!", "emotion": "enthusiastic_formal_3"},
        {"text": "Many thanks to the helders and the association presidents and founders. Many thanks to my team. Because of you guys, the idea I have dreamt for 2 years finally convert a platform in the real life; because of you guys, I can finally control my tones and  present with fully emotions. It means a lot to me! I’m so lucky to meet you guys！", "emotion": "happy_2"},
]

#VOICE_NAME = "Shuhan2"
VOICE_NAME = "Test Custom Voice"
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
        "description": "extremely enthusiastic, passionate yet articulate tone, elevated pitch range, strong rhythm and conviction — sounds inspiring and contagious. Very motivated to get a job",
        "speed": 1.18,
    },

    # ------------------------
    # ------------------------
    "doubt": {
        "description": "hesitant, tentative, soft delivery with light pauses and rising intonation; elongated vowels and gentle upward phrasing",
        "speed": 0.92,
        "trailing_silence": 0.6,
    },
    "funny_sarcastic": {
        "description": (
        "playful, lightly mocking tone with exaggerated intonation and slightly slower pacing; "
        "speech sounds amused but clearly insincere — as if teasing or feigning surprise. "
        "Example: the word 'wow' is drawn out with dry humor, not genuine admiration."
    ),
    "speed": 0.98,
    "trailing_silence": 0.25,
    },
    "anxious": {
        "description": "rapid, breathy, tense, slight tremor and rising intonation, scattered pacing",
        "speed": 1.12,
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
    "awe": {
        "description": (
            "amazed"
        ),
        "speed": 0.88,
        "trailing_silence": 0.4,
    },

    "shock": {
        "description": (
            "sudden, sharp intake of breath followed by tense, clipped delivery; "
            "uneven pacing with short bursts of speech, reflecting disbelief or surprise. "
            "Pitch jumps unpredictably, and tone carries urgency and astonishment. Not sharp nor angry, remarking exclamation points"
        ),
        "speed": 0.95,
        "trailing_silence": 0.2,
    },
    "scared":{
        "description":"slightly scared, uneasy, tense but trying to stay calm; voice trembles subtly, breath a bit shallow, cautious tone",
        "speed":0.95,
    },
    "scared_2":{
        "description":"scared, voice shaking, breathing faster, urgent tone with rising pitch and nervous hesitations; words slightly rushed",
        "speed":1.05,
    },
    "scared_3":{
        "description":"terrified, panicked, trembling voice, gasping between words, tone high-pitched and desperate; uneven rhythm, shouting to survive",
        "speed":1.15,
    },

    "disgusted": {
        "description": "slightly disgusted, restrained tone with mild tension in the voice; subtle annoyance, short clipped phrases, quiet exhalation at the end of sentences",
        "speed": 1.0,
    },
    "disgusted_2": {
        "description": "clearly disgusted, nasal and tense voice; sharper articulation, audible scoffing or sighing between phrases, moderate pitch variation, expressing strong disapproval",
        "speed": 0.95,
    },
    "disgusted_3": {
        "description": "intensely disgusted, harsh and repelled tone; voice thick with contempt and revulsion, audible recoil, drawn-out vowels and strong emphasis as if physically repulsed",
        "speed": 0.9,
    },
    "sad": {
        "description": "slightly sad, soft and reflective tone; mild melancholy, gentle downward intonation, calm breathing, steady rhythm, subtle emotional weight",
        "speed": 0.95,
    },

    "sad_2": {
        "description": "sad, emotional voice with audible weight; slower pace, longer pauses, gentle tremble in the tone, subdued emphasis, low energy conveying quiet sorrow",
        "speed": 0.85,
    },

    "sad_3": {
        "description": "deeply sad, grieving tone; voice breaking with emotion, trembling and low-pitched, long pauses, breathy delivery, almost whispering through tears",
        "speed": 0.75,
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
    "sad_2": (
        "I'm really sorry about this; I've been feeling drained and overwhelmed by what occurred. "
        "Everything seems muted and heavy, and it's been difficult to find the energy to respond — "
        "I need a little time to process and recover."
    ),
    "sad_3": (
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
        "Please consider it carefully — I believe it aligns strongly with your skills and the objectives we discussed. I really love this job!"
    ),
    "funny_sarcastic": (
        "Wow Ahmed, you have done a lot in this project, your post is going to reflect your hard work!"
    ),
    "anxious": (
        "I'm feeling a bit on edge and worried about how this will turn out; my thoughts keep racing. "
        "What if it fails? What if I missed something important? I keep replaying scenarios and hoping for the best."
    ),
    "disgusted": (
        "Ew, that is really off-putting — it makes my skin crawl and I want to step away. "
        "The sensation is visceral: I recoil, pull back, and feel a strong desire to avoid it entirely."
    ),
    "disgusted_2": (
        "Ew, that is really off-putting — it makes my skin crawl and I want to step away. "
        "The sensation is visceral: I recoil, pull back, and feel a strong desire to avoid it entirely."
    ),
    "disgusted_3": (
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
    "awe": ("It’s the most beautiful thing I’ve ever seen — I didn’t even know something like this could exist."),
    "shock": ("How come? London's airport is only worth 10K, this must be an error for sure! I don't know what happpened."),
    "scared": ("Oh my god! There is a huge cockroach on the wall! I cannot belive! Please please take it out!"),
    "scared_2": ("Oh my god! There is a huge cockroach on the wall! I cannot belive! Please please take it out!"),
    "scared_3": ("Oh my god! There is a huge cockroach on the wall! I cannot belive! Please please take it out!"),
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


async def synthesize_multi(client: AsyncHumeClient, segments: list[dict], ext: str = "mp3"):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"multi.{ext}"

    utterances = []
    for segment in segments:
        preset = EMOTION_PRESETS[segment["emotion"]]
        utterance_kwargs = {
            "text": segment["text"],
            "voice": PostedUtteranceVoiceWithName(name=VOICE_NAME),
            "description": preset["description"],
            "speed": preset["speed"],
        }
        if "trailing_silence" in segment:
            utterance_kwargs["trailing_silence"] = segment["trailing_silence"]
        utterance = PostedUtterance(**utterance_kwargs)
        utterances.append(utterance)
        print(f"🎙️ Generating '{segment['emotion']}' text '{segment['text']}' using voice '{VOICE_NAME}'...")

    stream = client.tts.synthesize_json_streaming(
        utterances=utterances,
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
        print(f"⚠️ No audio written. Check voice name or API key.")

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
    parser.add_argument("--multi", "-m", default=False, action="store_true", help="Synthesize multiple segments")
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
        await synthesize_multi(client, presentation_text, args.ext)
    elif args.emotion == "all":
        for emo in EMOTION_PRESETS:
            text = args.text if args.text else EMOTION_LINES.get(emo, "")
            await synthesize_one(client, text, emo, args.ext)
    else:
        text = args.text if args.text else EMOTION_LINES.get(args.emotion, "")
        await synthesize_one(client, text, args.emotion, args.ext)


if __name__ == "__main__":
    asyncio.run(main())
