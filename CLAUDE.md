# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the ET-RSO-Incident-Tracker, a web-based incident mapping application for tracking security incidents and crime reports in Ethiopia. The project provides risk assessment and visualization capabilities for the US Embassy's Regional Security Office (RSO) through an interactive choropleth map.

## Commands

### Live Application
```bash
# The application is live at:
# https://satchmodev.github.io/rso/

# No local server needed - application runs directly in browser
```

### Testing and Development
- Test live application at https://satchmodev.github.io/rso/
- For local development: any local server (CORS requirements for file loading)
- Check browser console for data loading and processing errors
- Verify all CSV and GeoJSON files load successfully

### Deployment
```bash
# Current repository: https://github.com/SatchmoDev/rso
# Automatic deployment to GitHub Pages on push to main branch

# To deploy changes:
git add .
git commit -m "Update application"
git push origin main

# GitHub Pages will automatically deploy to:
# https://satchmodev.github.io/rso/
```

## Architecture Overview

### Core Application Structure
- **Single-page application** using vanilla JavaScript and Leaflet.js
- **Data-driven choropleth visualization** of Ethiopian administrative boundaries (woreda level)
- **Modular JavaScript architecture** with separated concerns:
  - `DataProcessor` - CSV/GeoJSON loading, parsing, and aggregation
  - `RiskCalculator` - Risk scoring algorithm implementation
  - `MapRenderer` - Leaflet map initialization and choropleth rendering
  - `Controls` - UI controls, filtering, and application state management

### Data Flow
1. Application loads and parses CSV incident data and GeoJSON boundaries
2. Incidents are aggregated by woreda administrative unit
3. Risk scores calculated using weighted algorithm considering severity, casualties, recency, quantity
4. Map rendered with risk-based color coding and interactive features
5. User interactions update filters, triggering recalculation and re-rendering

### Key JavaScript Classes
- `js/dataProcessor.js:1` - Main data loading and processing class
- `js/riskCalculator.js:1` - Risk scoring algorithm implementation  
- `js/mapRenderer.js` - Leaflet map and choropleth visualization
- `js/controls.js` - UI controls and application initialization

## Data Structure

### Core Data Files
- `data/Crime-Report-RSO.csv` - Crime incidents affecting embassy personnel and operations
- `data/Conflict-Incident-RSO.csv` - Armed conflicts, arrests, drone strikes, and security incidents across Ethiopia
- `layers/geoBoundaries-ETH-ADM3.geojson` - Ethiopian administrative boundaries (woreda level)

### Data Schema

**Crime Reports Schema:**
Event Type, COM Personnel?, Date, Latitude, Longitude, Region, Zone, Woreda, Kebele, Town, Injuries, Fatalities, Notes, Merged

**Conflict Incidents Schema:**
Event Type, Date, Latitude, Longitude, Region, Zone, Woreda, Kebele, Town, Injuries, Fatalities, What Happened?, Merged, Notes

**Administrative Boundaries:**
GeoJSON with properties: shapeName, shapeISO, shapeID, shapeGroup, shapeType, polygon coordinates

## Risk Scoring System

### Severity Weights (js/riskCalculator.js:3-17)
- Drone strikes: 9 points
- Armed clashes, killings: 8 points  
- Cross-border attacks, kidnapping: 7 points
- Gunfire: 6 points
- Robbery: 4 points
- Arrests, vehicle accidents: 3 points
- Theft, other crime: 2 points

### Risk Calculation Factors
- **Incident Severity**: Event type weighted scoring
- **Casualty Impact**: Fatalities weighted 2x more than injuries
- **Recency Decay**: Linear reduction over 90 days (100% → 10% weight)
- **Quantity Scaling**: Logarithmic scaling for multiple incidents per woreda

### Risk Level Thresholds
- **High Risk** (15+ points): Dark red - immediate security protocols required
- **Elevated Risk** (8-14 points): Red - enhanced security awareness needed  
- **Moderate Risk** (4-7 points): Orange - standard security protocols sufficient
- **Low Risk** (1-3 points): Yellow - basic security awareness recommended
- **Minimal Risk** (0 points): Green - no recent incidents recorded

## Application Features and UI

### Interactive Map Features
- **Choropleth visualization** of woredas colored by calculated risk levels
- **Hover tooltips** showing quick incident statistics per woreda
- **Click interactions** for detailed woreda incident information
- **Responsive design** optimized for desktop and tablet interfaces

### Filtering and Controls
- **Time range filters**: 30/60/90 days or all historical data
- **Incident type filters**: All incidents, crime only, conflict only, high-severity only
- **Real-time statistics** displaying current filter results
- **Export functionality** generating JSON reports for risk assessments
- **Keyboard shortcuts**: Ctrl+R (refresh), Ctrl+E (export), 1-4 (time ranges)

## File Structure

```
/
├── index.html              # Main application interface with Leaflet map
├── css/
│   ├── map.css            # Map styling, choropleth colors, layout
│   └── controls.css       # Control panel, buttons, responsive design
├── js/
│   ├── dataProcessor.js   # CSV/GeoJSON loading via Papa Parse and fetch
│   ├── riskCalculator.js  # Risk scoring algorithm implementation  
│   ├── mapRenderer.js     # Leaflet map, choropleth rendering, interactions
│   └── controls.js        # UI controls, filtering, app initialization
├── data/
│   ├── Crime-Report-RSO.csv     # Embassy crime incident data
│   └── Conflict-Incident-RSO.csv # Regional conflict incident data
├── layers/
│   └── geoBoundaries-ETH-ADM3.geojson # Ethiopian woreda boundaries
├── README.md               # User documentation and GitHub Pages info
├── CLAUDE.md               # Development guidance and architecture
└── .gitignore             # Git ignore patterns
```

## Development Context and Common Tasks

### Typical Development Work
- **Risk algorithm tuning**: Adjusting severity weights and calculation factors in `riskCalculator.js`
- **Data validation**: Ensuring CSV data integrity and geographic coordinate accuracy
- **Visualization enhancement**: Modifying choropleth colors, tooltip content, and map interactions
- **Performance optimization**: Improving data processing and rendering for large datasets
- **Security reporting**: Generating risk assessments and incident analysis reports

### Dependencies and External Resources
- **Leaflet.js** (CDN): Interactive mapping library for choropleth visualization
- **Papa Parse** (CDN): CSV parsing and data processing
- **Self-contained deployment**: No server-side dependencies, all processing client-side
- **External map tiles**: Requires internet connection for OpenStreetMap tiles

## Security and Data Sensitivity

⚠️ **Critical Security Considerations:**
- Contains **real security incident data** with precise geographic coordinates
- Includes **sensitive operational information** about embassy security events
- Designed for **internal RSO use only** - not for public deployment
- **Location data must be protected** - consider private repository for GitHub Pages
- All data pertains to **defensive security operations** and threat assessment
- Incident details contain information about **specific security events and patterns**