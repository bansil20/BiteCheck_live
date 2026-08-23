# feedback_ml.py
import os
import sys
import re
import joblib
import numpy as np
from collections import Counter
from typing import List

try:
    if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")
VECT_FILE = os.path.join(MODEL_DIR, "vectorizer.pkl")
MLB_FILE = os.path.join(MODEL_DIR, "mlb.pkl")
MODEL_FILE = os.path.join(MODEL_DIR, "model.pkl")


def contains_word(word, text):
    return re.search(rf"\b{re.escape(word)}\b", text) is not None


def models_exist():
    return os.path.exists(VECT_FILE) and os.path.exists(MLB_FILE) and os.path.exists(MODEL_FILE)


def load_models():
    """
    Load and return (vectorizer, mlb, model). Raises FileNotFoundError if not present.
    """
    if not models_exist():
        raise FileNotFoundError("ML model files not found in ml_models/. Run train_feedback_model.py first.")
    vect = joblib.load(VECT_FILE)
    mlb = joblib.load(MLB_FILE)
    model = joblib.load(MODEL_FILE)
    return vect, mlb, model


def auto_train_if_needed():
    """
    Only trains model if model files are missing.
    """
    from train_feedback_model import main as train_main

    vect_exists = os.path.exists(VECT_FILE)
    mlb_exists = os.path.exists(MLB_FILE)
    model_exists = os.path.exists(MODEL_FILE)

    if not (vect_exists and mlb_exists and model_exists):
        print("[INFO] Model missing — training now...")
        train_main()


def predict_labels_for_comments(comments: List[str], threshold: float = 0.25):
    """
    Predict multi-labels for each comment string.
    Returns:
      labels_per_comment: List[List[str]]
      probs_per_comment: List[dict] or None
    """
    auto_train_if_needed()

    vect, mlb, model = load_models()
    texts = [c if isinstance(c, str) else "" for c in comments]
    X = vect.transform(texts)

    probs = None
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(X)
        except Exception:
            probs = None

    if probs is None and hasattr(model, "decision_function"):
        decisions = model.decision_function(X)
        probs = 1 / (1 + np.exp(-decisions))

    if probs is None:
        pred = model.predict(X)
        labels_per_comment = []
        for row in pred:
            labels_per_comment.append([mlb.classes_[i] for i, v in enumerate(row) if v == 1])
        return labels_per_comment, None

    labels_per_comment = []
    prob_per_comment = []
    for row in probs:
        chosen = [mlb.classes_[i] for i, p in enumerate(row) if p >= threshold]
        labels_per_comment.append(chosen)
        prob_per_comment.append({mlb.classes_[i]: float(row[i]) for i in range(len(row))})
    return labels_per_comment, prob_per_comment


def aggregate_labels_from_labellists(labellists):
    """
    labellists: List[List[str]] -> aggregate into counts dict and sorted list.
    """
    ctr = Counter()
    for labs in labellists:
        for l in labs:
            ctr[l] += 1
    sorted_list = ctr.most_common()
    return dict(ctr), sorted_list


def combine_with_sentiment(issue_counts: dict, comments: list):
    """
    Combine ML issue detection + sentiment analysis.
    """
    positive_words = ["good", "nice", "excellent", "fantastic", "amazing", "tasty", "loved"]
    negative_words = ["bad", "cold", "oily", "stale", "worst", "not good", "tasteless"]

    pos = sum(
        any(contains_word(w, c.lower()) for w in positive_words)
        for c in comments
    )

    neg = sum(
        any(contains_word(w, c.lower()) for w in negative_words)
        for c in comments
    )

    if pos > neg:
        sentiment_summary = "Most students enjoyed the food overall."
    elif neg > pos:
        sentiment_summary = "Students reported several issues with this food."
    else:
        sentiment_summary = "The feedback is mixed."

    if not issue_counts:
        fallback_issues = {}

        for comment in comments:
            c = comment.lower()

            for issue, keywords in {
                "oily": ["oily", "greasy", "oil"],
                "cold": ["cold", "not hot"],
                "salty": ["salty", "too salty"],
                "spicy": ["spicy", "too spicy"],
                "stale": ["stale", "old"],
                "raw": ["raw", "uncooked"],
                "hard": ["hard", "tough"],
                "bland": ["bland", "tasteless"]
            }.items():

                if any(k in c for k in keywords):
                    fallback_issues[issue] = fallback_issues.get(issue, 0) + 1

        issue_counts = fallback_issues

        if not issue_counts:
            return sentiment_summary + " No specific issues were detected."

    issues = ", ".join(issue_counts.keys())

    ACTION_MAP = {
        "oily": "Reduce oil used in preparation and frying.",
        "cold": "Ensure items are served hot; review serving/holding process.",
        "salty": "Reduce salt level slightly.",
        "spicy": "Consider offering a milder spice level.",
        "stale": "Check ingredients’ freshness and storage.",
        "raw": "Review cooking time/temperature to ensure proper cooking.",
        "hard": "Adjust preparation to improve texture and softness.",
        "overcooked": "Reduce cooking time or lower heat to avoid overcooking.",
        "undercooked": "Increase cooking time/temperature to fully cook items.",
        "bland": "Adjust seasoning to improve taste.",
        "quality_low": "Audit ingredient quality and supplier/process.",
        "quantity_low": "Increase portion size to meet expectations."
    }

    actions = [ACTION_MAP.get(i, "") for i in issue_counts.keys()]
    actions = "; ".join([a for a in actions if a])

    final_text = (
        f"{sentiment_summary} "
        f"However, some students mentioned: {issues}. "
        f"Consider to {actions}."
    )

    return final_text
