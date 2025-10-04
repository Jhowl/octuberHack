import { useState } from 'react';

const OCRExtractor = ({ imageUrl }) => {
  const [ocrResult, setOcrResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractText = async () => {
    if (!imageUrl) return;
    
    setIsProcessing(true);
    setProgress(0);
    setOcrResult(null);
    
    try {
      // Check if Tesseract is available
      if (typeof window !== 'undefined' && window.Tesseract) {
        // Use Tesseract.js if loaded via CDN
        const { createWorker } = window.Tesseract;
        
        const worker = await createWorker({
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        });
        
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        const { data } = await worker.recognize(imageUrl);
        
        setOcrResult({
          text: data.text,
          confidence: Math.round(data.confidence),
          words: data.words?.length || 0,
          lines: data.lines?.length || 0,
          paragraphs: data.paragraphs?.length || 0,
          blocks: data.blocks?.length || 0,
          processingTime: Date.now()
        });
        
        await worker.terminate();
      } else {
        // Fallback: simulate OCR for demo purposes
        await simulateOCR();
      }
    } catch (error) {
      console.error('OCR failed:', error);
      setOcrResult({ error: error.message });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const simulateOCR = async () => {
    // Simulate OCR processing for demo
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setOcrResult({
      text: "OCR Demo Mode\n\nThis is a demonstration of text extraction.\nTo enable real OCR, install Tesseract.js:\n\nnpm install tesseract.js\n\nOr include via CDN in public/index.html:\n<script src='https://unpkg.com/tesseract.js@4/dist/tesseract.min.js'></script>",
      confidence: 95,
      words: 25,
      lines: 8,
      paragraphs: 3,
      blocks: 1,
      processingTime: Date.now(),
      isDemo: true
    });
  };

  const copyText = () => {
    if (ocrResult?.text) {
      navigator.clipboard.writeText(ocrResult.text).then(() => {
        alert('Text copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy text');
      });
    }
  };

  const downloadText = () => {
    if (!ocrResult?.text) return;
    
    const blob = new Blob([ocrResult.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-text-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ocr-extractor">
      <h4>Text Recognition (OCR)</h4>
      
      <div className="ocr-controls">
        <button 
          className="btn" 
          onClick={extractText}
          disabled={isProcessing || !imageUrl}
        >
          {isProcessing ? `Processing... ${progress}%` : 'Extract Text'}
        </button>
        
        {ocrResult?.text && (
          <>
            <button className="btn" onClick={copyText}>
              Copy Text
            </button>
            <button className="btn" onClick={downloadText}>
              Download Text
            </button>
          </>
        )}
      </div>
      
      {isProcessing && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">{progress}% Complete</div>
        </div>
      )}
      
      {ocrResult && (
        <div className="ocr-results">
          {ocrResult.error ? (
            <div className="error">OCR Error: {ocrResult.error}</div>
          ) : (
            <>
              <div className="ocr-stats">
                <div className="stat">
                  <span className="stat-label">Confidence:</span>
                  <span className="stat-value">{ocrResult.confidence}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Words:</span>
                  <span className="stat-value">{ocrResult.words}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Lines:</span>
                  <span className="stat-value">{ocrResult.lines}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Paragraphs:</span>
                  <span className="stat-value">{ocrResult.paragraphs}</span>
                </div>
              </div>
              
              <div className="extracted-text">
                <h5>Extracted Text: {ocrResult.isDemo && <span className="demo-badge">DEMO MODE</span>}</h5>
                <div className="text-content">
                  {ocrResult.text ? (
                    <pre>{ocrResult.text}</pre>
                  ) : (
                    <em>No text detected in image</em>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OCRExtractor;