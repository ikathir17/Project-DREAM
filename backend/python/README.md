# Disaster Classification System

This system uses machine learning to automatically classify complaints as disaster-related or not, using two different algorithms: **Random Forest** and **Support Vector Machine (SVM)**.

## Features

- **Dual Algorithm Approach**: Uses both Random Forest and SVM for robust classification
- **Ensemble Prediction**: Combines predictions from both models for better accuracy
- **Text Preprocessing**: Advanced NLP preprocessing including stemming and stopword removal
- **Feature Engineering**: Extracts disaster-specific keywords and urgency indicators
- **Automatic Integration**: Seamlessly integrates with the existing complaint system

## Classification Output

- **`verified`**: Complaint is classified as disaster-related
- **`not_verified`**: Complaint is classified as non-disaster-related

## Files Overview

### Core Components
- `disaster_classifier.py` - Main classification model with Random Forest and SVM
- `spam_classifier.py` - Existing spam detection (unchanged)

### Training & Testing
- `train_disaster_model.py` - Script to train both models
- `test_disaster_model.py` - Comprehensive testing script
- `setup.py` - One-click setup and installation

### Configuration
- `requirements.txt` - Python dependencies
- `models/` - Directory for saved trained models (created automatically)

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend/python
pip install -r requirements.txt
```

### 2. Quick Setup (Recommended)
```bash
python setup.py
```
This will:
- Install all dependencies
- Train both models
- Test the system
- Verify everything is working

### 3. Manual Setup
```bash
# Train models
python train_disaster_model.py

# Test models
python test_disaster_model.py
```

## Usage

### Command Line Testing
```bash
# Basic prediction
python disaster_classifier.py "Severe flooding in downtown area, need help"

# Verbose output with model details
python disaster_classifier.py "Street light not working" verbose

# Retrain models
python disaster_classifier.py "any text" train
```

### Integration with Node.js
The system is automatically integrated with the complaint controller. When a new complaint is created:

1. **Spam Classification**: Runs existing spam detection
2. **Disaster Classification**: Runs new disaster classification
3. **Auto-Verification**: Sets `verified: true` for disaster-related complaints

## Model Details

### Random Forest Classifier
- **Algorithm**: Ensemble of 100 decision trees
- **Features**: TF-IDF vectors + engineered features
- **Strengths**: Handles overfitting well, good for text classification

### SVM Classifier
- **Algorithm**: Support Vector Machine with RBF kernel
- **Features**: Same feature set as Random Forest
- **Strengths**: Effective for high-dimensional data, good generalization

### Feature Engineering
1. **TF-IDF Vectorization**: Converts text to numerical features
2. **Disaster Keywords**: Counts disaster-related terms
3. **Urgency Indicators**: Detects urgent language patterns
4. **Text Statistics**: Length, word count, punctuation analysis

### Training Data
The system uses your provided dataset (`disaster_complaints_dataset.csv`) with:

**Dataset Statistics:**
- **1000+ complaint samples** from your CSV file
- **95% for training** (approximately 950+ samples)
- **5% for testing** (approximately 50+ samples)
- **Balanced distribution** maintained in train/test split

**Label Format:**
- **Label 1**: Disaster-related complaints (verified)
- **Label 0**: Non-disaster complaints (not_verified)

**Sample Categories in Your Dataset:**
- Disaster-related: floods, storms, infrastructure damage, emergency situations
- Non-disaster: service complaints, maintenance issues, general feedback

## Performance Metrics

The system provides detailed performance metrics including:
- **Accuracy**: Overall classification accuracy
- **Cross-validation scores**: 5-fold CV for both models
- **Confidence scores**: Prediction confidence levels
- **Individual model performance**: Separate RF and SVM metrics

## Testing

### Automated Testing
```bash
python test_disaster_model.py
```

### Interactive Testing
The test script includes an interactive mode where you can test custom complaints in real-time.

## Integration Points

### Complaint Controller
- File: `controllers/complaintController.js`
- Function: `createComplaint`
- Integration: Automatic classification on complaint creation

### Database Updates
- Field: `verified` (Boolean)
- Logic: Set to `true` for disaster-related complaints
- Timing: Asynchronous after complaint creation

## Troubleshooting

### Common Issues

1. **Python Dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

2. **NLTK Data**
   ```python
   import nltk
   nltk.download('punkt')
   nltk.download('stopwords')
   ```

3. **Model Files Missing**
   ```bash
   python train_disaster_model.py
   ```

4. **Permission Issues**
   - Ensure Python has write access to the `models/` directory
   - Check file permissions for script execution

### Logs and Debugging
- Check Node.js console for classification results
- Use verbose mode for detailed prediction information
- Review error logs in the complaint controller

## Customization

### Adding New Training Data
1. Edit the `create_sample_data()` method in `disaster_classifier.py`
2. Add new examples to disaster_samples or non_disaster_samples
3. Retrain models: `python train_disaster_model.py`

### Adjusting Classification Threshold
Modify the ensemble prediction logic in the `predict()` method to adjust sensitivity.

### Adding New Features
Extend the `extract_features()` method to include additional text analysis features.

## API Integration

The system automatically integrates with the existing complaint API:

```javascript
// POST /api/complaints
// The system will automatically:
// 1. Create the complaint
// 2. Run spam classification
// 3. Run disaster classification
// 4. Update verified status
```

## Security Considerations

- All Python scripts run in isolated processes
- No external API calls or network requests
- Models are stored locally
- Input validation prevents code injection

## Future Enhancements

- **Deep Learning Models**: Integration with neural networks
- **Multi-language Support**: Extend to other languages
- **Real-time Learning**: Update models with new data
- **Confidence Thresholds**: Configurable classification thresholds
- **Category Classification**: Specific disaster type classification

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review log files for error messages
3. Test with the provided test scripts
4. Verify Python environment and dependencies
