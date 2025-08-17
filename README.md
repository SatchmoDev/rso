# Ethiopia RSO Incident Tracker

**Live Application**: [https://satchmodev.github.io/rso/](https://satchmodev.github.io/rso/)

A web-based mapping application for visualizing and analyzing security incidents across Ethiopia at the woreda level. This tool provides risk assessment and visualization capabilities for the US Embassy's Regional Security Office (RSO).

## Access the Application

**Visit the live application**: [satchmodev.github.io/rso](https://satchmodev.github.io/rso/)

- **No installation required** - runs directly in your browser
- **Mobile responsive** - works on phones, tablets, and desktops  
- **Real-time data** - always up-to-date incident information
- **Secure hosting** - hosted on GitHub Pages

## Mobile Interface

The application features a mobile-optimized interface:

- **Hamburger Menu**: Tap the menu button (top-right) to access controls
- **Slide-out Panel**: Time range filters, incident type selection, and export options
- **Full-screen Map**: Maximum screen space for viewing incident data
- **Touch-friendly**: Large buttons and intuitive touch interactions

## Features

### Interactive Choropleth Map
- **Ethiopian administrative boundaries** at woreda level
- **Color-coded risk levels**: 
  - **High Risk (6+ points)** - Red - Immediate security protocols required
  - **Moderate Risk (3-5 points)** - Yellow - Standard security protocols sufficient
  - **Low/No Risk (<3 points)** - Transparent - Minimal or no recent incidents
- **Interactive tooltips**: Hover for quick statistics, click for detailed information

### Advanced Risk Assessment
The application calculates risk scores using a sophisticated algorithm:

- **Incident Severity Weighting** (1-9 scale):
  - Drone strikes, armed clashes: 8-9 points
  - Kidnapping, gunfire: 6-7 points  
  - Robbery, arrests: 3-4 points
  - Theft, miscellaneous: 1-2 points

- **Casualty Impact**: Fatalities weighted 2x more than injuries
- **Recency Factor**: Linear decay over 90 days (recent incidents weighted higher)
- **Incident Quantity**: Logarithmic scaling for multiple incidents per woreda

### Filtering & Controls
- **Time Range Filters**: 30/60/90 days or all historical data
- **Incident Type Filters**: All incidents, crime only, conflict only, or high-severity
- **Export Functionality**: Generate comprehensive JSON reports for analysis
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + R`: Refresh map and reload data
  - `Ctrl/Cmd + E`: Export current view as report
  - `1-4`: Quick time range selection

## Data Sources

- **Crime Reports**: Embassy-related incidents in Addis Ababa area
- **Conflict Data**: Regional security incidents across Ethiopia
- **Geographic Boundaries**: Ethiopian administrative boundaries (woreda level)

All data is processed in real-time with up-to-date risk calculations.

## Technical Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Mapping**: Leaflet.js v1.9+ for interactive choropleth visualization
- **Data Processing**: Papa Parse for CSV handling and real-time processing
- **Hosting**: GitHub Pages with CDN resources
- **Performance**: Client-side processing, no server dependencies

## Device Compatibility

- **Desktop**: Full-featured interface with all controls visible
- **Mobile**: Collapsible menu system, optimized touch targets
- **Browsers**: Chrome, Firefox, Safari, Edge (modern browsers)
- **Requirements**: Internet connection for map tiles and CDN resources

## Security & Data Sensitivity

**Important Security Notice**:

This application contains **real security incident data** with precise geographic coordinates:

- **Sensitive operational information** about embassy security events
- **Exact incident locations** with detailed geographic data
- **Internal RSO use** - designed for authorized personnel only
- **Defensive security data** for situational awareness and threat assessment

**Data Handling Guidelines**:
- Handle all incident information with appropriate security protocols
- Location data should be protected according to operational guidelines
- Consider access controls based on data sensitivity requirements

## Development

This repository contains the source code for the Ethiopia RSO Incident Tracker. The application is automatically deployed to GitHub Pages when changes are pushed to the main branch.

**Repository**: [github.com/SatchmoDev/rso](https://github.com/SatchmoDev/rso)

## Support

For technical issues or questions:

1. **Check the live application** at [satchmodev.github.io/rso](https://satchmodev.github.io/rso/)
2. **Verify browser compatibility** (modern browsers required)
3. **Check internet connection** (required for map tiles)
4. **Review browser console** for any error messages

## Version Information

- **Current Version**: Live on GitHub Pages
- **Last Updated**: Automatically updated with each deployment
- **Mobile Support**: Fully responsive with dedicated mobile interface
- **Real-time Data**: Always current incident information