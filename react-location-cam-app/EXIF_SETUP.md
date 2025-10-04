# EXIF GPS Location Extraction Setup

The app can extract GPS location data embedded in image EXIF metadata. Currently it runs in basic detection mode. To enable full GPS extraction, you have two options:

## Option 1: Install via NPM (Recommended)

1. Install EXIF.js:
```bash
npm install exif-js
```

2. Import and use in your component:
```javascript
import EXIF from 'exif-js';

// Then use EXIF.getData() and EXIF.getTag() as shown in the component
```

## Option 2: Use CDN (No build changes needed)

Add this script tag to `public/index.html` before the closing `</head>` tag:
```html
<script src="https://cdn.jsdelivr.net/npm/exif-js@2.3.0/exif.js"></script>
```

The app will automatically detect and use the CDN version.

## What GPS Data Can Be Extracted

Once EXIF.js is properly configured, you can extract:

### **Location Coordinates**
- **Latitude** - Decimal degrees with 8 decimal precision
- **Longitude** - Decimal degrees with 8 decimal precision  
- **Altitude** - Meters above/below sea level
- **Coordinate References** - N/S for latitude, E/W for longitude

### **GPS Timestamp**
- **Date** - When the GPS fix was obtained
- **Time** - UTC time of GPS fix
- **Time Zone** - If available in EXIF data

### **Raw GPS Data**
- **DMS Format** - Degrees, Minutes, Seconds
- **Reference Directions** - Cardinal directions
- **GPS Precision** - Accuracy information if available

## Supported Image Formats

GPS location data is typically available in:
- ✅ **JPEG files** - Most common, full EXIF support
- ❌ **PNG files** - Limited metadata support
- ❌ **GIF files** - No EXIF support
- ❌ **WebP files** - Limited EXIF support

## How It Works

1. **Upload Image**: Drag & drop or browse for JPEG images
2. **Extract GPS Data**: Click "Extract GPS Data" button
3. **View Results**: See coordinates, maps, and raw data
4. **Export Data**: Copy coordinates or download JSON

## Example Output

When GPS data is found, you'll see:

```json
{
  "hasLocation": true,
  "coordinates": {
    "latitude": 37.7749295,
    "longitude": -122.4194155,
    "altitude": 16.2
  },
  "timestamp": {
    "date": "2024:01:15",
    "time": "14:30:25 UTC"
  },
  "mapUrl": "https://www.google.com/maps?q=37.7749295,-122.4194155"
}
```

## Privacy and Security Notes

### **Image Privacy**
- GPS data reveals exact photo locations
- Consider privacy implications before sharing images
- Many social media platforms strip EXIF data automatically
- Use "Remove EXIF" tools if needed for privacy

### **When GPS Data is Available**
- Photos taken with smartphones (if location enabled)
- Digital cameras with GPS capability
- Images that haven't been processed/stripped of metadata
- Photos from apps that preserve EXIF data

### **When GPS Data is NOT Available**
- Screenshots and edited images
- Images from apps that strip metadata
- Photos with privacy settings enabled
- Older cameras without GPS capability

## Troubleshooting

### **No GPS Data Found**
- Check if image is JPEG format
- Verify location services were enabled when photo was taken
- Some editing software removes EXIF data
- Try with a different image known to have GPS data

### **EXIF.js Not Loading**
- Check browser console for errors
- Verify CDN script is loaded correctly
- Ensure proper npm installation if using package
- Try refreshing the page

### **Accuracy Issues**
- GPS accuracy depends on device and conditions
- Indoor photos may have poor GPS accuracy
- Older devices may have less precise coordinates
- Weather and satellite visibility affect accuracy

## Testing with Sample Images

To test the functionality:
1. Take a photo with your smartphone (location enabled)
2. Upload the original, unedited image
3. Click "Extract GPS Data"
4. You should see coordinates and map links

## Integration Examples

### **Real Estate**
- Extract property locations from listing photos
- Verify photo locations match property addresses
- Generate automatic map links for listings

### **Travel Documentation**
- Track photo locations from trips
- Create travel maps from photo collections
- Verify photo authenticity by location

### **Research and Analysis**
- Analyze photo metadata for research
- Extract location patterns from image collections
- Verify image origins and authenticity