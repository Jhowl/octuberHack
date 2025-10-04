#!/usr/bin/env python3
"""
Test script for AI image analysis functionality
"""

import requests
import json
import os
from PIL import Image
import io

API_BASE_URL = "http://localhost:8000"

def test_ai_status():
    """Test the AI status endpoint"""
    print("🤖 Testing AI status...")
    try:
        response = requests.get(f"{API_BASE_URL}/ai-status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI Status: {data['status']}")
            print(f"   Available: {data['ai_available']}")
            print(f"   OpenAI Configured: {data['openai_configured']}")
            print(f"   Model: {data.get('model', 'N/A')}")
            print(f"   Features: {len(data.get('features', []))}")
            return data['ai_available']
        else:
            print(f"❌ AI status check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ AI status error: {e}")
    return False

def test_ai_analysis():
    """Test AI metadata analysis with a sample image"""
    print("\n🖼️  Testing AI metadata analysis...")
    
    try:
        # Create a simple test image
        img = Image.new('RGB', (300, 200), color='blue')
        
        # Add some simple shapes for analysis
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 150, 100], fill='red')
        draw.ellipse([200, 75, 250, 125], fill='yellow')
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Test the AI analysis endpoint
        files = {'file': ('test_ai_metadata.jpg', img_bytes, 'image/jpeg')}
        response = requests.post(f"{API_BASE_URL}/analyze-image-ai", files=files)
        
        print(f"AI Metadata Analysis Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ AI Metadata Analysis Success!")
            
            if 'ai_analysis' in data and 'analysis' in data['ai_analysis']:
                analysis = data['ai_analysis']['analysis']
                print(f"\n📝 AI Metadata Analysis Result:")
                print("-" * 50)
                print(analysis)
                print("-" * 50)
                
                # Show metadata
                ai_data = data['ai_analysis']
                print(f"\n📊 Analysis Metadata:")
                print(f"   Model: {ai_data.get('model', 'N/A')}")
                print(f"   Tokens: {ai_data.get('tokens_used', 'N/A')}")
                print(f"   Analysis Type: {ai_data.get('analysis_type', 'N/A')}")
                print(f"   Privacy Mode: {ai_data.get('privacy_mode', 'N/A')}")
                print(f"   Image Content Processed: {ai_data.get('image_content_processed', 'N/A')}")
                print(f"   Status: {ai_data.get('status', 'N/A')}")
                
                return True
            else:
                print("❌ No analysis content in response")
                
        elif response.status_code == 503:
            data = response.json()
            print(f"⚠️  AI Service Unavailable: {data.get('message', 'Unknown error')}")
            
        else:
            print(f"❌ AI analysis failed: {response.text}")
            
    except Exception as e:
        print(f"❌ AI analysis error: {e}")
    
    return False

def test_full_metadata_with_ai():
    """Test the full metadata extraction with AI analysis"""
    print("\n📊 Testing full metadata extraction with AI...")
    
    try:
        # Create a test image with some metadata
        img = Image.new('RGB', (400, 300), color='green')
        
        # Add some content
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Draw some shapes and text
        draw.rectangle([50, 50, 200, 150], fill='white', outline='black', width=2)
        draw.text((60, 80), "TEST IMAGE", fill='black')
        draw.circle((300, 100), 50, fill='orange')
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Test full metadata extraction
        files = {'file': ('test_full_analysis.jpg', img_bytes, 'image/jpeg')}
        response = requests.post(f"{API_BASE_URL}/extract-metadata", files=files)
        
        print(f"Full Metadata Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Full Metadata Extraction Success!")
            
            # Show key information
            if 'file_info' in data:
                file_info = data['file_info']
                print(f"\n📁 File: {file_info.get('filename')} ({file_info.get('size_formatted')})")
            
            if 'image_properties' in data:
                props = data['image_properties'].get('dimensions', {})
                print(f"🖼️  Image: {props.get('resolution')} ({props.get('megapixels')} MP)")
            
            if 'ai_analysis' in data:
                ai_data = data['ai_analysis']
                if 'analysis' in ai_data:
                    print(f"\n🤖 AI Analysis Available:")
                    print(f"   Model: {ai_data.get('model')}")
                    print(f"   Tokens: {ai_data.get('tokens_used')}")
                    print(f"   Context: {'Yes' if ai_data.get('metadata_context_provided') else 'No'}")
                    
                    # Show first few lines of analysis
                    analysis_lines = ai_data['analysis'].split('\n')[:3]
                    print(f"   Preview: {' '.join(analysis_lines)[:100]}...")
                else:
                    print(f"⚠️  AI Analysis Error: {ai_data.get('error', 'Unknown error')}")
            
            # Save full response for inspection
            with open('full_metadata_with_ai.json', 'w') as f:
                json.dump(data, f, indent=2)
            print(f"\n💾 Full response saved to: full_metadata_with_ai.json")
            
            return True
        else:
            print(f"❌ Full metadata extraction failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Full metadata test error: {e}")
    
    return False

def main():
    """Run all AI tests"""
    print("🧪 AI Image Analysis Test Suite")
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
    
    # Test AI status
    ai_available = test_ai_status()
    
    if not ai_available:
        print("\n⚠️  AI Analysis is not available.")
        print("To enable AI analysis:")
        print("1. Get an OpenAI API key from: https://platform.openai.com/api-keys")
        print("2. Set environment variable: export OPENAI_API_KEY=your_key_here")
        print("3. Restart the API server")
        return
    
    # Test AI analysis
    if test_ai_analysis():
        print("\n✅ AI Analysis is working!")
    
    # Test full metadata with AI
    if test_full_metadata_with_ai():
        print("\n✅ Full metadata extraction with AI is working!")
    
    print("\n🎉 AI Test Suite Complete!")
    print("\nNext steps:")
    print("1. Upload images in the React app")
    print("2. Click 'Analyze with AI' to test the integration")
    print("3. Check the AI analysis results")

if __name__ == "__main__":
    main()