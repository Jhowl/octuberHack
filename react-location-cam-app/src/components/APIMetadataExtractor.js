import { useState } from 'react';

const APIMetadataExtractor = ({ imageFile, imageUrl }) => {
    const [apiResult, setApiResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000');

    const extractWithAPI = async (endpoint = 'extract-metadata') => {
        if (!imageFile) {
            alert('No image file available');
            return;
        }

        setIsProcessing(true);
        setApiResult(null);

        try {
            const formData = new FormData();
            formData.append('file', imageFile);

            const response = await fetch(`${apiEndpoint}/${endpoint}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle API error responses
                setApiResult({
                    error: data.message || `API request failed: ${response.status} ${response.statusText}`,
                    status: data.status || 'error',
                    suggestion: 'Check the API logs for more details'
                });
                return;
            }

            setApiResult(data);

        } catch (error) {
            console.error('API extraction failed:', error);
            setApiResult({
                error: error.message,
                suggestion: 'Make sure the Python API is running on http://localhost:8000'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const testAPIConnection = async () => {
        try {
            const response = await fetch(`${apiEndpoint}/health`);
            if (response.ok) {
                const data = await response.json();
                alert(`✅ API Connected!\nStatus: ${data.status}\nTime: ${data.timestamp}`);
            } else {
                alert(`❌ API Error: ${response.status}`);
            }
        } catch (error) {
            alert(`❌ Cannot connect to API: ${error.message}\n\nMake sure the Python API is running:\n1. cd image-metadata-api\n2. pip install -r requirements.txt\n3. python app.py`);
        }
    };

    const copyAPIData = () => {
        if (apiResult) {
            const dataText = JSON.stringify(apiResult, null, 2);
            navigator.clipboard.writeText(dataText).then(() => {
                alert('API response copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy API response');
            });
        }
    };

    const downloadAPIData = () => {
        if (!apiResult) return;

        const dataText = JSON.stringify(apiResult, null, 2);
        const blob = new Blob([dataText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `api-metadata-${imageFile.name}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="api-metadata-extractor">
            <h4>🚀 Python API Metadata Extraction</h4>
            <p className="description">Extract metadata using the Python FastAPI backend</p>

            <div className="api-config">
                <div className="endpoint-config">
                    <label htmlFor="api-endpoint">API Endpoint:</label>
                    <input
                        id="api-endpoint"
                        type="text"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                        placeholder="http://localhost:8000"
                        className="endpoint-input"
                    />
                    <button className="btn-small" onClick={testAPIConnection}>
                        Test Connection
                    </button>
                </div>
            </div>

            <div className="api-controls">
                <button
                    className="btn"
                    onClick={() => extractWithAPI('extract-metadata')}
                    disabled={isProcessing || !imageFile}
                >
                    {isProcessing ? 'Processing...' : 'Extract All Metadata'}
                </button>

                <button
                    className="btn"
                    onClick={() => extractWithAPI('extract-gps-only')}
                    disabled={isProcessing || !imageFile}
                >
                    {isProcessing ? 'Processing...' : 'Extract GPS Only'}
                </button>

                {apiResult && !apiResult.error && (
                    <>
                        <button className="btn" onClick={copyAPIData}>
                            Copy Response
                        </button>
                        <button className="btn" onClick={downloadAPIData}>
                            Download JSON
                        </button>
                    </>
                )}
            </div>

            {apiResult && (
                <div className="api-results">
                    {apiResult.error ? (
                        <div className="api-error">
                            <div className="error-message">
                                ❌ API Error: {apiResult.error}
                            </div>
                            {apiResult.suggestion && (
                                <div className="error-suggestion">
                                    💡 {apiResult.suggestion}
                                </div>
                            )}
                            <div className="setup-instructions">
                                <h6>🔧 Setup Instructions:</h6>
                                <ol>
                                    <li>Navigate to <code>image-metadata-api/</code> directory</li>
                                    <li>Install dependencies: <code>pip install -r requirements.txt</code></li>
                                    <li>Start API: <code>python app.py</code></li>
                                    <li>API will be available at <code>http://localhost:8000</code></li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <div className="api-success">
                            <div className="success-header">
                                ✅ API Response Received
                                <span className="status-badge">{apiResult.status}</span>
                            </div>

                            {apiResult.file_info && (
                                <div className="api-section">
                                    <h5>📁 File Information</h5>
                                    <div className="api-data-grid">
                                        <div className="api-data-item">
                                            <span className="label">Filename:</span>
                                            <span className="value">{apiResult.file_info.filename}</span>
                                        </div>
                                        <div className="api-data-item">
                                            <span className="label">Size:</span>
                                            <span className="value">{apiResult.file_info.size_formatted}</span>
                                        </div>
                                        <div className="api-data-item">
                                            <span className="label">Type:</span>
                                            <span className="value">{apiResult.file_info.content_type}</span>
                                        </div>
                                        <div className="api-data-item">
                                            <span className="label">MD5 Hash:</span>
                                            <span className="value hash">{apiResult.file_info.md5_hash}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {apiResult.image_properties && (
                                <div className="api-section">
                                    <h5>🖼️ Image Properties</h5>
                                    <div className="api-data-grid">
                                        {apiResult.image_properties.dimensions && (
                                            <>
                                                <div className="api-data-item">
                                                    <span className="label">Resolution:</span>
                                                    <span className="value">{apiResult.image_properties.dimensions.resolution}</span>
                                                </div>
                                                <div className="api-data-item">
                                                    <span className="label">Megapixels:</span>
                                                    <span className="value">{apiResult.image_properties.dimensions.megapixels} MP</span>
                                                </div>
                                                <div className="api-data-item">
                                                    <span className="label">Aspect Ratio:</span>
                                                    <span className="value">{apiResult.image_properties.dimensions.aspect_ratio}</span>
                                                </div>
                                                <div className="api-data-item">
                                                    <span className="label">Orientation:</span>
                                                    <span className="value">{apiResult.image_properties.dimensions.orientation}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {apiResult.gps_location && !apiResult.gps_location.error && (
                                <div className="api-section">
                                    <h5>📍 GPS Location</h5>
                                    <div className="gps-coordinates">
                                        <div className="coordinate-display">
                                            <strong>{apiResult.gps_location.coordinates_decimal}</strong>
                                        </div>
                                        {apiResult.gps_location.altitude && (
                                            <div className="altitude-display">
                                                Altitude: {apiResult.gps_location.altitude}m {apiResult.gps_location.altitude_ref}
                                            </div>
                                        )}
                                        {apiResult.gps_location.gps_date && (
                                            <div className="gps-timestamp">
                                                📅 {apiResult.gps_location.gps_date}
                                                {apiResult.gps_location.gps_time_utc && ` 🕒 ${apiResult.gps_location.gps_time_utc}`}
                                            </div>
                                        )}
                                    </div>
                                    <div className="map-links">
                                        <a href={apiResult.gps_location.google_maps_url} target="_blank" rel="noopener noreferrer" className="map-link">
                                            📍 Google Maps
                                        </a>
                                        <a href={apiResult.gps_location.openstreetmap_url} target="_blank" rel="noopener noreferrer" className="map-link">
                                            🗺️ OpenStreetMap
                                        </a>
                                    </div>
                                </div>
                            )}

                            {apiResult.gps_location?.error && (
                                <div className="api-section">
                                    <h5>📍 GPS Location</h5>
                                    <div className="gps-not-found">
                                        ⚠️ {apiResult.gps_location.error}
                                    </div>
                                </div>
                            )}

                            {apiResult.exif_data && Object.keys(apiResult.exif_data).length > 0 && (
                                <div className="api-section">
                                    <h5>📷 EXIF Data ({Object.keys(apiResult.exif_data).length} tags)</h5>
                                    <div className="exif-preview">
                                        {Object.entries(apiResult.exif_data).slice(0, 6).map(([key, value]) => (
                                            <div key={key} className="exif-item">
                                                <strong>{key}:</strong> {String(value)}
                                            </div>
                                        ))}
                                        {Object.keys(apiResult.exif_data).length > 6 && (
                                            <div className="exif-more">
                                                ... and {Object.keys(apiResult.exif_data).length - 6} more tags
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {apiResult.processing_info && (
                                <div className="api-section">
                                    <h5>⚙️ Processing Info</h5>
                                    <div className="processing-info">
                                        <div>API Version: {apiResult.processing_info.api_version}</div>
                                        <div>Processed: {new Date(apiResult.processing_info.processed_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default APIMetadataExtractor;