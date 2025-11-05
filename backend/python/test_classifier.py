#!/usr/bin/env python3
"""Quick test script for disaster classifier"""

import os
import sys
from disaster_classifier import DisasterClassifier

# Test complaints
test_complaints = [
    "Government hasn't provided any relief after the landslide",
    "Roads are blocked and no help has arrived",
    "No one has come to clean the flooded streets yet",
    "Feeling grateful today",
    "Train was late by two hours again"
]

print("Testing Disaster Classifier...")
print("=" * 60)

# Initialize classifier
classifier = DisasterClassifier()

# Get model directory
script_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(script_dir, 'models')

# Load models
print("Loading models...")
if classifier.load_models(model_dir):
    print("✓ Models loaded successfully\n")
else:
    print("✗ Failed to load models\n")
    sys.exit(1)

# Test each complaint
for i, complaint in enumerate(test_complaints, 1):
    print(f"{i}. Testing: \"{complaint}\"")
    
    try:
        prediction, confidence, details = classifier.predict(complaint)
        
        print(f"   Result: {prediction}")
        print(f"   Confidence: {confidence:.2%}")
        print(f"   RF: {details.get('rf_prediction', 'N/A')} ({details.get('rf_confidence', 0):.2%})")
        print(f"   SVM: {details.get('svm_prediction', 'N/A')} ({details.get('svm_confidence', 0):.2%})")
        
        if prediction == 'verified':
            print("   ✓ VERIFIED - Will be auto-approved")
        else:
            print("   ✗ NOT VERIFIED - Will go to manual verification")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    print()

print("=" * 60)
print("Test completed!")
