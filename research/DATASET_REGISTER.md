# AI Friend — Emotion Dataset Register & ML Data Governance

> Phase 1 Deliverable — Evaluation of Open-Access Speech Emotion Recognition (SER) Datasets

---

## 1. Overview & Objective

To enable the companion's acoustic emotion recognition capability (Phase 7), we evaluate and register three publicly accessible speech emotion datasets. The goal of this register is to document licensing compliance, acoustic characteristics, demographic distribution, splits, and known biases before training or fine-tuning any acoustic emotion model.

Target emotion taxonomy for AI Friend:
- **Primary 6:** `Neutral`, `Happy / Joyful`, `Sad`, `Angry / Frustrated`, `Fearful / Anxious`, `Surprised`
- **Secondary (Derived):** `Calm / Content`, `Excited`

---

## 2. Dataset Comparative Register

| Attribute | Dataset 1: RAVDESS | Dataset 2: CREMA-D | Dataset 3: TESS (Toronto) |
| :--- | :--- | :--- | :--- |
| **Full Name** | Ryerson Audio-Visual Database of Emotional Speech and Song | Crowd-sourced Emotional Multimodal Actors Dataset | Toronto Emotional Speech Set |
| **Creators / Institution** | Livingstone & Russo (Ryerson University, Canada) | Cao et al. (Binghamton University & NIST, USA) | Dupuis & Pichora-Fuller (University of Toronto) |
| **Primary License** | **Creative Commons Attribution 4.0 International (CC BY 4.0)** | **Open Database License (ODbL) / Open Data Commons Public Domain Dedication (CC0 / Academic)** | **Creative Commons Attribution 4.0 International (CC BY 4.0)** |
| **Commercial Usage Permitted?** | ✅ Yes (with attribution) | ✅ Yes (ODbL open data terms) | ✅ Yes (with attribution) |
| **Total Audio Samples** | 1,440 speech files (2,880 total with song) | 7,442 original audio clips | 2,800 audio files |
| **Speakers (Actors)** | 24 professional actors (12 Male, 12 Female) | 91 diverse actors (48 Male, 43 Female) | 2 female actors (Younger: 26yo, Older: 64yo) |
| **Demographics & Accents** | North American English (Ontario/Canada) | Multi-ethnic: African American (16%), Asian (11%), Caucasian (60%), Hispanic (13%) | North American English (Canadian) |
| **Emotions Covered** | Neutral, Calm, Happy, Sad, Angry, Fearful, Disgust, Surprised | Neutral, Happy, Sad, Angry, Fearful, Disgust | Neutral, Happy, Sad, Angry, Fearful, Disgust, Pleasant Surprise |
| **Intensity Levels** | Normal & Strong (for all except Neutral) | Low, Medium, High, Unspecified (crowd rated) | Standardized sentence stimuli |
| **Audio Format & Quality** | 16-bit uncompressed WAV, 48 kHz, stereo (downsampled to 16 kHz mono) | 16-bit WAV, 16 kHz, single channel mono | 16-bit WAV, 24.414 kHz mono |
| **Crowd-Validation Score** | Two-interval forced-choice perceptual validation (N=247 raters) | 2,443 crowd-sourced human raters (mean accuracy: 63.6%) | Standardized Northwestern University Auditory Test No. 6 stimulus set |

---

## 3. Dataset Deep Dives

### 3.1 RAVDESS (Ryerson Audio-Visual Database of Emotional Speech and Song)
* **Citation:** Livingstone SR, Russo FA (2018) *The Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS): A dynamic, multimodal set of facial and vocal expressions of emotion*. PLoS ONE 13(5): e0196391.
* **Access Link:** [Zenodo Record 1188976](https://zenodo.org/record/1188976)
* **File Naming Specification:**
  `03-01-XX-YY-ZZ-AA-BB.wav` where:
  - `03` = Audio-only
  - `01` = Speech
  - `XX` = Emotion (01=Neutral, 02=Calm, 03=Happy, 04=Sad, 05=Angry, 06=Fearful, 07=Disgust, 08=Surprised)
  - `YY` = Emotional intensity (01=Normal, 02=Strong)
  - `ZZ` = Statement (01="Kids are talking by the door", 02="Dogs are sitting by the door")
  - `AA` = Repetition (01=1st, 02=2nd)
  - `BB` = Actor ID (01 to 24, odd=Male, even=Female)
* **Strengths:** Pristine studio acoustics, zero background noise, perfectly balanced gender and emotion distribution, standardized utterances.
* **Limitations:** Acted emotions can display exaggerated acoustic dynamics compared to spontaneous natural conversational speech.

### 3.2 CREMA-D (Crowd-sourced Emotional Multimodal Actors Dataset)
* **Citation:** Cao H, Cooper DG, Keutmann MK, Gur RC, Nenkova A, Verma R (2014) *CREMA-D: Crowd-sourced Emotional Multimodal Actors Dataset*. IEEE Transactions on Affective Computing, 5(4): 377-390.
* **Access Link:** [GitHub CREMA-D / Zenodo](https://github.com/CheyneyComputerScience/CREMA-D)
* **File Naming Specification:**
  `[ActorID]_[Sentence]_[Emotion]_[Intensity].wav`
  (e.g., `1001_DFA_ANG_HI.wav`)
* **Strengths:** Outstanding ethnic, racial, and age diversity across 91 actors. Multiple intensity levels validate real-world subtle emotion vs intense distress.
* **Limitations:** Variable recording levels requiring root-mean-square (RMS) volume normalization; some crowd-label ambiguity between fear and sadness.

### 3.3 TESS (Toronto Emotional Speech Set)
* **Citation:** Dupuis, K., & Pichora-Fuller, M. K. (2010). *Toronto emotional speech set (TESS)*. University of Toronto, Psychology Department.
* **Access Link:** [University of Toronto Dataverse](https://dataverse.scholarsportal.info/dataset.xhtml?persistentId=doi:10.5683/SP2/E8H2MF)
* **File Naming Specification:**
  `[Speaker]_[Word]_[Emotion].wav` (e.g., `OAF_back_angry.wav`, `YAF_back_happy.wav`)
* **Strengths:** Excellent acoustic clarity for age-stratified vocal feature analysis (Young vs Senior adult female voices).
* **Limitations:** Exclusively female voices; isolated carrier phrase ("Say the word [X]"). Must be paired with RAVDESS and CREMA-D to prevent male/female classification imbalance.

---

## 4. Train / Validation / Test Splitting Strategy

To ensure zero data leakage across model evaluations:
1. **Speaker-Disjoint Split (Strict Requirement):**
   No speaker shall ever appear in both training and test sets.
2. **Split Proportions:**
   - **Training Set (70%):** ~8,170 clips across diverse speakers
   - **Validation Set (15%):** ~1,750 clips for early stopping and hyperparameter tuning
   - **Test Set (15%):** ~1,750 clips for uncorrupted final benchmarking
3. **Stratification:**
   Split must be stratified by emotion label, gender, and source dataset.

---

## 5. Audio Preprocessing & Feature Extraction Specification

For runtime inference and training, all raw audio feeds into a deterministic feature extraction pipeline:
- **Sampling Rate:** Resampled to 16,000 Hz, Mono, 16-bit PCM.
- **Silence Trimming:** Voice Activity Detection (energy threshold > -40 dBFS) strips pre/post dead air.
- **Acoustic Feature Vector (88-dimensional standard eGeMAPS or custom 64-dim vector):**
  - **MFCCs (Mel-Frequency Cepstral Coefficients):** 13 coefficients + 1st derivatives (Delta) + 2nd derivatives (Delta-Delta) = 39 dims
  - **Fundamental Frequency (Pitch / F0):** Mean, standard deviation, min, max, range, jitter = 6 dims
  - **Energy / Intensity:** RMS energy, mean, variance, shimmer = 5 dims
  - **Spectral Descriptors:** Spectral centroid, spectral bandwidth, spectral rolloff, spectral contrast (7 bands), zero-crossing rate = 14 dims
- **Output Dimension:** Fixed-length vector or variable-length spectrogram fed into a 1D-CNN / LSTM or pre-trained Wav2Vec2/Hubert backbone with ONNX runtime export.

---

## 6. Ethical Data Governance & Bias Mitigation

1. **Non-Clinical Guarantee:** The dataset register and derived models are exclusively intended for conversational empathy adjustment (e.g. softer speaking rate when user sounds tired), NEVER for psychiatric or clinical diagnosis.
2. **Accent & Demographic Bias Acknowledgment:** Current open-access emotion corpora skew toward North American and European accents. Models must output a confidence score; any inference with confidence < 0.55 reverts to neutral conversational baseline with zero emotional assumption.
3. **Data Retention & Privacy:** At runtime, user audio buffers are processed in volatile RAM and immediately discarded. Raw user voice files are NEVER stored on disk or used for retraining without explicit cryptographic consent.
