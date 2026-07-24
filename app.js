/**
 * MM Data Search - Main Application
 * Searches data from Google Sheets
 */

// ===== Configuration =====
// IMPORTANT: You need to deploy Google Apps Script for each sheet
// See google-apps-script.gs for instructions
const CONFIG = {
    sheet1: {
        // Your Google Sheet 1 Apps Script URL
        // Sheet: https://docs.google.com/spreadsheets/d/1nrMBnmgdjtefTNzW0ZBzeOp_mvBHBdSLeFHW_qPfLeo/edit
        url: 'https://script.google.com/macros/s/AKfycbzIAQsdtWl1gIYv8i_OrcbFG9pPrAKVmHVZk2TsAFfxSmb9QYY9hSUWfNWQPcvlfWCbkA/exec',
 	// Deploy Google Apps Script and paste URL here
        searchColumn: 'Name', // Column to search in Sheet 1
        nameKey: 'name', // Key for display name (auto-converted from header)
        detailKey: 'details' // Key for details (add if you have this column)
    },
    sheet2: {
        // Your Google Sheet 2 Apps Script URL
        // Sheet: https://docs.google.com/spreadsheets/d/1VcB_oia94R7dqRTl7U7fhxQznCwgnxDlHNCDN8ygagM/edit
        url: 'https://script.google.com/macros/s/AKfycby-Ot0_IIPQ4AAMzqfe8kvIS2dFo2bYa3J_HFMr8l2yzmePRU9d8y3LpRhhecZC07B-zg/exec',
	// Deploy Google Apps Script and paste URL here
        searchColumn: 'Township', // Column to search in Sheet 2
        nameKey: 'town_township', // Key for display name (auto-converted from header)
        detailKey: 'details' // Key for details (add if you have this column)
    }
};

// Add timestamp to prevent caching
function addCacheBuster(url) {
    return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
}

// ===== State =====
const state = {
    currentTab: 'sheet1',
    sheet1Data: [],
    sheet2Data: [],
    filteredResults: [],
    isLoading: false
};

// ===== DOM Elements =====
const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    
    // Search inputs
    searchName: document.getElementById('search-name'),
    searchLocation: document.getElementById('search-location'),
    
    // Clear buttons
    clearName: document.getElementById('clear-name'),
    clearLocation: document.getElementById('clear-location'),
    
    // Search buttons
    btnSearchName: document.getElementById('btn-search-name'),
    btnSearchLocation: document.getElementById('btn-search-location'),
    
    // Loading
    loading: document.getElementById('loading'),
    
    // Results
    resultsSection: document.getElementById('results-section'),
    resultsCount: document.getElementById('results-count'),
    resultsList: document.getElementById('results-list'),
    emptyState: document.getElementById('empty-state'),
    noResults: document.getElementById('no-results'),
    
    // Export
    exportSection: document.getElementById('export-section'),
    exportBtn: document.getElementById('export-btn')
};

// ===== Tab Navigation =====
function initTabs() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    state.currentTab = tab;
    
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-content`);
    });
    
    // Clear results when switching tabs
    clearResults();
}

// ===== Search Functionality =====
function initSearch() {
    // Name search
    elements.searchName.addEventListener('input', (e) => {
        toggleClearButton(elements.clearName, e.target.value);
    });

    elements.searchName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch('sheet1');
        }
    });

    elements.clearName.addEventListener('click', () => {
        elements.searchName.value = '';
        toggleClearButton(elements.clearName, false);
        clearResults();
    });

    elements.btnSearchName.addEventListener('click', () => {
        performSearch('sheet1');
    });

    // Location search
    elements.searchLocation.addEventListener('input', (e) => {
        toggleClearButton(elements.clearLocation, e.target.value);
    });

    elements.searchLocation.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch('sheet2');
        }
    });

    elements.clearLocation.addEventListener('click', () => {
        elements.searchLocation.value = '';
        toggleClearButton(elements.clearLocation, false);
        clearResults();
    });

    elements.btnSearchLocation.addEventListener('click', () => {
        performSearch('sheet2');
    });
}

function toggleClearButton(btn, show) {
    if (typeof show === 'string') {
        show = show.length > 0;
    }
    btn.classList.toggle('visible', show);
}

async function performSearch(type) {
    // type is 'sheet1' or 'sheet2'
    const query = type === 'sheet1'
        ? elements.searchName.value.trim()
        : elements.searchLocation.value.trim();
    
    if (!query) {
        showEmptyState();
        return;
    }
    
    setLoading(true);
    
    try {
        // Fetch data from Google Sheets
        const data = await fetchSheetData(type);
        
        // Check if data was fetched successfully
        if (!data || data.length === 0) {
            showError('Could not load data. Please check your internet connection and try again.');
            return;
        }
        
        // Filter results
        const results = filterData(data, query, type);
        
        // Display results
        displayResults(results, type);
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed: ' + error.message);
    } finally {
        setLoading(false);
    }
}

// ===== Data Fetching =====
async function fetchSheetData(type) {
    // type is 'sheet1' or 'sheet2' from the tab
    const config = CONFIG[type];

    // Check if we have cached data
    const cacheKey = `${type}Data`;
    if (state[cacheKey].length > 0) {
        console.log('Using cached data for:', type);
        return state[cacheKey];
    }
    
    // If no URL configured, use demo data
    if (!config.url) {
        console.log('No URL configured for:', type);
        const demoData = getDemoData(type);
        state[cacheKey] = demoData;
        return demoData;
    }
    
    try {
        const urlWithCacheBuster = addCacheBuster(config.url);
        console.log('Fetching Sheet', type === 'name' ? '1' : '2', 'from:', urlWithCacheBuster);
        
        const response = await fetch(urlWithCacheBuster);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Response length:', text.length, 'characters');
        
        // Check if response starts with HTML (login page)
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
            console.error('Response is HTML, not JSON - likely a login page');
            throw new Error('Google Apps Script requires login - please set access to "Anyone"');
        }
        
        const data = JSON.parse(text);
        console.log('Data received:', data.length, 'records for', type);
        console.log('First record:', data[0]);
        
        state[cacheKey] = data;
        return data;
    } catch (error) {
        console.error('Fetch error for', type, ':', error.message);
        // Return empty array instead of demo data to show actual error
        return [];
    }
}

function getDemoData(type) {
    if (type === 'name') {
        return [
            { name: 'Apple Inc.', details: 'Technology company based in Cupertino, California. Known for iPhone, iPad, Mac.' },
            { name: 'Microsoft Corporation', details: 'Technology company based in Redmond, Washington. Known for Windows, Office, Azure.' },
            { name: 'Amazon.com Inc.', details: 'E-commerce and cloud computing company based in Seattle, Washington.' },
            { name: 'Google LLC', details: 'Technology company based in Mountain View, California. Known for Search, Android, Cloud.' },
            { name: 'Meta Platforms Inc.', details: 'Social media company based in Menlo Park, California. Known for Facebook, Instagram, WhatsApp.' },
            { name: 'Tesla Inc.', details: 'Electric vehicle and clean energy company based in Austin, Texas.' },
            { name: 'Netflix Inc.', details: 'Entertainment company based in Los Gatos, California. Known for streaming services.' },
            { name: 'Adobe Inc.', details: 'Software company based in San Jose, California. Known for Creative Cloud, Photoshop.' },
            { name: 'Salesforce Inc.', details: 'Cloud-based software company based in San Francisco, California. Known for CRM.' },
            { name: 'Oracle Corporation', details: 'Computer technology company based in Austin, Texas. Known for database software.' }
        ];
    } else {
        return [
            { town: 'New York', details: 'Most populous city in the United States. Major financial and cultural center.' },
            { town: 'Los Angeles', details: 'Second most populous city in the US. Known for entertainment industry and beaches.' },
            { town: 'Chicago', details: 'Third most populous city in the US. Known for architecture and deep-dish pizza.' },
            { town: 'Houston', details: 'Largest city in Texas. Known for NASA and energy industry.' },
            { town: 'Phoenix', details: 'Capital of Arizona. Known for warm climate and desert landscapes.' },
            { town: 'San Antonio', details: 'Second largest city in Texas. Known for the Alamo and River Walk.' },
            { town: 'San Diego', details: 'Coastal city in California. Known for beaches and military bases.' },
            { town: 'Dallas', details: 'Major city in Texas. Known for business and cultural attractions.' },
            { town: 'Austin', details: 'Capital of Texas. Known for live music and technology industry.' },
            { town: 'Seattle', details: 'Major city in Washington state. Known for coffee culture and tech industry.' }
        ];
    }
}

// ===== Data Filtering =====
function filterData(data, query, type) {
    const searchTerm = query.toLowerCase();

    if (type === 'sheet1') {
        // Search in the Name column for Sheet 1 (Myanmar NRC)
        return data.filter(item => {
            const nameValue = (item['name'] || '').toLowerCase();
            return nameValue.includes(searchTerm);
        });
    } else {
        // Search in multiple columns for Sheet 2 (Location)
        return data.filter(item => {
            const region = (item['Region'] || item['region'] || '').toLowerCase();
            const townTownship = (item['Town_Township'] || item['town_township'] || '').toLowerCase();
            const township = (item['Township'] || item['township'] || '').toLowerCase();
            const engVillage = (item['ENG_Quarter_Village'] || item['eng_quarter_village'] || '').toLowerCase();

            return region.includes(searchTerm) ||
                   townTownship.includes(searchTerm) ||
                   township.includes(searchTerm) ||
                   engVillage.includes(searchTerm);
        });
    }
}

// ===== Results Display =====
function displayResults(results, type) {
    state.filteredResults = results;
    
    // Update UI
    elements.resultsSection.classList.add('active');
    elements.resultsCount.textContent = `${results.length} found`;
    
    if (results.length === 0) {
        elements.resultsList.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.noResults.style.display = 'flex';
        elements.exportSection.style.display = 'none';
    } else {
        elements.resultsList.style.display = 'flex';
        elements.emptyState.style.display = 'none';
        elements.noResults.style.display = 'none';
        elements.exportSection.style.display = 'block';
        
        renderResults(results, type);
    }
}

function renderResults(results, type) {
    elements.resultsList.innerHTML = results.map((item, index) => {
        if (type === 'sheet1') {
            // Name Search - Sheet 1 format
            const name = item['name'] || 'Unknown';
            const nameMm = item['name_mm'] || '';
            const shortNameMm = item['short_name_mm'] || '';
            const shortName = item['short_name'] || '';
            const sheetName = item['_sheet_name'] || '';
            
            let details = [];
            if (nameMm) details.push(`Name MM: ${nameMm}`);
            if (shortNameMm) details.push(`Short MM: ${shortNameMm}`);
            if (shortName) details.push(`Short Name: ${shortName}`);
            if (sheetName) details.push(`Region: ${sheetName}`);
            
            const detailText = details.join(' | ') || 'No additional details';
            
            return `
                <div class="result-item" data-index="${index}">
                    <div class="result-name">${escapeHtml(name)}</div>
                    <div class="result-detail">${escapeHtml(detailText)}</div>
                    <div class="result-meta">
                        <span class="result-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                            </svg>
                            Sheet 1
                        </span>
                    </div>
                </div>
            `;
        } else {
            // Location Search - Sheet 2 format
            const region = item['Region'] || item['region'] || '';
            const townTownship = item['Town_Township'] || item['town_township'] || '';
            const township = item['Township'] || item['township'] || '';
            const engVillage = item['ENG_Quarter_Village'] || item['eng_quarter_village'] || '';
            const mmVillage = item['MM_Quarter_Village'] || item['mm_quarter_village'] || '';
            const postalCode = item['Postal_Code'] || item['postal_code'] || '';
            
            let details = [];
            if (region) details.push(`Region: ${region}`);
            if (townTownship) details.push(`Town/Township: ${townTownship}`);
            if (engVillage) details.push(`Village: ${engVillage}`);
            if (mmVillage) details.push(`(MM: ${mmVillage})`);
            if (postalCode) details.push(`Postal: ${postalCode}`);
            
            const detailText = details.join(' | ') || 'No additional details';
            
            return `
                <div class="result-item" data-index="${index}">
                    <div class="result-name">${escapeHtml(township || townTownship)}</div>
                    <div class="result-detail">${escapeHtml(detailText)}</div>
                    <div class="result-meta">
                        <span class="result-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            Sheet 2
                        </span>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            selectResult(index, type);
        });
    });
}

function selectResult(index, type) {
    const result = state.filteredResults[index];
    if (!result) return;
    
    // Toggle selection
    document.querySelectorAll('.result-item').forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });
}

// ===== Export Functionality =====
function initExport() {
    elements.exportBtn.addEventListener('click', exportToCSV);
}

function exportToCSV() {
    if (state.filteredResults.length === 0) return;

    const type = state.currentTab;
    let headers, rows;

    if (type === 'sheet1') {
        // Name Search - Sheet 1 format
        headers = ['Name', 'Name MM', 'Short Name MM', 'Short Name', 'Region'];
        rows = state.filteredResults.map(item => [
            `"${(item['name'] || '').replace(/"/g, '""')}"`,
            `"${(item['name_mm'] || '').replace(/"/g, '""')}"`,
            `"${(item['short_name_mm'] || '').replace(/"/g, '""')}"`,
            `"${(item['short_name'] || '').replace(/"/g, '""')}"`,
            `"${(item['_sheet_name'] || '').replace(/"/g, '""')}"`
        ]);
    } else {
        // Location Search - Sheet 2 format
        headers = ['Region', 'Town_Township', 'Township', 'ENG_Quarter_Village', 'MM_Quarter_Village', 'Postal_Code'];
        rows = state.filteredResults.map(item => [
            `"${(item['Region'] || item['region'] || '').replace(/"/g, '""')}"`,
            `"${(item['Town_Township'] || item['town_township'] || '').replace(/"/g, '""')}"`,
            `"${(item['Township'] || item['township'] || '').replace(/"/g, '""')}"`,
            `"${(item['ENG_Quarter_Village'] || item['eng_quarter_village'] || '').replace(/"/g, '""')}"`,
            `"${(item['MM_Quarter_Village'] || item['mm_quarter_village'] || '').replace(/"/g, '""')}"`,
            `"${(item['Postal_Code'] || item['postal_code'] || '').replace(/"/g, '""')}"`
        ]);
    }
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mm-${type}-search-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ===== UI Helpers =====
function setLoading(show) {
    state.isLoading = show;
    elements.loading.classList.toggle('active', show);
}

function clearResults() {
    elements.resultsSection.classList.remove('active');
    elements.resultsList.innerHTML = '';
    elements.exportSection.style.display = 'none';
    state.filteredResults = [];
}

function showEmptyState() {
    elements.resultsSection.classList.remove('active');
    elements.exportSection.style.display = 'none';
}

function showError(message) {
    elements.resultsList.innerHTML = `
        <div class="no-results">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p class="empty-text">${escapeHtml(message)}</p>
        </div>
    `;
    elements.resultsSection.classList.add('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Initialize App =====
function init() {
    initTabs();
    initSearch();
    initExport();
    
    // Focus first search input
    elements.searchName.focus();
    
    console.log('MM Data Search initialized');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
