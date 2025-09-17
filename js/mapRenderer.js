class MapRenderer {
    constructor() {
        this.map = null;
        this.dataProcessor = null;
        this.riskCalculator = null;
        this.currentLayer = null;
        this.currentFilters = {
            timeRange: '180',
            incidentType: 'all'
        };
        this.woredaRiskData = {};
    }

    initialize(dataProcessor, riskCalculator) {
        this.dataProcessor = dataProcessor;
        this.riskCalculator = riskCalculator;
        this.initializeMap();
    }

    initializeMap() {
        // Initialize the map centered on Ethiopia
        this.map = L.map('map', {
            center: [9.1450, 40.4897], // Ethiopia center coordinates
            zoom: 6,
            zoomControl: true,
            attributionControl: true
        });

        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Add custom control for map info
        this.addMapControls();
        
        console.log('Map initialized');
    }

    addMapControls() {
        // Add a custom info control
        const info = L.control({ position: 'topright' });
        
        info.onAdd = function(map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };
        
        info.update = function(props) {
            if (!props) {
                this._div.innerHTML = '<h4>Woreda Risk Information</h4>Hover over a woreda';
                return;
            }
            
            let content = `<h4>Woreda Risk Information</h4>`;
            content += `<b>${props.woredaName || 'Unknown'}</b><br/>`;
            content += `Risk Level: <span style="color: ${props.riskColor}"><b>${props.riskLevel.toUpperCase()}</b></span><br/>`;
            content += `Risk Score: ${props.riskScore}<br/>`;
            content += `Total Incidents: ${props.totalIncidents}<br/>`;
            
            if (props.totalCasualties > 0) {
                content += `Total Casualties: ${props.totalCasualties}<br/>`;
            }
            
            if (props.eventTypes && props.eventTypes.length > 0) {
                content += `<br/><b>Recent Events:</b><br/>`;
                props.eventTypes.slice(0, 3).forEach(eventType => {
                    content += `• ${eventType}<br/>`;
                });
            }
            
            if (props.daysSinceLatest !== undefined) {
                content += `<br/><b>Latest:</b> ${props.daysSinceLatest} days ago`;
            }
            
            this._div.innerHTML = content;
        };
        
        info.addTo(this.map);
        this.infoControl = info;
    }

    async renderIncidentMap(filters = {}) {
        try {
            this.currentFilters = { ...this.currentFilters, ...filters };
            
            // Filter incidents based on current filters
            const filteredIncidents = this.dataProcessor.filterIncidents(this.currentFilters);
            console.log(`Rendering ${filteredIncidents.length} incidents with filters:`, this.currentFilters);
            
            // Aggregate incidents by woreda
            const woredaData = this.dataProcessor.aggregateByWoreda(filteredIncidents);
            console.log(`Aggregated data for ${Object.keys(woredaData).length} woredas`);
            
            // Calculate risk scores for each woreda
            this.woredaRiskData = {};
            const allScores = [];
            
            Object.keys(woredaData).forEach(woredaKey => {
                const riskScore = this.riskCalculator.calculateWoredaRiskScore(woredaData[woredaKey]);
                this.woredaRiskData[woredaKey] = {
                    ...woredaData[woredaKey],
                    riskScore: riskScore
                };
                
                allScores.push(riskScore.score);
                
                // Debug: Log risk scores
                console.log(`${woredaKey}: Score=${riskScore.score.toFixed(1)}, Level=${riskScore.level}, Incidents=${woredaData[woredaKey].totalIncidents}`);
            });
            
            // Log score distribution
            allScores.sort((a, b) => b - a); // Sort descending
            console.log('=== SCORE DISTRIBUTION ===');
            console.log(`Highest score: ${allScores[0]?.toFixed(1) || 0}`);
            console.log(`Lowest score: ${allScores[allScores.length - 1]?.toFixed(1) || 0}`);
            console.log(`Average score: ${(allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)}`);
            console.log(`Scores above 8: ${allScores.filter(s => s >= 8).length}`);
            console.log(`Scores 6-7.99: ${allScores.filter(s => s >= 6 && s < 8).length}`);
            console.log(`Scores 3-5.99: ${allScores.filter(s => s >= 3 && s < 6).length}`);
            console.log(`Top 5 scores: [${allScores.slice(0, 5).map(s => s.toFixed(1)).join(', ')}]`);
            
            // Clear ALL existing layers properly
            this.cleanup();
            
            // Render choropleth layer FIRST (bottom layer)
            await this.renderChoroplethLayer();
            
            // Add incident points as markers ON TOP
            this.addIncidentMarkers(filteredIncidents);
            
            // Update statistics
            this.updateStatistics(filteredIncidents);
            
            console.log('Map rendering complete');
            
        } catch (error) {
            console.error('Error rendering map:', error);
            this.showError('Failed to render map. Please check data files.');
        }
    }

    async renderChoroplethLayer() {
        if (!this.dataProcessor.boundariesData) {
            console.warn('No boundary data available for choropleth rendering');
            return;
        }

        console.log(`Rendering choropleth with ${this.dataProcessor.boundariesData.features.length} boundary features`);
        console.log(`Available risk data for ${Object.keys(this.woredaRiskData).length} woredas:`, Object.keys(this.woredaRiskData));

        const self = this;
        let coloredFeatures = 0;
        let totalFeatures = 0;
        
        // Create choropleth layer
        this.currentLayer = L.geoJSON(this.dataProcessor.boundariesData, {
            style: function(feature) {
                totalFeatures++;
                const style = self.getFeatureStyle(feature);
                
                if (style.fillOpacity > 0.5) { // Count significantly colored features
                    coloredFeatures++;
                    console.log(`COLORED: ${feature.properties.shapeName} -> ${style.fillColor} (opacity: ${style.fillOpacity})`);
                }
                
                return style;
            },
            onEachFeature: function(feature, layer) {
                self.setupFeatureInteractions(feature, layer);
            }
        }).addTo(this.map);
        
        console.log(`Choropleth rendering complete: ${coloredFeatures}/${totalFeatures} features colored`);
        
        // Fit map to boundaries
        this.map.fitBounds(this.currentLayer.getBounds());
    }

    getFeatureStyle(feature) {
        // Find matching woreda data
        const matchingWoreda = this.findMatchingWoredaData(feature);
        
        let fillColor = '#f0f0f0'; // Default light gray for areas with no incidents
        let fillOpacity = 0.2; // Subtle background for all areas
        let strokeColor = '#cccccc';
        let strokeWeight = 0.8;
        
        if (matchingWoreda && matchingWoreda.riskScore) {
            const riskColor = matchingWoreda.riskScore.color;
            
            if (riskColor !== 'transparent') {
                // High visibility for risk areas
                fillColor = riskColor;
                fillOpacity = 0.9; // Very high opacity for colored areas
                strokeColor = '#ffffff'; // White borders for contrast
                strokeWeight = 2; // Thicker borders for emphasis
                
                console.log(`RISK AREA: ${feature.properties.shapeName} -> ${riskColor} (${matchingWoreda.riskScore.level}) with ${matchingWoreda.totalIncidents} incidents`);
            } else {
                // Minimal risk areas - slightly more visible than default
                fillColor = '#f8f8f8';
                fillOpacity = 0.3;
                console.log(`LOW RISK: ${feature.properties.shapeName} -> transparent (${matchingWoreda.totalIncidents} incidents)`);
            }
        } else {
            console.log(`NO DATA: ${feature.properties.shapeName} -> no matching woreda data`);
        }
        
        return {
            fillColor: fillColor,
            weight: strokeWeight,
            opacity: 1,
            color: strokeColor,
            dashArray: '',
            fillOpacity: fillOpacity
        };
    }

    findMatchingWoredaData(feature) {
        const shapeID = feature.properties.shapeID;
        const shapeName = (feature.properties.shapeName || '').toLowerCase().trim();
        
        // First try direct boundary matching using shapeID
        const boundaryKey = `boundary_${shapeID}`;
        if (this.woredaRiskData[boundaryKey]) {
            return this.woredaRiskData[boundaryKey];
        }
        
        // Try exact shape name matches
        for (let [woredaKey, woredaData] of Object.entries(this.woredaRiskData)) {
            const woredaName = (woredaData.woreda || '').toLowerCase().trim();
            
            // Check for exact name matches
            if (shapeName === woredaName) {
                return woredaData;
            }
        }
        
        // Try partial matches as fallback
        for (let [woredaKey, woredaData] of Object.entries(this.woredaRiskData)) {
            const woredaName = (woredaData.woreda || '').toLowerCase().trim();
            const region = (woredaData.region || '').toLowerCase().trim();
            const town = (woredaData.incidents[0]?.town || '').toLowerCase().trim();
            
            // Check for partial matches
            if (shapeName && woredaName && 
                (shapeName.includes(woredaName) || woredaName.includes(shapeName))) {
                return woredaData;
            }
            
            // Try matching with town name if woreda is missing
            if (town && shapeName && 
                (shapeName.includes(town) || town.includes(shapeName))) {
                return woredaData;
            }
            
            // For Addis Ababa specifically (many incidents)
            if ((shapeName.includes('addis') || shapeName.includes('ababa')) &&
                (town.includes('addis') || region.includes('addis'))) {
                return woredaData;
            }
        }
        
        return null;
    }

    setupFeatureInteractions(feature, layer) {
        const self = this;
        
        layer.on({
            mouseover: function(e) {
                const layer = e.target;
                layer.setStyle({
                    weight: 5,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.8
                });
                
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                }
                
                // Update info control
                const matchingWoreda = self.findMatchingWoredaData(feature);
                if (matchingWoreda) {
                    const riskScore = matchingWoreda.riskScore;
                    
                    // Calculate days since latest incident
                    let daysSinceLatest = undefined;
                    if (matchingWoreda.latestIncident && matchingWoreda.latestIncident.date) {
                        const timeDiff = new Date() - matchingWoreda.latestIncident.date;
                        daysSinceLatest = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                    }
                    
                    self.infoControl.update({
                        woredaName: feature.properties.shapeName,
                        riskLevel: riskScore.level,
                        riskScore: riskScore.score.toFixed(1),
                        riskColor: riskScore.color === 'transparent' ? '#666' : riskScore.color,
                        totalIncidents: matchingWoreda.totalIncidents,
                        totalCasualties: matchingWoreda.totalFatalities + matchingWoreda.totalInjuries,
                        eventTypes: matchingWoreda.eventTypes,
                        daysSinceLatest: daysSinceLatest
                    });
                } else {
                    self.infoControl.update({
                        woredaName: feature.properties.shapeName,
                        riskLevel: 'minimal',
                        riskScore: '0.0',
                        riskColor: '#666',
                        totalIncidents: 0,
                        totalCasualties: 0,
                        eventTypes: [],
                        daysSinceLatest: undefined
                    });
                }
            },
            
            mouseout: function(e) {
                self.currentLayer.resetStyle(e.target);
                self.infoControl.update();
            },
            
            click: function(e) {
                self.showWoredaDetails(feature, e.latlng);
            }
        });
    }

    showWoredaDetails(feature, latlng) {
        const matchingWoreda = this.findMatchingWoredaData(feature);
        const shapeName = feature.properties.shapeName || 'Unknown Area';
        
        let popupContent = `<div class="popup-title">${shapeName}</div>`;
        
        if (matchingWoreda) {
            const riskScore = matchingWoreda.riskScore;
            const summary = this.riskCalculator.generateRiskSummary(matchingWoreda, riskScore);
            
            // Calculate time since latest incident
            let timeSinceLatest = '';
            if (matchingWoreda.latestIncident && matchingWoreda.latestIncident.date) {
                const daysSince = Math.floor((new Date() - matchingWoreda.latestIncident.date) / (1000 * 60 * 60 * 24));
                timeSinceLatest = `${daysSince} days ago`;
            }
            
            popupContent += `
                <div class="popup-content">
                    <p><strong>Risk Level:</strong> <span style="color: ${riskScore.color === 'transparent' ? '#666' : riskScore.color}"><strong>${riskScore.level.toUpperCase()}</strong></span></p>
                    <p><strong>Risk Score:</strong> ${riskScore.score.toFixed(1)}</p>
                    <p><strong>Total Incidents:</strong> ${matchingWoreda.totalIncidents}</p>
                    
                    ${matchingWoreda.totalFatalities > 0 ? `<p><strong>Fatalities:</strong> ${matchingWoreda.totalFatalities}</p>` : ''}
                    ${matchingWoreda.totalInjuries > 0 ? `<p><strong>Injuries:</strong> ${matchingWoreda.totalInjuries}</p>` : ''}
                    
                    <p><strong>Event Types:</strong><br/>
                    ${summary.topEventTypes.map(et => `• ${et.type} (${et.count})`).join('<br/>')}</p>
                    
                    ${matchingWoreda.latestIncident ? 
                        `<p><strong>Latest Incident:</strong><br/>
                         ${matchingWoreda.latestIncident.eventType}<br/>
                         <small>${matchingWoreda.latestIncident.date.toLocaleDateString()} (${timeSinceLatest})</small></p>` : 
                        ''
                    }
                    
                    ${summary.recommendations.length > 0 ? `
                        <p><strong>Recommendations:</strong><br/>
                        <small>${summary.recommendations.slice(0, 2).join('<br/>')}</small></p>
                    ` : ''}
                </div>
            `;
            
            // Update sidebar with detailed information
            this.updateSidebar(summary);
        } else {
            popupContent += `
                <div class="popup-content">
                    <p>No incidents recorded in this area for the selected time period.</p>
                </div>
            `;
        }
        
        L.popup()
            .setLatLng(latlng)
            .setContent(popupContent)
            .openOn(this.map);
    }

    addIncidentMarkers(incidents) {
        // Create markers that are visible but don't overpower the choropleth
        const markers = [];
        
        incidents.forEach(incident => {
            if (!incident.latitude || !incident.longitude) return;
            
            const marker = L.circleMarker([incident.latitude, incident.longitude], {
                radius: this.getMarkerSize(incident),
                fillColor: this.getMarkerColor(incident),
                color: '#ffffff', // White outline for better contrast
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9,
                zIndexOffset: 1000 // Ensure markers are on top
            });
            
            // Add popup with incident details
            const popupContent = this.createIncidentPopup(incident);
            marker.bindPopup(popupContent);
            
            markers.push(marker);
        });
        
        // Add markers to map
        const markerGroup = L.layerGroup(markers);
        markerGroup.addTo(this.map);
        
        // Store reference for cleanup
        this.incidentMarkers = markerGroup;
        
        console.log(`Added ${markers.length} incident markers`);
    }

    getMarkerSize(incident) {
        const casualties = (incident.fatalities || 0) + (incident.injuries || 0);
        if (casualties > 10) return 8;  // Reduced from 10
        if (casualties > 5) return 6;   // Reduced from 8
        if (casualties > 0) return 4;   // Reduced from 6
        return 3;                       // Reduced from 4 - smaller default size
    }

    getMarkerColor(incident) {
        const eventType = (incident.eventType || '').toLowerCase();
        
        if (eventType.includes('drone') || eventType.includes('clash')) return '#CC0000';
        if (eventType.includes('killing') || eventType.includes('gunfire')) return '#FF3333';
        if (eventType.includes('kidnapping') || eventType.includes('attack')) return '#FF6600';
        if (eventType.includes('robbery') || eventType.includes('theft')) return '#FF9900';
        return '#FFCC00';
    }

    createIncidentPopup(incident) {
        return `
            <div class="popup-title">${incident.eventType}</div>
            <div class="popup-content">
                <p><strong>Date:</strong> ${incident.date.toLocaleDateString()}</p>
                <p><strong>Location:</strong> ${incident.town || incident.woreda || 'Unknown'}</p>
                <p><strong>Region:</strong> ${incident.region}</p>
                ${incident.fatalities > 0 ? `<p><strong>Fatalities:</strong> ${incident.fatalities}</p>` : ''}
                ${incident.injuries > 0 ? `<p><strong>Injuries:</strong> ${incident.injuries}</p>` : ''}
                ${incident.notes ? `<p><strong>Details:</strong> ${incident.notes.substring(0, 200)}${incident.notes.length > 200 ? '...' : ''}</p>` : ''}
            </div>
        `;
    }

    updateSidebar(summary) {
        const selectedWoreda = document.getElementById('selectedWoreda');
        
        selectedWoreda.innerHTML = `
            <h4>${summary.woredaName}</h4>
            <p><strong>Region:</strong> ${summary.region}</p>
            ${summary.zone ? `<p><strong>Zone:</strong> ${summary.zone}</p>` : ''}
            
            <div style="margin: 15px 0; padding: 10px; background: ${summary.riskLevel === 'high' ? '#ffebee' : summary.riskLevel === 'moderate' ? '#fff9c4' : '#f5f5f5'}; border-radius: 5px;">
                <p style="margin: 0;"><strong>Risk Level:</strong> <span style="color: ${this.riskCalculator.riskColors[summary.riskLevel] === 'transparent' ? '#666' : this.riskCalculator.riskColors[summary.riskLevel]}"><strong>${summary.riskLevel.toUpperCase()}</strong></span></p>
                <p style="margin: 5px 0 0 0;"><strong>Risk Score:</strong> ${summary.riskScore.toFixed(1)}</p>
            </div>
            
            <p><strong>Total Incidents:</strong> ${summary.totalIncidents}</p>
            <p><strong>Total Casualties:</strong> ${summary.totalCasualties}</p>
            
            <div style="margin-top: 15px;">
                <strong>Top Event Types:</strong>
                <ul style="margin: 5px 0 0 20px;">
                    ${summary.topEventTypes.map(et => `<li>${et.type} (${et.count})</li>`).join('')}
                </ul>
            </div>
            
            ${summary.recommendations.length > 0 ? `
                <div style="margin-top: 15px;">
                    <strong>Recommendations:</strong>
                    <ul style="margin: 5px 0 0 20px; font-size: 12px;">
                        ${summary.recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    updateStatistics(incidents) {
        const stats = this.dataProcessor.getStatistics(incidents);
        
        document.getElementById('totalIncidents').textContent = stats.totalIncidents;
        document.getElementById('totalCasualties').textContent = stats.totalFatalities + stats.totalInjuries;
        
        // Count high-risk areas
        const highRiskCount = Object.values(this.woredaRiskData)
            .filter(w => w.riskScore && w.riskScore.level === 'high').length;
        document.getElementById('highRiskAreas').textContent = highRiskCount;
    }

    showError(message) {
        console.error(message);
        // Could add user-facing error display here
        alert(message);
    }

    cleanup() {
        // Remove choropleth layer
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = null;
        }
        
        // Remove incident markers
        if (this.incidentMarkers) {
            this.map.removeLayer(this.incidentMarkers);
            this.incidentMarkers = null;
        }
        
        console.log('Cleaned up existing layers');
    }
}
