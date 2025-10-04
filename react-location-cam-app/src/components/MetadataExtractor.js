import { useState } from 'react';

const MetadataExtractor = ({ imageFile, imageUrl }) => {
  const [metadata, setMetadata] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const extractMetadata = async () => {
    if (!imageFile) return;
    
    setIsExtracting(true);
    try {
      const basicMetadata = await getBasicMetadata(imageFile, imageUrl);
      const exifData = await extractEXIF(imageFile);
      const fileInfo = getFileInfo(imageFile);
      
      setMetadata({
        basic: basicMetadata,
        exif: exifData,
        file: fileInfo,
        extractedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      setMetadata({ error: error.message });
    } finally {
      setIsExtracting(false);
    }
  };

  const getBasicMetadata = (file, url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3),
          resolution: `${img.naturalWidth} x ${img.naturalHeight}`,
          megapixels: ((img.naturalWidth * img.naturalHeight) / 1000000).toFixed(2),
          orientation: img.naturalWidth > img.naturalHeight ? 'Landscape' : 
                      img.naturalWidth < img.naturalHeight ? 'Portrait' : 'Square'
        });
      };
      img.src = url;
    });
  };

  const getFileInfo = (file) => {
    return {
      name: file.name,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
      lastModifiedFormatted: new Date(file.lastModified).toLocaleString(),
      extension: file.name.split('.').pop()?.toLowerCase() || 'unknown'
    };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const extractEXIF = async (file) => {
    // Basic EXIF extraction without external library
    // For full EXIF support, you'd use exif-js or similar
    
    if (file.type !== 'image/jpeg') {
      return {
        supported: false,
        message: 'EXIF data is primarily available in JPEG files',
        suggestion: 'Install exif-js library for comprehensive EXIF extraction'
      };
    }

    try {
      // Read first few bytes to check for EXIF marker
      const arrayBuffer = await file.slice(0, 1000).arrayBuffer();
      const view = new DataView(arrayBuffer);
      
      // Check for JPEG SOI marker (0xFFD8)
      if (view.getUint16(0) !== 0xFFD8) {
        return { supported: false, message: 'Not a valid JPEG file' };
      }

      // Look for EXIF marker (0xFFE1)
      let hasExif = false;
      for (let i = 2; i < view.byteLength - 1; i++) {
        if (view.getUint16(i) === 0xFFE1) {
          hasExif = true;
          break;
        }
      }

      return {
        supported: true,
        hasExifData: hasExif,
        message: hasExif ? 
          'EXIF data detected. Install exif-js for detailed extraction.' :
          'No EXIF data found in this image.',
        suggestion: 'npm install exif-js for GPS, camera settings, and more',
        basicInfo: {
          jpegMarkers: 'SOI marker found',
          exifPresent: hasExif ? 'Yes' : 'No'
        }
      };
    } catch (error) {
      return {
        supported: false,
        error: error.message,
        message: 'Failed to analyze EXIF data'
      };
    }
  };

  const copyMetadata = () => {
    if (metadata) {
      const metadataText = JSON.stringify(metadata, null, 2);
      navigator.clipboard.writeText(metadataText).then(() => {
        alert('Metadata copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy metadata');
      });
    }
  };

  const downloadMetadata = () => {
    if (!metadata) return;
    
    const metadataText = JSON.stringify(metadata, null, 2);
    const blob = new Blob([metadataText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `metadata-${imageFile.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="metadata-extractor">
      <h4>📊 Detailed Metadata Extraction</h4>
      
      <div className="metadata-controls">
        <button 
          className="btn" 
          onClick={extractMetadata}
          disabled={isExtracting || !imageFile}
        >
          {isExtracting ? 'Extracting...' : 'Extract Metadata'}
        </button>
        
        {metadata && !metadata.error && (
          <>
            <button className="btn" onClick={copyMetadata}>
              Copy Metadata
            </button>
            <button className="btn" onClick={downloadMetadata}>
              Download JSON
            </button>
          </>
        )}
      </div>
      
      {metadata && (
        <div className="metadata-results">
          {metadata.error ? (
            <div className="error">Error: {metadata.error}</div>
          ) : (
            <>
              <div className="metadata-section">
                <h5>📁 File Information</h5>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="label">Filename:</span>
                    <span className="value">{metadata.file?.name}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">File Size:</span>
                    <span className="value">{metadata.file?.sizeFormatted}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">File Type:</span>
                    <span className="value">{metadata.file?.type}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Extension:</span>
                    <span className="value">{metadata.file?.extension?.toUpperCase()}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Last Modified:</span>
                    <span className="value">{metadata.file?.lastModifiedFormatted}</span>
                  </div>
                </div>
              </div>

              <div className="metadata-section">
                <h5>🖼️ Image Properties</h5>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="label">Dimensions:</span>
                    <span className="value">{metadata.basic?.resolution}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Megapixels:</span>
                    <span className="value">{metadata.basic?.megapixels} MP</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Aspect Ratio:</span>
                    <span className="value">{metadata.basic?.aspectRatio}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Orientation:</span>
                    <span className="value">{metadata.basic?.orientation}</span>
                  </div>
                </div>
              </div>

              <div className="metadata-section">
                <h5>📷 EXIF Information</h5>
                {metadata.exif?.supported ? (
                  <div className="exif-info">
                    <div className="metadata-item">
                      <span className="label">EXIF Support:</span>
                      <span className="value">✅ Supported</span>
                    </div>
                    <div className="metadata-item">
                      <span className="label">EXIF Data Present:</span>
                      <span className="value">
                        {metadata.exif.hasExifData ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="exif-message">
                      <p>{metadata.exif.message}</p>
                      <p className="suggestion">💡 {metadata.exif.suggestion}</p>
                    </div>
                  </div>
                ) : (
                  <div className="exif-info">
                    <p>{metadata.exif?.message}</p>
                    <p className="suggestion">💡 {metadata.exif?.suggestion}</p>
                  </div>
                )}
              </div>

              <div className="metadata-section">
                <h5>🔧 Enhancement Options</h5>
                <div className="enhancement-list">
                  <div className="enhancement-item">
                    <strong>Full EXIF Support:</strong> Install exif-js library
                    <code>npm install exif-js</code>
                  </div>
                  <div className="enhancement-item">
                    <strong>GPS Data:</strong> Extract location from EXIF
                  </div>
                  <div className="enhancement-item">
                    <strong>Camera Settings:</strong> ISO, aperture, shutter speed
                  </div>
                  <div className="enhancement-item">
                    <strong>Color Profile:</strong> ICC profile information
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MetadataExtractor;