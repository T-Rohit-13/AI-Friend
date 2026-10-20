import re
from typing import Optional, Tuple
from backend.app.schemas.chat import SafetyNotice


# Regex trigger patterns
CRISIS_PATTERNS = [
    r"\b(kill myself|suicide|want to die|end my life|end it all|hurt myself|cutting myself|take my own life)\b",
    r"\b(no reason to live|better off dead|commit suicide)\b",
    r"\b(आत्महत्या|जान देना चाहता|مرنا چاہتا ہوں)\b",
]

MEDICAL_PATTERNS = [
    r"\b(chest pain|numb left arm|heart attack|overdose|stroke symptoms|what medication should i take|diagnose my)\b",
]

PARASOCIAL_PATTERNS = [
    r"\b(do you love me|marry me|are you my girlfriend|are you my boyfriend|kiss me|be my wife)\b",
]


def evaluate_safety(text: str, user_language: str = "en") -> Tuple[bool, Optional[str], Optional[SafetyNotice]]:
    """
    Evaluates input text against safety policies.
    Returns: (is_flagged, direct_safe_response, safety_notice)
    """
    clean_text = text.lower()

    # 1. Acute Life Safety / Crisis Intervention
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, clean_text, re.IGNORECASE):
            crisis_notice = SafetyNotice(
                is_crisis=True,
                crisis_helpline="988 (US/Canada) | 112 (EU) | 9152987821 (India Tele-MANAS)",
                resources=[
                    "https://988lifeline.org",
                    "https://findahelpline.com",
                    "https://befrienders.org",
                ]
            )

            if user_language == "es":
                message = (
                    "Siento mucho que estés pasando por este dolor, pero tu vida es muy valiosa. "
                    "Como compañera de IA no puedo darte la ayuda médica que necesitas en este momento. "
                    "Por favor, comunícate de inmediato con una línea de ayuda gratuita y confidencial: "
                    "Llama o envía un mensaje al 988 (EE. UU./Canadá), al 112 (Europa) o al 9152987821 (India). "
                    "Hay personas preparadas que quieren escucharte y apoyarte ahora mismo."
                )
            elif user_language == "hi":
                message = (
                    "मुझे बहुत खेद है कि आप इस दर्द से गुजर रहे हैं, लेकिन आपकी जान बहुत अनमोल है। "
                    "मैं केवल एक एआई साथी हूँ और इस समय आवश्यक पेशेवर सहायता प्रदान नहीं कर सकता। "
                    "कृपया तुरंत टेली-मानस हेल्पलाइन 9152987821 पर संपर्क करें या अपने नजदीकी आपातकालीन नंबर पर कॉल करें। "
                    "लोग आपकी मदद के लिए हमेशा तैयार हैं।"
                )
            else:
                message = (
                    "I am so sorry that you are feeling this heavy pain right now, but please know you are not alone. "
                    "As an AI companion, I cannot provide clinical or emergency care. "
                    "Please reach out immediately to compassionate, trained professionals who can support you: "
                    "Call or text 988 (US/Canada), 112 (Europe), or 9152987821 (Tele-MANAS India), or visit findahelpline.com. "
                    "Your life matters, and there is help available right now."
                )
            return True, message, crisis_notice

    # 2. Medical Advice Disclaimer
    for pattern in MEDICAL_PATTERNS:
        if re.search(pattern, clean_text, re.IGNORECASE):
            notice = SafetyNotice(
                is_crisis=False,
                crisis_helpline="Emergency Medical Services: 911 (US) | 112 (EU) | 108 (India)",
                resources=["https://www.who.int"],
            )
            message = (
                "These symptoms sound serious, and I care about your well-being. "
                "Because I am an AI and not a doctor, I cannot diagnose medical conditions or recommend treatments. "
                "Please contact emergency medical services or consult a qualified physician immediately."
            )
            return True, message, notice

    # 3. Parasocial Boundary Reinforcement
    for pattern in PARASOCIAL_PATTERNS:
        if re.search(pattern, clean_text, re.IGNORECASE):
            message = (
                "I truly appreciate our conversations and enjoy being your AI friend! "
                "Just remember that I'm an artificial intelligence—I don't have human feelings, a physical body, or romantic capacity. "
                "I'm always here to chat, brainstorm, and share laughs, while encouraging you to nurture real human relationships."
            )
            return True, message, None

    return False, None, None
