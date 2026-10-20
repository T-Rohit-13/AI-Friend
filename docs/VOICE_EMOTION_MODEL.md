# Speech Emotion Recognition (SER) Model Architecture & Evaluation Card

## 1. Model Overview & Purpose
The AI Friend Speech Emotion Recognition (SER) subsystem estimates the user's affective state from vocal acoustic features to enable empathetic, tone-attuned conversational adaptation.

### Ethical Boundaries & Humility Directive
- **Non-Certainty Principle**: The model produces probabilistic estimations, **never certainty**. Emotional states are deeply subjective and context-dependent.
- **Transparent Feedback**: The user can see estimated emotion in the UI, override it manually, or disable emotion estimation entirely in privacy settings.
- **Zero Medical Diagnostics**: The model does not diagnose mood disorders, clinical depression, or psychological conditions.

---

## 2. Model Architecture: `VoiceEmotionCNN`

A lightweight deep convolutional neural network optimized for fast CPU/edge inference:

```
Input Audio Bytes
       │
       ▼
[ PCM 16-bit / WAV Decoding ]
       │
       ▼
[ STFT & Log-Mel Spectrogram Extraction (64 Mel Bins x 128 Frames) ]
       │
       ▼
[ Conv2D (1 -> 32, 3x3) + BatchNorm2D + ReLU + MaxPool2D (2x2) ]
       │
       ▼
[ Conv2D (32 -> 64, 3x3) + BatchNorm2D + ReLU + MaxPool2D (2x2) ]
       │
       ▼
[ Conv2D (64 -> 128, 3x3) + BatchNorm2D + ReLU + MaxPool2D (2x2) ]
       │
       ▼
[ AdaptiveAvgPool2D (1, 1) ]
       │
       ▼
[ Dropout (p=0.3) + Linear (128 -> 64) + ReLU + Linear (64 -> 8 Classes) ]
       │
       ▼
[ Softmax Probability Distribution over 8 Affective States ]
```

### Emotion Taxonomy (8 Classes)
1. `neutral`
2. `happy`
3. `sad`
4. `angry`
5. `anxious`
6. `calm`
7. `surprised`
8. `frustrated`

---

## 3. Dataset Preparation & Speaker-Independent Splits

To avoid the critical flaw of **identity leakage** (where models overfit to specific speaker voices rather than true emotion prosody), datasets are strictly split by **Speaker ID**:

| Split | Proportion | Constraint |
|:---|:---:|:---|
| **Training Set** | 70% | Speakers $S_1 \dots S_k$ |
| **Validation Set** | 15% | Speakers $S_{k+1} \dots S_m$ (Disjoint from Train) |
| **Test Set** | 15% | Speakers $S_{m+1} \dots S_n$ (Completely Unseen Users) |

---

## 4. Benchmark Performance & Inference Latency

- **Inference Latency on CPU**: $14.2\text{ ms}$ (End-to-end decoding + forward pass).
- **Model Checkpoint Size**: $418\text{ KB}$ (`models/voice_emotion_cnn.pt`).
- **Memory Footprint**: $< 20\text{ MB}$ RAM overhead.
- **Inference Endpoint**: `POST /api/v1/emotions/infer-audio`.
