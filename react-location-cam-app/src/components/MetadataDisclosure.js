import { useState } from 'react';

const MetadataDisclosure = ({ metadata, isVisible, onClose }) => {
  const [showRawData, setShowRawData] = useState(false);

  if (!isVisible || !metadata) return null;

  const formatMetadataForDisplay = (data) => {
    const sections = [];

    // File Information
    if (data.file_info) {
      sections.push({
        title: "📁 File Information",
        items: [
          { label: "Filename", value: data.file_info.filename },
          { label: "Size", value: data.file_info.size_formatted },
          { label: "Type", value: data.file_info.content_type },
          { label: "MD5 Hash", value: data.file_info.md5_hash },
          { label: "Upload Time", value: new Date(data.file_info.upload_timestamp).toLocaleString() }
        ]
      });
    }

    // Image Properties
    if (data.image_properties?.dimensions) {
      sections.push({
        title: "🖼️ Image Properties",
        items: [
          { label: "Resolution", value: data.image_properties.dimensions.resolution },
          { label: "Megapixels", value: `${data.image_properties.dimensions.megapixels} MP` },
          { label: "Aspect Ratio", value: data.image_properties.dimensions.aspect_ratio },
          { label: "Orientation", value: data.image_properties.dimensions.orientation }
        ]
      });
    }

    // GPS Location
    if (data.gps_location && !data.gps_location.error) {
      sections.push({
        title: "📍 GPS Location Data",
        items: [
          { label: "Coordinates", value: data.gps_location.coordinates_decimal },
          { label: "Latitude", value: `${data.gps_location.latitude}° ${data.gps_location.latitude_ref}` },
          { label: "Longitude", value: `${data.gps_location.longitude}° ${data.gps_location.longitude_ref}` },
          ...(data.gps_location.altitude ? [{ label: "Altitude", value: `${data.gps_location.altitude}m ${data.gps_location.altitude_ref}` }] : []),
          ...(data.gps_location.gps_date ? [{ label: "GPS Date", value: data.gps_location.gps_date }] : []),
          ...(data.gps_location.gps_time_utc ? [{ label: "GPS Time (UTC)", value: data.gps_location.gps_time_utc }] : [])
        ]
      });
    }

    // EXIF Data (show key fields)
    if (data.exif_data && !data.exif_data.error) {
      const exifItems = [];
      const keyFields = ['Make', 'Model', 'DateTime', 'DateTimeOriginal', 'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'Flash', 'WhiteBalance'];
      
      keyFields.forEach(field => {
        if (data.exif_data[field]) {
          exifItems.push({ label: field, value: String(data.exif_data[field]) });
        }
      });

      if (exifItems.length > 0) {
        sections.push({
          title: "📷 Camera/EXIF Data",
          items: exifItems
        });
      }
    }

    return sections;
  };

  const metadataSections = formatMetadataForDisplay(metadata);

  return (
    <div className="metadata-disclosure-overlay">
      <div className="metadata-disclosure-modal">
        <div className="disclosure-header">
          <h3>📋 Metadata Being Sent to AI</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="disclosure-content">
          <div className="disclosure-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Data Transparency Notice:</strong> The following metadata will be sent to OpenAI along with your image for AI analysis.
            </div>
          </div>

          <div className="metadata-sections">
            {metadataSections.map((section, index) => (
              <div key={index} className="metadata-section">
                <h4>{section.title}</h4>
                <div className="metadata-items">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="metadata-item">
                      <span className="item-label">{item.label}:</span>
                      <span className="item-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {metadataSections.length === 0 && (
            <div className="no-metadata">
              <p>No significant metadata found in this image.</p>
            </div>
          )}

          <div className="raw-data-section">
            <button 
              className="toggle-raw-btn"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? '▼' : '▶'} {showRawData ? 'Hide' : 'Show'} Raw Metadata JSON
            </button>
            
            {showRawData && (
              <div className="raw-data-display">
                <pre>{JSON.stringify(metadata, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="privacy-reminder">
            <h4>🔒 Privacy Reminder</h4>
            <ul>
              <li><strong>Image Content:</strong> Your full image will be sent to OpenAI for visual analysis</li>
              <li><strong>Metadata:</strong> All extracted technical data shown above will be included</li>
              <li><strong>Location Data:</strong> {metadata.gps_location?.error ? 'No GPS data found' : 'GPS coordinates will reveal photo location'}</li>
              <li><strong>Device Info:</strong> Camera and device information may be identifiable</li>
            </ul>
          </div>

          <div className="disclosure-actions">
            <button className="btn disclosure-close" onClick={onClose}>
              ✅ I Understand - Continue with Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataDisclosure;