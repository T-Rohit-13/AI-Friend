"""
Training script for VoiceEmotionCNN speech emotion classification.
Executes training loop with CrossEntropyLoss, AdamW optimizer, and validation tracking.
"""

import os
import argparse
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Dict, Any

from backend.app.ml.emotion_model import VoiceEmotionCNN, EMOTION_CLASSES
from backend.app.ml.dataset import create_synthetic_dataset, get_speaker_independent_splits


def train_model(
    epochs: int = 5,
    batch_size: int = 16,
    lr: float = 0.001,
    save_path: str = "models/voice_emotion_cnn.pt",
) -> Dict[str, Any]:
    """Train VoiceEmotionCNN on speaker-independent dataset splits."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    # Generate or load dataset
    samples = create_synthetic_dataset(num_speakers=16, samples_per_speaker=12)
    train_set, val_set, test_set = get_speaker_independent_splits(samples)

    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_set, batch_size=batch_size, shuffle=False)

    model = VoiceEmotionCNN(num_classes=len(EMOTION_CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)

    best_val_acc = 0.0

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()

        train_acc = correct / max(total, 1)

        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += targets.size(0)
                val_correct += predicted.eq(targets).sum().item()

        val_acc = val_correct / max(val_total, 1)
        print(f"Epoch [{epoch+1}/{epochs}] - Loss: {running_loss/max(total, 1):.4f} - Train Acc: {train_acc*100:.1f}% - Val Acc: {val_acc*100:.1f}%")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
            torch.save(model.state_dict(), save_path)

    # Test evaluation
    model.eval()
    test_correct = 0
    test_total = 0
    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            _, predicted = outputs.max(1)
            test_total += targets.size(0)
            test_correct += predicted.eq(targets).sum().item()

    test_acc = test_correct / max(test_total, 1)
    print(f"Test Set Accuracy (Unseen Speakers): {test_acc*100:.1f}%")

    return {
        "best_val_acc": best_val_acc,
        "test_acc": test_acc,
        "model_path": save_path,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--save-path", type=str, default="models/voice_emotion_cnn.pt")
    args = parser.parse_args()

    train_model(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr, save_path=args.save_path)
