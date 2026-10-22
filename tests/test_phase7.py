import uuid
import torch
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.core.database import init_db
from backend.app.ml.emotion_model import VoiceEmotionCNN, EMOTION_CLASSES
from backend.app.ml.preprocessing import decode_wav_to_tensor, extract_spectrogram
from backend.app.ml.dataset import create_synthetic_dataset, get_speaker_independent_splits
from backend.app.services.emotion_recognition import VoiceEmotionService, get_emotion_service


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()
    yield


def generate_dummy_wav(size: int = 1000) -> bytes:
    data_size = max(0, size - 44)
    header = (
        b"RIFF"
        + (data_size + 36).to_bytes(4, "little")
        + b"WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data"
        + data_size.to_bytes(4, "little")
    )
    data = b"\x00" * data_size
    return header + data


def test_audio_preprocessing_pipeline():
    wav_bytes = generate_dummy_wav(2000)
    waveform = decode_wav_to_tensor(wav_bytes)
    assert waveform.dim() == 1
    assert waveform.shape[0] > 0

    spec = extract_spectrogram(waveform, target_bins=64, target_frames=128)
    assert spec.shape == (64, 128)
    assert not torch.isnan(spec).any()


def test_voice_emotion_cnn_forward():
    model = VoiceEmotionCNN(num_classes=8)
    dummy_input = torch.randn(2, 1, 64, 128)

    logits = model(dummy_input)
    assert logits.shape == (2, 8)

    probs = model.predict_probabilities(dummy_input)
    assert probs.shape == (2, 8)
    assert torch.allclose(probs.sum(dim=-1), torch.ones(2), atol=1e-4)


def test_speaker_independent_splits():
    samples = create_synthetic_dataset(num_speakers=8, samples_per_speaker=6)
    train_set, val_set, test_set = get_speaker_independent_splits(samples)

    train_speakers = set(s[2] for s in train_set.samples)
    val_speakers = set(s[2] for s in val_set.samples)
    test_speakers = set(s[2] for s in test_set.samples)

    # Disjoint speaker verification
    assert len(train_speakers.intersection(val_speakers)) == 0
    assert len(train_speakers.intersection(test_speakers)) == 0


def test_voice_emotion_service_inference():
    service = get_emotion_service()
    wav_bytes = generate_dummy_wav(1500)

    result = service.predict_emotion_from_bytes(wav_bytes)
    assert result["primary_emotion"] in EMOTION_CLASSES
    assert 0.0 <= result["confidence"] <= 1.0
    assert len(result["distribution"]) == len(EMOTION_CLASSES)


@pytest.mark.asyncio
async def test_infer_audio_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"emo_user_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Emotion User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        wav_bytes = generate_dummy_wav(2000)
        files = {"audio": ("sample.wav", wav_bytes, "audio/wav")}

        res = await ac.post("/api/v1/emotions/infer-audio", files=files, headers=headers)
        assert res.status_code == 200
        payload = res.json()
        assert "primary_emotion" in payload
        assert "confidence" in payload
        assert "distribution" in payload
        assert payload["primary_emotion"] in EMOTION_CLASSES
