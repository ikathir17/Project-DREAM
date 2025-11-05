#!/usr/bin/env python3
"""
Disaster Classification Model
Classifies complaints as disaster-related or not using Random Forest and SVM algorithms
Returns: 'verified' for disaster-related, 'not_verified' for non-disaster-related
"""

import sys
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.pipeline import Pipeline
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
import warnings
warnings.filterwarnings('ignore')

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class DisasterClassifier:
    def __init__(self):
        self.rf_model = None
        self.svm_model = None
        self.vectorizer = None
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
        
        # Disaster-related keywords
        self.disaster_keywords = [
            'flood', 'flooding', 'flooded', 'water', 'rain', 'storm', 'hurricane',
            'earthquake', 'fire', 'wildfire', 'tornado', 'cyclone', 'tsunami',
            'landslide', 'avalanche', 'drought', 'famine', 'emergency', 'disaster',
            'evacuation', 'rescue', 'help', 'urgent', 'trapped', 'stuck', 'injured',
            'damage', 'destroyed', 'collapsed', 'broken', 'power outage', 'blackout',
            'road blocked', 'bridge down', 'tree fallen', 'debris', 'shelter',
            'medical emergency', 'hospital', 'ambulance', 'police', 'firefighter',
            'dangerous', 'hazard', 'toxic', 'gas leak', 'explosion', 'accident',
            'missing person', 'lost', 'stranded', 'isolated', 'cut off',
            'infrastructure', 'utility', 'communication down', 'network down'
        ]
        
    def preprocess_text(self, text):
        """Preprocess text for classification"""
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and stem
        tokens = [self.stemmer.stem(token) for token in tokens 
                 if token not in self.stop_words and len(token) > 2]
        
        return ' '.join(tokens)
    
    def extract_features(self, text):
        """Extract additional features from text"""
        features = {}
        
        # Disaster keyword count
        disaster_count = sum(1 for keyword in self.disaster_keywords 
                           if keyword.lower() in text.lower())
        features['disaster_keyword_count'] = disaster_count
        
        # Text length
        features['text_length'] = len(text)
        features['word_count'] = len(text.split())
        
        # Urgency indicators
        urgency_words = ['urgent', 'emergency', 'help', 'asap', 'immediate', 'now']
        features['urgency_count'] = sum(1 for word in urgency_words 
                                      if word in text.lower())
        
        # Exclamation marks (urgency indicator)
        features['exclamation_count'] = text.count('!')
        
        return features
    
    def load_dataset(self, csv_path=None):
        """Load dataset from CSV file"""
        if csv_path is None:
            # Default to the provided dataset
            script_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(script_dir, 'disaster_complaints_dataset.csv')
        
        try:
            # Load the CSV dataset
            df = pd.read_csv(csv_path)
            
            # Convert numeric labels to string labels
            # 1 = disaster (verified), 0 = non-disaster (not_verified)
            df['label'] = df['label'].map({1: 'verified', 0: 'not_verified'})
            
            print(f"Loaded dataset with {len(df)} samples")
            print(f"Disaster samples (verified): {sum(df['label'] == 'verified')}")
            print(f"Non-disaster samples (not_verified): {sum(df['label'] == 'not_verified')}")
            
            return df
            
        except FileNotFoundError:
            print(f"Dataset file not found at {csv_path}")
            print("Creating sample data instead...")
            return self.create_sample_data()
        except Exception as e:
            print(f"Error loading dataset: {e}")
            print("Creating sample data instead...")
            return self.create_sample_data()
    
    def create_sample_data(self):
        """Create sample training data for disaster classification (fallback)"""
        disaster_samples = [
            "Severe flooding in downtown area, need immediate evacuation assistance",
            "Earthquake damaged our building, people trapped inside, send help",
            "Wildfire approaching residential area, urgent evacuation needed",
            "Bridge collapsed due to heavy rain, road completely blocked",
            "Power lines down after storm, dangerous electrical hazard",
            "Landslide blocked highway, multiple vehicles stuck",
            "Gas leak in apartment building, residents need evacuation",
            "Tornado warning issued, seeking shelter information",
            "Flash flood warning, water rising rapidly in our area",
            "Building collapse after earthquake, people missing",
            "Hurricane damage assessment needed, infrastructure destroyed",
            "Emergency medical assistance needed after accident",
            "Fire spreading rapidly, firefighters required immediately",
            "Tsunami alert, coastal evacuation required",
            "Avalanche risk high, mountain roads closed",
            "Drought conditions severe, water shortage critical",
            "Chemical spill on highway, hazmat team needed",
            "Sinkhole opened on main street, traffic diverted",
            "Hailstorm damage to vehicles and property",
            "Mudslide after heavy rainfall, homes at risk"
        ]
        
        non_disaster_samples = [
            "Street light not working on main road",
            "Pothole needs repair on elm street",
            "Noise complaint from neighbor's party",
            "Parking violation in residential area",
            "Graffiti on public building wall",
            "Broken bench in city park",
            "Dog barking continuously at night",
            "Litter problem in downtown area",
            "Traffic light timing needs adjustment",
            "Public restroom needs cleaning",
            "Sidewalk crack needs minor repair",
            "Bus stop sign is missing",
            "Park maintenance required for grass cutting",
            "Street sweeping schedule inquiry",
            "Permit application for event",
            "General information about city services",
            "Complaint about slow internet service",
            "Request for additional garbage pickup",
            "Question about property tax assessment",
            "Suggestion for new bike lane installation"
        ]
        
        # Create dataset
        texts = disaster_samples + non_disaster_samples
        labels = ['verified'] * len(disaster_samples) + ['not_verified'] * len(non_disaster_samples)
        
        return pd.DataFrame({'text': texts, 'label': labels})
    
    def train_models(self, csv_path=None):
        """Train both Random Forest and SVM models"""
        print("Loading dataset...")
        df = self.load_dataset(csv_path)
        
        # Preprocess texts
        df['processed_text'] = df['text'].apply(self.preprocess_text)
        
        # Create TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )
        
        # Fit vectorizer and transform texts
        X_text = self.vectorizer.fit_transform(df['processed_text'])
        
        # Extract additional features
        additional_features = []
        for text in df['text']:
            features = self.extract_features(text)
            additional_features.append(list(features.values()))
        
        additional_features = np.array(additional_features)
        
        # Combine text features with additional features
        X = np.hstack([X_text.toarray(), additional_features])
        y = df['label']
        
        # Split data with 95% train, 5% test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.05, random_state=42, stratify=y
        )
        
        print(f"Training set size: {len(X_train)} samples ({len(X_train)/len(X)*100:.1f}%)")
        print(f"Test set size: {len(X_test)} samples ({len(X_test)/len(X)*100:.1f}%)")
        
        print("Training Random Forest model...")
        # Train Random Forest
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        self.rf_model.fit(X_train, y_train)
        
        print("Training SVM model...")
        # Train SVM
        self.svm_model = SVC(
            kernel='rbf',
            C=1.0,
            gamma='scale',
            probability=True,
            random_state=42,
            class_weight='balanced'
        )
        self.svm_model.fit(X_train, y_train)
        
        # Evaluate models
        print("\n=== Model Evaluation ===")
        
        # Random Forest evaluation
        rf_pred = self.rf_model.predict(X_test)
        rf_accuracy = accuracy_score(y_test, rf_pred)
        print(f"Random Forest Accuracy: {rf_accuracy:.3f}")
        
        # SVM evaluation
        svm_pred = self.svm_model.predict(X_test)
        svm_accuracy = accuracy_score(y_test, svm_pred)
        print(f"SVM Accuracy: {svm_accuracy:.3f}")
        
        # Cross-validation scores
        rf_cv_scores = cross_val_score(self.rf_model, X_train, y_train, cv=5)
        svm_cv_scores = cross_val_score(self.svm_model, X_train, y_train, cv=5)
        
        print(f"Random Forest CV Score: {rf_cv_scores.mean():.3f} (+/- {rf_cv_scores.std() * 2:.3f})")
        print(f"SVM CV Score: {svm_cv_scores.mean():.3f} (+/- {svm_cv_scores.std() * 2:.3f})")
        
        return X_test, y_test
    
    def predict(self, text, use_ensemble=True):
        """Predict if complaint is disaster-related"""
        if not self.rf_model or not self.svm_model or not self.vectorizer:
            raise ValueError("Models not trained. Please train models first.")
        
        # Preprocess text
        processed_text = self.preprocess_text(text)
        
        # Vectorize text
        X_text = self.vectorizer.transform([processed_text])
        
        # Extract additional features
        features = self.extract_features(text)
        additional_features = np.array([list(features.values())])
        
        # Combine features
        X = np.hstack([X_text.toarray(), additional_features])
        
        if use_ensemble:
            # Ensemble prediction (average of both models)
            rf_prob = self.rf_model.predict_proba(X)[0]
            svm_prob = self.svm_model.predict_proba(X)[0]
            
            # Average probabilities
            avg_prob = (rf_prob + svm_prob) / 2
            
            # Get class with highest probability
            classes = self.rf_model.classes_
            prediction = classes[np.argmax(avg_prob)]
            confidence = np.max(avg_prob)
            
            return prediction, confidence, {
                'rf_prediction': self.rf_model.predict(X)[0],
                'svm_prediction': self.svm_model.predict(X)[0],
                'rf_confidence': np.max(rf_prob),
                'svm_confidence': np.max(svm_prob)
            }
        else:
            # Use Random Forest as primary
            prediction = self.rf_model.predict(X)[0]
            confidence = np.max(self.rf_model.predict_proba(X)[0])
            return prediction, confidence, {}
    
    def save_models(self, model_dir):
        """Save trained models to disk"""
        os.makedirs(model_dir, exist_ok=True)
        
        with open(os.path.join(model_dir, 'rf_model.pkl'), 'wb') as f:
            pickle.dump(self.rf_model, f)
        
        with open(os.path.join(model_dir, 'svm_model.pkl'), 'wb') as f:
            pickle.dump(self.svm_model, f)
        
        with open(os.path.join(model_dir, 'vectorizer.pkl'), 'wb') as f:
            pickle.dump(self.vectorizer, f)
        
        print(f"Models saved to {model_dir}")
    
    def load_models(self, model_dir):
        """Load trained models from disk"""
        try:
            with open(os.path.join(model_dir, 'rf_model.pkl'), 'rb') as f:
                self.rf_model = pickle.load(f)
            
            with open(os.path.join(model_dir, 'svm_model.pkl'), 'rb') as f:
                self.svm_model = pickle.load(f)
            
            with open(os.path.join(model_dir, 'vectorizer.pkl'), 'rb') as f:
                self.vectorizer = pickle.load(f)
            
            print(f"Models loaded from {model_dir}")
            return True
        except FileNotFoundError:
            print(f"Model files not found in {model_dir}")
            return False

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python disaster_classifier.py <complaint_text> [train]")
        sys.exit(1)
    
    # Initialize classifier
    classifier = DisasterClassifier()
    
    # Get current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(script_dir, 'models')
    
    # Check if we need to train
    if len(sys.argv) > 2 and sys.argv[2] == 'train':
        print("Training models...")
        classifier.train_models()
        classifier.save_models(model_dir)
        print("Training completed!")
        return
    
    # Try to load existing models
    if not classifier.load_models(model_dir):
        print("No trained models found. Training new models...")
        classifier.train_models()
        classifier.save_models(model_dir)
    
    # Get complaint text from command line
    complaint_text = sys.argv[1]
    
    # Make prediction
    try:
        prediction, confidence, details = classifier.predict(complaint_text)
        
        # Output result (for Node.js integration)
        print(prediction)
        
        # Optional: Print detailed results to stderr for debugging
        if len(sys.argv) > 2 and sys.argv[2] == 'verbose':
            print(f"Prediction: {prediction}", file=sys.stderr)
            print(f"Confidence: {confidence:.3f}", file=sys.stderr)
            if details:
                print(f"RF Prediction: {details.get('rf_prediction', 'N/A')}", file=sys.stderr)
                print(f"SVM Prediction: {details.get('svm_prediction', 'N/A')}", file=sys.stderr)
    
    except Exception as e:
        print(f"Error during prediction: {e}", file=sys.stderr)
        print("not_verified")  # Default to not verified on error

if __name__ == "__main__":
    main()
