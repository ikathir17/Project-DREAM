#!/usr/bin/env python3
"""Debug script to test the complete complaint flow"""

import os
import sys
from disaster_classifier import DisasterClassifier
from spam_classifier import is_spam

# Test complaint
complaint_text = "Government hasn't provided any relief after the landslide"

print("=" * 70)
print("DEBUGGING COMPLAINT CLASSIFICATION FLOW")
print("=" * 70)
print(f"\nComplaint: \"{complaint_text}\"\n")

# Step 1: Spam Classification
print("STEP 1: Spam Classification")
print("-" * 70)
spam_result = "spam" if is_spam(complaint_text) else "not_spam"
print(f"Result: {spam_result}")

if spam_result == "spam":
    print("❌ STOPPED - Marked as spam, will go to 'Marked as Spam' tab")
    print("   No disaster classification will run")
    sys.exit(0)
else:
    print("✓ Not spam, continuing to disaster classification...\n")

# Step 2: Disaster Classification
print("STEP 2: Disaster Classification")
print("-" * 70)

# Initialize classifier
classifier = DisasterClassifier()

# Get model directory
script_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(script_dir, 'models')

# Load models
if not classifier.load_models(model_dir):
    print("❌ Failed to load models")
    sys.exit(1)

# Make prediction
try:
    prediction, confidence, details = classifier.predict(complaint_text)
    
    print(f"Result: {prediction}")
    print(f"Confidence: {confidence:.2%}")
    print(f"Random Forest: {details.get('rf_prediction', 'N/A')} ({details.get('rf_confidence', 0):.2%})")
    print(f"SVM: {details.get('svm_prediction', 'N/A')} ({details.get('svm_confidence', 0):.2%})")
    
    print("\n" + "=" * 70)
    print("FINAL RESULT")
    print("=" * 70)
    
    if prediction == 'verified':
        print("✓ VERIFIED by AI")
        print("  - verified: true")
        print("  - autoVerified: true")
        print("  - requiresManualVerification: false")
        print("  - isSpam: false")
        print("\n✓ Will appear in:")
        print("  - Normal complaints list")
        print("  - Nearby complaints")
        print("  - Dashboard analytics")
        print("\n✓ Will NOT appear in:")
        print("  - Manual verification tabs")
    else:
        print("❌ NOT VERIFIED by AI")
        print("  - verified: false")
        print("  - autoVerified: true")
        print("  - requiresManualVerification: true")
        print("  - isSpam: false")
        print("\n❌ Will appear in:")
        print("  - Manual verification - 'Rejected by AI' tab")
        print("\n❌ Will NOT appear in:")
        print("  - Normal complaints list")
        print("  - Nearby complaints")
        print("  - Dashboard analytics")
    
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 70)
