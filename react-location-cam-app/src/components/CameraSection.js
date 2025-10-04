import { useState, useRef, useCallback, useEffect } from 'react';
import ImageAnalysis from './ImageAnalysis';
import InformationExtractor from './InformationExtractor';
import OCRExtractor from './OCRExtractor';

const CameraSection = () => {
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setVideoReady(false);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }
      
      // Start with basic constraints, fallback if needed
      let constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      };
      
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.log('Trying fallback constraints...', err);
        // Fallback to basic video constraint
        constraints = { video: true };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Force play the video
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.log('Auto-play failed, user interaction may be required:', playError);
        }
      }
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      let message = 'Failed to access camera: ' + error.message;
      
      if (error.name === 'NotAllowedError') {
        message = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        message = 'Camera not supported by this browser.';
      }
      
      alert(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setVideoReady(false);
    }
  }, [stream]);

  // Handle video load events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const handleLoadedMetadata = () => {
      setVideoReady(true);
    };

    const handleCanPlay = () => {
      setVideoReady(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!stream || !videoRef.current || !canvasRef.current || !videoReady) {
      alert('Video not ready. Please wait a moment and try again.');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Double check video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Video dimensions not available. Please try again.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas first
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        alert('Failed to capture photo. Please try again.');
        return;
      }
      
      try {
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toLocaleString();
        const fileSize = (blob.size / 1024).toFixed(2);
        
        const newImage = {
          id: Date.now(),
          url,
          timestamp,
          fileSize,
          blob
        };
        
        setCapturedImages(prev => [newImage, ...prev]);
      } catch (error) {
        console.error('Error creating object URL:', error);
        alert('Failed to process captured photo.');
      }
    }, 'image/jpeg', 0.9);
  }, [stream, videoReady]);

  const downloadImage = (image) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `photo_${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="section">
      <h2>Camera Access</h2>
      
      <div>
        <button 
          className="btn" 
          onClick={stream ? stopCamera : startCamera}
          disabled={isLoading}
        >
          {isLoading ? 'Starting Camera...' : stream ? 'Stop Camera' : 'Start Camera'}
        </button>
        
        <button 
          className="btn" 
          onClick={capturePhoto}
          disabled={!stream || !videoReady}
        >
          {videoReady ? 'Capture Photo' : 'Video Loading...'}
        </button>
      </div>
      
      <div className="camera-container">
        {stream && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-element"
          />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      {capturedImages.length > 0 && (
        <div className="captured-images">
          <h3>Captured Images</h3>
          {capturedImages.map((image) => (
            <div key={image.id} className="image-container">
              <img
                src={image.url}
                alt="Captured"
                className="captured-image"
              />
              <div className="image-timestamp">
                Captured: {image.timestamp} ({image.fileSize} KB)
                <button
                  className="download-link"
                  onClick={() => downloadImage(image)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Download
                </button>
              </div>
              <ImageAnalysis 
                imageBlob={image.blob} 
                imageUrl={image.url}
              />
              <InformationExtractor 
                imageBlob={image.blob} 
                imageUrl={image.url}
              />
              <OCRExtractor 
                imageUrl={image.url}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CameraSection;