#!/usr/bin/env python3
"""
Setup script for disaster classification system
This script installs dependencies and trains the models
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        return False

def train_models():
    """Train the disaster classification models"""
    print("Training disaster classification models...")
    try:
        subprocess.check_call([sys.executable, 'train_disaster_model.py'])
        print("✓ Models trained successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error training models: {e}")
        return False

def test_models():
    """Test the trained models"""
    print("Testing models...")
    try:
        # Test with a sample disaster complaint
        result = subprocess.run([
            sys.executable, 'disaster_classifier.py', 
            'Severe flooding in downtown area, need immediate evacuation assistance'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            prediction = result.stdout.strip()
            print(f"✓ Test successful - Sample prediction: {prediction}")
            return True
        else:
            print(f"✗ Test failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error testing models: {e}")
        return False

def validate_dataset():
    """Validate the dataset exists and is properly formatted"""
    print("Validating dataset...")
    try:
        import pandas as pd
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, 'disaster_complaints_dataset.csv')
        
        df = pd.read_csv(csv_path)
        
        # Basic validation
        if 'text' not in df.columns or 'label' not in df.columns:
            print("✗ Dataset missing required columns (text, label)")
            return False
        
        if df.empty:
            print("✗ Dataset is empty")
            return False
        
        # Check label values
        unique_labels = df['label'].unique()
        if not all(label in [0, 1] for label in unique_labels):
            print("✗ Dataset labels must be 0 (non-disaster) or 1 (disaster)")
            return False
        
        print(f"✓ Dataset validated - {len(df)} samples found")
        print(f"  Disaster samples: {sum(df['label'] == 1)}")
        print(f"  Non-disaster samples: {sum(df['label'] == 0)}")
        return True
        
    except FileNotFoundError:
        print("✗ Dataset file 'disaster_complaints_dataset.csv' not found")
        return False
    except Exception as e:
        print(f"✗ Error validating dataset: {e}")
        return False

def main():
    print("=== Disaster Classification Setup ===")
    print("Setting up with your dataset using 95% train / 5% test split\n")
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    success = True
    
    # Step 1: Validate dataset
    if not validate_dataset():
        success = False
    
    print()
    
    # Step 2: Install dependencies
    if success and not install_requirements():
        success = False
    
    print()
    
    # Step 3: Train models
    if success and not train_models():
        success = False
    
    print()
    
    # Step 4: Test models
    if success and not test_models():
        success = False
    
    print()
    
    if success:
        print("=== Setup Complete ===")
        print("✓ All components installed and configured successfully")
        print("✓ Disaster classification is ready to use")
        print("\nThe system will now automatically classify complaints as:")
        print("- 'verified' for disaster-related complaints")
        print("- 'not_verified' for non-disaster complaints")
    else:
        print("=== Setup Failed ===")
        print("✗ Some components failed to install or configure")
        print("Please check the error messages above and try again")
        sys.exit(1)

if __name__ == "__main__":
    main()
