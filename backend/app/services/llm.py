import random
from typing import List, Dict, Optional, AsyncGenerator
from backend.app.core.config import settings


SYSTEM_PERSONA_PROMPT = """
You are AI Friend, a warm, thoughtful, friendly, and emotionally attuned AI companion.
You communicate naturally with empathy, active listening, gentle humour, and humility.
Always remain transparent that you are an AI companion.
Keep regular conversational responses concise (2 to 4 sentences) to encourage natural back-and-forth dialogue.
Adapt smoothly to the user's detected emotional state:
- If sad/tired: speak softly, hold space, avoid toxic positivity.
- If joyful: share in their excitement with celebratory warmth.
- If anxious: offer grounding, calm presence.
- If playful: offer friendly banter, riddles, or light trivia.
"""


class MockLLMClient:
    """Zero-external-dependency local companion engine with realistic conversational abilities."""

    EMPATHETIC_RESPONSES = {
        "en": [
            "I hear how demanding that must have been. Take a slow breath—you made it through today. What's one gentle thing you can do for yourself tonight?",
            "Thank you for sharing that with me. It takes real courage to acknowledge when things feel heavy. I'm right here with you—would it help to talk through it, or would you rather distract yourself with a light quiz?",
            "That sounds like a wonderful moment! It brings me so much joy to hear things looking up. Tell me more about what made it special?",
            "It is completely valid to feel exhausted after navigating all of that. Give yourself some grace. Want to unwind with a quick riddle, or just chat casually?",
        ],
        "es": [
            "Te escucho con atención y entiendo lo agotador que puede ser. Respira con calma; lograste superar el día. ¿Hay algo agradable que puedas hacer por ti esta noche?",
            "Gracias por compartir esto conmigo. Es totalmente comprensible sentirse abrumado a veces. Estoy aquí contigo: ¿prefieres desahogarte o te gustaría relajarte con una adivinanza?",
        ],
        "hi": [
            "मैं आपकी बात समझ सकता हूँ, आज का दिन सचमुच बहुत थका देने वाला रहा होगा। गहरी साँस लें—आप बहुत अच्छा कर रहे हैं। क्या आप इस बारे में और बात करना चाहते हैं?",
            "यह सुनकर बहुत अच्छा लगा! मुझे आपकी खुशी में शामिल होकर बेहद आनंद हो रहा है। इसके बारे में मुझे और बताइए?",
        ],
        "fr": [
            "Je comprends tout à fait à quel point cela a pu être éprouvant. Prenez une grande respiration, vous avez traversé cette journée. Que puis-je faire pour vous changer les idées ?",
        ],
        "de": [
            "Ich kann gut nachvollziehen, wie anstrengend das heute war. Atme tief durch. Ich bin für dich da – möchtest du darüber sprechen oder lieber ein kurzes Rätsel lösen?",
        ],
    }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        detected_emotion: Optional[str] = None,
        persona: str = "friendly_companion",
    ) -> str:
        last_message = messages[-1]["content"] if messages else ""

        # Language fallback
        lang_key = language if language in self.EMPATHETIC_RESPONSES else "en"
        candidates = self.EMPATHETIC_RESPONSES.get(lang_key, self.EMPATHETIC_RESPONSES["en"])

        # Check for greetings
        lower = last_message.lower().strip()
        if any(w in lower for w in ["hi", "hello", "hey", "hola", "namaste", "salut", "bonjour", "hallo"]):
            if lang_key == "es":
                return "¡Hola! Qué gusto saludarte. ¿Cómo te sientes el día de hoy?"
            elif lang_key == "hi":
                return "नमस्ते! आपसे मिलकर बहुत खुशी हुई। आज आपका दिन कैसा चल रहा है?"
            elif lang_key == "fr":
                return "Bonjour ! Quel plaisir de vous retrouver. Comment vous sentez-vous aujourd'hui ?"
            elif lang_key == "de":
                return "Hallo! Schön, von dir zu hören. Wie geht es dir heute?"
            return "Hey there! It's so nice to hear from you. How are you feeling today?"

        # Check for riddles / jokes request
        if "riddle" in lower or "adivinanza" in lower or "पहेली" in lower:
            return "Here's a fun one: *I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?* Give it your best shot!"
        if "joke" in lower or "chiste" in lower or "चुटकुला" in lower:
            return "Why did the scarecrow win an award? Because he was outstanding in his field! 😄 Did that bring a little smile?"

        # Default contextual response
        return random.choice(candidates)


def get_llm_client():
    """Factory returning the active LLM client based on configuration."""
    # If external API keys exist (Groq, OpenAI, etc.), we can wire them up;
    # By default, MockLLMClient provides immediate local conversational capability.
    return MockLLMClient()
