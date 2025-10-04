# Image Metadata Extraction API

A FastAPI-based REST API that extracts comprehensive metadata from uploaded images, including EXIF data, GPS location information, and technical image properties.

## Features

### 🔍 **Comprehensive Metadata Extraction**
- **File Information**: Name, size, type, MD5 hash, upload timestamp
- **Image Properties**: Dimensions, aspect ratio, megapixels, color info, orientation
- **EXIF Data**: Camera settings, timestamps, technical parameters
- **GPS Location**: Coordinates, altitude, timestamps, map links
- **AI Analysis**: OpenAI-powered image content analysis and description
- **Processing Info**: API version, processing time, status

### 📍 **GPS Location Extraction**
- Decimal degree coordinates with 8-decimal precision
- Altitude information (above/below sea level)
- GPS timestamps (date and UTC time)
- Direct map links (Google Maps, OpenStreetMap)
- Raw GPS data from EXIF

### 🚀 **API Endpoints**

#### `POST /extract-metadata`
Extract complete metadata from uploaded image (includes AI analysis)
- **Input**: Image file (multipart/form-data)
- **Output**: Comprehensive JSON metadata with AI analysis
- **Supports**: JPG, PNG, GIF, BMP, WebP, TIFF

#### `POST /extract-gps-only`
Extract only GPS location data (optimized)
- **Input**: Image file (multipart/form-data)  
- **Output**: GPS coordinates and location info
- **Use Case**: When you only need location data

#### `POST /analyze-image-ai`
AI-powered image analysis using OpenAI Vision API
- **Input**: Image file (multipart/form-data)
- **Output**: Detailed AI analysis with metadata context
- **Features**: Content analysis, quality assessment, context identification

#### `POST /save-image`
Save image permanently with complete metadata analysis
- **Input**: Image file (multipart/form-data)
- **Output**: Save confirmation with image ID and complete analysis
- **Storage**: Saves both image file and metadata JSON

#### `GET /saved-images`
List all saved images with summary information
- **Output**: Array of saved images with metadata summaries
- **Info**: Image ID, filename, size, GPS/AI availability

#### `GET /saved-images/{image_id}`
Get complete metadata for a specific saved image
- **Input**: Image ID (path parameter)
- **Output**: Complete metadata and analysis results

#### `GET /ai-status`
Check AI analysis availability and configuration
- **Output**: AI service status, model info, available features

#### `GET /`
API information and available endpoints

#### `GET /health`
Health check endpoint

#### `GET /docs`
Interactive API documentation (Swagger UI)

## Installation & Setup

### 1. **Install Dependencies**
```bash
cd image-metadata-api
externally-managed-environment

× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.
    
    If you wish to install a non-Debian-packaged Python package,
    create a virtual environment using python3 -m venv path/to/venv.
    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make
    sure you have python3-full installed.
    
    If you wish to install a non-Debian packaged Python application,
    it may be easiest to use pipx install xyz, which will manage a
    virtual environment for you. Make sure you have pipx installed.
    
    See /usr/share/doc/python3.12/README.venv for more information.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
```

### 2. **Run the API**
```bash
python app.py
```

Or using uvicorn directly:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 3. **Access the API**
- **API Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Usage Examples

### **Using cURL**

#### Extract Complete Metadata:
```bash
curl -X POST "http://localhost:8000/extract-metadata" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your-image.jpg"
```

#### Extract GPS Only:
```bash
curl -X POST "http://localhost:8000/extract-gps-only" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your-image.jpg"
```

### **Using Python Requests**

```python
import requests

# Extract complete metadata
with open('image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/extract-metadata',
        files={'file': f}
    )
    metadata = response.json()
    print(metadata)

# Extract GPS only
with open('image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/extract-gps-only',
        files={'file': f}
    )
    gps_data = response.json()
    print(gps_data)
```

### **Using JavaScript/Fetch**

```javascript
// Extract metadata from file input
const fileInput = document.getElementById('fileInput');
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/extract-metadata', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Response Format

### **Complete Metadata Response**

```json
{
  "status": "success",
  "message": "Metadata extracted successfully",
  "file_info": {
    "filename": "IMG_1234.jpg",
    "size_bytes": 2048576,
    "size_formatted": "2.00 MB",
    "content_type": "image/jpeg",
    "md5_hash": "d41d8cd98f00b204e9800998ecf8427e",
    "upload_timestamp": "2024-01-15T14:30:25.123456"
  },
  "image_properties": {
    "dimensions": {
      "width": 4032,
      "height": 3024,
      "resolution": "4032x3024",
      "aspect_ratio": 1.333,
      "megapixels": 12.19,
      "orientation": "landscape"
    },
    "color_info": {
      "mode": "RGB",
      "has_transparency": false,
      "color_palette_size": "More than 16M colors"
    },
    "technical": {
      "format": "JPEG",
      "format_description": "JPEG (ISO 10918)",
      "is_animated": false,
      "n_frames": 1
    }
  },
  "exif_data": {
    "Make": "Apple",
    "Model": "iPhone 12 Pro",
    "DateTime": "2024:01:15 14:30:25",
    "ExposureTime": "1/120",
    "FNumber": "1.6",
    "ISO": "64"
  },
  "gps_location": {
    "latitude": 37.7749295,
    "longitude": -122.4194155,
    "latitude_ref": "N",
    "longitude_ref": "W",
    "coordinates_decimal": "37.7749295, -122.4194155",
    "altitude": 16.2,
    "altitude_ref": "above sea level",
    "gps_date": "2024:01:15",
    "gps_time_utc": "22:30:25",
    "google_maps_url": "https://maps.google.com/?q=37.7749295,-122.4194155",
    "openstreetmap_url": "https://www.openstreetmap.org/?mlat=37.7749295&mlon=-122.4194155&zoom=15",
    "raw_gps_data": {
      "GPSLatitude": "[37, 46, 29.758]",
      "GPSLatitudeRef": "N"
    }
  },
  "processing_info": {
    "api_version": "1.0.0",
    "processed_at": "2024-01-15T14:30:25.789012"
  }
}
```

### **GPS-Only Response**

```json
{
  "status": "success",
  "message": "GPS location extracted successfully",
  "filename": "IMG_1234.jpg",
  "gps_location": {
    "latitude": 37.7749295,
    "longitude": -122.4194155,
    "coordinates_decimal": "37.7749295, -122.4194155",
    "google_maps_url": "https://maps.google.com/?q=37.7749295,-122.4194155",
    "openstreetmap_url": "https://www.openstreetmap.org/?mlat=37.7749295&mlon=-122.4194155&zoom=15"
  },
  "processed_at": "2024-01-15T14:30:25.789012"
}
```

### **Error Response**

```json
{
  "status": "no_gps_data",
  "message": "No GPS data found in EXIF",
  "filename": "screenshot.png",
  "gps_location": {
    "error": "No GPS data found in EXIF"
  }
}
```

## Integration with React App

To integrate with your React app, create an API service:

```javascript
// services/metadataAPI.js
const API_BASE_URL = 'http://localhost:8000';

export const extractMetadata = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/extract-metadata`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

export const extractGPSOnly = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/extract-gps-only`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

## Supported Image Formats

- ✅ **JPEG/JPG** - Full EXIF and GPS support
- ✅ **PNG** - Basic metadata (limited EXIF)
- ✅ **GIF** - Basic properties
- ✅ **BMP** - Basic properties  
- ✅ **WebP** - Basic properties
- ✅ **TIFF** - Full EXIF support

## Security & Privacy

- **Local Processing**: All processing happens on your server
- **No Data Storage**: Images are not saved or cached
- **CORS Enabled**: Configured for React development
- **File Validation**: Only image files are accepted
- **Error Handling**: Comprehensive error responses

## Development

### **Run in Development Mode**
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### **Run Tests**
```bash
pytest tests/
```

### **Docker Deployment**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Performance Notes

- **Memory Efficient**: Processes images in memory without saving
- **Fast Processing**: Optimized for quick metadata extraction
- **Concurrent Requests**: FastAPI handles multiple simultaneous uploads
- **File Size Limits**: Configure via FastAPI settings if needed

## Troubleshooting

### **Common Issues**

1. **CORS Errors**: Update `allow_origins` in CORS middleware
2. **Large Files**: Increase FastAPI file size limits
3. **Missing GPS**: Only JPEG files typically contain GPS EXIF data
4. **Import Errors**: Ensure all requirements are installed

### **Logs and Debugging**

The API provides detailed error messages and logs processing information for debugging.