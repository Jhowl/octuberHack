#!/usr/bin/env python3
"""
Simple test script to verify the API is working
"""

import requests
import json

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            return True
    except Exception as e:
        print(f"Health check failed: {e}")
    return False

def test_with_sample_image():
    """Test with a simple image"""
    try:
        # Create a simple test image
        from PIL import Image
        import io
        
        # Create a small test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Test the API
        files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
        response = requests.post("http://localhost:8000/extract-metadata", files=files)
        
        print(f"Metadata extraction: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"Status: {data.get('status')}")
            print(f"File info: {data.get('file_info', {}).get('filename')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"Test failed: {e}")
    return False

if __name__ == "__main__":
    print("🧪 Testing Image Metadata API")
    print("=" * 40)
    
    if test_health():
        print("\n📊 Testing metadata extraction...")
        test_with_sample_image()
    else:
        print("❌ API is not running. Start it with: python app.py")