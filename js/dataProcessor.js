class DataProcessor {
    constructor() {
        this.crimeData = [];
        this.conflictData = [];
        this.boundariesData = null;
        this.processedData = {};
    }

    async loadAllData() {
        try {
            console.log('Loading data files...');
            
            // Load CSV files
            const [crimeData, conflictData, boundariesData] = await Promise.all([
                this.loadCSV('data/Crime-Report-RSO.csv'),
                this.loadCSV('data/Conflict-Incident-RSO.csv'),
                this.loadGeoJSON('layers/geoBoundaries-ETH-ADM3.geojson')
            ]);

            this.crimeData = this.parseIncidents(crimeData, 'crime');
            this.conflictData = this.parseIncidents(conflictData, 'conflict');
            this.boundariesData = boundariesData;

            console.log(`Loaded ${this.crimeData.length} crime incidents`);
            console.log(`Loaded ${this.conflictData.length} conflict incidents`);
            console.log(`Loaded ${this.boundariesData.features.length} boundary features`);

            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    loadCSV(filePath) {
        return new Promise((resolve, reject) => {
            Papa.parse(filePath, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn('CSV parsing warnings:', results.errors);
                    }
                    resolve(results.data);
                },
                error: (error) => reject(error)
            });
        });
    }

    async loadGeoJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
            throw error;
        }
    }

    parseIncidents(data, type) {
        return data.map(row => {
            const incident = {
                id: `${type}_${Date.now()}_${Math.random()}`,
                type: type,
                eventType: row['Event Type'] || 'Unknown',
                date: this.parseDate(row.Date),
                latitude: parseFloat(row.Latitude) || null,
                longitude: parseFloat(row.Longitude) || null,
                region: row.Region || 'Unknown',
                zone: row.Zone || '',
                woreda: row.Woreda || '',
                kebele: row.Kebele || '',
                town: row.Town || '',
                injuries: this.parseNumber(row.Injuries),
                fatalities: this.parseNumber(row.Fatalities),
                notes: row.Notes || row['What Happened?'] || '',
                comPersonnel: row['COM Personnel?'] === 'YES' || row['COM Personnel?'] === 'Yes'
            };

            // Clean up empty strings
            Object.keys(incident).forEach(key => {
                if (incident[key] === '') {
                    incident[key] = null;
                }
            });

            return incident;
        }).filter(incident => {
            // Filter out incidents without valid coordinates or dates
            return incident.latitude && incident.longitude && incident.date;
        });
    }

    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Handle different date formats
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY or M/D/YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
            /(\d{1,2})-(\d{1,2})-(\d{4})/    // MM-DD-YYYY
        ];

        for (let format of formats) {
            const match = dateStr.match(format);
            if (match) {
                if (format === formats[1]) { // YYYY-MM-DD
                    return new Date(match[1], match[2] - 1, match[3]);
                } else { // MM/DD/YYYY or MM-DD-YYYY
                    return new Date(match[3], match[1] - 1, match[2]);
                }
            }
        }

        // Try direct parsing as fallback
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    parseNumber(str) {
        if (!str || str === 'None' || str === 'none' || str === '') return 0;
        if (str === 'Yes' || str === 'YES') return 1;
        
        const num = parseInt(str);
        return isNaN(num) ? 0 : num;
    }

    getAllIncidents() {
        return [...this.crimeData, ...this.conflictData];
    }

    filterIncidents(filters = {}) {
        let incidents = this.getAllIncidents();

        // Time range filter
        if (filters.timeRange && filters.timeRange !== 'all') {
            const days = parseInt(filters.timeRange);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            incidents = incidents.filter(incident => 
                incident.date && incident.date >= cutoffDate
            );
        }

        // Incident type filter
        if (filters.incidentType && filters.incidentType !== 'all') {
            switch (filters.incidentType) {
                case 'crime':
                    incidents = incidents.filter(i => i.type === 'crime');
                    break;
                case 'conflict':
                    incidents = incidents.filter(i => i.type === 'conflict');
                    break;
                case 'high-severity':
                    incidents = incidents.filter(i => {
                        const severityTypes = ['drone strike', 'armed clash', 'crime/killing', 
                                             'kidnapping', 'gunfire', 'cross-border attack'];
                        return severityTypes.includes(i.eventType.toLowerCase()) ||
                               i.fatalities > 0 || i.injuries > 2;
                    });
                    break;
            }
        }

        return incidents;
    }

    aggregateByWoreda(incidents) {
        const woredaData = {};

        let spatialMatches = 0;
        let fallbackMatches = 0;
        
        incidents.forEach(incident => {
            // First try to assign incident to a boundary feature using spatial matching
            const boundaryFeature = this.findBoundaryByCoordinates(incident.latitude, incident.longitude);
            
            let woredaKey;
            let woredaInfo = {
                region: incident.region,
                zone: incident.zone,
                woreda: incident.woreda
            };
            
            if (boundaryFeature) {
                // Use boundary feature information
                woredaKey = `boundary_${boundaryFeature.properties.shapeID}`;
                woredaInfo = {
                    region: incident.region || 'Unknown',
                    zone: incident.zone || 'Unknown', 
                    woreda: boundaryFeature.properties.shapeName,
                    boundaryFeature: boundaryFeature
                };
                spatialMatches++;
            } else {
                // Fall back to original woreda key method
                woredaKey = this.getWoredaKey(incident);
                fallbackMatches++;
            }
            
            if (!woredaData[woredaKey]) {
                woredaData[woredaKey] = {
                    ...woredaInfo,
                    incidents: [],
                    totalIncidents: 0,
                    totalFatalities: 0,
                    totalInjuries: 0,
                    latestIncident: null,
                    eventTypes: new Set(),
                    coordinates: boundaryFeature ? null : {
                        avgLat: incident.latitude,
                        avgLng: incident.longitude,
                        count: 1
                    }
                };
            }

            woredaData[woredaKey].incidents.push(incident);
            woredaData[woredaKey].totalIncidents++;
            woredaData[woredaKey].totalFatalities += incident.fatalities || 0;
            woredaData[woredaKey].totalInjuries += incident.injuries || 0;
            woredaData[woredaKey].eventTypes.add(incident.eventType);

            // Update average coordinates for non-boundary matched incidents
            if (!boundaryFeature && woredaData[woredaKey].coordinates) {
                const coords = woredaData[woredaKey].coordinates;
                coords.avgLat = (coords.avgLat * coords.count + incident.latitude) / (coords.count + 1);
                coords.avgLng = (coords.avgLng * coords.count + incident.longitude) / (coords.count + 1);
                coords.count++;
            }

            // Track latest incident
            if (!woredaData[woredaKey].latestIncident || 
                incident.date > woredaData[woredaKey].latestIncident.date) {
                woredaData[woredaKey].latestIncident = incident;
            }
        });

        // Convert eventTypes Set to Array for easier handling
        Object.values(woredaData).forEach(data => {
            data.eventTypes = Array.from(data.eventTypes);
        });

        console.log(`Aggregated into ${Object.keys(woredaData).length} woreda groups`);
        console.log(`Spatial matches: ${spatialMatches}, Fallback matches: ${fallbackMatches}`);
        return woredaData;
    }

    getWoredaKey(incident) {
        // Create a unique key for woreda identification
        const region = (incident.region || '').toLowerCase().trim();
        const woreda = (incident.woreda || '').toLowerCase().trim();
        const zone = (incident.zone || '').toLowerCase().trim();
        
        // If woreda is empty, use town or coordinates as fallback
        if (!woreda) {
            const town = (incident.town || '').toLowerCase().trim();
            if (town) {
                return `${region}_${zone}_${town}`;
            }
            // Fallback to coordinate-based grouping for incidents without woreda info
            const lat = Math.round(incident.latitude * 100) / 100;
            const lng = Math.round(incident.longitude * 100) / 100;
            return `${region}_coord_${lat}_${lng}`;
        }
        
        return `${region}_${zone}_${woreda}`;
    }

    findBoundaryByCoordinates(latitude, longitude) {
        if (!this.boundariesData || !this.boundariesData.features || !latitude || !longitude) {
            return null;
        }

        // Check each boundary feature to see if the point is inside
        for (let feature of this.boundariesData.features) {
            if (feature.geometry && feature.geometry.type === 'Polygon') {
                if (this.isPointInPolygon([longitude, latitude], feature.geometry.coordinates[0])) {
                    return feature;
                }
            }
        }

        return null;
    }

    isPointInPolygon(point, polygon) {
        // Ray casting algorithm for point-in-polygon test
        const x = point[0], y = point[1];
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }

    findMatchingBoundary(woredaKey, woredaData) {
        // Try to match boundary features with woreda data
        if (!this.boundariesData || !this.boundariesData.features) {
            return null;
        }

        const [region, zone, woreda] = woredaKey.split('_');
        
        // Find matching boundary feature
        return this.boundariesData.features.find(feature => {
            const shapeName = (feature.properties.shapeName || '').toLowerCase();
            const woredaName = woreda.toLowerCase();
            
            // Simple name matching - could be enhanced with fuzzy matching
            return shapeName.includes(woredaName) || woredaName.includes(shapeName);
        });
    }

    getStatistics(incidents) {
        const stats = {
            totalIncidents: incidents.length,
            totalFatalities: 0,
            totalInjuries: 0,
            highRiskAreas: 0,
            eventTypeCounts: {},
            regionCounts: {},
            recentIncidents: []
        };

        incidents.forEach(incident => {
            stats.totalFatalities += incident.fatalities || 0;
            stats.totalInjuries += incident.injuries || 0;
            
            // Count by event type
            const eventType = incident.eventType || 'Unknown';
            stats.eventTypeCounts[eventType] = (stats.eventTypeCounts[eventType] || 0) + 1;
            
            // Count by region
            const region = incident.region || 'Unknown';
            stats.regionCounts[region] = (stats.regionCounts[region] || 0) + 1;
        });

        // Get recent incidents (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        stats.recentIncidents = incidents
            .filter(i => i.date >= sevenDaysAgo)
            .sort((a, b) => b.date - a.date)
            .slice(0, 10);

        return stats;
    }
}