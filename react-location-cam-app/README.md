# Location & Camera React App with Information Extraction

A comprehensive React-based web application that captures images and extracts detailed information from them.

## Features

### Core Functionality
- **Location Access**: Get user's current GPS coordinates with accuracy information
- **Camera Access**: Access device camera (front/back) and capture photos
- **Photo Capture**: Take photos and display them with timestamps
- **Image Upload**: Upload existing images for analysis (drag & drop or browse)
- **Download Photos**: Save captured images locally

### Information Extraction
- **🤖 AI-Powered Analysis**: OpenAI Vision API integration for intelligent image content analysis
- **📊 Interactive Dashboard**: Comprehensive tabbed interface showing all extracted information
- **📍 GPS Location Extraction**: Extract GPS coordinates embedded in image EXIF data with map links
- **📊 Detailed Metadata**: File info, dimensions, technical properties, and hash verification
- **🎨 Visual Analysis**: Color palettes, brightness, contrast, and composition analysis
- **📝 OCR Text Recognition**: Extract text from images (demo mode included, see OCR_SETUP.md for real OCR)
- **📱 Device Location**: Capture current GPS coordinates with each photo
- **🔧 EXIF Support**: Complete EXIF data extraction with camera settings and timestamps
- **📁 Multiple Formats**: Support for JPG, PNG, GIF, WebP, BMP files

### Advanced Features
- **OCR Text Recognition**: Extract text from captured images (see OCR_SETUP.md to enable)
- **Export Functionality**: Download extracted data as JSON or text files
- **Copy to Clipboard**: Easy copying of extracted text and data
- **Progress Tracking**: Visual progress bars for processing
- **Demo Mode**: Works out of the box with simulated OCR for testing
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd react-location-cam-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Enable Advanced Features (Optional)
- **Real OCR**: See `OCR_SETUP.md` for text extraction setup
- **Full GPS Extraction**: See `EXIF_SETUP.md` for complete GPS location extraction

### Building for Production

```bash
npm run build
```

## Usage

### Basic Operations
1. **Location**: Click "Get My Location" to request location access
2. **Camera**: Click "Start Camera" to begin camera stream and capture photos
3. **Upload**: Drag & drop images or click to browse and upload existing images
4. **Analysis**: Each image (captured or uploaded) can be analyzed with multiple tools

### Information Extraction Tools
1. **📊 Interactive Dashboard**: Comprehensive tabbed interface with overview, AI analysis, location, technical data, and EXIF information
2. **🤖 AI Image Analysis**: OpenAI-powered content analysis, quality assessment, and context identification
3. **📍 GPS Location Extractor**: Extract GPS coordinates from image EXIF data with interactive maps
4. **🔧 Advanced Analysis Tools**: Detailed metadata extraction, color analysis, and technical properties
5. **📝 OCR Text Recognition**: Extract text from images with confidence scores and statistics
6. **💾 Export Options**: Download complete analysis as JSON, copy specific data to clipboard

### What Information is Extracted
- **Image Metadata**: Dimensions, file size, format, aspect ratio
- **Location Data**: GPS coordinates, accuracy, timestamp, map links
- **Color Analysis**: Dominant colors, brightness, contrast levels
- **Text Recognition**: OCR with confidence scores and statistics
- **Device Information**: Browser, device type, capture timestamp
- **Technical Details**: Processing time, word count, line count

## Component Structure

```
src/
├── App.js                        # Main app component
├── index.js                      # React entry point
├── index.css                     # Global styles
└── components/
    ├── LocationSection.js        # Current device GPS location
    ├── CameraSection.js          # Camera capture and management
    ├── ImageUploader.js          # Drag & drop image upload
    ├── ImageLocationExtractor.js # Extract GPS from image EXIF data
    ├── MetadataExtractor.js      # Detailed metadata and EXIF analysis
    ├── ImageAnalysis.js          # Color analysis and visual properties
    ├── InformationExtractor.js   # Comprehensive data extraction
    └── OCRExtractor.js           # Text recognition (demo + real OCR)
```

## Browser Requirements

- Modern browser with support for:
  - Geolocation API
  - MediaDevices API (getUserMedia)
  - Canvas API
- HTTPS connection (required for camera access on most browsers)

## React Features Used

- **useState**: Managing component state
- **useRef**: Direct DOM access for video and canvas elements
- **useCallback**: Optimizing function references
- **Functional Components**: Modern React patterns
- **Event Handling**: User interactions and media events

## Permissions

The app will request:
- Location access for GPS coordinates
- Camera access for photo capture

## Extending the App

You can enhance this app by adding:
- Image analysis and object detection
- OCR (Optical Character Recognition)
- EXIF data extraction
- Image filters and editing
- Cloud storage integration
- Real-time image processing
- Redux for state management
- TypeScript for type safety

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Security Notes

- Always serve over HTTPS in production
- Camera and location access require user permission
- Consider privacy implications when handling location/image data