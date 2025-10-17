import { useState, useRef } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ onImagesChange, disabled = false, maxImages = 5 }) => {
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Please upload: ${ALLOWED_TYPES.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const processFiles = async (files) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`);
      return;
    }

    const validFiles = [];
    const errors = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      alert('Some files were rejected:\n' + errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    try {
      const processedImages = await Promise.all(
        validFiles.map(async (file) => {
          const base64 = await convertToBase64(file);
          return {
            id: Date.now() + Math.random(),
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            data: base64,
            description: '',
            uploadedAt: new Date().toISOString()
          };
        })
      );

      const newImages = [...images, ...processedImages];
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Error processing images. Please try again.');
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeImage = (imageId) => {
    const newImages = images.filter(img => img.id !== imageId);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const updateImageDescription = (imageId, description) => {
    const newImages = images.map(img => 
      img.id === imageId ? { ...img, description } : img
    );
    setImages(newImages);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-header">
        <label>Attach Images (Optional)</label>
        <span className="image-count">
          {images.length}/{maxImages} images
        </span>
      </div>

      {images.length < maxImages && (
        <div
          className={`image-upload-zone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled}
            style={{ display: 'none' }}
          />
          
          <div className="upload-content">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              <p><strong>Click to upload</strong> or drag and drop</p>
              <p>PNG, JPG, GIF, WebP up to {MAX_FILE_SIZE / (1024 * 1024)}MB each</p>
            </div>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="image-preview-container">
          <h4>Uploaded Images:</h4>
          <div className="image-preview-grid">
            {images.map((image) => (
              <div key={image.id} className="image-preview-item">
                <div className="image-preview">
                  <img 
                    src={image.data} 
                    alt={image.filename}
                    className="preview-image"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(image.id)}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </div>
                <div className="image-details">
                  <div className="image-filename">{image.filename}</div>
                  <div className="image-size">
                    {(image.size / 1024).toFixed(1)} KB
                  </div>
                  <input
                    type="text"
                    placeholder="Add description (optional)"
                    value={image.description}
                    onChange={(e) => updateImageDescription(image.id, e.target.value)}
                    className="image-description-input"
                    disabled={disabled}
                    maxLength={200}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="image-upload-help">
        <small>
          • Upload photos of the disaster/emergency scene<br/>
          • Maximum {maxImages} images, {MAX_FILE_SIZE / (1024 * 1024)}MB each<br/>
          • Supported formats: JPEG, PNG, GIF, WebP
        </small>
      </div>
    </div>
  );
};

export default ImageUpload;
