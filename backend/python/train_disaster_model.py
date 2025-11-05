#!/usr/bin/env python3
"""
Training script for disaster classification models
This script trains both Random Forest and SVM models and saves them for future use
"""

import os
import sys
from disaster_classifier import DisasterClassifier

def main():
    print("=== Disaster Classification Model Training ===")
    print("Training with your dataset using 95% train / 5% test split")
    print("Using Random Forest and SVM algorithms")
    
    # Initialize classifier
    classifier = DisasterClassifier()
    
    # Get current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(script_dir, 'models')
    csv_path = os.path.join(script_dir, 'disaster_complaints_dataset.csv')
    
    try:
        # Train models with the provided dataset
        print(f"\nLoading dataset from: {csv_path}")
        print("Starting training process...")
        X_test, y_test = classifier.train_models(csv_path)
        
        # Save models
        print("\nSaving models...")
        classifier.save_models(model_dir)
        
        print("\n=== Training Summary ===")
        print("* Random Forest model trained and saved")
        print("* SVM model trained and saved")
        print("* TF-IDF vectorizer trained and saved")
        print(f"* Models saved to: {model_dir}")
        
        # Test with sample predictions
        print("\n=== Sample Predictions ===")
        
        test_cases = [
            "Severe flooding in downtown area, need immediate evacuation assistance",
            "Street light not working on main road",
            "Earthquake damaged our building, people trapped inside",
            "Noise complaint from neighbor's party",
            "Wildfire approaching residential area, urgent evacuation needed"
        ]
        
        for i, text in enumerate(test_cases, 1):
            prediction, confidence, details = classifier.predict(text)
            print(f"{i}. Text: '{text[:50]}...'")
            print(f"   Prediction: {prediction} (Confidence: {confidence:.3f})")
            print(f"   RF: {details.get('rf_prediction', 'N/A')}, SVM: {details.get('svm_prediction', 'N/A')}")
            print()
        
        print("Training completed successfully!")
        print("\nTo use the classifier:")
        print("python disaster_classifier.py 'your complaint text here'")
        
    except Exception as e:
        print(f"Error during training: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
