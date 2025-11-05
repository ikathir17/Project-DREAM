#!/usr/bin/env python3
"""
Simple script to verify trained models
"""

import os
from disaster_classifier import DisasterClassifier

def main():
    print("=== Model Verification ===\n")
    
    # Initialize classifier
    classifier = DisasterClassifier()
    
    # Get model directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(script_dir, 'models')
    
    # Load models
    print("Loading models...")
    if not classifier.load_models(model_dir):
        print("ERROR: Failed to load models!")
        return
    
    print("Models loaded successfully!\n")
    
    # Test cases
    test_cases = [
        ("Severe flooding in downtown area, need immediate evacuation", "verified"),
        ("Earthquake damaged our building, people trapped inside", "verified"),
        ("Wildfire approaching residential area, urgent evacuation needed", "verified"),
        ("Roads are blocked and no help has arrived after cyclone", "verified"),
        ("No food or water since the cyclone hit", "verified"),
        ("Street light not working on main road", "not_verified"),
        ("Pothole needs repair on elm street", "not_verified"),
        ("Noise complaint from neighbor's party", "not_verified"),
        ("The coffee machine is broken in the office", "not_verified"),
        ("Request for additional garbage pickup", "not_verified")
    ]
    
    print("Testing predictions...\n")
    correct = 0
    total = len(test_cases)
    
    for i, (text, expected) in enumerate(test_cases, 1):
        prediction, confidence, details = classifier.predict(text)
        is_correct = prediction == expected
        
        if is_correct:
            correct += 1
            status = "[OK]"
        else:
            status = "[FAIL]"
        
        print(f"{i}. {status} '{text[:50]}...'")
        print(f"   Expected: {expected}, Got: {prediction} (Confidence: {confidence:.3f})")
        if not is_correct:
            print(f"   RF: {details.get('rf_prediction')}, SVM: {details.get('svm_prediction')}")
        print()
    
    # Summary
    accuracy = (correct / total) * 100
    print("=" * 60)
    print(f"Results: {correct}/{total} correct ({accuracy:.1f}% accuracy)")
    
    if accuracy >= 80:
        print("Status: [PASS] Models are working well!")
    elif accuracy >= 60:
        print("Status: [WARNING] Models need improvement")
    else:
        print("Status: [FAIL] Models need retraining")
    
    print("\nModels are ready to use!")
    print("Integration: python disaster_classifier.py '<complaint_text>'")

if __name__ == "__main__":
    main()
