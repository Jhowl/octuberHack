import { useState, useRef } from 'react';
import ImageAnalysis from './ImageAnalysis';
import InformationExtractor from './InformationExtractor';
import OCRExtractor from './OCRExtractor';
import MetadataExtractor from './MetadataExtractor';
import APIMetadataExtractor from './APIMetadataExtractor';

const ImageUploader = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          id: Date.now() + Math.random(),
          file,
          url: e.target.result,
          blob: file,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toLocaleString(),
          uploadTime: new Date().toLocaleString()
        };
        
        setUploadedImages(prev => [imageData, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const downloadImage = (image) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const extractEXIFData = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Basic metadata extraction
        const metadata = {
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
          fileType: file.type,
          dimensions: `${img.naturalWidth} x ${img.naturalHeight}`,
          aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
          lastModified: new Date(file.lastModified).toLocaleString(),
          uploadTime: new Date().toLocaleString()
        };
        
        // Try to extract EXIF data if available
        if (file.type === 'image/jpeg') {
          // Note: Full EXIF extraction requires a library like exif-js
          metadata.note = "For full EXIF data (GPS, camera settings), install exif-js library";
        }
        
        resolve(metadata);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className="section">
      <h2>Upload Images for Analysis</h2>
      
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>Drop images here or click to browse</h3>
          <p>Supports: JPG, PNG, GIF, WebP, BMP</p>
          <p>Multiple files supported</p>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      {uploadedImages.length > 0 && (
        <div className="uploaded-images">
          <h3>Uploaded Images ({uploadedImages.length})</h3>
          
          {uploadedImages.map((image) => (
            <div key={image.id} className="uploaded-image-container">
              <div className="image-header">
                <div className="image-info">
                  <h4>{image.name}</h4>
                  <div className="image-details">
                    <span>Size: {(image.size / 1024).toFixed(2)} KB</span>
                    <span>Type: {image.type}</span>
                    <span>Uploaded: {image.uploadTime}</span>
                  </div>
                </div>
                <div className="image-actions">
                  <button 
                    className="btn-small"
                    onClick={() => downloadImage(image)}
                    title="Download"
                  >
                    ⬇️
                  </button>
                  <button 
                    className="btn-small btn-danger"
                    onClick={() => removeImage(image.id)}
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="image-preview">
                <img
                  src={image.url}
                  alt={image.name}
                  className="uploaded-image"
                />
              </div>
              
              <div className="analysis-components">
                <APIMetadataExtractor 
                  imageFile={image.file} 
                  imageUrl={image.url}
                />
                <MetadataExtractor 
                  imageFile={image.file} 
                  imageUrl={image.url}
                />
                <ImageAnalysis 
                  imageBlob={image.blob} 
                  imageUrl={image.url}
                />
                <InformationExtractor 
                  imageBlob={image.blob} 
                  imageUrl={image.url}
                />
                <OCRExtractor 
                  imageUrl={image.url}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {uploadedImages.length === 0 && (
        <div className="no-images">
          <p>No images uploaded yet. Upload some images to start analyzing!</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;