from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import random

from backend.app.models.user import User
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/games", tags=["Games & Entertainment"])

RIDDLES_DB = [
    {
        "id": "r1",
        "question": "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        "answer": "echo",
        "hints": ["It repeats what you say.", "You might hear it in a vast canyon or empty room."]
    },
    {
        "id": "r2",
        "question": "The more you take away from me, the larger I become. What am I?",
        "answer": "hole",
        "hints": ["Think about digging in the sand.", "You might find one in a sock or in the ground."]
    },
    {
        "id": "r3",
        "question": "What has keys, but no locks; space, but no room; you can enter, but not go outside?",
        "answer": "keyboard",
        "hints": ["You are likely touching or seeing one right now.", "It has letters and numbers."]
    },
    {
        "id": "r4",
        "question": "What can travel all around the world while remaining in the same corner?",
        "answer": "stamp",
        "hints": ["You affix it to a letter or postcard.", "It is small and paper-thin."]
    }
]

TRIVIA_DB = [
    {
        "id": "t1",
        "category": "Science & Nature",
        "question": "What gives the flamingos their distinctive vibrant pink color?",
        "options": ["Their genetic code", "Carotenoids in the algae and shrimp they eat", "Sunlight exposure", "Clay mud baths"],
        "correct_index": 1,
        "fun_fact": "Flamingo chicks are actually born with fluffy dull grey feathers!"
    },
    {
        "id": "t2",
        "category": "World & Geography",
        "question": "Which ocean trench contains the deepest known point on Earth, the Challenger Deep?",
        "options": ["Puerto Rico Trench", "Java Trench", "Mariana Trench", "Philippine Trench"],
        "correct_index": 2,
        "fun_fact": "At nearly 11,000 meters deep, the water pressure is over 1,000 times that of sea level!"
    }
]


class RiddleCheckRequest(BaseModel):
    riddle_id: str
    user_answer: str


class StoryStepRequest(BaseModel):
    story_id: Optional[str] = "story-1"
    user_choice: str


@router.get("/riddles/next")
async def get_next_riddle(current_user: User = Depends(get_current_user)):
    """Fetch a riddle."""
    riddle = random.choice(RIDDLES_DB)
    return {
        "id": riddle["id"],
        "question": riddle["question"],
        "hints": riddle["hints"],
    }


@router.post("/riddles/answer")
async def check_riddle_answer(payload: RiddleCheckRequest, current_user: User = Depends(get_current_user)):
    """Check user's answer to a riddle."""
    riddle = next((r for r in RIDDLES_DB if r["id"] == payload.riddle_id), None)
    if not riddle:
        return {"correct": False, "message": "Riddle not found."}

    user_clean = payload.user_answer.strip().lower()
    target_clean = riddle["answer"].lower()

    if target_clean in user_clean:
        return {
            "correct": True,
            "message": f"Spot on! 🎉 The answer is indeed '{riddle['answer']}'. Outstanding intuition!",
        }
    else:
        return {
            "correct": False,
            "message": f"Not quite, but that was a creative guess! Hint: {riddle['hints'][0]}",
        }


@router.get("/trivia")
async def get_trivia(current_user: User = Depends(get_current_user)):
    """Fetch a trivia question with options."""
    question = random.choice(TRIVIA_DB)
    return question


@router.post("/story/step")
async def next_story_step(payload: StoryStepRequest, current_user: User = Depends(get_current_user)):
    """Progress the collaborative storytelling adventure."""
    return {
        "story_id": payload.story_id,
        "narrative": (
            f"As you decide to '{payload.user_choice}', a hidden brass doorway swings open "
            "with a soft chiming melody. Bioluminescent lantern moss illuminates two stone archways ahead: "
            "one smells of ozone and distant thunder, while the other radiates the comforting aroma of baked cinnamon."
        ),
        "options": [
            "Investigate the archway crackling with ozone and distant thunder",
            "Follow the comforting scent of baked cinnamon and warm lantern light",
        ]
    }
