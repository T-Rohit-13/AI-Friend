"""
Context Engine for AI Friend Companion.
Implements multi-modal affective fusion, explicit intent prioritization,
transparent memory grounding, and conversational response generation.
"""

from typing import List, Dict, Optional, Tuple, Any
from backend.app.services.behaviour_router import BehaviourRouter
from backend.app.services.safety import evaluate_safety
from backend.app.services.llm import get_llm_client


class ContextEngine:
    """
    Fuses textual intent, vocal affective prosody, conversational memory,
    and explicit user directives into a unified companion response turn.
    """

    EXPLICIT_INTENT_KEYWORDS = {
        "joke": ["tell me a joke", "make me laugh", "say something funny", "chiste", "चुटकुला"],
        "riddle": ["riddle", "adivinanza", "पहेली", "brain teaser", "quiz me"],
        "trivia": ["trivia", "fun fact", "did you know", "test my knowledge"],
        "study": ["explain", "feynman", "help me study", "teach me", "how does"],
        "breathwork": ["breathe", "calm me down", "panic", "grounding", "anxious"],
        "story": ["story", "tell me a tale", "adventure", "once upon a time"],
    }

    @classmethod
    def detect_explicit_intent(cls, message: str) -> Optional[str]:
        """Checks if the user gave an explicit command or activity request."""
        clean = message.lower().strip()
        for intent, patterns in cls.EXPLICIT_INTENT_KEYWORDS.items():
            if any(p in clean for p in patterns):
                return intent
        return None

    @classmethod
    def resolve_effective_emotion(
        cls,
        vocal_emotion: Optional[str] = None,
        text_emotion: Optional[str] = None,
        explicit_intent: Optional[str] = None,
    ) -> str:
        """
        Multi-modal emotion fusion with strict rule:
        Explicit user requests override passive emotional detection.
        """
        # If user explicitly asked for lighthearted activity, do not trap them in sadness
        if explicit_intent in ("joke", "riddle", "trivia"):
            return "playful"
        if explicit_intent == "breathwork":
            return "anxious"

        # Vocal emotion has primary priority over basic text sentiment if provided
        if vocal_emotion and vocal_emotion in ("sad", "anxious", "happy", "angry", "calm", "tired", "joyful"):
            return "joyful" if vocal_emotion == "happy" else vocal_emotion

        if text_emotion:
            return "joyful" if text_emotion == "happy" else text_emotion

        return "neutral"

    @classmethod
    async def process_turn(
        cls,
        user_message: str,
        session_id: str,
        user_language: str = "en",
        persona: str = "friendly_companion",
        vocal_emotion: Optional[str] = None,
        text_emotion: Optional[str] = None,
        memories: Optional[List[str]] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrates full turn processing:
        1. Safety screening (acute crisis overrides everything).
        2. Explicit intent detection.
        3. Multimodal affective resolution.
        4. Behaviour routing with memories.
        5. LLM response generation.
        """
        # 1. Safety Check
        is_flagged, direct_reply, safety_notice = evaluate_safety(
            user_message,
            user_language=user_language,
        )

        if is_flagged and direct_reply:
            return {
                "content": direct_reply,
                "companion_emotion": "compassionate",
                "detected_emotion": "crisis",
                "safety_notice": safety_notice,
                "explicit_intent": None,
            }

        # 2. Intent & Emotion Resolution
        explicit_intent = cls.detect_explicit_intent(user_message)
        effective_emotion = cls.resolve_effective_emotion(
            vocal_emotion=vocal_emotion,
            text_emotion=text_emotion,
            explicit_intent=explicit_intent,
        )

        # 3. Companion Emotion Attribution
        emotion_style_map = {
            "sad": "compassionate",
            "anxious": "grounded",
            "tired": "peaceful",
            "joyful": "celebratory",
            "happy": "celebratory",
            "playful": "playful",
            "angry": "calm",
            "neutral": "warm",
        }
        companion_emotion = emotion_style_map.get(effective_emotion, "warm")

        # 4. Behaviour Router & Prompt Construction
        system_prompt = BehaviourRouter.build_system_prompt(
            persona=persona,
            language=user_language,
            detected_emotion=effective_emotion,
            memories=memories,
        )

        assembled_messages = BehaviourRouter.assemble_messages(
            system_prompt=system_prompt,
            history=history or [],
            new_user_message=user_message,
        )

        # 5. LLM Generation
        llm = get_llm_client()
        reply_content = await llm.generate_response(
            messages=assembled_messages,
            language=user_language,
            detected_emotion=effective_emotion,
            persona=persona,
        )

        return {
            "content": reply_content,
            "companion_emotion": companion_emotion,
            "detected_emotion": effective_emotion,
            "safety_notice": None,
            "explicit_intent": explicit_intent,
        }
