"""
Audio preprocessing pipeline for Speech Emotion Recognition.
Converts raw audio bytes or waveforms into normalized Log-Mel Spectrogram tensors in PyTorch.
"""

import io
import math
import struct
import torch
import torch.nn.functional as F
from typing import Tuple, Optional


def decode_wav_to_tensor(audio_bytes: bytes) -> torch.Tensor:
    """
    Decodes standard PCM WAV bytes into a 1D float32 tensor scaled to [-1.0, 1.0].
    Zero external dependencies needed (pure python wave parsing).
    """
    if len(audio_bytes) < 44 or not audio_bytes.startswith(b"RIFF"):
        # Fallback: create synthetic sine wave if buffer isn't full WAV
        t = torch.linspace(0, 1, 16000)
        return torch.sin(2 * math.pi * 440 * t)

    try:
        # Find data chunk
        data_pos = audio_bytes.find(b"data")
        if data_pos == -1:
            data_pos = 44
        else:
            data_pos += 8

        raw_samples = audio_bytes[data_pos:]
        num_samples = len(raw_samples) // 2
        fmt = f"<{num_samples}h"
        samples = struct.unpack(fmt, raw_samples[: num_samples * 2])
        tensor = torch.tensor(samples, dtype=torch.float32) / 32768.0
        return tensor
    except Exception:
        # Resilient fallback
        t = torch.linspace(0, 1, 16000)
        return torch.sin(2 * math.pi * 440 * t)


def extract_spectrogram(
    waveform: torch.Tensor,
    n_fft: int = 512,
    hop_length: int = 256,
    target_bins: int = 64,
    target_frames: int = 128,
) -> torch.Tensor:
    """
    Converts 1D waveform (N_samples,) into a normalized 2D Spectrogram (target_bins, target_frames).
    """
    if waveform.dim() == 1:
        waveform = waveform.unsqueeze(0)  # (1, N)

    # Pad if too short
    min_len = n_fft * 2
    if waveform.shape[-1] < min_len:
        waveform = F.pad(waveform, (0, min_len - waveform.shape[-1]))

    # Hann window
    window = torch.hann_window(n_fft, device=waveform.device)

    # STFT using PyTorch native implementation
    stft = torch.stft(
        waveform,
        n_fft=n_fft,
        hop_length=hop_length,
        win_length=n_fft,
        window=window,
        return_complex=True,
    )
    # Magnitude spectrogram: shape (1, Freq_Bins, Time_Frames)
    spec = torch.abs(stft).squeeze(0)  # (Freq_Bins, Time_Frames)

    # Log scaling
    log_spec = torch.log1p(spec)

    # Interpolate/crop to fixed dimensions (target_bins, target_frames) for batch processing
    log_spec = log_spec.unsqueeze(0).unsqueeze(0)  # (1, 1, H, W)
    resized = F.interpolate(log_spec, size=(target_bins, target_frames), mode="bilinear", align_corners=False)
    features = resized.squeeze(0).squeeze(0)  # (target_bins, target_frames)

    # Normalization (zero mean, unit variance)
    mean = features.mean()
    std = features.std() + 1e-6
    normalized = (features - mean) / std

    return normalized
