#!/usr/bin/env python3
"""
Test script for Image Metadata Extraction API
Demonstrates how to use the API endpoints with sample requests.
"""

import requests
import json
import os
from pathlib import Path

API_BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint."""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure it's running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    return True

def test_api_info():
    """Test the root endpoint for API information."""
    print("\n📋 Testing API info...")
    try:
        response = requests.get(f"{API_BASE_URL}/")
        if response.status_code == 200:
            print("✅ API info retrieved")
            data = response.json()
            print(f"   Title: {data.get('message')}")
            print(f"   Endpoints: {list(data.get('endpoints', {}).keys())}")
        else:
            print(f"❌ API info failed: {response.status_code}")
    except Exception as e:
        print(f"❌ API info error: {e}")

def test_extract_metadata(image_path):
    """Test the complete metadata extraction endpoint."""
    print(f"\n📊 Testing metadata extraction with: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            response = requests.post(f"{API_BASE_URL}/extract-metadata", files=files)
        
        if response.status_code == 200:
            print("✅ Metadata extraction successful")
            data = response.json()
            
            # Display key information
            if 'file_info' in data:
                file_info = data['file_info']
                print(f"   📁 File: {file_info.get('filename')} ({file_info.get('size_formatted')})")
            
            if 'image_properties' in data and 'dimensions' in data['image_properties']:
                dims = data['image_properties']['dimensions']
                print(f"   🖼️  Dimensions: {dims.get('resolution')} ({dims.get('megapixels')} MP)")
            
            if 'gps_location' in data and 'latitude' in data['gps_location']:
                gps = data['gps_location']
                print(f"   📍 Location: {gps.get('coordinates_decimal')}")
                print(f"   🗺️  Maps: {gps.get('google_maps_url')}")
            elif 'gps_location' in data and 'error' in data['gps_location']:
                print(f"   📍 GPS: {data['gps_location']['error']}")
            
            if 'exif_data' in data and data['exif_data']:
                exif_count = len([k for k in data['exif_data'].keys() if not k.startswith('error')])
                print(f"   📷 EXIF: {exif_count} tags found")
                
                # Show some interesting EXIF data
                exif = data['exif_data']
                if 'Make' in exif and 'Model' in exif:
                    print(f"      Camera: {exif['Make']} {exif['Model']}")
                if 'DateTime' in exif:
                    print(f"      Date: {exif['DateTime']}")
            
            # Save full response to file for inspection
            output_file = f"metadata_response_{os.path.basename(image_path)}.json"
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"   💾 Full response saved to: {output_file}")
            
        else:
            print(f"❌ Metadata extraction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Metadata extraction error: {e}")

def test_extract_gps_only(image_path):
    """Test the GPS-only extraction endpoint."""
    print(f"\n📍 Testing GPS extraction with: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            response = requests.post(f"{API_BASE_URL}/extract-gps-only", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ GPS extraction completed: {data.get('status')}")
            
            if 'gps_location' in data and 'latitude' in data['gps_location']:
                gps = data['gps_location']
                print(f"   📍 Coordinates: {gps.get('coordinates_decimal')}")
                if 'altitude' in gps:
                    print(f"   ⛰️  Altitude: {gps.get('altitude')}m {gps.get('altitude_ref', '')}")
                if 'gps_date' in gps:
                    print(f"   📅 GPS Date: {gps.get('gps_date')}")
                if 'gps_time_utc' in gps:
                    print(f"   🕒 GPS Time: {gps.get('gps_time_utc')}")
            else:
                print(f"   ⚠️  {data.get('message', 'No GPS data found')}")
                
        else:
            print(f"❌ GPS extraction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ GPS extraction error: {e}")

def create_sample_request_examples():
    """Create example request files for different programming languages."""
    print("\n📝 Creating sample request examples...")
    
    # Python example
    python_example = '''
import requests

# Extract complete metadata
def extract_metadata(image_path):
    with open(image_path, 'rb') as f:
        response = requests.post(
            'http://localhost:8000/extract-metadata',
            files={'file': f}
        )
    return response.json()

# Extract GPS only
def extract_gps(image_path):
    with open(image_path, 'rb') as f:
        response = requests.post(
            'http://localhost:8000/extract-gps-only',
            files={'file': f}
        )
    return response.json()

# Usage
metadata = extract_metadata('your_image.jpg')
gps_data = extract_gps('your_image.jpg')
'''
    
    # JavaScript example
    js_example = '''
// Extract metadata using fetch API
async function extractMetadata(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:8000/extract-metadata', {
        method: 'POST',
        body: formData
    });
    
    return response.json();
}

// Extract GPS only
async function extractGPS(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:8000/extract-gps-only', {
        method: 'POST',
        body: formData
    });
    
    return response.json();
}

// Usage with file input
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const metadata = await extractMetadata(file);
        console.log(metadata);
    }
});
'''
    
    # cURL examples
    curl_examples = '''
# Extract complete metadata
curl -X POST "http://localhost:8000/extract-metadata" \\
     -H "accept: application/json" \\
     -H "Content-Type: multipart/form-data" \\
     -F "file=@your_image.jpg"

# Extract GPS only
curl -X POST "http://localhost:8000/extract-gps-only" \\
     -H "accept: application/json" \\
     -H "Content-Type: multipart/form-data" \\
     -F "file=@your_image.jpg"

# Health check
curl -X GET "http://localhost:8000/health"

# API documentation
curl -X GET "http://localhost:8000/"
'''
    
    # Save examples
    with open('example_requests.py', 'w') as f:
        f.write(python_example)
    
    with open('example_requests.js', 'w') as f:
        f.write(js_example)
    
    with open('example_requests.sh', 'w') as f:
        f.write(curl_examples)
    
    print("✅ Sample request examples created:")
    print("   📄 example_requests.py - Python examples")
    print("   📄 example_requests.js - JavaScript examples") 
    print("   📄 example_requests.sh - cURL examples")

def main():
    """Run all API tests."""
    print("🚀 Image Metadata API Test Suite")
    print("=" * 50)
    
    # Test basic connectivity
    if not test_health_check():
        print("\n❌ API is not running. Start it with: python app.py")
        return
    
    # Test API info
    test_api_info()
    
    # Look for sample images to test with
    sample_images = []
    
    # Check for common image files in current directory
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.bmp']:
        sample_images.extend(Path('.').glob(ext))
    
    if sample_images:
        print(f"\n🖼️  Found {len(sample_images)} sample image(s) to test with:")
        for img in sample_images[:3]:  # Test with first 3 images
            print(f"   📁 {img}")
            test_extract_metadata(str(img))
            test_extract_gps_only(str(img))
    else:
        print("\n⚠️  No sample images found in current directory")
        print("   Add some .jpg, .png, or other image files to test with")
        print("   Testing with placeholder (will fail, but shows error handling)")
        test_extract_metadata("nonexistent.jpg")
    
    # Create example files
    create_sample_request_examples()
    
    print("\n✅ Test suite completed!")
    print("\n📚 Next steps:")
    print("   1. Visit http://localhost:8000/docs for interactive API documentation")
    print("   2. Use the example files to integrate with your applications")
    print("   3. Upload images with GPS data to test location extraction")

if __name__ == "__main__":
    main()
'''