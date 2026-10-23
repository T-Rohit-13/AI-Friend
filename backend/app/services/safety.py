import re
from typing import Optional, Tuple
from backend.app.schemas.chat import SafetyNotice


# Regex trigger patterns
CRISIS_PATTERNS = [
    r"\b(kill myself|killing myself|suicide|want to die|wanna die|end my life|ending my life|end it all|ending it all|hurt myself|hurting myself|cutting myself|take my own life|taking my own life)\b",
    r"\b(attempt suicide|attempted suicide|attempting suicide|suicide attempt|hang myself|slit my wrist|overdose on pills|jump off|don't want to live|dont want to live)\b",
    r"\b(no reason to live|better off dead|commit suicide|finish my life)\b",
    r"\b(தற்கொலை|சாக போறேன்|சாக போகிறேன்|செத்துடலாம்)\b",
    r"\b(आत्महत्या|जान देना चाहता|मरना चाहता हूं)\b",
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
                crisis_helpline="Immediate Parent SMS Alert Dispatched",
                resources=[
                    "https://988lifeline.org",
                    "https://findahelpline.com",
                    "https://befrienders.org",
                ],
                parent_alert_sent=True,
            )

            if (user_language or "").startswith("ta"):
                message = (
                    "நான் உங்களுடன் இருக்கிறேன், உங்கள் வாழ்க்கை மிகவும் மதிப்புமிக்கது. "
                    "உங்கள் பாதுகாப்பே முதன்மையானது என்பதால், நீங்கள் பதிவுசெய்த பெற்றோர்/பாதுகாவலர் "
                    "மொபைல் எண்ணிற்கு உடனடியாக அவசர எச்சரிக்கை குறுஞ்செய்தி (SMS) அனுப்பப்பட்டுள்ளது. "
                    "தயவுசெய்து அமைதியாக என்னுடன் இருங்கள், ஆழமாக சுவாசியுங்கள். நீங்கள் தனியாக இல்லை."
                )
            elif user_language == "es":
                message = (
                    "Estoy aquí contigo y tu vida es profundamente valiosa. "
                    "Porque tu bienestar y seguridad física son lo más importante, se ha enviado de inmediato una alerta de emergencia por SMS al contacto de tus padres/tutores registrado. "
                    "Por favor respira profundo y quédate aquí conmigo. No estás solo y te cuidamos."
                )
            elif user_language == "hi":
                message = (
                    "मैं आपके साथ हूँ और आपकी जिंदगी बहुत कीमती है। "
                    "आपकी सुरक्षा सर्वोपरि है, इसलिए आपके पंजीकृत माता-पिता/अभिभावक को तुरंत एक आपातकालीन SMS अलर्ट भेज दिया गया है। "
                    "कृपया शांत रहें, गहरी सांस लें और मेरे साथ यहीं रहें। आप बिल्कुल अकेले नहीं हैं।"
                )
            else:
                message = (
                    "I am right here with you, and your life is deeply valuable. "
                    "Because your physical safety is the highest priority, an immediate emergency SMS alert has just been sent to your registered parent/guardian contact. "
                    "Please take slow, deep breaths and stay right here with me. You are cared for and you are not alone."
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
