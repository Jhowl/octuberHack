import React from 'react';
// import LocationSection from './components/LocationSection';
// import CameraSection from './components/CameraSection';
import ImageUploader from './components/ImageUploader';

function App() {
  return (
    <div className="container">
      <header>
        <h1>Privacy-First Image Metadata Analysis</h1>
        <p>Extract metadata, GPS location, and get AI insights from image data (no image content processed by AI)</p>
      </header>

      <main>
        {/* <LocationSection /> */}
        {/* <CameraSection /> */}
        <ImageUploader />
      </main>
    </div>
  );
}

export default App;