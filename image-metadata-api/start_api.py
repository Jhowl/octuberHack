#!/usr/bin/env python3
"""
Startup script for the Image Metadata API
Includes dependency checking and helpful error messages
"""

import sys
import subprocess
import importlib

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        ('fastapi', 'fastapi'),
        ('uvicorn', 'uvicorn'),
        ('PIL', 'Pillow'),
        ('multipart', 'python-multipart')
    ]
    
    missing_packages = []
    
    for import_name, package_name in required_packages:
        try:
            importlib.import_module(import_name)
            print(f"✅ {package_name}")
        except ImportError:
            print(f"❌ {package_name} - Missing")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n🔧 Install missing packages:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def start_api():
    """Start the FastAPI server"""
    try:
        import uvicorn
        print("\n🚀 Starting Image Metadata API...")
        print("📍 API will be available at: http://localhost:8000")
        print("📚 Interactive docs at: http://localhost:8000/docs")
        print("🔍 Health check at: http://localhost:8000/health")
        print("\n⏹️  Press Ctrl+C to stop the server\n")
        
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 API server stopped")
    except Exception as e:
        print(f"❌ Failed to start API: {e}")

def main():
    print("🔍 Image Metadata API Startup")
    print("=" * 40)
    print("Checking dependencies...")
    
    if check_dependencies():
        print("\n✅ All dependencies installed!")
        start_api()
    else:
        print("\n❌ Please install missing dependencies first")
        sys.exit(1)

if __name__ == "__main__":
    main()