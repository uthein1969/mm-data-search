/**
 * MM Data Search - Main Application
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
        url: 'https://script.google.com/macros/s/AKfycbxcOEuKCqtbBwzFv3bjVDEEOxA6csCEDLhShfYHpHiL5WH68mCoAx00IszJFyUsJg7exw/exec', 
        searchColumn: 'Town_Township',
        nameKey: 'town_township',
        detailKey: 'details'
    }
};

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
        if (e.key === 'Enter') performSearch('name');
    });
    elements.clearName.addEventListener('click', () => {
        elements.searchName.value = '';
        toggleClearButton(elements.clearName, false);
        clearResults();
    });
    elements.btnSearchName.addEventListener('click', () => {
        performSearch('name');
    });

    // Location search
    elements.searchLocation.addEventListener('input', (e) => {
        toggleClearButton(elements.clearLocation, e.target.value);
    });
    elements.searchLocation.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch('location');
    });
    elements.clearLocation.addEventListener('click', () => {
        elements.searchLocation.value = '';
        toggleClearButton(elements.clearLocation, false);
        clearResults();
    });
    elements.btnSearchLocation.addEventListener('click', () => {
        performSearch('location');
    });
}

function toggleClearButton(btn, show) {
    if (typeof show === 'string') show = show.length > 0;
    btn.classList.toggle('visible', show);
}

async function performSearch(type) {
    const query = type === 'name' 
        ? elements.searchName.value.trim()
        : elements.searchLocation.value.trim();
    
    if (!query) {
        showEmptyState();
        return;
    }
    
    setLoading(true);
    
    try {
        const data = await fetchSheetData(type);
        const results = filterData(data, query, type);
        displayResults(results, type);
    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to search. Please try again.');
    } finally {
        setLoading(false);
    }
}

// ===== Data Fetching =====
async function fetchSheetData(type) {
    const isNameSearch = (type === 'name');
    const config = isNameSearch ? CONFIG.sheet1 : CONFIG.sheet2;
    const cacheKey = isNameSearch ? 'sheet1Data' : 'sheet2Data';

    if (state[cacheKey] && state[cacheKey].length > 0) {
        return state[cacheKey];
    }
    
    if (!config.url) {
        const demoData = getDemoData(type);
        state[cacheKey] = demoData;
        return demoData;
    }
    
    try {
        // Cache မမိစေရန် Timestamp ပူးတွဲ ပါဝင်ပါသည်
        const fetchUrl = `${config.url}?_t=${new Date().getTime()}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        state[cacheKey] = data;
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        const demoData = getDemoData(type);
        state[cacheKey] = demoData;
        return demoData;
    }
}

function getDemoData(type) {
    if (type === 'name') {
        return [
            { name: 'Apple Inc.', details: 'Technology company based in Cupertino, California.' },
            { name: 'Google LLC', details: 'Technology company based in Mountain View, California.' }
        ];
    } else {
        return [
            { town_township: 'Yangon', details: 'Commercial capital of Myanmar.' },
            { town_township: 'Mandalay', details: 'Cultural center of Myanmar.' }
        ];
    }
}

// ===== Data Filtering (FIXED BUG HERE) =====
function filterData(data, query, type) {
    const searchTerm = query.toLowerCase();
    
    return data.filter(item => {
        if (type === 'name') {
            // Sheet 1: Search in name, name_mm, short_name
            const name = (item['name'] || '').toLowerCase();
            const nameMm = (item['name_mm'] || '').toLowerCase();
            const shortName = (item['short_name'] || '').toLowerCase();
            return name.includes(searchTerm) || nameMm.includes(searchTerm) || shortName.includes(searchTerm);
        } else {
            // Sheet 2: Search in town_township, town, details
            const town = (item['town_township'] || item['town'] || '').toLowerCase();
            const details = (item['details'] || '').toLowerCase();
            return town.includes(searchTerm) || details.includes(searchTerm);
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
        let title = '';
        let detailText = '';
        let tagText = (type === 'name') ? 'Sheet 1 (Name)' : 'Sheet 2 (Location)';

        if (type === 'name') {
            title = item['name'] || 'Unknown';
            let details = [];
            if (item['name_mm']) details.push(`Name MM: ${item['name_mm']}`);
            if (item['short_name_mm']) details.push(`Short MM: ${item['short_name_mm']}`);
            if (item['short_name']) details.push(`Short Name: ${item['short_name']}`);
            if (item['_sheet_name']) details.push(`Region: ${item['_sheet_name']}`);
            detailText = details.join(' | ') || 'No additional details';
        } else {
            title = item['town_township'] || item['town'] || 'Unknown Location';
            detailText = item['details'] || item['region'] || 'No additional details';
        }
        
        return `
            <div class="result-item" data-index="${index}">
                <div class="result-name">${escapeHtml(title)}</div>
                <div class="result-detail">${escapeHtml(detailText)}</div>
                <div class="result-meta">
                    <span class="result-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                        ${tagText}
                    </span>
                </div>
            </div>
        `;
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
    
    const isName = (state.currentTab === 'sheet1');
    const headers = isName 
        ? ['Name', 'Name MM', 'Short Name MM', 'Short Name', 'Region']
        : ['Town/Township', 'Details'];
    
    const rows = state.filteredResults.map(item => {
        if (isName) {
            return [
                `"${(item['name'] || '').replace(/"/g, '""')}"`,
                `"${(item['name_mm'] || '').replace(/"/g, '""')}"`,
                `"${(item['short_name_mm'] || '').replace(/"/g, '""')}"`,
                `"${(item['short_name'] || '').replace(/"/g, '""')}"`,
                `"${(item['_sheet_name'] || '').replace(/"/g, '""')}"`
            ];
        } else {
            return [
                `"${(item['town_township'] || item['town'] || '').replace(/"/g, '""')}"`,
                `"${(item['details'] || '').replace(/"/g, '""')}"`
            ];
        }
    });
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mm-data-search-${new Date().toISOString().split('T')[0]}.csv`;
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
    console.log('MM Data Search initialized');
}

document.addEventListener('DOMContentLoaded', init);
