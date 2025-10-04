import { useState } from 'react';

const PrivacyNotice = ({ onAccept, onDecline, isVisible }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="privacy-notice-overlay">
      <div className="privacy-notice-modal">
        <div className="privacy-header">
          <h3>🔒 Privacy & Data Sharing Notice</h3>
        </div>
        
        <div className="privacy-content">
          <div className="privacy-summary">
            <p><strong>Before analyzing your image, please understand what data will be processed:</strong></p>
          </div>

          <div className="data-categories">
            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">📁</span>
                <strong>File Information</strong>
              </div>
              <ul>
                <li>Filename and file size</li>
                <li>File type and format</li>
                <li>Upload timestamp</li>
                <li>MD5 hash for integrity</li>
              </ul>
            </div>

            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">📍</span>
                <strong>Location Data (if available)</strong>
              </div>
              <ul>
                <li>GPS coordinates from EXIF data</li>
                <li>Altitude information</li>
                <li>Location timestamp</li>
                <li>Map references</li>
              </ul>
            </div>

            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">📷</span>
                <strong>Camera & Technical Data</strong>
              </div>
              <ul>
                <li>Camera make and model</li>
                <li>Photo settings (ISO, aperture, etc.)</li>
                <li>Date and time taken</li>
                <li>Image dimensions and properties</li>
              </ul>
            </div>

            <div className="data-category">
              <div className="category-header">
                <span className="category-icon">🤖</span>
                <strong>AI Analysis (Metadata Only)</strong>
              </div>
              <ul>
                <li>Technical specification analysis</li>
                <li>Geographic context from GPS data</li>
                <li>Temporal pattern analysis</li>
                <li>Device and equipment assessment</li>
                <li><strong>NO image content is processed by AI</strong></li>
              </ul>
            </div>
          </div>

          <div className="privacy-details">
            <button 
              className="details-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} Detailed Privacy Information
            </button>
            
            {showDetails && (
              <div className="detailed-info">
                <div className="info-section">
                  <h4>🔐 Data Processing</h4>
                  <ul>
                    <li><strong>Local Processing</strong>: Metadata extraction happens on our servers</li>
                    <li><strong>AI Analysis</strong>: Only extracted metadata is sent to OpenAI (NO image content)</li>
                    <li><strong>Enhanced Privacy</strong>: Your actual images are never processed by AI services</li>
                    <li><strong>No Permanent Storage</strong>: Images are not stored unless you explicitly save them</li>
                    <li><strong>Metadata Only</strong>: AI analyzes technical data, GPS, EXIF, and file information</li>
                  </ul>
                </div>

                <div className="info-section">
                  <h4>⚠️ Privacy Risks</h4>
                  <ul>
                    <li><strong>Location Exposure</strong>: GPS data can reveal where photos were taken</li>
                    <li><strong>Device Information</strong>: Camera data can identify your device</li>
                    <li><strong>Timestamps</strong>: Date/time data can reveal when photos were taken</li>
                    <li><strong>Metadata Patterns</strong>: Technical data can reveal usage patterns</li>
                    <li><strong>Reduced Risk</strong>: Image content is NOT processed by AI services</li>
                  </ul>
                </div>

                <div className="info-section">
                  <h4>🛡️ Your Rights</h4>
                  <ul>
                    <li><strong>Consent Required</strong>: Analysis only proceeds with your explicit consent</li>
                    <li><strong>Data Control</strong>: You can choose what analysis to perform</li>
                    <li><strong>No Tracking</strong>: We don't track or profile users</li>
                    <li><strong>Transparency</strong>: All extracted data is shown to you</li>
                  </ul>
                </div>

                <div className="info-section">
                  <h4>🔧 Recommendations</h4>
                  <ul>
                    <li><strong>Remove Sensitive Images</strong>: Don't upload personal or sensitive photos</li>
                    <li><strong>Check EXIF Data</strong>: Be aware that photos may contain location data</li>
                    <li><strong>Use Test Images</strong>: Try with non-personal images first</li>
                    <li><strong>Review Results</strong>: Check what data was extracted before saving</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="consent-section">
            <div className="consent-text">
              <p><strong>By proceeding, you acknowledge that:</strong></p>
              <ul>
                <li>You understand what data will be extracted and analyzed</li>
                <li>You consent to processing of image metadata and content</li>
                <li>You are responsible for ensuring you have rights to analyze this image</li>
                <li>You understand the privacy implications of sharing image data</li>
              </ul>
            </div>

            <div className="consent-actions">
              <button className="btn consent-decline" onClick={onDecline}>
                🚫 Decline - Don't Analyze
              </button>
              <button className="btn consent-accept" onClick={onAccept}>
                ✅ I Understand & Consent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;