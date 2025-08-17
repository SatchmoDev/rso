class RiskCalculator {
    constructor() {
        this.severityWeights = {
            'drone strike': 9,
            'armed clash': 8,
            'crime/killing': 8,
            'cross-border attack': 7,
            'kidnapping': 7,
            'gunfire': 6,
            'robbery': 4,
            'arrests': 3,
            'vehicle accident': 3,
            'theft': 2,
            'other crime': 2,
            'miscellaneous': 2,
            'unknown': 1
        };
        
        this.riskThresholds = {
            high: 6,       // Multiple incidents or serious single incident
            moderate: 3    // Some incidents or single serious incident
            // Below 3 = minimal risk (transparent)
        };
        
        this.riskColors = {
            high: '#CC0000',        // Red - High Risk
            moderate: '#FFCC00',    // Yellow - Moderate Risk  
            minimal: 'transparent'  // Transparent - No significant risk
        };
    }

    calculateWoredaRiskScore(woredaData, currentDate = new Date()) {
        if (!woredaData || !woredaData.incidents || woredaData.incidents.length === 0) {
            return {
                score: 0,
                level: 'minimal',
                color: this.riskColors.minimal,
                breakdown: {
                    severityScore: 0,
                    recencyMultiplier: 0,
                    quantityMultiplier: 0,
                    casualtyMultiplier: 0
                }
            };
        }

        let totalScore = 0;
        let breakdown = {
            severityScore: 0,
            recencyMultiplier: 0,
            quantityMultiplier: 0,
            casualtyMultiplier: 0
        };

        // Calculate individual incident scores
        woredaData.incidents.forEach(incident => {
            const incidentScore = this.calculateIncidentScore(incident, currentDate);
            totalScore += incidentScore.score;
            
            // Accumulate breakdown data
            breakdown.severityScore += incidentScore.breakdown.severityScore;
            breakdown.recencyMultiplier += incidentScore.breakdown.recencyMultiplier;
            breakdown.casualtyMultiplier += incidentScore.breakdown.casualtyMultiplier;
        });

        // Apply quantity multiplier based on total incidents
        breakdown.quantityMultiplier = this.getQuantityMultiplier(woredaData.incidents.length);
        totalScore *= breakdown.quantityMultiplier;

        // Average the breakdown values for display
        const incidentCount = woredaData.incidents.length;
        breakdown.severityScore = breakdown.severityScore / incidentCount;
        breakdown.recencyMultiplier = breakdown.recencyMultiplier / incidentCount;
        breakdown.casualtyMultiplier = breakdown.casualtyMultiplier / incidentCount;

        const finalScore = Math.round(totalScore * 100) / 100;
        const level = this.getRiskLevel(finalScore);
        const color = this.getRiskColor(finalScore);
        
        // Debug logging for score calculation
        console.log(`Risk calculation: Score=${finalScore}, Level=${level}, Color=${color}, Incidents=${woredaData.incidents.length}`);
        
        return {
            score: finalScore,
            level: level,
            color: color,
            breakdown: breakdown
        };
    }

    calculateIncidentScore(incident, currentDate = new Date()) {
        // 1. Base severity score
        const severityScore = this.getSeverityScore(incident);
        
        // 2. Recency multiplier
        const recencyMultiplier = this.getRecencyMultiplier(incident.date, currentDate);
        
        // 3. Casualty multiplier
        const casualtyMultiplier = this.getCasualtyMultiplier(incident.fatalities, incident.injuries);
        
        // Calculate final incident score
        const score = severityScore * recencyMultiplier * casualtyMultiplier;
        
        return {
            score: score,
            breakdown: {
                severityScore: severityScore,
                recencyMultiplier: recencyMultiplier,
                casualtyMultiplier: casualtyMultiplier
            }
        };
    }

    getSeverityScore(incident) {
        const eventType = (incident.eventType || 'unknown').toLowerCase();
        
        // Check for exact matches first
        if (this.severityWeights[eventType]) {
            return this.severityWeights[eventType];
        }
        
        // Check for partial matches
        for (let [key, weight] of Object.entries(this.severityWeights)) {
            if (eventType.includes(key) || key.includes(eventType)) {
                return weight;
            }
        }
        
        // Special case handling
        if (eventType.includes('kill') || eventType.includes('death')) {
            return this.severityWeights['crime/killing'];
        }
        
        if (eventType.includes('attack') || eventType.includes('clash')) {
            return this.severityWeights['armed clash'];
        }
        
        if (eventType.includes('bomb') || eventType.includes('explosion')) {
            return this.severityWeights['drone strike'];
        }
        
        return this.severityWeights['unknown'];
    }

    getRecencyMultiplier(incidentDate, currentDate = new Date()) {
        if (!incidentDate) return 0.1;
        
        const daysAgo = (currentDate - incidentDate) / (1000 * 60 * 60 * 24);
        
        if (daysAgo < 0) return 1.0; // Future date (data error), but don't penalize
        
        // Linear decay over 90 days: 1.0 → 0.1
        const decay = Math.max(0.1, 1 - (daysAgo / 90));
        
        // Additional boost for very recent incidents (last 7 days)
        if (daysAgo <= 7) {
            return Math.min(1.2, decay * 1.2);
        }
        
        return decay;
    }

    getCasualtyMultiplier(fatalities = 0, injuries = 0) {
        // Base multiplier of 1.0
        let multiplier = 1.0;
        
        // Fatalities have higher weight than injuries
        const casualtyScore = (fatalities * 2) + (injuries * 0.5);
        
        // More conservative multiplier to prevent score inflation
        if (casualtyScore > 0) {
            multiplier = 1 + Math.min(casualtyScore * 0.1, 1.0); // Cap at 2x multiplier
        }
        
        return multiplier;
    }

    getQuantityMultiplier(incidentCount) {
        if (incidentCount <= 1) return 1.0;
        
        // More conservative logarithmic scaling to prevent score inflation
        return 1 + (Math.log10(incidentCount) * 0.2);
    }

    getRiskLevel(score) {
        if (score >= this.riskThresholds.high) return 'high';
        if (score >= this.riskThresholds.moderate) return 'moderate';
        return 'minimal';
    }

    getRiskColor(score) {
        const level = this.getRiskLevel(score);
        return this.riskColors[level];
    }

    getColorScale(scores) {
        // Create a color scale for choropleth mapping
        const maxScore = Math.max(...scores, this.riskThresholds.high);
        const minScore = Math.min(...scores, 0);
        
        return {
            min: minScore,
            max: maxScore,
            thresholds: this.riskThresholds,
            colors: this.riskColors
        };
    }

    // Generate risk assessment summary
    generateRiskSummary(woredaData, riskScore) {
        const summary = {
            woredaName: woredaData.woreda || 'Unknown Area',
            region: woredaData.region,
            zone: woredaData.zone,
            riskLevel: riskScore.level,
            riskScore: riskScore.score,
            totalIncidents: woredaData.totalIncidents,
            totalCasualties: woredaData.totalFatalities + woredaData.totalInjuries,
            latestIncident: woredaData.latestIncident,
            recommendations: this.getRecommendations(riskScore.level, woredaData),
            topEventTypes: this.getTopEventTypes(woredaData.incidents)
        };
        
        return summary;
    }

    getRecommendations(riskLevel, woredaData) {
        const recommendations = [];
        
        switch (riskLevel) {
            case 'high':
                recommendations.push('Implement immediate security protocols');
                recommendations.push('Consider travel restrictions to this area');
                recommendations.push('Increase security detail for operations');
                recommendations.push('Monitor situation continuously');
                break;
                
            case 'elevated':
                recommendations.push('Enhanced security awareness required');
                recommendations.push('Review and update security procedures');
                recommendations.push('Coordinate with local security forces');
                break;
                
            case 'moderate':
                recommendations.push('Maintain standard security protocols');
                recommendations.push('Regular monitoring recommended');
                recommendations.push('Brief personnel on local conditions');
                break;
                
            case 'low':
                recommendations.push('Standard security awareness sufficient');
                recommendations.push('Periodic monitoring recommended');
                break;
                
            case 'minimal':
                recommendations.push('Maintain basic security awareness');
                break;
        }
        
        // Add specific recommendations based on incident types
        if (woredaData.eventTypes.includes('robbery') || woredaData.eventTypes.includes('theft')) {
            recommendations.push('Advise on personal security measures');
        }
        
        if (woredaData.eventTypes.includes('kidnapping')) {
            recommendations.push('Review kidnapping response protocols');
        }
        
        if (woredaData.totalFatalities > 0) {
            recommendations.push('Consider this area high priority for monitoring');
        }
        
        return recommendations;
    }

    getTopEventTypes(incidents) {
        const eventCounts = {};
        
        incidents.forEach(incident => {
            const eventType = incident.eventType || 'Unknown';
            eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;
        });
        
        return Object.entries(eventCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type, count]) => ({ type, count }));
    }
}