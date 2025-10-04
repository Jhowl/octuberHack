import { useState, useEffect } from 'react';
import ImageSaver from './ImageSaver';

const ImageDashboard = ({ imageFile, imageUrl }) => {
  const [allData, setAllData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [apiEndpoint] = useState(
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:8000' 
      : `http://${window.location.hostname}:8000`
  );

  const extractAllData = async () => {
    if (!imageFile) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await fetch(`${apiEndpoint}/extract-metadata`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAllData(data);
        setActiveTab('overview');
      } else {
        setAllData({ error: data.message || 'Failed to extract data' });
      }
    } catch (error) {
      setAllData({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllData = () => {
    if (!allData || allData.error) return;
    
    const dataText = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `complete-analysis-${imageFile.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'ai', label: '🤖 AI Analysis', icon: '🤖' },
    { id: 'location', label: '📍 Location', icon: '📍' },
    { id: 'technical', label: '🔧 Technical', icon: '🔧' },
    { id: 'exif', label: '📷 EXIF Data', icon: '📷' },
    { id: 'save', label: '💾 Save Image', icon: '💾' }
  ];

  const renderOverview = () => (
    <div className="overview-content">
      <div className="overview-grid">
        <div className="overview-card">
          <h4>📁 File Information</h4>
          {allData.file_info ? (
            <div className="info-list">
              <div><strong>Name:</strong> {allData.file_info.filename}</div>
              <div><strong>Size:</strong> {allData.file_info.size_formatted}</div>
              <div><strong>Type:</strong> {allData.file_info.content_type}</div>
              <div><strong>Hash:</strong> <code>{allData.file_info.md5_hash?.substring(0, 16)}...</code></div>
            </div>
          ) : (
            <div className="no-data">No file information available</div>
          )}
        </div>

        <div className="overview-card">
          <h4>🖼️ Image Properties</h4>
          {allData.image_properties?.dimensions ? (
            <div className="info-list">
              <div><strong>Resolution:</strong> {allData.image_properties.dimensions.resolution}</div>
              <div><strong>Megapixels:</strong> {allData.image_properties.dimensions.megapixels} MP</div>
              <div><strong>Aspect Ratio:</strong> {allData.image_properties.dimensions.aspect_ratio}</div>
              <div><strong>Orientation:</strong> {allData.image_properties.dimensions.orientation}</div>
            </div>
          ) : (
            <div className="no-data">No image properties available</div>
          )}
        </div>

        <div className="overview-card">
          <h4>📍 Location Status</h4>
          {allData.gps_location && !allData.gps_location.error ? (
            <div className="info-list location-found">
              <div><strong>✅ GPS Found</strong></div>
              <div><strong>Coordinates:</strong> {allData.gps_location.coordinates_decimal}</div>
              {allData.gps_location.altitude && (
                <div><strong>Altitude:</strong> {allData.gps_location.altitude}m</div>
              )}
              <a href={allData.gps_location.google_maps_url} target="_blank" rel="noopener noreferrer" className="map-link-small">
                📍 View on Maps
              </a>
            </div>
          ) : (
            <div className="info-list location-not-found">
              <div><strong>❌ No GPS Data</strong></div>
              <div className="error-text">{allData.gps_location?.error || 'GPS information not available'}</div>
            </div>
          )}
        </div>

        <div className="overview-card">
          <h4>🤖 AI Analysis Status</h4>
          {allData.ai_analysis && !allData.ai_analysis.error ? (
            <div className="info-list ai-available">
              <div><strong>✅ AI Analysis Available</strong></div>
              <div><strong>Model:</strong> {allData.ai_analysis.model}</div>
              <div><strong>Tokens:</strong> {allData.ai_analysis.tokens_used || 'N/A'}</div>
              <div><strong>Context:</strong> {allData.ai_analysis.metadata_context_provided ? 'Enhanced' : 'Basic'}</div>
            </div>
          ) : (
            <div className="info-list ai-not-available">
              <div><strong>❌ AI Analysis Unavailable</strong></div>
              <div className="error-text">{allData.ai_analysis?.error || 'AI analysis not configured'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAIAnalysis = () => (
    <div className="ai-content">
      {allData.ai_analysis && !allData.ai_analysis.error ? (
        <div className="ai-analysis-full">
          <div className="ai-header">
            <h4>🤖 AI-Powered Image Analysis</h4>
            <div className="ai-meta">
              <span>Model: {allData.ai_analysis.model}</span>
              <span>Tokens: {allData.ai_analysis.tokens_used}</span>
              <span>Time: {new Date(allData.ai_analysis.analysis_timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div className="ai-analysis-text">
            {allData.ai_analysis.analysis.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="ai-unavailable">
          <h4>🤖 AI Analysis Not Available</h4>
          <p>{allData.ai_analysis?.error || 'AI analysis requires OpenAI API configuration'}</p>
          <div className="setup-hint">
            <strong>To enable AI analysis:</strong>
            <ol>
              <li>Configure OPENAI_API_KEY on the server</li>
              <li>Restart the API service</li>
              <li>Re-upload your image</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );

  const renderLocation = () => (
    <div className="location-content">
      {allData.gps_location && !allData.gps_location.error ? (
        <div className="location-details">
          <h4>📍 GPS Location Information</h4>
          <div className="coordinates-display">
            <div className="coord-main">{allData.gps_location.coordinates_decimal}</div>
            <div className="coord-details">
              <div>Latitude: {allData.gps_location.latitude}° {allData.gps_location.latitude_ref}</div>
              <div>Longitude: {allData.gps_location.longitude}° {allData.gps_location.longitude_ref}</div>
              {allData.gps_location.altitude && (
                <div>Altitude: {allData.gps_location.altitude}m {allData.gps_location.altitude_ref}</div>
              )}
            </div>
          </div>
          
          {(allData.gps_location.gps_date || allData.gps_location.gps_time_utc) && (
            <div className="gps-timestamp">
              <h5>🕒 GPS Timestamp</h5>
              {allData.gps_location.gps_date && <div>Date: {allData.gps_location.gps_date}</div>}
              {allData.gps_location.gps_time_utc && <div>Time (UTC): {allData.gps_location.gps_time_utc}</div>}
            </div>
          )}
          
          <div className="map-links">
            <h5>🗺️ View on Maps</h5>
            <div className="map-buttons">
              <a href={allData.gps_location.google_maps_url} target="_blank" rel="noopener noreferrer" className="map-button">
                📍 Google Maps
              </a>
              <a href={allData.gps_location.openstreetmap_url} target="_blank" rel="noopener noreferrer" className="map-button">
                🗺️ OpenStreetMap
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-location">
          <h4>📍 No GPS Location Data</h4>
          <p>{allData.gps_location?.error || 'This image does not contain GPS location information.'}</p>
          <div className="location-info">
            <strong>GPS data is typically available in:</strong>
            <ul>
              <li>Photos taken with smartphones (location enabled)</li>
              <li>Digital cameras with GPS capability</li>
              <li>Images that haven't been processed or edited</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderTechnical = () => (
    <div className="technical-content">
      <h4>🔧 Technical Information</h4>
      
      {allData.image_properties && (
        <div className="tech-section">
          <h5>Image Properties</h5>
          <div className="tech-grid">
            {allData.image_properties.dimensions && Object.entries(allData.image_properties.dimensions).map(([key, value]) => (
              <div key={key} className="tech-item">
                <span className="tech-label">{key.replace(/_/g, ' ')}:</span>
                <span className="tech-value">{value}</span>
              </div>
            ))}
            {allData.image_properties.color_info && Object.entries(allData.image_properties.color_info).map(([key, value]) => (
              <div key={key} className="tech-item">
                <span className="tech-label">{key.replace(/_/g, ' ')}:</span>
                <span className="tech-value">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {allData.file_info && (
        <div className="tech-section">
          <h5>File Details</h5>
          <div className="tech-grid">
            <div className="tech-item">
              <span className="tech-label">MD5 Hash:</span>
              <span className="tech-value hash-value">{allData.file_info.md5_hash}</span>
            </div>
            <div className="tech-item">
              <span className="tech-label">Upload Time:</span>
              <span className="tech-value">{new Date(allData.file_info.upload_timestamp).toLocaleString()}</span>
            </div>
            <div className="tech-item">
              <span className="tech-label">Size (bytes):</span>
              <span className="tech-value">{allData.file_info.size_bytes?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEXIF = () => (
    <div className="exif-content">
      <h4>📷 EXIF Data</h4>
      {allData.exif_data && Object.keys(allData.exif_data).length > 0 && !allData.exif_data.error ? (
        <div className="exif-data">
          <div className="exif-grid">
            {Object.entries(allData.exif_data).map(([key, value]) => (
              <div key={key} className="exif-item">
                <span className="exif-label">{key}:</span>
                <span className="exif-value">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-exif">
          <p>{allData.exif_data?.error || 'No EXIF data available in this image.'}</p>
          <div className="exif-info">
            <strong>EXIF data typically includes:</strong>
            <ul>
              <li>Camera make and model</li>
              <li>Photo settings (ISO, aperture, shutter speed)</li>
              <li>Date and time taken</li>
              <li>GPS coordinates (if available)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderSave = () => (
    <div className="save-content">
      <ImageSaver 
        imageFile={imageFile} 
        imageUrl={imageUrl}
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'ai': return renderAIAnalysis();
      case 'location': return renderLocation();
      case 'technical': return renderTechnical();
      case 'exif': return renderEXIF();
      case 'save': return renderSave();
      default: return renderOverview();
    }
  };

  return (
    <div className="image-dashboard">
      <div className="dashboard-header">
        <h3>📊 Complete Image Analysis Dashboard</h3>
        <div className="dashboard-controls">
          <button 
            className="btn extract-btn" 
            onClick={extractAllData}
            disabled={isLoading || !imageFile}
          >
            {isLoading ? '🔄 Analyzing...' : '🚀 Extract All Data'}
          </button>
          {allData && !allData.error && (
            <button className="btn download-btn" onClick={downloadAllData}>
              💾 Download Complete Analysis
            </button>
          )}
        </div>
      </div>

      {allData && !allData.error && (
        <>
          <div className="dashboard-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="dashboard-content">
            {renderTabContent()}
          </div>
        </>
      )}

      {allData?.error && (
        <div className="dashboard-error">
          <h4>❌ Analysis Error</h4>
          <p>{allData.error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageDashboard;