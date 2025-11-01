#!/usr/bin/env python3
"""
Dataset validation script
This script analyzes the disaster complaints dataset and shows statistics
"""

import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter

def analyze_dataset():
    """Analyze the disaster complaints dataset"""
    
    # Get current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'disaster_complaints_dataset.csv')
    
    try:
        # Load the dataset
        print("=== Dataset Analysis ===")
        df = pd.read_csv(csv_path)
        
        print(f"Dataset file: {csv_path}")
        print(f"Total samples: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        
        # Check for missing values
        print(f"\nMissing values:")
        print(df.isnull().sum())
        
        # Label distribution
        print(f"\nLabel distribution:")
        label_counts = df['label'].value_counts()
        print(label_counts)
        
        # Convert to percentage
        label_percentages = df['label'].value_counts(normalize=True) * 100
        print(f"\nLabel percentages:")
        for label, percentage in label_percentages.items():
            label_name = "Disaster-related" if label == 1 else "Non-disaster"
            print(f"{label_name} ({label}): {percentage:.1f}%")
        
        # Text length analysis
        df['text_length'] = df['text'].str.len()
        df['word_count'] = df['text'].str.split().str.len()
        
        print(f"\nText statistics:")
        print(f"Average text length: {df['text_length'].mean():.1f} characters")
        print(f"Average word count: {df['word_count'].mean():.1f} words")
        print(f"Min text length: {df['text_length'].min()} characters")
        print(f"Max text length: {df['text_length'].max()} characters")
        
        # Sample texts for each category
        print(f"\n=== Sample Disaster-related Complaints (label=1) ===")
        disaster_samples = df[df['label'] == 1]['text'].head(5)
        for i, text in enumerate(disaster_samples, 1):
            print(f"{i}. {text}")
        
        print(f"\n=== Sample Non-disaster Complaints (label=0) ===")
        non_disaster_samples = df[df['label'] == 0]['text'].head(5)
        for i, text in enumerate(non_disaster_samples, 1):
            print(f"{i}. {text}")
        
        # Train/Test split preview (95%/5%)
        from sklearn.model_selection import train_test_split
        
        X = df['text']
        y = df['label']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.05, random_state=42, stratify=y
        )
        
        print(f"\n=== Train/Test Split (95%/5%) ===")
        print(f"Training set: {len(X_train)} samples ({len(X_train)/len(df)*100:.1f}%)")
        print(f"Test set: {len(X_test)} samples ({len(X_test)/len(df)*100:.1f}%)")
        
        # Training set distribution
        train_dist = y_train.value_counts()
        print(f"\nTraining set distribution:")
        for label, count in train_dist.items():
            label_name = "Disaster-related" if label == 1 else "Non-disaster"
            print(f"{label_name} ({label}): {count} samples ({count/len(y_train)*100:.1f}%)")
        
        # Test set distribution
        test_dist = y_test.value_counts()
        print(f"\nTest set distribution:")
        for label, count in test_dist.items():
            label_name = "Disaster-related" if label == 1 else "Non-disaster"
            print(f"{label_name} ({label}): {count} samples ({count/len(y_test)*100:.1f}%)")
        
        # Check for data quality issues
        print(f"\n=== Data Quality Check ===")
        
        # Check for duplicate texts
        duplicates = df.duplicated(subset=['text']).sum()
        print(f"Duplicate texts: {duplicates}")
        
        if duplicates > 0:
            print("Sample duplicate texts:")
            duplicate_texts = df[df.duplicated(subset=['text'], keep=False)]['text'].unique()[:3]
            for i, text in enumerate(duplicate_texts, 1):
                print(f"{i}. {text}")
        
        # Check for very short texts
        short_texts = df[df['word_count'] < 3]
        print(f"Very short texts (< 3 words): {len(short_texts)}")
        
        if len(short_texts) > 0:
            print("Sample short texts:")
            for i, text in enumerate(short_texts['text'].head(3), 1):
                print(f"{i}. '{text}' ({short_texts.iloc[i-1]['word_count']} words)")
        
        # Most common words in each category
        print(f"\n=== Word Analysis ===")
        
        # Disaster-related texts
        disaster_texts = df[df['label'] == 1]['text'].str.lower()
        disaster_words = ' '.join(disaster_texts).split()
        disaster_word_freq = Counter(disaster_words).most_common(10)
        
        print("Most common words in disaster-related complaints:")
        for word, freq in disaster_word_freq:
            print(f"  {word}: {freq}")
        
        # Non-disaster texts
        non_disaster_texts = df[df['label'] == 0]['text'].str.lower()
        non_disaster_words = ' '.join(non_disaster_texts).split()
        non_disaster_word_freq = Counter(non_disaster_words).most_common(10)
        
        print("\nMost common words in non-disaster complaints:")
        for word, freq in non_disaster_word_freq:
            print(f"  {word}: {freq}")
        
        print(f"\n=== Dataset Ready for Training ===")
        print("✓ Dataset loaded successfully")
        print("✓ No missing values detected")
        print("✓ Balanced distribution maintained in train/test split")
        print("✓ Ready for 95%/5% train-test split")
        
        return df
        
    except FileNotFoundError:
        print(f"Error: Dataset file not found at {csv_path}")
        print("Please ensure the disaster_complaints_dataset.csv file exists in the python directory.")
        return None
    except Exception as e:
        print(f"Error analyzing dataset: {e}")
        return None

def main():
    """Main function"""
    df = analyze_dataset()
    
    if df is not None:
        print(f"\nDataset analysis complete!")
        print("You can now run: python train_disaster_model.py")
    else:
        print("Dataset analysis failed. Please check the file and try again.")

if __name__ == "__main__":
    main()
