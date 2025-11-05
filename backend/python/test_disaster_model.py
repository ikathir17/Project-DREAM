#!/usr/bin/env python3
"""
Test script for disaster classification models
This script tests the trained models with various complaint examples
"""

import os
import sys
from disaster_classifier import DisasterClassifier

def main():
    print("=== Disaster Classification Model Testing ===")
    print("Testing models trained on your dataset with 95%/5% split")
    
    # Initialize classifier
    classifier = DisasterClassifier()
    
    # Get current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(script_dir, 'models')
    
    # Load models
    if not classifier.load_models(model_dir):
        print("No trained models found. Please run train_disaster_model.py first.")
        sys.exit(1)
    
    # Test cases with expected results
    test_cases = [
        # Disaster-related (should be 'verified')
        {
            'text': "Severe flooding in downtown area, need immediate evacuation assistance",
            'expected': 'verified',
            'category': 'Flood Emergency'
        },
        {
            'text': "Earthquake damaged our building, people trapped inside, send help",
            'expected': 'verified',
            'category': 'Earthquake Emergency'
        },
        {
            'text': "Wildfire approaching residential area, urgent evacuation needed",
            'expected': 'verified',
            'category': 'Fire Emergency'
        },
        {
            'text': "Bridge collapsed due to heavy rain, road completely blocked",
            'expected': 'verified',
            'category': 'Infrastructure Disaster'
        },
        {
            'text': "Power lines down after storm, dangerous electrical hazard",
            'expected': 'verified',
            'category': 'Storm Damage'
        },
        {
            'text': "Gas leak in apartment building, residents need evacuation",
            'expected': 'verified',
            'category': 'Hazmat Emergency'
        },
        {
            'text': "Emergency medical assistance needed after accident",
            'expected': 'verified',
            'category': 'Medical Emergency'
        },
        
        # Non-disaster (should be 'not_verified')
        {
            'text': "Street light not working on main road",
            'expected': 'not_verified',
            'category': 'Maintenance Issue'
        },
        {
            'text': "Pothole needs repair on elm street",
            'expected': 'not_verified',
            'category': 'Road Maintenance'
        },
        {
            'text': "Noise complaint from neighbor's party",
            'expected': 'not_verified',
            'category': 'Noise Complaint'
        },
        {
            'text': "Parking violation in residential area",
            'expected': 'not_verified',
            'category': 'Traffic Violation'
        },
        {
            'text': "Graffiti on public building wall",
            'expected': 'not_verified',
            'category': 'Vandalism'
        },
        {
            'text': "Public restroom needs cleaning",
            'expected': 'not_verified',
            'category': 'Sanitation'
        },
        {
            'text': "Request for additional garbage pickup",
            'expected': 'not_verified',
            'category': 'Service Request'
        }
    ]
    
    print(f"\nTesting {len(test_cases)} cases...\n")
    
    correct_predictions = 0
    total_predictions = len(test_cases)
    
    # Test each case
    for i, case in enumerate(test_cases, 1):
        try:
            prediction, confidence, details = classifier.predict(case['text'])
            
            is_correct = prediction == case['expected']
            if is_correct:
                correct_predictions += 1
                status = "[CORRECT]"
            else:
                status = "[INCORRECT]"
            
            print(f"Test {i}: {case['category']}")
            print(f"Text: '{case['text'][:60]}...'")
            print(f"Expected: {case['expected']}")
            print(f"Predicted: {prediction} (Confidence: {confidence:.3f}) {status}")
            print(f"RF: {details.get('rf_prediction', 'N/A')} ({details.get('rf_confidence', 0):.3f}), "
                  f"SVM: {details.get('svm_prediction', 'N/A')} ({details.get('svm_confidence', 0):.3f})")
            print("-" * 80)
            
        except Exception as e:
            print(f"Error testing case {i}: {e}")
            print("-" * 80)
    
    # Calculate accuracy
    accuracy = (correct_predictions / total_predictions) * 100
    
    print(f"\n=== Test Results ===")
    print(f"Total Tests: {total_predictions}")
    print(f"Correct Predictions: {correct_predictions}")
    print(f"Accuracy: {accuracy:.1f}%")
    
    if accuracy >= 80:
        print("[OK] Model performance is GOOD")
    elif accuracy >= 60:
        print("[WARNING] Model performance is FAIR - consider retraining")
    else:
        print("[ERROR] Model performance is POOR - retraining recommended")
    
    # Interactive testing
    print("\n=== Interactive Testing ===")
    print("Enter complaint text to test (or 'quit' to exit):")
    
    while True:
        try:
            user_input = input("\nComplaint: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                break
            
            if not user_input:
                continue
            
            prediction, confidence, details = classifier.predict(user_input)
            
            print(f"Prediction: {prediction}")
            print(f"Confidence: {confidence:.3f}")
            print(f"Random Forest: {details.get('rf_prediction', 'N/A')} ({details.get('rf_confidence', 0):.3f})")
            print(f"SVM: {details.get('svm_prediction', 'N/A')} ({details.get('svm_confidence', 0):.3f})")
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")
    
    print("\nTesting completed!")

if __name__ == "__main__":
    main()
