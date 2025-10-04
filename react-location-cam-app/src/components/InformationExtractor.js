import { useState } from 'react';

const InformationExtractor = ({ imageBlob, imageUrl, locationData }) => {
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const extractInformation = async () => {
    if (!imageBlob) return;
    
    setIsExtracting(true);
    try {
      const info = {
        metadata: await extractMetadata(imageBlob),
        location: locationData || await getCurrentLocation(),
        objects: await detectObjects(imageUrl),
        text: await extractText(imageUrl),
        qrCodes: await detectQRCodes(imageUrl),
        timestamp: new Date().toISOString(),
        summary: generateSummary()
      };
      
      setExtractedInfo(info);
    } catch (error) {
      console.error('Information extraction failed:', error);
      setExtractedInfo({ error: error.message });
    } finally {
      setIsExtracting(false);
    }
  };

  const extractMetadata = async (blob) => {
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => {
        resolve({
          dimensions: `${img.naturalWidth} x ${img.naturalHeight}`,
          fileSize: `${(blob.size / 1024).toFixed(2)} KB`,
          format: blob.type,
          captureTime: new Date().toLocaleString(),
          aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
        });
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const getCurrentLocation = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: 'Geolocation not supported' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            accuracy: `${accuracy}m`,
            timestamp: new Date(position.timestamp).toLocaleString(),
            mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
          });
        },
        (error) => {
          resolve({ error: error.message });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const detectObjects = async (imageUrl) => {
    // Placeholder for object detection
    // In production, you'd use TensorFlow.js or similar
    return {
      detected: false,
      message: "Object detection requires ML model",
      suggestion: "Integrate TensorFlow.js for object recognition",
      possibleObjects: [
        "Person", "Car", "Building", "Text", "Sign", 
        "Animal", "Food", "Document", "Product"
      ]
    };
  };

  const extractText = async (imageUrl) => {
    // Placeholder for OCR
    // In production, you'd use Tesseract.js
    return {
      detected: false,
      message: "OCR requires Tesseract.js library",
      suggestion: "Add 'npm install tesseract.js' for text extraction",
      example: "Would extract text from signs, documents, labels, etc."
    };
  };

  const detectQRCodes = async (imageUrl) => {
    // Placeholder for QR code detection
    return {
      detected: false,
      message: "QR code detection requires jsQR library",
      suggestion: "Add 'npm install jsqr' for QR code scanning"
    };
  };

  const generateSummary = () => {
    const now = new Date();
    return {
      captureDate: now.toLocaleDateString(),
      captureTime: now.toLocaleTimeString(),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop',
      browser: getBrowserName(),
      analysisComplete: true
    };
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const exportData = () => {
    if (!extractedInfo) return;
    
    const dataStr = JSON.stringify(extractedInfo, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="information-extractor">
      <h4>Information Extraction</h4>
      
      <div className="extraction-controls">
        <button 
          className="btn" 
          onClick={extractInformation}
          disabled={isExtracting || !imageBlob}
        >
          {isExtracting ? 'Extracting...' : 'Extract Information'}
        </button>
        
        {extractedInfo && !extractedInfo.error && (
          <>
            <button className="btn" onClick={exportData}>
              Export Data
            </button>
          </>
        )}
      </div>
      
      {extractedInfo && (
        <div className="extraction-results">
          {extractedInfo.error ? (
            <div className="error">Error: {extractedInfo.error}</div>
          ) : (
            <>
              <div className="info-section">
                <h5>Image Metadata</h5>
                <div className="info-grid">
                  <div>Dimensions: {extractedInfo.metadata?.dimensions}</div>
                  <div>File Size: {extractedInfo.metadata?.fileSize}</div>
                  <div>Format: {extractedInfo.metadata?.format}</div>
                  <div>Aspect Ratio: {extractedInfo.metadata?.aspectRatio}</div>
                </div>
              </div>
              
              <div className="info-section">
                <h5>Location Data</h5>
                {extractedInfo.location?.error ? (
                  <div className="warning">{extractedInfo.location.error}</div>
                ) : (
                  <div className="info-grid">
                    <div>Latitude: {extractedInfo.location?.latitude}</div>
                    <div>Longitude: {extractedInfo.location?.longitude}</div>
                    <div>Accuracy: {extractedInfo.location?.accuracy}</div>
                    {extractedInfo.location?.mapUrl && (
                      <div>
                        <a 
                          href={extractedInfo.location.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View on Map
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="info-section">
                <h5>Content Analysis</h5>
                <div className="analysis-placeholder">
                  <p><strong>Text Recognition:</strong> {extractedInfo.text?.message}</p>
                  <p><strong>Object Detection:</strong> {extractedInfo.objects?.message}</p>
                  <p><strong>QR Codes:</strong> {extractedInfo.qrCodes?.message}</p>
                </div>
              </div>
              
              <div className="info-section">
                <h5>Capture Summary</h5>
                <div className="info-grid">
                  <div>Date: {extractedInfo.summary?.captureDate}</div>
                  <div>Time: {extractedInfo.summary?.captureTime}</div>
                  <div>Device: {extractedInfo.summary?.device}</div>
                  <div>Browser: {extractedInfo.summary?.browser}</div>
                </div>
              </div>
              
              <div className="info-section">
                <h5>Enhancement Suggestions</h5>
                <ul className="suggestions">
                  <li>Add Tesseract.js for OCR text extraction</li>
                  <li>Integrate TensorFlow.js for object detection</li>
                  <li>Add jsQR for QR code scanning</li>
                  <li>Include EXIF.js for detailed metadata</li>
                  <li>Add face detection capabilities</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InformationExtractor;