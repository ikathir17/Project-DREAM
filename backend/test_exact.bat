@echo off
echo Testing with exact dataset complaints...
echo.

echo 1. From dataset (should be verified):
python python/disaster_classifier.py "Government hasn't provided any relief after the landslide"
echo.

echo 2. From dataset (should be verified):
python python/disaster_classifier.py "Roads are blocked and no help has arrived"
echo.

echo 3. From dataset (should be NOT verified):
python python/disaster_classifier.py "Train was late by two hours again"
echo.

echo 4. Test complaint (should be verified):
python python/disaster_classifier.py "Severe flooding in downtown area, need immediate evacuation assistance"
echo.

pause
