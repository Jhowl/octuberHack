import { useState } from 'react';

const ImageAnalysis = ({ imageBlob, imageUrl }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = async () => {
    if (!imageBlob) return;
    
    setIsAnalyzing(true);
    try {
      const analysisResult = {
        fileInfo: await getFileInfo(imageBlob),
        exifData: await extractExifData(imageBlob),
        colorAnalysis: await analyzeColors(imageUrl),
        textDetection: await detectText(imageUrl),
        timestamp: new Date().toISOString()
      };
      
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis({ error: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileInfo = async (blob) => {
    return {
      size: `${(blob.size / 1024).toFixed(2)} KB`,
      type: blob.type,
      lastModified: new Date().toLocaleString()
    };
  };

  const extractExifData = async (blob) => {
    // Basic EXIF extraction (limited in browser)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
          resolution: `${img.naturalWidth} x ${img.naturalHeight}`
        });
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const analyzeColors = async (imageUrl) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractDominantColors(imageData);
        
        resolve({
          dominantColors: colors,
          brightness: calculateBrightness(imageData),
          contrast: calculateContrast(imageData)
        });
      };
      
      img.src = imageUrl;
    });
  };

  const extractDominantColors = (imageData) => {
    const data = imageData.data;
    const colorMap = {};
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Group similar colors
      const colorKey = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
      colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
    }
    
    // Get top 5 colors
    return Object.entries(colorMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([color, count]) => ({
        rgb: color,
        count,
        hex: rgbToHex(color.split(',').map(Number))
      }));
  };

  const calculateBrightness = (imageData) => {
    const data = imageData.data;
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
      pixelCount++;
    }
    
    return Math.round(totalBrightness / pixelCount);
  };

  const calculateContrast = (imageData) => {
    const data = imageData.data;
    let min = 255, max = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
    }
    
    return Math.round(max - min);
  };

  const rgbToHex = ([r, g, b]) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const detectText = async (imageUrl) => {
    // Placeholder for OCR functionality
    // In a real app, you'd use Tesseract.js or similar
    return {
      detected: false,
      message: "Text detection requires OCR library (Tesseract.js)",
      suggestion: "Add Tesseract.js for text recognition"
    };
  };

  return (
    <div className="image-analysis">
      <button 
        className="btn" 
        onClick={analyzeImage}
        disabled={isAnalyzing || !imageBlob}
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
      </button>
      
      {analysis && (
        <div className="analysis-results">
          <h4>Image Analysis Results</h4>
          
          {analysis.error ? (
            <div className="error">Error: {analysis.error}</div>
          ) : (
            <>
              <div className="analysis-section">
                <h5>File Information</h5>
                <ul>
                  <li>Size: {analysis.fileInfo?.size}</li>
                  <li>Type: {analysis.fileInfo?.type}</li>
                  <li>Resolution: {analysis.exifData?.resolution}</li>
                  <li>Aspect Ratio: {analysis.exifData?.aspectRatio}</li>
                </ul>
              </div>
              
              <div className="analysis-section">
                <h5>Color Analysis</h5>
                <ul>
                  <li>Brightness: {analysis.colorAnalysis?.brightness}/255</li>
                  <li>Contrast: {analysis.colorAnalysis?.contrast}</li>
                </ul>
                <div className="color-palette">
                  <strong>Dominant Colors:</strong>
                  <div className="colors">
                    {analysis.colorAnalysis?.dominantColors?.map((color, index) => (
                      <div 
                        key={index}
                        className="color-swatch"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.hex} (${color.count} pixels)`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="analysis-section">
                <h5>Text Detection</h5>
                <p>{analysis.textDetection?.message}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageAnalysis;