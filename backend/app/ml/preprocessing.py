"""
Acoustic feature and tone analysis preprocessing pipeline.
Extracts:
1. Log-Mel Spectrogram (frequency energy across time).
2. Fundamental frequency / Pitch (F0) contour for intonation analysis.
3. RMS Energy (speech volume and intensity).
4. Spectral Centroid (vocal brightness and tension).
"""

import io
import math
import struct
import wave
import torch
import torch.nn.functional as F
from typing import Dict, Any, Tuple


def decode_wav_to_tensor(audio_bytes: bytes) -> torch.Tensor:
    """
    Decodes audio bytes (PCM WAV or raw audio) into a 1D float32 tensor scaled to [-1.0, 1.0].
    Safely extracts samples using Python's wave module or raw PCM fallback.
    Returns silence (zeros) on empty or invalid input instead of synthetic tones.
    """
    if not audio_bytes or len(audio_bytes) < 44:
        return torch.zeros(16000, dtype=torch.float32)

    # 1. Attempt standard WAV decoding via wave.open
    try:
        with io.BytesIO(audio_bytes) as buf:
            with wave.open(buf, "rb") as wf:
                n_channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                framerate = wf.getframerate()
                n_frames = wf.getnframes()
                raw_bytes = wf.readframes(n_frames)

                if sampwidth == 2:  # 16-bit PCM
                    num_samples = len(raw_bytes) // 2
                    samples = struct.unpack(f"<{num_samples}h", raw_bytes[:num_samples * 2])
                    tensor = torch.tensor(samples, dtype=torch.float32) / 32768.0
                elif sampwidth == 1:  # 8-bit unsigned
                    samples = struct.unpack(f"<{len(raw_bytes)}B", raw_bytes)
                    tensor = (torch.tensor(samples, dtype=torch.float32) - 128.0) / 128.0
                elif sampwidth == 4:  # 32-bit int
                    num_samples = len(raw_bytes) // 4
                    samples = struct.unpack(f"<{num_samples}i", raw_bytes[:num_samples * 4])
                    tensor = torch.tensor(samples, dtype=torch.float32) / 2147483648.0
                else:
                    return torch.zeros(16000, dtype=torch.float32)

                # Downmix stereo to mono
                if n_channels > 1 and len(tensor) >= n_channels:
                    tensor = tensor.view(-1, n_channels).mean(dim=1)

                # Resample to 16,000 Hz if different
                if framerate != 16000 and framerate > 0 and len(tensor) > 10:
                    target_len = int(len(tensor) * (16000.0 / framerate))
                    tensor = F.interpolate(
                        tensor.view(1, 1, -1),
                        size=target_len,
                        mode="linear",
                        align_corners=False,
                    ).squeeze()

                if len(tensor) == 0:
                    return torch.zeros(16000, dtype=torch.float32)
                return tensor
    except Exception:
        pass

    # 2. Attempt RIFF data chunk direct parsing
    try:
        if audio_bytes.startswith(b"RIFF"):
            data_pos = audio_bytes.find(b"data")
            if data_pos != -1:
                raw_samples = audio_bytes[data_pos + 8:]
                num_samples = len(raw_samples) // 2
                if num_samples > 0:
                    samples = struct.unpack(f"<{num_samples}h", raw_samples[: num_samples * 2])
                    return torch.tensor(samples, dtype=torch.float32) / 32768.0
    except Exception:
        pass

    # 3. Fallback: return silence (zero tensor) — never invent frequencies!
    return torch.zeros(16000, dtype=torch.float32)



def extract_spectrogram(
    waveform: torch.Tensor,
    n_fft: int = 512,
    hop_length: int = 256,
    target_bins: int = 64,
    target_frames: int = 128,
) -> torch.Tensor:
    """
    Converts 1D waveform (N_samples,) into a normalized 2D Log-Mel Spectrogram (target_bins, target_frames).
    """
    if waveform.dim() == 1:
        waveform = waveform.unsqueeze(0)

    min_len = n_fft * 2
    if waveform.shape[-1] < min_len:
        waveform = F.pad(waveform, (0, min_len - waveform.shape[-1]))

    window = torch.hann_window(n_fft, device=waveform.device)

    stft = torch.stft(
        waveform,
        n_fft=n_fft,
        hop_length=hop_length,
        win_length=n_fft,
        window=window,
        return_complex=True,
    )
    spec = torch.abs(stft).squeeze(0)  # (Freq_Bins, Time_Frames)
    log_spec = torch.log1p(spec)

    # Interpolate to target tensor shape
    log_spec = log_spec.unsqueeze(0).unsqueeze(0)  # (1, 1, H, W)
    resized = F.interpolate(log_spec, size=(target_bins, target_frames), mode="bilinear", align_corners=False)
    features = resized.squeeze(0).squeeze(0)  # (target_bins, target_frames)

    # Normalize
    mean = features.mean()
    std = features.std() + 1e-6
    return (features - mean) / std


def extract_acoustic_tone_features(waveform: torch.Tensor, sample_rate: int = 16000) -> Dict[str, float]:
    """
    Extracts core prosodic and acoustic tone features:
    - RMS Energy (mean and std): loudness and energy.
    - Zero-Crossing Rate (ZCR): vocal roughness / unvoiced friction.
    - Fundamental Frequency (F0 / Pitch proxy): pitch height and jitter.
    - Spectral Brightness (spectral centroid).
    """
    if waveform.dim() > 1:
        waveform = waveform.squeeze()

    n_samples = len(waveform)
    if n_samples == 0:
        return {"pitch_mean": 150.0, "pitch_variance": 10.0, "rms_energy": 0.05, "spectral_centroid": 1200.0, "tone": "neutral"}

    # 1. RMS Energy
    rms = torch.sqrt(torch.mean(waveform ** 2) + 1e-8).item()

    # 2. Zero-crossing rate
    zcr = ((waveform[:-1] * waveform[1:]) < 0).float().mean().item()

    # 3. Simple Autocorrelation-based Pitch (F0) estimation
    # Human pitch range: 60Hz - 450Hz => lags: sample_rate/450 to sample_rate/60
    min_lag = int(sample_rate / 450)
    max_lag = int(sample_rate / 60)

    # Clip to max lag range for speed
    chunk = waveform[:min(n_samples, 4000)]
    pitch = 150.0
    if len(chunk) > max_lag * 2:
        r = torch.zeros(max_lag - min_lag)
        for lag in range(min_lag, max_lag):
            r[lag - min_lag] = torch.sum(chunk[:len(chunk) - lag] * chunk[lag:])
        best_lag = min_lag + int(torch.argmax(r).item())
        if best_lag > 0:
            pitch = sample_rate / best_lag

    # Clamp pitch to physiological bounds
    pitch = max(70.0, min(500.0, pitch))

    # 4. Spectral Centroid proxy
    spec = torch.abs(torch.fft.rfft(waveform[:min(n_samples, 2048)]))
    freqs = torch.linspace(0, sample_rate / 2, len(spec))
    spectral_centroid = (torch.sum(freqs * spec) / (torch.sum(spec) + 1e-8)).item()

    # Determine acoustic tone label
    # Silence / ambient noise:
    if rms < 0.008:
        tone = "silence"
    # High pitch + high energy = Excitement / Anger / Distress
    elif pitch > 240 and rms > 0.15:
        tone = "angry" if spectral_centroid > 2500 else "happy"
    elif pitch > 210 and rms > 0.07:
        tone = "anxious"
    elif pitch < 135 and rms < 0.08:
        tone = "sad"
    elif rms < 0.035:
        tone = "tired"
    elif pitch < 165 and rms < 0.09:
        tone = "calm"
    else:
        tone = "neutral"

    return {
        "pitch_mean": round(pitch, 1),
        "rms_energy": round(rms, 4),
        "zero_crossing_rate": round(zcr, 4),
        "spectral_centroid": round(spectral_centroid, 1),
        "acoustic_tone": tone,
    }
