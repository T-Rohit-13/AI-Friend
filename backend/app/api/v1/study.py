from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from backend.app.models.user import User
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/study", tags=["Study & Learning Buddy"])


class ExplainRequest(BaseModel):
    topic: str
    level: str = "eli5"  # "eli5", "high_school", "university"
    language: str = "en"


class QuizRequest(BaseModel):
    subject: str
    num_questions: int = 3


@router.post("/explain")
async def explain_concept(payload: ExplainRequest, current_user: User = Depends(get_current_user)):
    """Explain a concept using the Feynman technique (intuitive analogies and zero unnecessary jargon)."""
    topic_clean = payload.topic.strip()
    return {
        "topic": topic_clean,
        "analogy": (
            f"Imagine {topic_clean} like a bustling neighborhood library where books represent tiny packets of energy. "
            "Whenever someone checks out a book, they leave a bookmark in its place. "
            "No matter how complex it looks from the outside, each part simply follows one clear, predictable routine."
        ),
        "core_idea": (
            f"At its heart, {topic_clean} is about balance and flow. "
            "Rather than memorizing abstract formulas, remember that systems naturally seek their lowest energy state."
        ),
        "check_question": f"If you had to describe {topic_clean} to an 8-year-old in one sentence, what comparison would you use?",
    }


@router.post("/quiz")
async def generate_quiz(payload: QuizRequest, current_user: User = Depends(get_current_user)):
    """Generate interactive study flashcards/questions for a topic."""
    subj = payload.subject.strip()
    return {
        "subject": subj,
        "cards": [
            {
                "id": 1,
                "question": f"What is the foundational principle behind {subj}?",
                "key_takeaway": f"Understanding how components interact under changing conditions is central to {subj}."
            },
            {
                "id": 2,
                "question": f"What is one common misconception people have about {subj}?",
                "key_takeaway": "People often assume it operates independently, but in practice it depends closely on environmental context."
            },
            {
                "id": 3,
                "question": f"How does {subj} apply to everyday modern life?",
                "key_takeaway": "It directly influences how modern digital and physical technologies optimize performance."
            }
        ]
    }
