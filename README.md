# Ethiopia RSO Incident Tracker

A web-based mapping application for visualizing and analyzing security incidents across Ethiopia at the woreda level. This tool provides risk assessment and visualization capabilities for the US Embassy's Regional Security Office (RSO).

## Quick Start

1. **Start the application:**
   ```bash
   python3 -m http.server 8080
   ```

2. **Open your browser:**
   Navigate to `http://localhost:8080`

3. **Use the interface:**
   - View the interactive map with risk-colored woredas
   - Use time range filters (30/60/90 days, all time)
   - Filter by incident type (crime, conflict, high-severity)
   - Click on woredas for detailed incident information
   - Export reports using the Export button

## Features

### Interactive Choropleth Map
- Ethiopian administrative boundaries (woreda level)
- Color-coded risk levels: High (red), Elevated (orange), Moderate (yellow), Low (light yellow), Minimal (green)
- Hover for quick statistics, click for detailed information

### Risk Assessment Algorithm
The application calculates risk scores based on:

- **Incident Severity** (1-9 scale):
  - Drone strikes, armed clashes: 8-9 points
  - Kidnapping, gunfire: 6-7 points  
  - Robbery, arrests: 3-4 points
  - Theft, miscellaneous: 1-2 points

- **Casualty Impact**: Fatalities weighted 2x more than injuries
- **Recency Factor**: Linear decay over 90 days (recent = higher weight)
- **Incident Quantity**: Logarithmic scaling for multiple incidents

### Data Sources
- `data/Crime-Report-RSO.csv` - Embassy-related crime incidents
- `data/Conflict-Incident-RSO.csv` - Regional conflict and security incidents  
- `layers/geoBoundaries-ETH-ADM3.geojson` - Ethiopian administrative boundaries

### Controls and Filters
- **Time Range**: Filter incidents by recency (30/60/90 days or all time)
- **Incident Type**: View all incidents, crime only, conflict only, or high-severity only
- **Export**: Generate comprehensive JSON reports for analysis

### Keyboard Shortcuts
- `Ctrl/Cmd + R`: Refresh map and reload data
- `Ctrl/Cmd + E`: Export current view as report
- `1-4`: Quick time range selection (30/60/90 days/all)

## Risk Level Definitions

| Level | Score Range | Color | Description |
|-------|-------------|-------|-------------|
| **High** | 15+ | Dark Red | Immediate security protocols required |
| **Elevated** | 8-14 | Red | Enhanced security awareness needed |
| **Moderate** | 4-7 | Orange | Standard security protocols sufficient |
| **Low** | 1-3 | Yellow | Basic security awareness recommended |
| **Minimal** | 0 | Green | No recent incidents recorded |

## Technical Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Mapping**: Leaflet.js v1.9+ for interactive maps
- **Data Processing**: Papa Parse for CSV handling
- **Visualization**: Custom choropleth implementation
- **Export**: JSON report generation

## Data Format

### Crime Reports
Fields: Event Type, Date, Latitude, Longitude, Region, Zone, Woreda, Kebele, Town, Injuries, Fatalities, Notes

### Conflict Incidents  
Fields: Event Type, Date, Latitude, Longitude, Region, Zone, Woreda, Kebele, Town, Injuries, Fatalities, What Happened?, Notes

## Security Notes

⚠️ **Sensitive Data**: This application contains real security incident data with precise locations. Handle appropriately:

- Designed for internal RSO use only
- Should not be deployed on public networks
- Incident details contain sensitive operational information
- Geographic data shows exact incident locations

## Browser Compatibility

- Modern browsers with JavaScript enabled
- Tested on Chrome, Firefox, Safari, Edge
- Mobile responsive design for tablets
- Requires internet connection for map tiles

## Troubleshooting

**Map not loading:**
- Check that all data files are present in correct directories
- Ensure local server is running on port 8080
- Check browser console for error messages

**No incidents showing:**
- Verify CSV files contain valid data
- Check date format compatibility
- Try different time range filters

**Performance issues:**
- Large datasets may cause slower rendering
- Consider filtering to smaller time ranges
- Check browser console for performance warnings