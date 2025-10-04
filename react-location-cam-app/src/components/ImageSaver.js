import { useState } from 'react';

const ImageSaver = ({ imageFile, imageUrl }) => {
  const [saveResult, setSaveResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [apiEndpoint] = useState(
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:8000' 
      : `http://${window.location.hostname}:8000`
  );

  const saveImageWithAnalysis = async () => {
    if (!imageFile) {
      alert('No image file available to save');
      return;
    }
    
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await fetch(`${apiEndpoint}/save-image`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setSaveResult({
          success: true,
          ...data
        });
      } else {
        setSaveResult({
          success: false,
          error: data.message || 'Failed to save image',
          details: data
        });
      }
      
    } catch (error) {
      console.error('Save failed:', error);
      setSaveResult({
        success: false,
        error: error.message,
        suggestion: 'Check if the API server is running and accessible'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedImages = async () => {
    setIsLoadingSaved(true);
    try {
      const response = await fetch(`${apiEndpoint}/saved-images`);
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setSavedImages(data.images || []);
      } else {
        setSavedImages([]);
        console.error('Failed to load saved images:', data.message);
      }
    } catch (error) {
      console.error('Error loading saved images:', error);
      setSavedImages([]);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const downloadSavedMetadata = async (imageId, filename) => {
    try {
      const response = await fetch(`${apiEndpoint}/saved-images/${imageId}`);
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        const metadataText = JSON.stringify(data.metadata, null, 2);
        const blob = new Blob([metadataText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `metadata-${filename}-${imageId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to download metadata: ' + data.message);
      }
    } catch (error) {
      alert('Error downloading metadata: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-saver">
      <h4>💾 Save Image with Analysis</h4>
      <p className="description">Save image permanently with complete metadata and AI analysis</p>
      
      <div className="saver-controls">
        <button 
          className="btn save-btn" 
          onClick={saveImageWithAnalysis}
          disabled={isSaving || !imageFile}
        >
          {isSaving ? '💾 Saving...' : '💾 Save Image & Analysis'}
        </button>
        
        <button 
          className="btn list-btn" 
          onClick={loadSavedImages}
          disabled={isLoadingSaved}
        >
          {isLoadingSaved ? '📋 Loading...' : '📋 View Saved Images'}
        </button>
      </div>
      
      {saveResult && (
        <div className="save-results">
          {saveResult.success ? (
            <div className="save-success">
              <div className="success-header">
                ✅ Image Saved Successfully!
              </div>
              
              <div className="save-details">
                <div className="save-info-grid">
                  <div className="save-info-item">
                    <span className="label">Image ID:</span>
                    <span className="value">{saveResult.save_info?.image_id}</span>
                  </div>
                  <div className="save-info-item">
                    <span className="label">Saved Filename:</span>
                    <span className="value">{saveResult.save_info?.saved_filename}</span>
                  </div>
                  <div className="save-info-item">
                    <span className="label">Saved At:</span>
                    <span className="value">
                      {saveResult.save_info?.saved_at ? 
                        new Date(saveResult.save_info.saved_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="save-info-item">
                    <span className="label">Storage Path:</span>
                    <span className="value path">{saveResult.save_info?.image_path}</span>
                  </div>
                </div>
                
                <div className="analysis-summary">
                  <h5>📊 Analysis Summary</h5>
                  <div className="summary-items">
                    <div className="summary-item">
                      <span className="summary-icon">📁</span>
                      <span>File metadata extracted</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-icon">
                        {saveResult.metadata?.gps_location?.error ? '❌' : '✅'}
                      </span>
                      <span>GPS location {saveResult.metadata?.gps_location?.error ? 'not found' : 'extracted'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-icon">
                        {saveResult.metadata?.ai_analysis?.error ? '❌' : '✅'}
                      </span>
                      <span>AI analysis {saveResult.metadata?.ai_analysis?.error ? 'unavailable' : 'completed'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-icon">📷</span>
                      <span>EXIF data processed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="save-error">
              <div className="error-header">
                ❌ Save Failed
              </div>
              <div className="error-details">
                <p>{saveResult.error}</p>
                {saveResult.suggestion && (
                  <p className="error-suggestion">💡 {saveResult.suggestion}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {savedImages.length > 0 && (
        <div className="saved-images-list">
          <h5>📋 Saved Images ({savedImages.length})</h5>
          <div className="saved-images-grid">
            {savedImages.slice(0, 10).map((image, index) => (
              <div key={image.image_id || index} className="saved-image-card">
                <div className="saved-image-header">
                  <div className="saved-image-name">{image.original_filename}</div>
                  <div className="saved-image-date">
                    {new Date(image.saved_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="saved-image-details">
                  <div className="detail-item">
                    <span>Size: {formatFileSize(image.file_size)}</span>
                  </div>
                  <div className="detail-item">
                    <span>GPS: {image.has_gps ? '✅' : '❌'}</span>
                  </div>
                  <div className="detail-item">
                    <span>AI: {image.has_ai_analysis ? '✅' : '❌'}</span>
                  </div>
                </div>
                
                <div className="saved-image-actions">
                  <button 
                    className="btn-small"
                    onClick={() => downloadSavedMetadata(image.image_id, image.original_filename)}
                  >
                    📥 Download Metadata
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {savedImages.length > 10 && (
            <div className="more-images-note">
              ... and {savedImages.length - 10} more images
            </div>
          )}
        </div>
      )}
      
      {savedImages.length === 0 && isLoadingSaved === false && (
        <div className="no-saved-images">
          <p>No saved images found. Save your first image to get started!</p>
        </div>
      )}
    </div>
  );
};

export default ImageSaver;