import { useState } from 'react';
import MetadataDisclosure from './MetadataDisclosure';

const AIImageAnalyzer = ({ imageFile, imageUrl }) => {
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMetadataDisclosure, setShowMetadataDisclosure] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState(
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:8000' 
      : `http://${window.location.hostname}:8000`
  );

  const analyzeWithAI = async () => {
    if (!imageFile) {
      alert('No image file available');
      return;
    }
    
    // First extract metadata to show user what will be sent
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const metadataResponse = await fetch(`${apiEndpoint}/extract-metadata`, {
        method: 'POST',
        body: formData
      });
      
      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json();
        setExtractedMetadata(metadataData);
        setShowMetadataDisclosure(true);
      } else {
        // Proceed without metadata disclosure if extraction fails
        proceedWithAIAnalysis();
      }
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      // Proceed without metadata disclosure if extraction fails
      proceedWithAIAnalysis();
    }
  };

  const proceedWithAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiResult(null);
    setShowMetadataDisclosure(false);
    
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await fetch(`${apiEndpoint}/analyze-image-ai`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setAiResult({
          error: data.message || `AI analysis failed: ${response.status} ${response.statusText}`,
          status: data.status || 'error',
          suggestion: 'Make sure OpenAI API key is configured on the server'
        });
        return;
      }
      
      setAiResult(data);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiResult({
        error: error.message,
        suggestion: 'Check if the API server is running and OpenAI is configured'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/ai-status`);
      const data = await response.json();
      
      if (data.ai_available) {
        alert(`✅ AI Analysis Available!\nModel: ${data.model}\nFeatures: ${data.features.length} available`);
      } else {
        alert(`❌ AI Analysis Unavailable\nOpenAI configured: ${data.openai_configured}\nStatus: ${data.status}`);
      }
    } catch (error) {
      alert(`❌ Cannot check AI status: ${error.message}`);
    }
  };

  const copyAnalysis = () => {
    if (aiResult?.ai_analysis?.analysis) {
      navigator.clipboard.writeText(aiResult.ai_analysis.analysis).then(() => {
        alert('AI analysis copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy analysis');
      });
    }
  };

  const downloadAnalysis = () => {
    if (!aiResult) return;
    
    const analysisText = aiResult.ai_analysis?.analysis || JSON.stringify(aiResult, null, 2);
    const blob = new Blob([analysisText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-analysis-${imageFile.name}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-image-analyzer">
      <h4>🤖 AI Image Analysis</h4>
      <p className="description">Analyze image content using OpenAI Vision API</p>
      
      <div className="ai-controls">
        <button 
          className="btn" 
          onClick={analyzeWithAI}
          disabled={isAnalyzing || !imageFile}
        >
          {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with AI'}
        </button>
        
        <button className="btn-small" onClick={checkAIStatus}>
          Check AI Status
        </button>
        
        {aiResult?.ai_analysis?.analysis && (
          <>
            <button className="btn" onClick={copyAnalysis}>
              Copy Analysis
            </button>
            <button className="btn" onClick={downloadAnalysis}>
              Download Analysis
            </button>
          </>
        )}
      </div>
      
      {aiResult && (
        <div className="ai-results">
          {aiResult.error ? (
            <div className="ai-error">
              <div className="error-message">
                ❌ AI Analysis Error: {aiResult.error}
              </div>
              {aiResult.suggestion && (
                <div className="error-suggestion">
                  💡 {aiResult.suggestion}
                </div>
              )}
              <div className="setup-instructions">
                <h6>🔧 Setup Instructions:</h6>
                <ol>
                  <li>Get an OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></li>
                  <li>Set the environment variable: <code>OPENAI_API_KEY=your_key_here</code></li>
                  <li>Restart the Python API server</li>
                  <li>Test AI status with the "Check AI Status" button</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="ai-success">
              <div className="success-header">
                ✅ AI Analysis Complete
                <span className="status-badge">{aiResult.ai_analysis?.status}</span>
              </div>
              
              {aiResult.ai_analysis?.analysis && (
                <div className="analysis-content">
                  <h5>🔍 AI Analysis Results</h5>
                  <div className="analysis-text">
                    {aiResult.ai_analysis.analysis.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="analysis-metadata">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="label">Model:</span>
                    <span className="value">{aiResult.ai_analysis?.model}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Analysis Type:</span>
                    <span className="value">{aiResult.ai_analysis?.analysis_type || 'N/A'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Tokens Used:</span>
                    <span className="value">{aiResult.ai_analysis?.tokens_used || 'N/A'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Image Processed:</span>
                    <span className="value">
                      {aiResult.ai_analysis?.image_content_processed ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Metadata Sent:</span>
                    <span className="value">
                      {aiResult.ai_analysis?.metadata_context_provided ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Analysis Time:</span>
                    <span className="value">
                      {aiResult.ai_analysis?.analysis_timestamp ? 
                        new Date(aiResult.ai_analysis.analysis_timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              {aiResult.ai_analysis?.metadata_sent && (
                <div className="metadata-sent-section">
                  <h5>📋 Metadata Sent to AI</h5>
                  <div className="metadata-sent-preview">
                    <pre>{aiResult.ai_analysis.metadata_sent.substring(0, 500)}...</pre>
                    <button 
                      className="btn-small"
                      onClick={() => setShowMetadataDisclosure(true)}
                    >
                      View Full Metadata Sent
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <MetadataDisclosure
        metadata={extractedMetadata}
        isVisible={showMetadataDisclosure}
        onClose={() => {
          setShowMetadataDisclosure(false);
          if (isAnalyzing === false) {
            // If user is seeing disclosure before analysis, proceed with analysis
            proceedWithAIAnalysis();
          }
        }}
      />
    </div>
  );
};

export default AIImageAnalyzer;