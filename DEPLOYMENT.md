# Deployment Guide: Ethiopia RSO Incident Tracker

## GitHub Pages Deployment to dipnote.github.io

### Prerequisites
- Access to your dipnote.github.io repository
- Git installed locally
- GitHub account with push permissions

### Security Warning ⚠️
**IMPORTANT**: This application contains real security incident data with precise coordinates. Consider the following before public deployment:

1. **Private Repository**: Use GitHub Pro for private repository with Pages hosting
2. **Data Sanitization**: Remove or generalize sensitive location details
3. **Access Control**: Limit access to authorized personnel only

### Deployment Steps

#### 1. Clone Your Existing Repository
```bash
git clone https://github.com/[your-username]/dipnote.github.io.git
cd dipnote.github.io
```

#### 2. Create Subdirectory Structure
```bash
mkdir ethiopia-tracker
```

#### 3. Copy Tracker Files
Copy all files from this project to the `ethiopia-tracker/` subdirectory:
```
ethiopia-tracker/
├── index.html
├── css/
│   ├── map.css
│   └── controls.css
├── js/
│   ├── dataProcessor.js
│   ├── riskCalculator.js
│   ├── mapRenderer.js
│   └── controls.js
├── data/
│   ├── Crime-Report-RSO.csv
│   └── Conflict-Incident-RSO.csv
├── layers/
│   └── geoBoundaries-ETH-ADM3.geojson
├── README.md
└── CLAUDE.md
```

#### 4. Update Main Landing Page
Replace or update your main `index.html` with the provided landing page that links to both projects.

#### 5. Test Locally
```bash
# From the dipnote.github.io directory
python3 -m http.server 8080
# Visit http://localhost:8080/ethiopia-tracker/
```

#### 6. Deploy to GitHub
```bash
git add .
git commit -m "Add Ethiopia RSO Incident Tracker"
git push origin main
```

#### 7. Access Your Deployed Site
- Landing page: `https://dipnote.github.io/`
- Tracker: `https://dipnote.github.io/ethiopia-tracker/`

### File Requirements
All files are self-contained and use CDN resources:
- Leaflet.js (from CDN)
- Papa Parse (from CDN)
- No server-side requirements
- All data files included

### Browser Requirements
- Modern browsers with JavaScript enabled
- Internet connection for map tiles and CDN resources
- Recommended: Chrome, Firefox, Safari, Edge

### Troubleshooting
- If maps don't load, check browser console for errors
- Ensure all data files are in correct subdirectory
- Verify GitHub Pages is enabled in repository settings
- Check that all paths use relative URLs (not absolute)

### Support
- Check browser console for error messages
- Verify data files are accessible
- Ensure GitHub Pages build completed successfully