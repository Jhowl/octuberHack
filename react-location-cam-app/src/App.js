import React from 'react';
import LocationSection from './components/LocationSection';
import CameraSection from './components/CameraSection';
import ImageUploader from './components/ImageUploader';

function App() {
  return (
    <div className="container">
      <header>
        <h1>Location & Camera React App</h1>
        <p>Capture photos or upload images to extract detailed information</p>
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