import React, { useState } from 'react';

const LocationSection = () => {
  const [locationResult, setLocationResult] = useState('');
  const [resultType, setResultType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = () => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      showLocationResult('Geolocation is not supported by this browser.', 'error');
      setIsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      options
    );
  };

  const onLocationSuccess = (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = new Date(position.timestamp).toLocaleString();
    
    const locationInfo = (
      <div>
        <strong>Location Retrieved Successfully!</strong><br />
        Latitude: {latitude.toFixed(6)}<br />
        Longitude: {longitude.toFixed(6)}<br />
        Accuracy: {accuracy} meters<br />
        Timestamp: {timestamp}<br />
        <br />
        <a 
          href={`https://www.google.com/maps?q=${latitude},${longitude}`} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          View on Google Maps
        </a>
      </div>
    );
    
    showLocationResult(locationInfo, 'success');
    setIsLoading(false);
  };

  const onLocationError = (error) => {
    let message = 'An error occurred while retrieving location.';
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied by user.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out.';
        break;
      default:
        break;
    }
    
    showLocationResult(message, 'error');
    setIsLoading(false);
  };

  const showLocationResult = (message, type) => {
    setLocationResult(message);
    setResultType(type);
  };

  return (
    <div className="section">
      <h2>Location Access</h2>
      <button 
        className="btn" 
        onClick={getLocation}
        disabled={isLoading}
      >
        {isLoading ? 'Getting Location...' : 'Get My Location'}
      </button>
      {locationResult && (
        <div className={`result-box ${resultType}`}>
          {locationResult}
        </div>
      )}
    </div>
  );
};

export default LocationSection;