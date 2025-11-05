#!/usr/bin/env python3
"""
Simple spam classifier for disaster complaints
"""
import sys
import re

def is_spam(text):
    """
    A simple rule-based spam classifier
    In a real application, this would be replaced with a proper ML model
    """
    # Convert to lowercase
    text = text.lower()
    
    # Define spam indicators
    spam_words = [
        'lottery', 'winner', 'prize', 'free', 'money', 'cash', 'credit',
        'loan', 'debt', 'investment', 'bitcoin', 'crypto', 'offer',
        'discount', 'buy now', 'limited time', 'click here', 'subscribe',
        'casino', 'betting', 'gambling', 'dating', 'singles', 'hot',
        'meet singles', 'weight loss', 'diet', 'pills', 'medication',
        'viagra', 'cialis', 'enlargement', 'miracle', 'cure', 'hair loss',
        'wrinkle', 'anti-aging', 'fountain of youth'
    ]
    
    # Check for spam indicators
    for word in spam_words:
        if re.search(r'\b' + re.escape(word) + r'\b', text):
            return True
    
    # Check for excessive punctuation or capitalization
    if text.count('!') > 3 or text.count('$') > 2:
        return True
    
    # Check for very short messages
    if len(text.split()) < 3:
        return True
    
    return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        complaint_text = sys.argv[1]
        result = "spam" if is_spam(complaint_text) else "not_spam"
        print(result)
    else:
        print("Please provide complaint text as an argument")
