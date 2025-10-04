from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import io
import hashlib
from datetime import datetime
import os
from typing import Optional, Dict, Any
import json
import traceback
import base64
from openai import OpenAI
from dotenv import load_dotenv
import shutil
from pathlib import Path
import uuid

# Load environment variables
load_dotenv()

# Create directories for saved images and data
SAVED_IMAGES_DIR = Path("saved_images")
SAVED_DATA_DIR = Path("saved_data")
SAVED_IMAGES_DIR.mkdir(exist_ok=True)
SAVED_DATA_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Image Metadata Extraction API",
    description="Extract comprehensive metadata from uploaded images including EXIF, GPS, technical details, and AI analysis",
    version="1.1.0"
)

# Initialize OpenAI client
openai_client = None
try:
    openai_api_key = "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"
    if openai_api_key:
        openai_client = OpenAI(api_key=openai_api_key)
        print("✅ OpenAI client initialized")
    else:
        print("⚠️  OPENAI_API_KEY not found. AI analysis will be disabled.")
except Exception as e:
    print(f"❌ Failed to initialize OpenAI client: {e}")
    openai_client = None

# Enable CORS for React app
# Get allowed origins from environment or use defaults
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "http://138.197.21.64:3000",
    "https://138.197.21.64:3000",
]

# Add wildcard for development
if os.getenv("ENVIRONMENT") == "development":
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

def dms_to_decimal(dms, ref):
    """Convert GPS coordinates in DMS format to decimal degrees."""
    try:
        degrees, minutes, seconds = dms
        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
        if ref in ['S', 'W']:
            decimal = -decimal
        return round(decimal, 8)
    except (TypeError, ValueError, ZeroDivisionError):
        return None

def extract_gps_info(image):
    """Extract GPS information from EXIF data."""
    try:
        exif_data = image._getexif()
        if not exif_data:
            return {"error": "No EXIF data available"}
        
        gps_info = {}
        location_data = {}
        
        # Find GPS info in EXIF
        for tag, value in exif_data.items():
            tag_name = TAGS.get(tag, str(tag))
            if tag_name == "GPSInfo":
                try:
                    for key in value:
                        name = GPSTAGS.get(key, str(key))
                        gps_info[name] = value[key]
                except (TypeError, AttributeError):
                    # Handle case where GPSInfo is not iterable
                    return {"error": "GPS data format not supported"}
        
        if not gps_info:
            return {"error": "No GPS data found in EXIF"}
        
        # Extract coordinates
        if 'GPSLatitude' in gps_info and 'GPSLongitude' in gps_info:
            lat = dms_to_decimal(gps_info['GPSLatitude'], gps_info.get('GPSLatitudeRef', 'N'))
            lon = dms_to_decimal(gps_info['GPSLongitude'], gps_info.get('GPSLongitudeRef', 'E'))
            
            if lat is not None and lon is not None:
                location_data = {
                    "latitude": lat,
                    "longitude": lon,
                    "latitude_ref": gps_info.get('GPSLatitudeRef'),
                    "longitude_ref": gps_info.get('GPSLongitudeRef'),
                    "coordinates_decimal": f"{lat}, {lon}",
                    "google_maps_url": f"https://maps.google.com/?q={lat},{lon}",
                    "openstreetmap_url": f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=15"
                }
        
        # Extract altitude
        if 'GPSAltitude' in gps_info:
            altitude = gps_info['GPSAltitude']
            altitude_ref = gps_info.get('GPSAltitudeRef', 0)
            if isinstance(altitude, (int, float)):
                location_data["altitude"] = altitude if altitude_ref == 0 else -altitude
                location_data["altitude_ref"] = "above sea level" if altitude_ref == 0 else "below sea level"
        
        # Extract GPS timestamp
        if 'GPSDateStamp' in gps_info:
            location_data["gps_date"] = gps_info['GPSDateStamp']
        
        if 'GPSTimeStamp' in gps_info:
            time_stamp = gps_info['GPSTimeStamp']
            if len(time_stamp) == 3:
                hours, minutes, seconds = time_stamp
                location_data["gps_time_utc"] = f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"
        
        # Raw GPS data
        location_data["raw_gps_data"] = {k: str(v) for k, v in gps_info.items()}
        
        return location_data if location_data else {"error": "No valid GPS coordinates found"}
        
    except Exception as e:
        return {"error": f"Error processing GPS data: {str(e)}"}

def extract_exif_data(image):
    """Extract all EXIF data from image."""
    try:
        exif_data = image.getexif()
        if not exif_data:
            return {}
        
        exif_dict = {}
        for tag, value in exif_data.items():
            tag_name = TAGS.get(tag, str(tag))
            if tag_name != "GPSInfo":  # GPS handled separately
                # Convert complex types to strings for JSON serialization
                try:
                    if isinstance(value, (bytes, tuple, list)):
                        value = str(value)
                    elif isinstance(value, dict):
                        value = json.dumps(value, default=str)
                    # Ensure value is JSON serializable
                    json.dumps(value)
                    exif_dict[tag_name] = value
                except (TypeError, ValueError):
                    exif_dict[tag_name] = str(value)
        
        return exif_dict
    except Exception as e:
        return {"error": f"Error extracting EXIF: {str(e)}"}

def calculate_file_hash(file_content):
    """Calculate MD5 hash of file content."""
    return hashlib.md5(file_content).hexdigest()

def analyze_image_properties(image):
    """Analyze image properties and characteristics."""
    try:
        width, height = image.size
        
        properties = {
            "dimensions": {
                "width": width,
                "height": height,
                "resolution": f"{width}x{height}",
                "aspect_ratio": round(width / height, 3),
                "megapixels": round((width * height) / 1000000, 2),
                "orientation": "landscape" if width > height else "portrait" if height > width else "square"
            },
            "color_info": {
                "mode": image.mode,
                "has_transparency": image.mode in ('RGBA', 'LA') or 'transparency' in image.info,
                "color_palette_size": len(image.getcolors(maxcolors=256*256*256)) if image.getcolors(maxcolors=256*256*256) else "More than 16M colors"
            },
            "technical": {
                "format": image.format,
                "format_description": image.format_description if hasattr(image, 'format_description') else None,
                "is_animated": getattr(image, 'is_animated', False),
                "n_frames": getattr(image, 'n_frames', 1)
            }
        }
        
        return properties
    except Exception as e:
        return {"error": f"Error analyzing image properties: {str(e)}"}

@app.get("/")
async def root():
    """API health check and information."""
    return {
        "message": "Image Metadata Extraction API",
        "version": "1.0.0",
        "endpoints": {
            "/extract-metadata": "POST - Upload image to extract metadata",
            "/health": "GET - Health check",
            "/docs": "GET - API documentation"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/extract-metadata")
async def extract_metadata(file: UploadFile = File(...)):
    """
    Extract comprehensive metadata from uploaded image.
    
    Returns:
    - File information (name, size, type, hash)
    - Image properties (dimensions, color info, technical details)
    - EXIF data (camera settings, timestamps)
    - GPS location data (coordinates, maps, timestamps)
    - Processing information
    """
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Create PIL Image
        image = Image.open(io.BytesIO(file_content))
        
        # Extract metadata with individual error handling
        file_info = {
            "filename": file.filename,
            "size_bytes": file_size,
            "size_formatted": format_file_size(file_size),
            "content_type": file.content_type,
            "md5_hash": calculate_file_hash(file_content),
            "upload_timestamp": datetime.now().isoformat()
        }
        
        # Extract each component safely
        try:
            image_properties = analyze_image_properties(image)
        except Exception as e:
            image_properties = {"error": f"Failed to analyze image properties: {str(e)}"}
        
        try:
            exif_data = extract_exif_data(image)
        except Exception as e:
            exif_data = {"error": f"Failed to extract EXIF data: {str(e)}"}
        
        try:
            gps_location = extract_gps_info(image)
        except Exception as e:
            gps_location = {"error": f"Failed to extract GPS data: {str(e)}"}
        
        # Build initial metadata
        metadata = {
            "file_info": file_info,
            "image_properties": image_properties,
            "exif_data": exif_data,
            "gps_location": gps_location,
            "processing_info": {
                "api_version": "1.1.0",
                "processed_at": datetime.now().isoformat()
            }
        }
        
        # Add AI analysis if OpenAI is available (image + metadata sent to OpenAI)
        try:
            ai_analysis = analyze_image_with_metadata_context(file_content, metadata)
            metadata["ai_analysis"] = ai_analysis
        except Exception as e:
            metadata["ai_analysis"] = {
                "error": f"AI analysis failed: {str(e)}",
                "status": "error"
            }
        
        # Add success status
        metadata["status"] = "success"
        metadata["message"] = "Metadata extracted successfully"
        
        # Save image and metadata if enabled
        save_images = os.getenv("SAVE_IMAGES", "false").lower() == "true"
        if save_images:
            try:
                save_result = save_image_and_metadata(file_content, file.filename, metadata)
                metadata["save_info"] = save_result
            except Exception as e:
                metadata["save_info"] = {
                    "success": False,
                    "error": f"Failed to save: {str(e)}"
                }
        
        return JSONResponse(content=metadata)
        
    except Exception as e:
        # Log the full traceback for debugging
        error_details = traceback.format_exc()
        print(f"Error processing image: {error_details}")
        
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error processing image: {str(e)}",
                "error_type": type(e).__name__,
                "filename": file.filename if file else "unknown"
            }
        )

def format_file_size(size_bytes):
    """Format file size in human readable format."""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.2f} {size_names[i]}"

def save_image_and_metadata(file_content, filename, metadata):
    """Save image file and its metadata to disk."""
    try:
        # Generate unique ID for this image
        image_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Clean filename and create safe name
        safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-")
        if not safe_filename:
            safe_filename = "image"
        
        # Get file extension
        file_ext = Path(filename).suffix.lower()
        if not file_ext:
            file_ext = ".jpg"  # Default extension
        
        # Create filenames
        image_filename = f"{timestamp}_{image_id}_{safe_filename}"
        if not image_filename.endswith(file_ext):
            image_filename += file_ext
        
        metadata_filename = f"{timestamp}_{image_id}_{safe_filename}.json"
        
        # Save image file
        image_path = SAVED_IMAGES_DIR / image_filename
        with open(image_path, 'wb') as f:
            f.write(file_content)
        
        # Prepare metadata for saving
        save_metadata = {
            "image_id": image_id,
            "original_filename": filename,
            "saved_filename": image_filename,
            "saved_at": datetime.now().isoformat(),
            "file_size": len(file_content),
            "metadata": metadata
        }
        
        # Save metadata file
        metadata_path = SAVED_DATA_DIR / metadata_filename
        with open(metadata_path, 'w') as f:
            json.dump(save_metadata, f, indent=2, default=str)
        
        return {
            "success": True,
            "image_id": image_id,
            "image_path": str(image_path),
            "metadata_path": str(metadata_path),
            "saved_filename": image_filename,
            "saved_at": save_metadata["saved_at"]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to save image: {str(e)}"
        }

def analyze_image_with_metadata_context(file_content, metadata=None):
    """Analyze image with OpenAI Vision API including extracted metadata context."""
    if not openai_client:
        return {
            "error": "OpenAI client not available",
            "message": "Set OPENAI_API_KEY environment variable to enable AI analysis"
        }
    
    try:
        # Convert image to base64
        base64_image = base64.b64encode(file_content).decode('utf-8')
        
        # Build comprehensive metadata summary to send with image
        metadata_summary = build_metadata_summary(metadata) if metadata else "No metadata available"
        
        # Create the analysis prompt with metadata transparency
        analysis_prompt = f"""**IMAGE ANALYSIS WITH METADATA CONTEXT**

**METADATA BEING SENT WITH THIS IMAGE:**
{metadata_summary}

---

**ANALYSIS REQUEST:**
Please analyze this image comprehensively, incorporating the metadata provided above. Provide detailed information about:

1. **Visual Content Analysis**: 
   - Describe what you see in the image (objects, people, scenes, activities)
   - Identify any text, signs, or readable content
   - Note any identifiable locations or landmarks

2. **Technical Quality Assessment**:
   - Evaluate image quality, lighting, composition, focus
   - Comment on photographic techniques used
   - Correlate with camera settings from metadata if available

3. **Context Integration**:
   - Use GPS location data to provide geographic context
   - Incorporate timestamp data for temporal context
   - Reference camera/device information to understand capture method

4. **Metadata Correlation**:
   - How does the visual content align with the metadata?
   - Are there any discrepancies or interesting correlations?
   - What additional context does the metadata provide?

5. **Content Categorization**:
   - Classify the type of image (portrait, landscape, document, etc.)
   - Identify potential use cases
   - Note any commercial, artistic, or personal elements

6. **Privacy & Information Assessment**:
   - Identify any sensitive information visible in the image
   - Note privacy implications of both image content and metadata
   - Assess what personal information is revealed

Please provide a comprehensive analysis that combines visual observation with metadata insights."""

        # Make the API call with both image and metadata
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": analysis_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        analysis_result = {
            "analysis": response.choices[0].message.content,
            "model": "gpt-4o-mini",
            "tokens_used": response.usage.total_tokens if response.usage else None,
            "analysis_timestamp": datetime.now().isoformat(),
            "analysis_type": "image_with_metadata",
            "image_content_processed": True,
            "metadata_sent": metadata_summary,
            "metadata_context_provided": bool(metadata),
            "status": "success"
        }
        
        return analysis_result
        
    except Exception as e:
        return {
            "error": f"OpenAI analysis failed: {str(e)}",
            "status": "error",
            "analysis_timestamp": datetime.now().isoformat()
        }

def build_metadata_summary(metadata):
    """Build a comprehensive text summary of all metadata."""
    summary_parts = []
    
    # File Information
    if metadata.get('file_info'):
        file_info = metadata['file_info']
        summary_parts.append("FILE INFORMATION:")
        summary_parts.append(f"- Filename: {file_info.get('filename', 'unknown')}")
        summary_parts.append(f"- Size: {file_info.get('size_formatted', 'unknown')} ({file_info.get('size_bytes', 0)} bytes)")
        summary_parts.append(f"- Type: {file_info.get('content_type', 'unknown')}")
        summary_parts.append(f"- MD5 Hash: {file_info.get('md5_hash', 'unknown')}")
        summary_parts.append(f"- Upload Time: {file_info.get('upload_timestamp', 'unknown')}")
        summary_parts.append("")
    
    # Image Properties
    if metadata.get('image_properties'):
        props = metadata['image_properties']
        summary_parts.append("IMAGE PROPERTIES:")
        
        if props.get('dimensions'):
            dims = props['dimensions']
            summary_parts.append(f"- Resolution: {dims.get('resolution', 'unknown')}")
            summary_parts.append(f"- Megapixels: {dims.get('megapixels', 'unknown')} MP")
            summary_parts.append(f"- Aspect Ratio: {dims.get('aspect_ratio', 'unknown')}")
            summary_parts.append(f"- Orientation: {dims.get('orientation', 'unknown')}")
        
        if props.get('color_info'):
            color = props['color_info']
            summary_parts.append(f"- Color Mode: {color.get('mode', 'unknown')}")
            summary_parts.append(f"- Has Transparency: {color.get('has_transparency', 'unknown')}")
        
        if props.get('technical'):
            tech = props['technical']
            summary_parts.append(f"- Format: {tech.get('format', 'unknown')}")
            summary_parts.append(f"- Animated: {tech.get('is_animated', False)}")
        
        summary_parts.append("")
    
    # GPS Location
    if metadata.get('gps_location') and not metadata['gps_location'].get('error'):
        gps = metadata['gps_location']
        summary_parts.append("GPS LOCATION DATA:")
        summary_parts.append(f"- Coordinates: {gps.get('coordinates_decimal', 'unknown')}")
        summary_parts.append(f"- Latitude: {gps.get('latitude', 'unknown')}° {gps.get('latitude_ref', '')}")
        summary_parts.append(f"- Longitude: {gps.get('longitude', 'unknown')}° {gps.get('longitude_ref', '')}")
        if gps.get('altitude'):
            summary_parts.append(f"- Altitude: {gps.get('altitude')}m {gps.get('altitude_ref', '')}")
        if gps.get('gps_date'):
            summary_parts.append(f"- GPS Date: {gps.get('gps_date')}")
        if gps.get('gps_time_utc'):
            summary_parts.append(f"- GPS Time (UTC): {gps.get('gps_time_utc')}")
        summary_parts.append("")
    elif metadata.get('gps_location'):
        summary_parts.append("GPS LOCATION DATA: Not available")
        summary_parts.append("")
    
    # EXIF Data
    if metadata.get('exif_data') and not metadata['exif_data'].get('error'):
        exif = metadata['exif_data']
        summary_parts.append("CAMERA/EXIF DATA:")
        
        # Camera info
        if exif.get('Make') and exif.get('Model'):
            summary_parts.append(f"- Camera: {exif.get('Make')} {exif.get('Model')}")
        
        # Timestamps
        for date_field in ['DateTime', 'DateTimeOriginal', 'DateTimeDigitized']:
            if exif.get(date_field):
                summary_parts.append(f"- {date_field}: {exif.get(date_field)}")
        
        # Camera settings
        camera_settings = ['ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'Flash', 'WhiteBalance']
        for setting in camera_settings:
            if exif.get(setting):
                summary_parts.append(f"- {setting}: {exif.get(setting)}")
        
        # Other EXIF data (limit to important fields)
        other_fields = ['Software', 'Artist', 'Copyright', 'ImageDescription']
        for field in other_fields:
            if exif.get(field):
                summary_parts.append(f"- {field}: {exif.get(field)}")
        
        summary_parts.append("")
    elif metadata.get('exif_data'):
        summary_parts.append("CAMERA/EXIF DATA: Not available or error in extraction")
        summary_parts.append("")
    
    # Processing info
    if metadata.get('processing_info'):
        proc = metadata['processing_info']
        summary_parts.append("PROCESSING INFORMATION:")
        summary_parts.append(f"- API Version: {proc.get('api_version', 'unknown')}")
        summary_parts.append(f"- Processed At: {proc.get('processed_at', 'unknown')}")
        summary_parts.append("")
    
    return "\n".join(summary_parts)

@app.post("/extract-gps-only")
async def extract_gps_only(file: UploadFile = File(...)):
    """
    Extract only GPS location data from uploaded image.
    Optimized endpoint for location extraction only.
    """
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        file_content = await file.read()
        image = Image.open(io.BytesIO(file_content))
        
        gps_data = extract_gps_info(image)
        
        result = {
            "filename": file.filename,
            "gps_location": gps_data,
            "processed_at": datetime.now().isoformat()
        }
        
        if "error" not in gps_data:
            result["status"] = "success"
            result["message"] = "GPS location extracted successfully"
        else:
            result["status"] = "no_gps_data"
            result["message"] = gps_data["error"]
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting GPS data: {str(e)}")

@app.post("/analyze-image-ai")
async def analyze_image_ai(file: UploadFile = File(...)):
    """
    Analyze image using OpenAI Vision API.
    Provides detailed AI-powered analysis of image content, quality, and context.
    """
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    if not openai_client:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unavailable",
                "message": "AI analysis not available. Set OPENAI_API_KEY environment variable.",
                "filename": file.filename
            }
        )
    
    try:
        file_content = await file.read()
        
        # Get basic metadata for context
        image = Image.open(io.BytesIO(file_content))
        basic_metadata = {
            "file_info": {
                "filename": file.filename,
                "size_formatted": format_file_size(len(file_content)),
                "content_type": file.content_type
            },
            "image_properties": analyze_image_properties(image),
            "gps_location": extract_gps_info(image),
            "exif_data": extract_exif_data(image)
        }
        
        # Perform AI analysis (image + metadata sent to OpenAI)
        ai_analysis = analyze_image_with_metadata_context(file_content, basic_metadata)
        
        result = {
            "filename": file.filename,
            "ai_analysis": ai_analysis,
            "basic_metadata": basic_metadata,
            "processed_at": datetime.now().isoformat()
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error analyzing image: {str(e)}",
                "filename": file.filename if file else "unknown"
            }
        )

@app.post("/save-image")
async def save_image_endpoint(file: UploadFile = File(...)):
    """
    Save uploaded image with complete metadata analysis.
    Returns saved image information and analysis results.
    """
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Create PIL Image
        image = Image.open(io.BytesIO(file_content))
        
        # Extract metadata (same as main endpoint)
        file_info = {
            "filename": file.filename,
            "size_bytes": file_size,
            "size_formatted": format_file_size(file_size),
            "content_type": file.content_type,
            "md5_hash": calculate_file_hash(file_content),
            "upload_timestamp": datetime.now().isoformat()
        }
        
        # Extract each component safely
        try:
            image_properties = analyze_image_properties(image)
        except Exception as e:
            image_properties = {"error": f"Failed to analyze image properties: {str(e)}"}
        
        try:
            exif_data = extract_exif_data(image)
        except Exception as e:
            exif_data = {"error": f"Failed to extract EXIF data: {str(e)}"}
        
        try:
            gps_location = extract_gps_info(image)
        except Exception as e:
            gps_location = {"error": f"Failed to extract GPS data: {str(e)}"}
        
        # Build metadata
        metadata = {
            "file_info": file_info,
            "image_properties": image_properties,
            "exif_data": exif_data,
            "gps_location": gps_location,
            "processing_info": {
                "api_version": "1.1.0",
                "processed_at": datetime.now().isoformat()
            }
        }
        
        # Add AI analysis if available (image + metadata sent to OpenAI)
        try:
            ai_analysis = analyze_image_with_metadata_context(file_content, metadata)
            metadata["ai_analysis"] = ai_analysis
        except Exception as e:
            metadata["ai_analysis"] = {
                "error": f"AI analysis failed: {str(e)}",
                "status": "error"
            }
        
        # Save image and metadata
        save_result = save_image_and_metadata(file_content, file.filename, metadata)
        
        if save_result["success"]:
            result = {
                "status": "success",
                "message": "Image saved successfully with complete analysis",
                "save_info": save_result,
                "metadata": metadata
            }
        else:
            result = {
                "status": "error",
                "message": "Failed to save image",
                "error": save_result["error"],
                "metadata": metadata
            }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error saving image: {error_details}")
        
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error saving image: {str(e)}",
                "error_type": type(e).__name__,
                "filename": file.filename if file else "unknown"
            }
        )

@app.get("/saved-images")
async def list_saved_images():
    """List all saved images with their metadata."""
    try:
        saved_images = []
        
        # Get all metadata files
        for metadata_file in SAVED_DATA_DIR.glob("*.json"):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                # Check if image file still exists
                image_path = SAVED_IMAGES_DIR / metadata.get("saved_filename", "")
                image_exists = image_path.exists()
                
                saved_images.append({
                    "image_id": metadata.get("image_id"),
                    "original_filename": metadata.get("original_filename"),
                    "saved_filename": metadata.get("saved_filename"),
                    "saved_at": metadata.get("saved_at"),
                    "file_size": metadata.get("file_size"),
                    "image_exists": image_exists,
                    "has_gps": not metadata.get("metadata", {}).get("gps_location", {}).get("error"),
                    "has_ai_analysis": not metadata.get("metadata", {}).get("ai_analysis", {}).get("error"),
                    "metadata_file": str(metadata_file)
                })
            except Exception as e:
                print(f"Error reading metadata file {metadata_file}: {e}")
                continue
        
        # Sort by saved_at timestamp (newest first)
        saved_images.sort(key=lambda x: x.get("saved_at", ""), reverse=True)
        
        return {
            "status": "success",
            "count": len(saved_images),
            "images": saved_images,
            "storage_info": {
                "images_directory": str(SAVED_IMAGES_DIR),
                "metadata_directory": str(SAVED_DATA_DIR)
            }
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error listing saved images: {str(e)}"
            }
        )

@app.get("/saved-images/{image_id}")
async def get_saved_image_metadata(image_id: str):
    """Get complete metadata for a specific saved image."""
    try:
        # Find metadata file for this image_id
        metadata_file = None
        for file_path in SAVED_DATA_DIR.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    metadata = json.load(f)
                if metadata.get("image_id") == image_id:
                    metadata_file = file_path
                    break
            except:
                continue
        
        if not metadata_file:
            raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
        
        with open(metadata_file, 'r') as f:
            complete_metadata = json.load(f)
        
        return {
            "status": "success",
            "image_id": image_id,
            "metadata": complete_metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error retrieving image metadata: {str(e)}"
            }
        )

@app.get("/ai-status")
async def ai_status():
    """Check if AI analysis is available."""
    return {
        "ai_available": openai_client is not None,
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "model": "gpt-4o-mini",
        "analysis_type": "image_with_metadata",
        "features": [
            "Complete image content analysis",
            "Visual content description and recognition",
            "Technical quality assessment with metadata correlation",
            "Geographic context integration from GPS data", 
            "Temporal analysis from timestamps",
            "Device and equipment analysis",
            "Metadata-enhanced visual analysis"
        ] if openai_client else [],
        "data_sent_to_ai": [
            "Complete image content (visual data)",
            "Extracted metadata (file info, GPS, EXIF, technical properties)",
            "Combined analysis for comprehensive insights"
        ],
        "privacy_notes": [
            "Both image content AND metadata are sent to OpenAI",
            "Users are informed about all data being shared",
            "Comprehensive analysis combining visual and technical data",
            "Full transparency about data sharing"
        ],
        "status": "available" if openai_client else "unavailable",
        "message": "AI analysis is available" if openai_client else "AI analysis is not available. Set OPENAI_API_KEY environment variable."
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )