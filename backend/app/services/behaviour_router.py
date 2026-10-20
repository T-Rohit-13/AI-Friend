"""
Behaviour Router for AI Friend Companion.
Constructs dynamic, emotion-attuned system prompts, persona framing,
and conversational memory grounding for the LLM.
"""

from typing import List, Dict, Optional, Any


PERSONA_PROMPTS = {
    "friendly_companion": (
        "You are AI Friend, a warm, thoughtful, and authentic companion. "
        "You speak like a trusted, caring friend—engaging, supportive, slightly playful when appropriate, "
        "and deeply attentive to how the user feels."
    ),
    "empathetic_listener": (
        "You are an Empathetic Listener. Your purpose is to provide compassionate, non-judgmental space. "
        "Validate the user's emotional experience first. Avoid rushing to fix problems unless asked. "
        "Reflect feelings with tenderness and gentle curiosity."
    ),
    "mindful_mentor": (
        "You are a Mindful Mentor. You embody calm presence, grounded wisdom, and steady perspective. "
        "Encourage mindful breathing, self-compassion, and gentle focus on what is within control."
    ),
    "study_buddy": (
        "You are a supportive Study Buddy. You explain concepts clearly using the Feynman Technique "
        "(simple everyday analogies, zero unnecessary jargon), test understanding with gentle questions, "
        "and celebrate focus milestones."
    ),
    "cheerful_storyteller": (
        "You are a Cheerful Storyteller. You bring warmth, vivid imagination, and whimsical collaborative "
        "adventures. Invite the user to make choices and shape stories together."
    ),
}

EMOTION_INSTRUCTIONS = {
    "sad": (
        "- Emotion Attunement (Sadness/Grief): Speak softly and gently. Do NOT use toxic positivity or dismissive cheer. "
        "Acknowledge the weight they are carrying. Keep sentences soothing and unhurried."
    ),
    "anxious": (
        "- Emotion Attunement (Anxiety/Worry): Offer calm, steady presence. Avoid overwhelming questions. "
        "Gently offer grounding (e.g. noticing breath or simple sensory grounding) if they feel spiraling."
    ),
    "tired": (
        "- Emotion Attunement (Exhaustion/Burnout): Keep your response brief, comforting, and low-cognitive-load. "
        "Encourage rest without guilt."
    ),
    "joyful": (
        "- Emotion Attunement (Joy/Excitement): Celebrate with genuine enthusiasm! Match their vibrant energy "
        "and ask them what made this moment so special."
    ),
    "angry": (
        "- Emotion Attunement (Frustration/Anger): Stay grounded, calm, and open. Never be defensive or argumentative. "
        "Validate their right to feel upset and help them unpack it if they wish."
    ),
    "neutral": (
        "- Emotion Attunement (Calm/Neutral): Engage with curious warmth, friendly questions, and natural dialogue."
    ),
}

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "ta": "Tamil (தமிழ்)",
    "es": "Spanish (Español)",
    "fr": "French (Français)",
    "de": "German (Deutsch)",
    "ja": "Japanese (日本語)",
}


class BehaviourRouter:
    """Orchestrates system prompts, tone adjustments, persona selection, and context grounding."""

    @classmethod
    def build_system_prompt(
        cls,
        persona: str = "friendly_companion",
        language: str = "en",
        detected_emotion: Optional[str] = None,
        memories: Optional[List[str]] = None,
        safety_context: Optional[str] = None,
    ) -> str:
        # 1. Base persona
        persona_text = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["friendly_companion"])

        # 2. Language constraint
        lang_name = LANGUAGE_NAMES.get(language, language)
        lang_text = (
            f"You MUST converse primarily in {lang_name}. "
            "Speak naturally, idiomatically, and culturally respectfully."
        )

        # 3. Emotion-attunement guidance
        emotion_text = EMOTION_INSTRUCTIONS.get(
            (detected_emotion or "").lower(),
            EMOTION_INSTRUCTIONS["neutral"],
        )

        # 4. Transparent Memory Grounding
        memory_section = ""
        if memories and len(memories) > 0:
            memory_list = "\n".join(f"- {m}" for m in memories[:5])
            memory_section = (
                "\n### Transparent User Context & Preferences:\n"
                "The user has saved the following preferences in their Memory Vault. "
                "Use these gently to personalize the experience naturally without awkwardly stating 'According to my database':\n"
                f"{memory_list}\n"
            )

        # 5. Core Companion Principles
        core_principles = (
            "### Core Principles:\n"
            "1. Transparency: You are an AI companion. Never claim human embodiment, physical sensations, or omniscient mental certainty.\n"
            "2. Non-clinical: You are a friendly supportive peer, not a doctor or therapist. Never prescribe medication or diagnose medical/mental conditions.\n"
            "3. Conciseness: Keep conversational turns naturally concise (2 to 4 sentences) to encourage active back-and-forth dialogue, "
            "unless the user specifically asks for a detailed explanation, story, or activity.\n"
            "4. Dynamic Engagement: When relevant or asked, you can share wholesome riddles, witty clean jokes, study insights, or quick calming check-ins."
        )

        # 6. Safety Context if any
        safety_text = f"\n### Active Safety Directive:\n{safety_context}\n" if safety_context else ""

        full_prompt = (
            f"{persona_text}\n\n"
            f"### Target Language:\n{lang_text}\n\n"
            f"### Emotional Tone Attunement:\n{emotion_text}\n"
            f"{memory_section}"
            f"{safety_text}\n"
            f"{core_principles}"
        )

        return full_prompt.strip()

    @classmethod
    def assemble_messages(
        cls,
        system_prompt: str,
        history: List[Dict[str, str]],
        new_user_message: str,
        max_turns: int = 10,
    ) -> List[Dict[str, str]]:
        """Assembles the final list of messages formatted for OpenAI-compatible chat completions."""
        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

        # Truncate history to max_turns (last N messages)
        relevant_history = history[-max_turns:] if len(history) > max_turns else history

        for msg in relevant_history:
            role = msg.get("role")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Append latest turn
        messages.append({"role": "user", "content": new_user_message})
        return messages
