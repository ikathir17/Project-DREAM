#!/usr/bin/env python3
"""
Download required NLTK data
"""

import nltk

def download_nltk_data():
    """Download required NLTK datasets"""
    print("Downloading NLTK data...")
    
    try:
        # Download required datasets
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        nltk.download('stopwords', quiet=True)
        
        print("NLTK data downloaded successfully")
        return True
        
    except Exception as e:
        print(f"Error downloading NLTK data: {e}")
        return False

if __name__ == "__main__":
    download_nltk_data()
