#!/usr/bin/env python3
"""
API Test script for disaster classification
This script provides a simple way to test the disaster classifier via command line
"""

import sys
import json
from disaster_classifier import DisasterClassifier

def test_classification(text):
    """Test disaster classification for given text"""
    try:
        # Initialize classifier
        classifier = DisasterClassifier()
        
        # Try to load existing models
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(script_dir, 'models')
        
        if not classifier.load_models(model_dir):
            print("Training models (first time setup)...")
            classifier.train_models()
            classifier.save_models(model_dir)
        
        # Make prediction
        prediction, confidence, details = classifier.predict(text)
        
        # Return structured result
        result = {
            'text': text,
            'prediction': prediction,
            'confidence': round(confidence, 3),
            'is_disaster': prediction == 'verified',
            'models': {
                'random_forest': {
                    'prediction': details.get('rf_prediction', 'N/A'),
                    'confidence': round(details.get('rf_confidence', 0), 3)
                },
                'svm': {
                    'prediction': details.get('svm_prediction', 'N/A'),
                    'confidence': round(details.get('svm_confidence', 0), 3)
                }
            }
        }
        
        return result
        
    except Exception as e:
        return {
            'error': str(e),
            'text': text,
            'prediction': 'not_verified',
            'confidence': 0.0,
            'is_disaster': False
        }

def main():
    """Main function for API testing"""
    if len(sys.argv) < 2:
        print("Usage: python api_test.py <complaint_text> [format]")
        print("Format options: json, simple (default: simple)")
        sys.exit(1)
    
    text = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else 'simple'
    
    # Test classification
    result = test_classification(text)
    
    if output_format.lower() == 'json':
        # JSON output for API integration
        print(json.dumps(result, indent=2))
    else:
        # Simple output for human reading
        if 'error' in result:
            print(f"Error: {result['error']}")
            print(f"Default prediction: {result['prediction']}")
        else:
            print(f"Text: {result['text']}")
            print(f"Classification: {result['prediction']}")
            print(f"Is Disaster: {result['is_disaster']}")
            print(f"Confidence: {result['confidence']}")
            print(f"Random Forest: {result['models']['random_forest']['prediction']} ({result['models']['random_forest']['confidence']})")
            print(f"SVM: {result['models']['svm']['prediction']} ({result['models']['svm']['confidence']})")

if __name__ == "__main__":
    main()
