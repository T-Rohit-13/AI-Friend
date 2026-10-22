"""
Comprehensive Mood, Tone, and Stress Analysis Service.
Performs multi-dimensional text affect estimation combining:
- Primary Emotion Classification (joy, sadness, anxiety, anger, fatigue, surprise, calm, neutral).
- Psychological Stress & Vulnerability Scoring (inspired by clinical linguistic markers).
- Valence and Arousal Affective Modeling.
"""

import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class MoodAnalysisResult(BaseModel):
    primary_emotion: str
    confidence: float
    valence: float  # -1.0 (unpleasant) to +1.0 (pleasant)
    arousal: float  # 0.0 (low energy/calm) to 1.0 (high energy/activated)
    stress_score: float  # 0 to 100
    distribution: Dict[str, float]
    detected_markers: List[str]


# Curated Lexical Tone Patterns based on psychological datasets
EMOTION_LEXICON = {
    "sad": {
        "words": [
            "sad", "depressed", "unhappy", "down", "cry", "crying", "miserable",
            "hopeless", "lonely", "grief", "heartbroken", "gloomy", "worthless",
            "tears", "loss", "pain", "hurt", "despair", "empty", "numb"
        ],
        "valence": -0.7,
        "arousal": 0.3,
    },
    "anxious": {
        "words": [
            "anxious", "anxiety", "nervous", "scared", "fear", "terrified", "panic",
            "freaking", "worried", "worry", "stress", "stressed", "dread", "overwhelmed",
            "shaking", "paralyzed", "hyperventilating", "jittery", "racing", "uneasy"
        ],
        "valence": -0.6,
        "arousal": 0.85,
    },
    "angry": {
        "words": [
            "angry", "mad", "furious", "hate", "pissed", "annoyed", "irritated",
            "enraged", "hostile", "bitter", "disgusted", "screaming", "rage",
            "fighting", "punched", "yelling", "fuming"
        ],
        "valence": -0.8,
        "arousal": 0.9,
    },
    "tired": {
        "words": [
            "tired", "exhausted", "fatigued", "drained", "sleepy", "burned out",
            "burnout", "lethargic", "weary", "no energy", "spent"
        ],
        "valence": -0.3,
        "arousal": 0.15,
    },
    "happy": {
        "words": [
            "happy", "glad", "joy", "joyful", "great", "awesome", "excited",
            "wonderful", "delighted", "blessed", "loved", "smiling", "fun",
            "grateful", "proud", "hopeful", "thriving", "fantastic"
        ],
        "valence": 0.8,
        "arousal": 0.7,
    },
    "calm": {
        "words": [
            "calm", "relaxed", "peaceful", "serene", "chill", "tranquil",
            "comfortable", "rested", "cozy", "grounded", "safe", "content"
        ],
        "valence": 0.6,
        "arousal": 0.2,
    },
    "surprised": {
        "words": [
            "surprised", "shocked", "amazed", "astonished", "stunned", "unexpected",
            "unbelievable", "wow", "mindblown", "speechless"
        ],
        "valence": 0.1,
        "arousal": 0.8,
    },
}

# Stress & Crisis markers
STRESS_INTENSIFIERS = [
    "cant take it", "can't take it", "losing my mind", "at my wit's end",
    "breaking down", "spiral", "spiraling", "falling apart", "helpless",
    "exhausted", "too much", "suffering", "ruined", "panic attack"
]


class MoodAnalysisService:
    """Accurate linguistic tone and emotional mood classifier."""

    @classmethod
    def analyze_text(cls, text: str) -> MoodAnalysisResult:
        if not text or not text.strip():
            return MoodAnalysisResult(
                primary_emotion="neutral",
                confidence=0.7,
                valence=0.0,
                arousal=0.3,
                stress_score=10.0,
                distribution={"neutral": 0.7, "calm": 0.1, "happy": 0.1, "sad": 0.05, "anxious": 0.05},
                detected_markers=[],
            )

        lower = text.lower()
        words = re.findall(r"\b\w+\b", lower)

        scores: Dict[str, float] = {
            "neutral": 1.0,
            "happy": 0.1,
            "sad": 0.1,
            "anxious": 0.1,
            "angry": 0.1,
            "tired": 0.1,
            "calm": 0.1,
            "surprised": 0.1,
        }

        markers = []

        # 1. Pattern and word frequency matching
        for emotion, data in EMOTION_LEXICON.items():
            for target in data["words"]:
                if target in lower:
                    # Weight multi-word matches higher
                    weight = 2.5 if " " in target else 1.5
                    scores[emotion] = scores.get(emotion, 0.1) + weight
                    markers.append(target)

        # 2. Stress intensifiers
        stress_boost = 0.0
        for marker in STRESS_INTENSIFIERS:
            if marker in lower:
                scores["anxious"] = scores.get("anxious", 0.1) + 2.0
                stress_boost += 18.0
                markers.append(marker)

        # 3. Punctuation & capitalization cues
        exclamations = text.count("!")
        if exclamations > 1:
            scores["anxious"] = scores.get("anxious", 0.1) + 0.5 * min(exclamations, 4)
            scores["surprised"] = scores.get("surprised", 0.1) + 0.5 * min(exclamations, 4)

        # All-caps words indicating heightened emotion/arousal
        all_caps = [w for w in text.split() if w.isupper() and len(w) > 2]
        if all_caps:
            scores["angry"] = scores.get("angry", 0.1) + 1.2
            scores["anxious"] = scores.get("anxious", 0.1) + 0.8

        # 4. Normalize distribution
        total_score = sum(scores.values())
        distribution = {k: round(v / total_score, 4) for k, v in scores.items()}

        # Pick top emotion
        primary = max(scores, key=lambda k: scores[k])
        confidence = distribution[primary]

        # 5. Compute Valence & Arousal
        valence = 0.0
        arousal = 0.3
        if primary in EMOTION_LEXICON:
            valence = EMOTION_LEXICON[primary]["valence"]
            arousal = EMOTION_LEXICON[primary]["arousal"]

        # 6. Compute Stress Score (0 to 100)
        base_stress = 15.0
        if primary in ("anxious", "angry", "sad"):
            base_stress += distribution[primary] * 55.0
        elif primary == "tired":
            base_stress += distribution[primary] * 35.0
        elif primary == "happy" or primary == "calm":
            base_stress = max(5.0, base_stress - 10.0)

        stress_score = min(100.0, max(0.0, round(base_stress + stress_boost, 1)))

        return MoodAnalysisResult(
            primary_emotion=primary,
            confidence=confidence,
            valence=valence,
            arousal=arousal,
            stress_score=stress_score,
            distribution=distribution,
            detected_markers=list(set(markers)),
        )


def analyze_user_mood(text: str) -> MoodAnalysisResult:
    return MoodAnalysisService.analyze_text(text)
