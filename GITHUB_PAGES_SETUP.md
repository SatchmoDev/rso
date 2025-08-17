# GitHub Pages Deployment Instructions

## Step-by-Step Setup for dipnote.github.io

### 🚨 **Security Warning**
**CRITICAL**: This application contains real security incident data with precise geographic coordinates. Before deploying publicly:

1. **Consider using a private repository** (requires GitHub Pro for Pages)
2. **Review data sensitivity** with appropriate authorities
3. **Ensure authorized access only** for sensitive security information

---

## Quick Deployment Steps

### 1. **Clone Your Existing Repository**
```bash
git clone https://github.com/[your-username]/dipnote.github.io.git
cd dipnote.github.io
```

### 2. **Create the Directory Structure**
```bash
mkdir ethiopia-tracker
```

### 3. **Copy Files to Your Repository**

Copy these files from the ET-RSO-Incident-Tracker to `dipnote.github.io/ethiopia-tracker/`:

**Required Files:**
```
ethiopia-tracker/
├── index.html                    # Main application
├── css/
│   ├── map.css                  # Map styling  
│   └── controls.css             # UI controls styling
├── js/
│   ├── dataProcessor.js         # Data handling
│   ├── riskCalculator.js        # Risk scoring
│   ├── mapRenderer.js           # Map visualization
│   └── controls.js              # UI interactions
├── data/
│   ├── Crime-Report-RSO.csv     # Crime incident data
│   └── Conflict-Incident-RSO.csv # Conflict incident data
├── layers/
│   └── geoBoundaries-ETH-ADM3.geojson # Ethiopian boundaries
├── README.md                    # Documentation
└── CLAUDE.md                    # Development notes
```

### 4. **Update Your Main Landing Page**

Replace your current `index.html` with the provided `landing-page.html`, OR modify your existing landing page to include a link to the Ethiopia tracker:

```html
<a href="ethiopia-tracker/">Ethiopia RSO Incident Tracker</a>
```

### 5. **Commit and Deploy**
```bash
git add .
git commit -m "Add Ethiopia RSO Incident Tracker

- Interactive choropleth visualization of security incidents
- Risk assessment by Ethiopian woredas  
- Temporal filtering and detailed incident analysis
- Built with Leaflet.js for RSO security operations"

git push origin main
```

### 6. **Access Your Deployed Applications**

After GitHub processes the deployment (usually 5-10 minutes):

- **Landing Page**: `https://dipnote.github.io/`
- **Ethiopia Tracker**: `https://dipnote.github.io/ethiopia-tracker/`
- **Your Existing Project**: `https://dipnote.github.io/[existing-project]/`

---

## Customization Options

### **Update Landing Page Content**
Edit the `index.html` (landing page) to:
- Update the description of your existing project
- Change the link to point to your existing project
- Modify branding and styling as needed

### **Customize Tracker Branding**
In `ethiopia-tracker/index.html`, you can:
- Update the page title
- Modify the header text
- Adjust color schemes in the CSS files

---

## Alternative Deployment Options

### **Option A: Private Repository (Recommended for Sensitive Data)**
1. Create a new private repository: `ethiopia-rso-tracker-private`
2. Upload all tracker files
3. Use GitHub Pro for private Pages hosting
4. Share access only with authorized personnel

### **Option B: Separate Public Repository**
1. Create: `github.com/[username]/ethiopia-tracker`
2. Deploy to: `[username].github.io/ethiopia-tracker`
3. Link from your main dipnote.github.io site

### **Option C: Alternative Hosting**
- **Netlify**: Drag-and-drop deployment
- **Vercel**: Git-based deployment
- **Google Cloud**: Static site hosting

---

## Verification Checklist

✅ **Landing page loads** at dipnote.github.io  
✅ **Tracker accessible** at dipnote.github.io/ethiopia-tracker/  
✅ **Map renders** with Ethiopian boundaries  
✅ **Incident markers** appear on map  
✅ **Choropleth fills** show risk levels (red/yellow)  
✅ **Hover tooltips** display incident information  
✅ **Filters work** (time range, incident type)  
✅ **Export function** generates reports  

---

## Troubleshooting

### **Map Doesn't Load**
- Check browser console for errors
- Verify internet connection (needs CDN access)
- Ensure GitHub Pages build completed

### **Data Files Missing**
- Confirm all files copied to `ethiopia-tracker/` directory
- Check file paths are relative (not absolute)
- Verify CSV and GeoJSON files are accessible

### **GitHub Pages Not Working**
1. Go to repository Settings → Pages
2. Ensure source is set to "Deploy from a branch"
3. Select "main" branch and "/ (root)" folder
4. Wait 5-10 minutes for deployment

### **Security Concerns**
- Consider private repository for sensitive data
- Review data with appropriate security personnel
- Implement access controls as needed

---

## Technical Requirements

**Client Requirements:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection for map tiles

**Server Requirements:**
- None (static site hosting)
- All processing happens in browser
- Uses CDN resources (Leaflet.js, Papa Parse)

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify all files are in the correct subdirectory
3. Ensure GitHub Pages build completed successfully
4. Test locally first with `python3 -m http.server 8080`