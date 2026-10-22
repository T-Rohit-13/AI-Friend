"""
Speech Emotion Recognition Inference Service.
Loads VoiceEmotionCNN and fuses deep spectrogram embeddings with acoustic prosody (pitch & energy).
"""

import os
import torch
from typing import Dict, Any, Optional

from backend.app.ml.emotion_model import VoiceEmotionCNN, EMOTION_CLASSES
from backend.app.ml.preprocessing import (
    decode_wav_to_tensor,
    extract_spectrogram,
    extract_acoustic_tone_features,
)


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
                    print(f"Warning: Failed to load emotion model weights: {e}")
            cls._instance.model.eval()

        return cls._instance

    def reload_model(self, model_path: Optional[str] = None):
        """Reload weights from disk."""
        path = model_path or self.model_path
        if os.path.exists(path):
            self.model.load_state_dict(torch.load(path, map_location=self.device))
            self.model.eval()


    def predict_emotion_from_bytes(self, audio_bytes: bytes) -> Dict[str, Any]:
        """
        Runs acoustic feature extraction and emotion classification.
        Returns: {primary_emotion, confidence, distribution, acoustic_tone, pitch, rms}
        Handles uncertainty: returns 'uncertain' or 'neutral' when confidence is low or audio is silent.
        """
        # 1. Decode audio bytes to waveform
        waveform = decode_wav_to_tensor(audio_bytes)

        # 2. Extract acoustic tone features (pitch, energy, spectral brightness)
        tone_features = extract_acoustic_tone_features(waveform)
        rms = tone_features.get("rms_energy", 0.0)
        acoustic_tone = tone_features.get("acoustic_tone", "neutral")

        # Handle silence or near-zero amplitude audio honestly
        if acoustic_tone == "silence" or rms < 0.008:
            equal_prob = round(1.0 / len(EMOTION_CLASSES), 4)
            return {
                "primary_emotion": "neutral",
                "confidence": 0.25,
                "distribution": {c: equal_prob for c in EMOTION_CLASSES},
                "acoustic_tone": "silence",
                "pitch_mean": tone_features.get("pitch_mean", 150.0),
                "rms_energy": rms,
                "uncertain": True,
            }

        # 3. Extract spectrogram & CNN forward pass
        spec = extract_spectrogram(waveform)
        input_tensor = spec.unsqueeze(0).unsqueeze(0).to(self.device)

        with torch.no_grad():
            probs = self.model.predict_probabilities(input_tensor)[0]

        prob_list = probs.tolist()
        distribution = {EMOTION_CLASSES[i]: round(prob_list[i], 4) for i in range(len(EMOTION_CLASSES))}

        top_idx = int(torch.argmax(probs).item())
        cnn_emotion = EMOTION_CLASSES[top_idx]
        confidence = round(prob_list[top_idx], 4)

        # 4. Multimodal Acoustic Tone & CNN Fusion
        final_emotion = cnn_emotion

        # When CNN confidence is low (< 0.32), check if acoustic tone provides a genuine physiological cue
        if confidence < 0.32:
            if acoustic_tone in ("sad", "anxious", "angry", "happy", "tired"):
                # Use acoustic tone but keep honest, moderate confidence
                final_emotion = acoustic_tone
                confidence = max(confidence, 0.45)
            else:
                # If both CNN is uncertain and acoustic tone is neutral, return neutral or uncertain
                final_emotion = "uncertain"

        # If CNN and acoustic tone agree on sadness or happiness, report genuine consensus
        elif cnn_emotion == acoustic_tone:
            confidence = min(0.95, round(confidence + 0.10, 4))

        return {
            "primary_emotion": final_emotion,
            "confidence": confidence,
            "distribution": distribution,
            "acoustic_tone": acoustic_tone,
            "pitch_mean": tone_features.get("pitch_mean", 150.0),
            "rms_energy": rms,
        }



def get_emotion_service() -> VoiceEmotionService:
    return VoiceEmotionService()
