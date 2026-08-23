# train_feedback_model.py
"""
Train a global multi-label model from your feedback DB (MongoDB).
Saves vectorizer.pkl, mlb.pkl, model.pkl in ml_models/.
Run: python train_feedback_model.py
"""

import os
import re
from collections import defaultdict
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer

from db_mongo import feedbacks_col

# ---- Config ----
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")
VECT_FILE = os.path.join(MODEL_DIR, "vectorizer.pkl")
MLB_FILE = os.path.join(MODEL_DIR, "mlb.pkl")
MODEL_FILE = os.path.join(MODEL_DIR, "model.pkl")

# These are the labels (issues) your model will predict
ALL_LABELS = [
    "oily", "cold", "salty", "spicy", "stale", "raw",
    "hard", "overcooked", "undercooked", "bland", "quality_low", "quantity_low"
]

KEYWORD_MAP = {
    "oily": ["oily", "greasy", "too oily", "oil"],
    "cold": ["cold", "lukewarm", "not hot", "served cold"],
    "salty": ["salty", "too salty"],
    "spicy": ["spicy", "too spicy", "hot spice"],
    "stale": ["stale", "old", "staleness"],
    "raw": ["raw", "uncooked", "half cooked", "half-cooked"],
    "hard": ["hard", "tough", "chewy"],
    "overcooked": ["burnt", "overcooked"],
    "undercooked": ["undercooked", "half cooked", "undercooked"],
    "bland": ["bland", "tasteless"],
    "quality_low": ["quality", "poor quality", "low quality", "quality down", "bad quality"],
    "quantity_low": ["small", "insufficient", "less quantity", "portion small", "tiny portion"]
}

# whole-word exact matching
KEYWORD_REGEX = {
    label: re.compile(
        r"\b(" + "|".join(re.escape(k) for k in kws) + r")\b",
        flags=re.I
    )
    for label, kws in KEYWORD_MAP.items()
}


def ensure_model_dir():
    os.makedirs(MODEL_DIR, exist_ok=True)


def normalize_text(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def bootstrap_labels_from_text(text: str):
    labels = []
    for label, patt in KEYWORD_REGEX.items():
        if patt.search(text):
            labels.append(label)
    return labels


def fetch_feedback_from_db():
    """
    Pull feedback comments directly from MongoDB feedbacks collection.
    """
    texts = []
    labels = []

    fbs = list(feedbacks_col.find().sort("created_at", 1))
    for fb in fbs:
        txt = (fb.get("comment") or "").strip()
        if not txt:
            continue
        txtn = normalize_text(txt)
        texts.append(txtn)
        lbs = bootstrap_labels_from_text(txtn)
        labels.append(lbs)
    return texts, labels


def train_and_save(texts, label_lists):
    ensure_model_dir()
    if len(texts) == 0:
        raise ValueError("No feedback texts found in DB. Add some feedback before training.")

    # TF-IDF
    vectorizer = TfidfVectorizer(ngram_range=(1,2), min_df=1)
    X = vectorizer.fit_transform(texts)

    # MultiLabelBinarizer (force fixed class order)
    mlb = MultiLabelBinarizer(classes=ALL_LABELS)
    Y = mlb.fit_transform(label_lists)

    # Model: One-vs-Rest Logistic Regression
    clf = OneVsRestClassifier(LogisticRegression(max_iter=2000))
    clf.fit(X, Y)

    # Save
    joblib.dump(vectorizer, VECT_FILE)
    joblib.dump(mlb, MLB_FILE)
    joblib.dump(clf, MODEL_FILE)

    return {
        "vectorizer": VECT_FILE,
        "mlb": MLB_FILE,
        "model": MODEL_FILE,
        "n_samples": X.shape[0],
        "n_labels": Y.shape[1]
    }


def main():
    print("Fetching feedback from MongoDB...")
    texts, labels = fetch_feedback_from_db()
    print(f"Found {len(texts)} feedback rows.")
    if len(texts) < 5:
        print("Warning: small dataset may give noisy predictions. Bootstrapped labels will help.")
    if len(texts) == 0:
        print("No feedback found to train.")
        return
    print("Training model... (this may take a few seconds)")
    info = train_and_save(texts, labels)
    print("Training completed. Saved files:")
    print(info)


if __name__ == "__main__":
    main()
