@echo off
echo Testing Python Classifiers...
echo.

echo 1. Testing Spam Classifier:
python python/spam_classifier.py "Severe flooding in downtown area"
echo.

echo 2. Testing Disaster Classifier:
python python/disaster_classifier.py "Severe flooding in downtown area"
echo.

echo 3. Testing Spam (should be spam):
python python/spam_classifier.py "Win free money now"
echo.

pause
