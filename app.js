/**
 * MM Data Search - Main Application (v3 - Sheet 2 Location Support)
 * Searches data from Google Sheets
 */

// ===== Configuration =====
const CONFIG = {
    sheet1: {
        url: 'https://script.google.com/macros/s/AKfycbzIAQsdtWl1gIYv8i_OrcbFG9pPrAKVmHVZk2TsAFfxSmb9QYY9hSUWfNWQPcvlfWCbkA/exec',
        searchColumn: 'Name',
        nameKey: 'name',
        detailKey: 'details'
    },
    sheet2: {
        url: 'https://script.google.com/macros/s/AKfycby-Ot0_IIPQ4AAMzqfe8kvIS2dFo2bYa3J_HFMr8l2yzmePRU9d8y3LpRhhecZC07B-zg/exec',
        searchColumn: 'Town_Township',
        nameKey: 'town_township',
        detailKey: 'details'
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
    tabBtns: document.querySelectorAll('.tab-btn'),
    searchName: document.getElementById('search-name'),
    searchLocation: document.getElementById('search-location'),
    clearName: document.getElementById('clear-name'),
    clearLocation: document.getElementById('clear-location'),
    btnSearchName: document.getElementById('btn-search-name'),
    btnSearchLocation: document.getElementById('btn-search-location'),
    loading: document.getElementById('loading'),
    resultsSection: document.getElementById('results-section'),
    resultsCount: document.getElementById('results-count'),
    resultsList: document.getElementById('results-list'),
    emptyState: document.getElementById('empty-state'),
    noResults: document.getElementById('no-results'),
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
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-content`);
    });
    clearResults();
}

// ===== Search Functionality =====
function initSearch() {
    // Name search
    elements.searchName.addEventListener('input', (e) => {
        toggleClearButton(elements.clearName, e.target.value);
    });
    elements.searchName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch('sheet1');
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
        if (e.key === 'Enter') performSearch('sheet2');
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
    if (typeof show === 'string') show = show.length > 0;
    btn.classList.toggle('visible', show);
}

async function performSearch(type) {
    const query = type === 'sheet1'
        ? elements.searchName.value.trim()
        : elements.searchLocation.value.trim();
    
    if (!query) {
        showEmptyState();
        return;
    }
    
    setLoading(true);
    
    try {
        const data = await fetchSheetData(type);
        
        if (!data || data.length === 0) {
            showError('Could not load data from Google Sheets. Please check your network or Apps Script deployment.');
            return;
        }
        
        const results = filterData(data, query, type);
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
    const config = CONFIG[type];
    const cacheKey = `${type}Data`;

    if (state[cacheKey] && state[cacheKey].length > 0) {
        console.log('Using cached data for:', type);
        return state[cacheKey];
    }
    
    if (!config.url) {
        console.log('No URL configured, fallback to demo data');
        const demoData = getDemoData(type);
        state[cacheKey] = demoData;
        return demoData;
    }
    
    try {
        const urlWithCacheBuster = addCacheBuster(config.url);
        console.log('Fetching', type, 'from:', urlWithCacheBuster);
        
        const response = await fetch(urlWithCacheBuster);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const text = await response.text();
        
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
            console.error('Response is HTML, likely a permission issue.');
            throw new Error('Google Apps Script requires login - please set access to "Anyone"');
        }
        
        const data = JSON.parse(text);
        console.log('Data received:', data.length, 'records for', type);
        
        state[cacheKey] = data;
        return data;
    } catch (error) {
        console.error('Fetch error for', type, ':', error.message);
        // Fallback to Demo Data if Fetch fails so app won't break
        const demoData = getDemoData(type);
        return demoData;
    }
}

function getDemoData(type) {
    if (type === 'sheet1') {
        return [
            { name: 'Apple Inc.', name_mm: 'အက်ပဲလ်', details: 'Technology company based in Cupertino, California.' },
            { name: 'Microsoft Corporation', name_mm: 'မိုက်ခရိုဆော့ဖ်', details: 'Technology company based in Redmond, Washington.' }
        ];
    } else {
        return [
            { region: 'Yangon', township: 'Kamayut', town_township: 'Yangon/Kamayut', eng_quarter_village: 'Hledan' },
            { region: 'Mandalay', township: 'Chanayethazan', town_township: 'Mandalay/Chanayethazan', eng_quarter_village: 'Zegyo' }
        ];
    }
}

// Helper: Case-insensitive Key Getter
function getValue(item, keys) {
    for (let key of keys) {
        // Find property ignoring case
        const foundKey = Object.keys(item).find(k => k.toLowerCase() === key.toLowerCase());
        if (foundKey && item[foundKey]) {
            return String(item[foundKey]);
        }
    }
    return '';
}

// ===== Data Filtering (Robust Case-Insensitive Search) =====
function filterData(data, query, type) {
    const searchTerm = query.toLowerCase();

    return data.filter(item => {
        if (type === 'sheet1') {
            // Search across all possible name fields
            const name = getValue(item, ['name', 'Name', 'NAME']).toLowerCase();
            const nameMm = getValue(item, ['name_mm', 'Name_MM', 'Name MM']).toLowerCase();
            const shortName = getValue(item, ['short_name', 'Short_Name', 'shortName']).toLowerCase();
            const details = getValue(item, ['details', 'Details']).toLowerCase();

            return name.includes(searchTerm) || 
                   nameMm.includes(searchTerm) || 
                   shortName.includes(searchTerm) ||
                   details.includes(searchTerm);
        } else {
            // Search across location fields
            const region = getValue(item, ['Region', 'region']).toLowerCase();
            const townTownship = getValue(item, ['Town_Township', 'town_township', 'town', 'Town']).toLowerCase();
            const township = getValue(item, ['Township', 'township']).toLowerCase();
            const engVillage = getValue(item, ['ENG_Quarter_Village', 'eng_quarter_village']).toLowerCase();
            const mmVillage = getValue(item, ['MM_Quarter_Village', 'mm_quarter_village']).toLowerCase();

            return region.includes(searchTerm) ||
                   townTownship.includes(searchTerm) ||
                   township.includes(searchTerm) ||
                   engVillage.includes(searchTerm) ||
                   mmVillage.includes(searchTerm);
        }
    });
}

// ===== Results Display =====
function displayResults(results, type) {
    state.filteredResults = results;
    
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
            const name = getValue(item, ['name', 'Name']) || 'Unknown';
            const nameMm = getValue(item, ['name_mm', 'Name_MM']);
            const shortName = getValue(item, ['short_name', 'Short_Name']);
            const sheetName = getValue(item, ['_sheet_name', 'region', 'Region']);
            
            let details = [];
            if (nameMm) details.push(`Name MM: ${nameMm}`);
            if (shortName) details.push(`Short Name: ${shortName}`);
            if (sheetName) details.push(`Region: ${sheetName}`);
            
            const detailText = details.join(' | ') || getValue(item, ['details', 'Details']) || 'No additional details';
            
            return `
                <div class="result-item" data-index="${index}">
                    <div class="result-name">${escapeHtml(name)}</div>
                    <div class="result-detail">${escapeHtml(detailText)}</div>
                    <div class="result-meta">
                        <span class="result-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                            </svg>
                            Sheet 1 (Name)
                        </span>
                    </div>
                </div>
            `;
        } else {
            const township = getValue(item, ['Township', 'township']);
            const townTownship = getValue(item, ['Town_Township', 'town_township', 'town']);
            const region = getValue(item, ['Region', 'region']);
            const engVillage = getValue(item, ['ENG_Quarter_Village', 'eng_quarter_village']);
            const mmVillage = getValue(item, ['MM_Quarter_Village', 'mm_quarter_village']);
            
            let details = [];
            if (region) details.push(`Region: ${region}`);
            if (townTownship) details.push(`Town/Township: ${townTownship}`);
            if (engVillage) details.push(`Village: ${engVillage}`);
            if (mmVillage) details.push(`(MM: ${mmVillage})`);
            
            const titleText = township || townTownship || region || 'Unknown Location';
            const detailText = details.join(' | ') || getValue(item, ['details', 'Details']) || 'No additional details';
            
            return `
                <div class="result-item" data-index="${index}">
                    <div class="result-name">${escapeHtml(titleText)}</div>
                    <div class="result-detail">${escapeHtml(detailText)}</div>
                    <div class="result-meta">
                        <span class="result-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            Sheet 2 (Location)
                        </span>
                    </div>
                </div>
            `;
        }
    }).join('');
    
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
        headers = ['Name', 'Name MM', 'Short Name', 'Region'];
        rows = state.filteredResults.map(item => [
            `"${(getValue(item, ['name', 'Name'])).replace(/"/g, '""')}"`,
            `"${(getValue(item, ['name_mm', 'Name_MM'])).replace(/"/g, '""')}"`,
            `"${(getValue(item, ['short_name', 'Short_Name'])).replace(/"/g, '""')}"`,
            `"${(getValue(item, ['_sheet_name', 'region'])).replace(/"/g, '""')}"`
        ]);
    } else {
        headers = ['Region', 'Town_Township', 'Township', 'ENG_Quarter_Village', 'MM_Quarter_Village'];
        rows = state.filteredResults.map(item => [
            `"${(getValue(item, ['Region', 'region'])).replace(/"/g, '""')}"`,
            `"${(getValue(item, ['Town_Township', 'town_township'])).replace(/"/g, '""')}"`,
            `"${(getValue(item, ['Township', 'township'])).replace(/"/g, '""')}"`,
            `"${(getValue(item, ['ENG_Quarter_Village', 'eng_quarter_village'])).replace(/"/g, '""')}"`,
            `"${(getValue(item, ['MM_Quarter_Village', 'mm_quarter_village'])).replace(/"/g, '""')}"`
        ]);
    }
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
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
    elements.searchName.focus();
    console.log('MM Data Search v3 (Fixed) initialized');
}

document.addEventListener('DOMContentLoaded', init);
