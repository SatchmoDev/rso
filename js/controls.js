// Main application controller
let app = {
    dataProcessor: null,
    riskCalculator: null,
    mapRenderer: null,
    isLoading: false
};

// Initialize the application
async function initializeApp() {
    try {
        showLoading(true);
        
        // Initialize classes
        app.dataProcessor = new DataProcessor();
        app.riskCalculator = new RiskCalculator();
        app.mapRenderer = new MapRenderer();
        
        // Load data
        console.log('Loading application data...');
        await app.dataProcessor.loadAllData();
        
        // Initialize map
        app.mapRenderer.initialize(app.dataProcessor, app.riskCalculator);
        
        // Set up event listeners
        setupEventListeners();
        
        // Initial map render
        await app.mapRenderer.renderIncidentMap();
        
        showLoading(false);
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showLoading(false);
        showError('Failed to load application. Please check that data files are available.');
    }
}

// Set up event listeners for controls
function setupEventListeners() {
    // Time range filter
    const timeRangeSelect = document.getElementById('timeRange');
    timeRangeSelect.addEventListener('change', handleFilterChange);
    
    // Incident type filter
    const incidentTypeSelect = document.getElementById('incidentType');
    incidentTypeSelect.addEventListener('change', handleFilterChange);
    
    // Refresh button
    const refreshButton = document.getElementById('refreshMap');
    refreshButton.addEventListener('click', handleRefreshMap);
    
    // Export button
    const exportButton = document.getElementById('exportData');
    exportButton.addEventListener('click', handleExportData);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('Event listeners set up');
}

// Handle filter changes
async function handleFilterChange() {
    if (app.isLoading) return;
    
    try {
        showLoading(true);
        
        const filters = getCurrentFilters();
        console.log('Filters changed:', filters);
        
        await app.mapRenderer.renderIncidentMap(filters);
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showLoading(false);
        showError('Failed to apply filters');
    }
}

// Get current filter values
function getCurrentFilters() {
    return {
        timeRange: document.getElementById('timeRange').value,
        incidentType: document.getElementById('incidentType').value
    };
}

// Handle map refresh
async function handleRefreshMap() {
    if (app.isLoading) return;
    
    try {
        showLoading(true);
        
        // Reload data
        await app.dataProcessor.loadAllData();
        
        // Re-render map with current filters
        const filters = getCurrentFilters();
        await app.mapRenderer.renderIncidentMap(filters);
        
        showLoading(false);
        showSuccess('Map refreshed successfully');
        
    } catch (error) {
        console.error('Error refreshing map:', error);
        showLoading(false);
        showError('Failed to refresh map');
    }
}

// Handle data export
function handleExportData() {
    try {
        const filters = getCurrentFilters();
        const incidents = app.dataProcessor.filterIncidents(filters);
        const woredaData = app.dataProcessor.aggregateByWoreda(incidents);
        
        // Generate report data
        const reportData = generateReport(woredaData, filters);
        
        // Export as JSON (could be extended to support CSV, PDF, etc.)
        exportAsJSON(reportData, `incident-report-${new Date().toISOString().split('T')[0]}.json`);
        
        showSuccess('Report exported successfully');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showError('Failed to export data');
    }
}

// Generate comprehensive report
function generateReport(woredaData, filters) {
    const report = {
        metadata: {
            generated: new Date().toISOString(),
            filters: filters,
            totalWoredas: Object.keys(woredaData).length
        },
        summary: {
            totalIncidents: 0,
            totalFatalities: 0,
            totalInjuries: 0,
            riskLevels: {
                high: 0,
                elevated: 0,
                moderate: 0,
                low: 0,
                minimal: 0
            }
        },
        woredas: []
    };
    
    // Process each woreda
    Object.entries(woredaData).forEach(([woredaKey, data]) => {
        const riskScore = app.riskCalculator.calculateWoredaRiskScore(data);
        const summary = app.riskCalculator.generateRiskSummary(data, riskScore);
        
        // Update summary statistics
        report.summary.totalIncidents += data.totalIncidents;
        report.summary.totalFatalities += data.totalFatalities;
        report.summary.totalInjuries += data.totalInjuries;
        report.summary.riskLevels[riskScore.level]++;
        
        // Add woreda details
        report.woredas.push({
            key: woredaKey,
            name: data.woreda || 'Unknown',
            region: data.region,
            zone: data.zone,
            riskLevel: riskScore.level,
            riskScore: riskScore.score,
            totalIncidents: data.totalIncidents,
            totalFatalities: data.totalFatalities,
            totalInjuries: data.totalInjuries,
            eventTypes: data.eventTypes,
            latestIncident: data.latestIncident ? {
                type: data.latestIncident.eventType,
                date: data.latestIncident.date.toISOString(),
                location: data.latestIncident.town || data.latestIncident.woreda
            } : null,
            recommendations: summary.recommendations,
            incidents: data.incidents.map(incident => ({
                id: incident.id,
                type: incident.type,
                eventType: incident.eventType,
                date: incident.date.toISOString(),
                location: {
                    latitude: incident.latitude,
                    longitude: incident.longitude,
                    town: incident.town,
                    woreda: incident.woreda,
                    region: incident.region
                },
                casualties: {
                    fatalities: incident.fatalities || 0,
                    injuries: incident.injuries || 0
                },
                notes: incident.notes
            }))
        });
    });
    
    // Sort woredas by risk score (highest first)
    report.woredas.sort((a, b) => b.riskScore - a.riskScore);
    
    return report;
}

// Export data as JSON file
function exportAsJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + R: Refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        handleRefreshMap();
    }
    
    // Ctrl/Cmd + E: Export
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        handleExportData();
    }
    
    // Number keys 1-4: Change time range
    if (event.key >= '1' && event.key <= '4') {
        const timeRangeSelect = document.getElementById('timeRange');
        const options = ['30', '60', '90', 'all'];
        const index = parseInt(event.key) - 1;
        if (index < options.length) {
            timeRangeSelect.value = options[index];
            handleFilterChange();
        }
    }
}

// UI Helper Functions
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    app.isLoading = show;
    
    if (show) {
        loadingElement.classList.remove('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

function showError(message) {
    console.error(message);
    
    // Create error notification
    const notification = createNotification(message, 'error');
    showNotification(notification);
}

function showSuccess(message) {
    console.log(message);
    
    // Create success notification
    const notification = createNotification(message, 'success');
    showNotification(notification);
}

function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styling
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        background-color: ${type === 'error' ? '#e74c3c' : '#27ae60'};
        animation: slideIn 0.3s ease-out;
    `;
    
    return notification;
}

function showNotification(notification) {
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        margin-left: 10px;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
    
    .notification-message {
        margin-right: 10px;
    }
`;
document.head.appendChild(notificationStyles);

// Performance monitoring
function monitorPerformance() {
    if (window.performance && window.performance.measure) {
        try {
            performance.mark('app-start');
            
            window.addEventListener('load', () => {
                performance.mark('app-loaded');
                performance.measure('app-load-time', 'app-start', 'app-loaded');
                
                const measure = performance.getEntriesByName('app-load-time')[0];
                console.log(`Application load time: ${measure.duration.toFixed(2)}ms`);
            });
        } catch (error) {
            // Performance API not supported
            console.log('Performance monitoring not available');
        }
    }
}

// Initialize performance monitoring
monitorPerformance();

// Error handling for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    showError('An unexpected error occurred. Please refresh the page.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An unexpected error occurred. Please refresh the page.');
});