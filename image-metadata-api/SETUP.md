# Image Metadata API Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd image-metadata-api
pip install fastapi uvicorn python-multipart Pillow
```

### 2. Start the API
```bash
python start_api.py
```

Or directly:
```bash
python app.py
```

### 3. Test the API
```bash
python simple_test.py
```

## Detailed Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation Options

#### Option 1: Direct Installation
```bash
pip install fastapi uvicorn python-multipart Pillow
```

#### Option 2: Using requirements.txt
```bash
pip install -r requirements.txt
```

#### Option 3: Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Running the API

#### Method 1: Using the startup script
```bash
python start_api.py
```

#### Method 2: Direct execution
```bash
python app.py
```

#### Method 3: Using uvicorn directly
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Verification

Once started, the API will be available at:
- **Base URL**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **Interactive Docs**: http://localhost:8000/docs
- **API Info**: http://localhost:8000/

### Testing

#### Quick Test
```bash
python simple_test.py
```

#### Manual Test with cURL
```bash
# Health check
curl http://localhost:8000/health

# Test with an image file
curl -X POST "http://localhost:8000/extract-metadata" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your_image.jpg"
```

## Troubleshooting

### Common Issues

#### 1. "No module named 'fastapi'"
**Solution**: Install dependencies
```bash
pip install fastapi uvicorn python-multipart Pillow
```

#### 2. "Port 8000 already in use"
**Solution**: Use a different port
```bash
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

#### 3. "Permission denied" on macOS/Linux
**Solution**: Make scripts executable
```bash
chmod +x start_api.py
chmod +x simple_test.py
```

#### 4. CORS errors from React app
**Solution**: The API is already configured for CORS. Make sure:
- API is running on http://localhost:8000
- React app is running on http://localhost:3000
- No firewall blocking the connection

#### 5. 500 Internal Server Error
**Solution**: Check the API logs in the terminal where you started the server. Common causes:
- Corrupted image file
- Unsupported image format
- Missing EXIF data

### Performance Tips

#### For Production
1. **Use Gunicorn** (Linux/macOS):
```bash
pip install gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. **Use Docker**:
```bash
docker build -t image-metadata-api .
docker run -p 8000:8000 image-metadata-api
```

3. **Environment Variables**:
```bash
export API_HOST=0.0.0.0
export API_PORT=8000
export API_WORKERS=4
```

#### For Development
- Use `--reload` flag for auto-restart on code changes
- Set log level to `debug` for detailed logs
- Use virtual environment to avoid conflicts

### API Configuration

#### Environment Variables
- `API_HOST`: Host to bind to (default: 0.0.0.0)
- `API_PORT`: Port to bind to (default: 8000)
- `API_WORKERS`: Number of worker processes (production)

#### CORS Configuration
The API is pre-configured to allow requests from:
- http://localhost:3000 (React development server)
- http://127.0.0.1:3000

To add more origins, edit the `allow_origins` list in `app.py`.

### File Size Limits

By default, FastAPI has no file size limit, but you may want to add one:

```python
# In app.py, add this configuration
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1"]
)

# Add file size limit (example: 10MB)
@app.middleware("http")
async def limit_upload_size(request, call_next):
    if request.method == "POST" and "multipart/form-data" in request.headers.get("content-type", ""):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB
            return JSONResponse(
                status_code=413,
                content={"error": "File too large. Maximum size is 10MB."}
            )
    return await call_next(request)
```

### Security Considerations

#### For Production Deployment
1. **Use HTTPS**: Deploy behind a reverse proxy with SSL
2. **Rate Limiting**: Add rate limiting middleware
3. **Authentication**: Add API key or JWT authentication if needed
4. **File Validation**: Validate file types and sizes
5. **Logging**: Implement proper logging and monitoring

#### Example Production Configuration
```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
import time

# Add rate limiting
request_times = {}

@app.middleware("http")
async def rate_limit(request, call_next):
    client_ip = request.client.host
    current_time = time.time()
    
    if client_ip in request_times:
        if current_time - request_times[client_ip] < 1:  # 1 request per second
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    request_times[client_ip] = current_time
    return await call_next(request)
```

## Integration with React App

The React app includes an `APIMetadataExtractor` component that automatically connects to this API. Make sure:

1. **API is running** on http://localhost:8000
2. **React app is running** on http://localhost:3000
3. **Upload an image** in the React app
4. **Click "Extract All Metadata"** or "Extract GPS Only"

The component will show connection status and results automatically.

## Support

If you encounter issues:
1. Check the API logs in the terminal
2. Verify all dependencies are installed
3. Test with the simple test script
4. Check the interactive docs at http://localhost:8000/docs
5. Ensure no firewall is blocking port 8000