"""
Speech Emotion Recognition Inference Service.
Loads the trained VoiceEmotionCNN model and runs acoustic inference on audio bytes.
"""

import os
import torch
from typing import Dict, Any, Optional

from backend.app.ml.emotion_model import VoiceEmotionCNN, EMOTION_CLASSES
from backend.app.ml.preprocessing import decode_wav_to_tensor, extract_spectrogram


class VoiceEmotionService:
    """Singleton service for real-time acoustic emotion classification."""

    _instance = None

    def __new__(cls, model_path: str = "models/voice_emotion_cnn.pt"):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model_path = model_path
            cls._instance.device = torch.device("cpu")
            cls._instance.model = VoiceEmotionCNN(num_classes=len(EMOTION_CLASSES)).to(cls._instance.device)

            if os.path.exists(model_path):
                try:
                    cls._instance.model.load_state_dict(
                        torch.load(model_path, map_location=cls._instance.device)
                    )
                    cls._instance.model.eval()
                except Exception as e:
                    print(f"Warning: Failed to load emotion model weights from {model_path}: {e}")
            cls._instance.model.eval()

        return cls._instance

    def predict_emotion_from_bytes(self, audio_bytes: bytes) -> Dict[str, Any]:
        """
        Runs acoustic feature extraction and emotion classification.
        Returns: {primary_emotion, confidence, distribution}
        """
        # 1. Decode audio bytes to waveform
        waveform = decode_wav_to_tensor(audio_bytes)

        # 2. Extract spectrogram
        spec = extract_spectrogram(waveform)  # (Mel_Bins, Time_Frames)
        input_tensor = spec.unsqueeze(0).unsqueeze(0).to(self.device)  # (1, 1, H, W)

        # 3. Model forward pass
        with torch.no_grad():
            probs = self.model.predict_probabilities(input_tensor)[0]

        prob_list = probs.tolist()
        distribution = {EMOTION_CLASSES[i]: round(prob_list[i], 4) for i in range(len(EMOTION_CLASSES))}

        top_idx = int(torch.argmax(probs).item())
        primary_emotion = EMOTION_CLASSES[top_idx]
        confidence = round(prob_list[top_idx], 4)

        return {
            "primary_emotion": primary_emotion,
            "confidence": confidence,
            "distribution": distribution,
        }


def get_emotion_service() -> VoiceEmotionService:
    return VoiceEmotionService()
