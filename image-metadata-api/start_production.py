#!/usr/bin/env python3
"""
Production startup script for the Image Metadata API
Loads production environment variables and starts with production settings
"""

import os
import sys
import uvicorn
from pathlib import Path

def load_env_file(env_file):
    """Load environment variables from file"""
    if Path(env_file).exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print(f"✅ Loaded environment from {env_file}")
    else:
        print(f"⚠️  Environment file {env_file} not found")

def main():
    print("🚀 Starting Image Metadata API (Production Mode)")
    print("=" * 50)
    
    # Load production environment
    load_env_file("production.env")
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    log_level = os.getenv("LOG_LEVEL", "info")
    
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"📊 Log Level: {log_level}")
    print(f"🌐 Allowed Origins: {os.getenv('ALLOWED_ORIGINS', 'Default')}")
    print(f"🔒 Environment: {os.getenv('ENVIRONMENT', 'production')}")
    print("\n⏹️  Press Ctrl+C to stop the server\n")
    
    try:
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            log_level=log_level,
            reload=False,  # Disable reload in production
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n👋 API server stopped")
    except Exception as e:
        print(f"❌ Failed to start API: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()