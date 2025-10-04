import React from 'react';
import LocationSection from './components/LocationSection';
import CameraSection from './components/CameraSection';
import ImageUploader from './components/ImageUploader';

function App() {
  return (
    <div className="container">
      <header>
        <h1>AI-Powered Image Analysis Platform</h1>
        <p>Capture photos or upload images to extract metadata, GPS location, and AI-powered insights</p>
      </header>
      
      <main>
        <LocationSection />
        <CameraSection />
        <ImageUploader />
      </main>
    </div>
  );
}

export default App;