# Production Deployment Guide

## Server Setup (138.197.21.64)

### 1. Fix CORS Issues

The API has been updated to allow requests from your production server. The CORS configuration now includes:

- `http://138.197.21.64:3000` (React app)
- `https://138.197.21.64:3000` (HTTPS version)
- `http://localhost:3000` (development)

### 2. Environment Setup

#### Option A: Using Virtual Environment (Recommended)
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn python-multipart Pillow

# Start production server
python start_production.py
```

#### Option B: Using System Packages (if allowed)
```bash
# Install system packages
sudo apt update
sudo apt install python3-fastapi python3-uvicorn python3-multipart python3-pil

# Or use pip with --break-system-packages (not recommended)
pip install --break-system-packages fastapi uvicorn python-multipart Pillow
```

#### Option C: Using pipx (Recommended for system-wide)
```bash
# Install pipx if not available
sudo apt install pipx

# Install each package
pipx install fastapi
pipx install uvicorn
# Note: pipx is better for applications, not libraries
```

### 3. Production Startup

#### Method 1: Using the production script
```bash
python start_production.py
```

#### Method 2: Direct uvicorn with production settings
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Method 3: Using systemd service (recommended for production)

Create `/etc/systemd/system/image-metadata-api.service`:
```ini
[Unit]
Description=Image Metadata API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/image-metadata-api
Environment=PATH=/path/to/venv/bin
ExecStart=/path/to/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable image-metadata-api
sudo systemctl start image-metadata-api
```

### 4. Nginx Configuration (Optional)

If using Nginx as reverse proxy, add to your config:

```nginx
server {
    listen 80;
    server_name 138.197.21.64;

    # React app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}
```

### 5. Firewall Configuration

Ensure ports are open:
```bash
# Allow API port
sudo ufw allow 8000

# Allow React app port
sudo ufw allow 3000

# Check status
sudo ufw status
```

### 6. Environment Variables

Create `.env` file or use `production.env`:
```bash
export ENVIRONMENT=production
export ALLOWED_ORIGINS=http://138.197.21.64:3000,https://138.197.21.64:3000
export API_HOST=0.0.0.0
export API_PORT=8000
```

### 7. Testing the Setup

#### Test API directly:
```bash
curl http://138.197.21.64:8000/health
```

#### Test CORS:
```bash
curl -H "Origin: http://138.197.21.64:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://138.197.21.64:8000/extract-metadata
```

### 8. React App Configuration

The React app will automatically detect the production environment and use the correct API endpoint:
- Development: `http://localhost:8000`
- Production: `http://138.197.21.64:8000`

### 9. Troubleshooting CORS

If you still get CORS errors:

#### Check API logs:
```bash
# If using systemd
sudo journalctl -u image-metadata-api -f

# If running directly
# Check terminal output where API is running
```

#### Verify CORS headers:
```bash
curl -I -H "Origin: http://138.197.21.64:3000" http://138.197.21.64:8000/health
```

#### Temporary fix (development only):
Add this to the API startup:
```bash
export ENVIRONMENT=development
python start_production.py
```

This will allow all origins (`*`) for testing.

### 10. Security Considerations

For production:
1. **Remove wildcard CORS** - Only allow specific origins
2. **Use HTTPS** - Set up SSL certificates
3. **Rate limiting** - Implement request rate limits
4. **File size limits** - Limit upload sizes
5. **Authentication** - Add API keys if needed

### 11. Monitoring

#### Check API status:
```bash
curl http://138.197.21.64:8000/health
```

#### Monitor logs:
```bash
tail -f /var/log/image-metadata-api.log
```

#### Process monitoring:
```bash
ps aux | grep uvicorn
netstat -tlnp | grep :8000
```

## Quick Fix for Current CORS Issue

1. **Update the API** with the new CORS configuration (already done)
2. **Restart the API server** on your production server
3. **Test the connection** from React app

The API should now accept requests from `http://138.197.21.64:3000`.