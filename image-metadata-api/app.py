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

app = FastAPI(
    title="Image Metadata Extraction API",
    description="Extract comprehensive metadata from uploaded images including EXIF, GPS, and technical details",
    version="1.0.0"
)

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
        
        metadata = {
            "file_info": file_info,
            "image_properties": image_properties,
            "exif_data": exif_data,
            "gps_location": gps_location,
            "processing_info": {
                "api_version": "1.0.0",
                "processed_at": datetime.now().isoformat()
            }
        }
        
        # Add success status
        metadata["status"] = "success"
        metadata["message"] = "Metadata extracted successfully"
        
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

if __name__ == "__main__":
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )