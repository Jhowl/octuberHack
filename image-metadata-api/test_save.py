#!/usr/bin/env python3
"""
Test script for image saving functionality
"""

import requests
import json
from PIL import Image, ImageDraw
import io

API_BASE_URL = "http://localhost:8000"

def test_save_image():
    """Test saving an image with complete analysis"""
    print("💾 Testing image saving...")
    
    try:
        # Create a test image
        img = Image.new('RGB', (400, 300), color='lightblue')
        draw = ImageDraw.Draw(img)
        
        # Add some content
        draw.rectangle([50, 50, 200, 150], fill='red', outline='black', width=2)
        draw.ellipse([250, 100, 350, 200], fill='yellow', outline='green', width=3)
        draw.text((60, 80), "SAVE TEST", fill='white')
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Test save endpoint
        files = {'file': ('test_save_image.jpg', img_bytes, 'image/jpeg')}
        response = requests.post(f"{API_BASE_URL}/save-image", files=files)
        
        print(f"Save Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Image Save Success!")
            
            if data['status'] == 'success':
                save_info = data.get('save_info', {})
                print(f"\n📁 Save Details:")
                print(f"   Image ID: {save_info.get('image_id')}")
                print(f"   Filename: {save_info.get('saved_filename')}")
                print(f"   Path: {save_info.get('image_path')}")
                print(f"   Saved At: {save_info.get('saved_at')}")
                
                # Check metadata
                metadata = data.get('metadata', {})
                print(f"\n📊 Analysis Summary:")
                print(f"   File Size: {metadata.get('file_info', {}).get('size_formatted', 'N/A')}")
                print(f"   GPS Data: {'✅' if not metadata.get('gps_location', {}).get('error') else '❌'}")
                print(f"   AI Analysis: {'✅' if not metadata.get('ai_analysis', {}).get('error') else '❌'}")
                print(f"   EXIF Data: {'✅' if metadata.get('exif_data') and not metadata.get('exif_data', {}).get('error') else '❌'}")
                
                return save_info.get('image_id')
            else:
                print(f"❌ Save failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Save request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Save test error: {e}")
    
    return None

def test_list_saved_images():
    """Test listing saved images"""
    print("\n📋 Testing saved images list...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/saved-images")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ List Saved Images Success!")
            
            if data['status'] == 'success':
                images = data.get('images', [])
                print(f"\n📊 Found {len(images)} saved images:")
                
                for i, image in enumerate(images[:5]):  # Show first 5
                    print(f"\n   {i+1}. {image.get('original_filename', 'Unknown')}")
                    print(f"      ID: {image.get('image_id', 'N/A')}")
                    print(f"      Size: {image.get('file_size', 0)} bytes")
                    print(f"      Saved: {image.get('saved_at', 'N/A')}")
                    print(f"      GPS: {'✅' if image.get('has_gps') else '❌'}")
                    print(f"      AI: {'✅' if image.get('has_ai_analysis') else '❌'}")
                
                if len(images) > 5:
                    print(f"   ... and {len(images) - 5} more images")
                
                return images
            else:
                print(f"❌ List failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ List request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ List test error: {e}")
    
    return []

def test_get_saved_metadata(image_id):
    """Test getting metadata for a specific saved image"""
    if not image_id:
        print("\n⚠️  No image ID provided, skipping metadata test")
        return
    
    print(f"\n📄 Testing metadata retrieval for image {image_id}...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/saved-images/{image_id}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Metadata Retrieval Success!")
            
            if data['status'] == 'success':
                metadata = data.get('metadata', {})
                
                print(f"\n📊 Complete Metadata Available:")
                print(f"   Original Filename: {metadata.get('original_filename', 'N/A')}")
                print(f"   Saved Filename: {metadata.get('saved_filename', 'N/A')}")
                print(f"   File Size: {metadata.get('file_size', 0)} bytes")
                
                # Check analysis components
                image_metadata = metadata.get('metadata', {})
                print(f"\n🔍 Analysis Components:")
                print(f"   File Info: {'✅' if image_metadata.get('file_info') else '❌'}")
                print(f"   Image Properties: {'✅' if image_metadata.get('image_properties') else '❌'}")
                print(f"   GPS Location: {'✅' if not image_metadata.get('gps_location', {}).get('error') else '❌'}")
                print(f"   AI Analysis: {'✅' if not image_metadata.get('ai_analysis', {}).get('error') else '❌'}")
                print(f"   EXIF Data: {'✅' if image_metadata.get('exif_data') and not image_metadata.get('exif_data', {}).get('error') else '❌'}")
                
                # Save sample metadata file
                with open(f'sample_metadata_{image_id}.json', 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"\n💾 Sample metadata saved to: sample_metadata_{image_id}.json")
                
            else:
                print(f"❌ Metadata retrieval failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ Metadata request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Metadata test error: {e}")

def main():
    """Run all save functionality tests"""
    print("🧪 Image Saving Test Suite")
    print("=" * 50)
    
    # Check if API is running
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code != 200:
            print("❌ API is not running. Start it with: python app.py")
            return
    except:
        print("❌ Cannot connect to API. Make sure it's running on http://localhost:8000")
        return
    
    print("✅ API is running")
    
    # Test saving an image
    image_id = test_save_image()
    
    # Test listing saved images
    saved_images = test_list_saved_images()
    
    # Test getting metadata for the saved image
    if image_id:
        test_get_saved_metadata(image_id)
    elif saved_images:
        # Use the first saved image if we have any
        test_get_saved_metadata(saved_images[0].get('image_id'))
    
    print("\n🎉 Save Test Suite Complete!")
    print("\nNext steps:")
    print("1. Check the 'saved_images' and 'saved_data' directories")
    print("2. Upload images in the React app and use the 'Save Image' tab")
    print("3. View saved images list in the React interface")

if __name__ == "__main__":
    main()