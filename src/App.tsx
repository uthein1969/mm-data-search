import React, { useState, useCallback } from 'react';
import { Search, MapPin, ClipboardList, Download, X, Loader2, Database } from 'lucide-react';

// ===== Configuration =====
const CONFIG = {
  sheet1: {
    url: 'https://script.google.com/macros/s/AKfycbwXR9RWyxnDxEXSq2FthKIZuEDD345v_0OjLHakG5umKEF38tnWqyphAtLlEWMyONM9/exec',
  },
  sheet2: {
    url: 'https://script.google.com/macros/s/AKfycby-Ot0_IIPQ4AAMzqfe8kvIS2dFo2bYa3J_HFMr8l2yzmePRU9d8y3LpRhhecZC07B-zg/exec',
  }
};

type TabType = 'sheet1' | 'sheet2';

// ===== Helper Functions =====
function getValue(item: any, keys: string[]): string {
  for (const key of keys) {
    const foundKey = Object.keys(item).find(k => k.toLowerCase() === key.toLowerCase());
    if (foundKey && item[foundKey]) {
      return String(item[foundKey]);
    }
  }
  return '';
}

function getDemoData(type: TabType) {
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('sheet1');
  const [queries, setQueries] = useState({ sheet1: '', sheet2: '' });
  const [dataCache, setDataCache] = useState<{ sheet1: any[]; sheet2: any[] }>({ sheet1: [], sheet2: [] });
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const currentQuery = queries[activeTab];

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueries(prev => ({ ...prev, [activeTab]: e.target.value }));
  };

  const clearQuery = () => {
    setQueries(prev => ({ ...prev, [activeTab]: '' }));
    setResults([]);
    setHasSearched(false);
    setErrorMsg('');
  };

  const filterData = (data: any[], query: string, type: TabType) => {
    const removePunctuation = (str: string) => String(str).replace(/[\s.,\-_()/]/g, '').toLowerCase();
    const searchTerm = removePunctuation(query);

    return data.filter(item => {
      if (type === 'sheet1') {
        const values = Object.values(item).map(v => removePunctuation(String(v)));
        return values.some(v => v.includes(searchTerm));
      } else {
        const region = removePunctuation(getValue(item, ['Region', 'region']));
        const townTownship = removePunctuation(getValue(item, ['Town_Township', 'town_township', 'town', 'Town']));
        const township = removePunctuation(getValue(item, ['Township', 'township']));
        const engVillage = removePunctuation(getValue(item, ['ENG_Quarter_Village', 'eng_quarter_village']));
        const mmVillage = removePunctuation(getValue(item, ['MM_Quarter_Village', 'mm_quarter_village']));
        const postalCode = removePunctuation(getValue(item, ['Postal_Code', 'postal_code', 'Postal Code']));

        return region.includes(searchTerm) ||
               townTownship.includes(searchTerm) ||
               township.includes(searchTerm) ||
               engVillage.includes(searchTerm) ||
               mmVillage.includes(searchTerm) ||
               postalCode.includes(searchTerm);
      }
    });
  };

  const performSearch = async () => {
    if (!currentQuery.trim()) {
      setResults([]);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setHasSearched(true);
    setSelectedIndex(null);

    try {
      let dataToSearch = dataCache[activeTab];
      
      // Fetch if not cached
      if (dataToSearch.length === 0) {
        const url = CONFIG[activeTab].url;
        
        const fetchUrl = async (targetUrl: string) => {
          const response = await fetch(targetUrl);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const text = await response.text();
          if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
            throw new Error('Google Apps Script is returning an HTML page. Please ensure the script is deployed as a Web App, accessible to "Anyone".');
          }
          const json = JSON.parse(text);
          return Array.isArray(json) ? json : Object.values(json).flat();
        };

        try {
          // Fetch base data
          const baseData = await fetchUrl(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
          let parsedData = [...baseData];

          const stateMapping: Record<number, {no: number, name: string}> = {
            1: { no: 1, name: 'Kachin State' },
            2: { no: 2, name: 'Kayah State' },
            3: { no: 3, name: 'Kayin State' },
            4: { no: 4, name: 'Chin State' },
            5: { no: 5, name: 'Sagaing Region' },
            6: { no: 6, name: 'Tanintharyi Region' },
            7: { no: 7, name: 'Bago Region' },
            8: { no: 8, name: 'Magway Region' },
            9: { no: 9, name: 'Naypyidaw Union Territory' },
            10: { no: 9, name: 'Mandalay Region' },
            11: { no: 10, name: 'Mon State' },
            12: { no: 11, name: 'Rakhine State' },
            13: { no: 12, name: 'Yangon Region' },
            14: { no: 13, name: 'Shan State' },
            15: { no: 13, name: 'Shan State' },
            16: { no: 13, name: 'Shan State' },
            17: { no: 14, name: 'Ayeyarwady Region' }
          };
          
          // If NRC Search, attempt to fetch all 17 sheets just in case the API requires a sheet parameter
          if (activeTab === 'sheet1') {
            parsedData = baseData.map(item => ({...item, state_no: stateMapping[1].no, state_name: stateMapping[1].name}));
            if (baseData.length > 0 && baseData.length < 1000) {
              const extraPromises = [];
              // Try fetching sheets 2 to 17
              for (let i = 2; i <= 17; i++) {
                const sheetUrl = url + (url.includes('?') ? '&' : '?') + `sheet=${i}&t=` + Date.now();
                extraPromises.push(
                  fetchUrl(sheetUrl)
                    .then(res => res.map(item => ({...item, state_no: stateMapping[i]?.no || '', state_name: stateMapping[i]?.name || ''})))
                    .catch(() => [])
                );
              }
              const extraResults = await Promise.all(extraPromises);
              parsedData = [...parsedData, ...extraResults.flat()];
              
              // Deduplicate in case the API ignored the sheet parameter and returned sheet 1 every time
              const unique = new Map();
              parsedData.forEach(item => {
                // Use a combination of fields as a unique key for deduplication instead of full JSON
                const key = `${getValue(item, ['name', 'Name'])}-${getValue(item, ['short_name', 'Short_Name'])}-${item.state_no}`;
                if (!unique.has(key)) {
                  unique.set(key, item);
                }
              });
              parsedData = Array.from(unique.values());
            }
          }
          
          setDataCache(prev => ({ ...prev, [activeTab]: parsedData }));
          dataToSearch = parsedData;
        } catch (fetchErr: any) {
          console.error('Fetch error for', activeTab, ':', fetchErr.message);
          throw fetchErr; // Propagate to outer catch to display to user
        }
      }

      const filtered = filterData(dataToSearch, currentQuery, activeTab);
      setResults(filtered);
    } catch (err: any) {
      setErrorMsg('Search failed: ' + err.message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    let headers: string[];
    let rows: string[][];

    if (activeTab === 'sheet1') {
      headers = ['Name', 'Name MM', 'Short Name', 'Short Name MM', 'Region'];
      rows = results.map(item => [
        `"${(getValue(item, ['name', 'Name'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['name_mm', 'Name_MM', 'Name MM'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['short_name', 'Short_Name', 'Short Name'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['short_name_mm', 'Short_Name_MM', 'Short Name MM'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['_sheet_name', 'region'])).replace(/"/g, '""')}"`
      ]);
    } else {
      headers = ['Region', 'Town_Township', 'Township', 'ENG_Quarter_Village', 'MM_Quarter_Village', 'Postal_Code'];
      rows = results.map(item => [
        `"${(getValue(item, ['Region', 'region'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['Town_Township', 'town_township'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['Township', 'township'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['ENG_Quarter_Village', 'eng_quarter_village'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['MM_Quarter_Village', 'mm_quarter_village'])).replace(/"/g, '""')}"`,
        `"${(getValue(item, ['Postal_Code', 'postal_code', 'Postal Code'])).replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mm-${activeTab}-search-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    setResults([]);
    setHasSearched(false);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-slate-100 font-sans p-4 flex justify-center selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-[600px] flex flex-col pt-6 pb-12">
        
        {/* Header */}
        <header className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Search className="w-8 h-8 text-cyan-500" strokeWidth={3} />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-cyan-400">
              MM Data Search
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Search across multiple data sources</p>
        </header>

        {/* Tab Navigation */}
        <div className="bg-[#1a1a2e] p-1.5 rounded-xl flex gap-1.5 mb-6 shadow-lg">
          <button
            onClick={() => handleTabSwitch('sheet1')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sheet1' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#2d2d5a]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            NRC Search
          </button>
          <button
            onClick={() => handleTabSwitch('sheet2')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sheet2' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#2d2d5a]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Township Search
          </button>
        </div>

        {/* Search Panel */}
        <div className="bg-[#1a1a2e] rounded-2xl p-4 shadow-xl mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 flex items-center">
              {activeTab === 'sheet1' ? (
                <ClipboardList className="absolute left-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
              ) : (
                <MapPin className="absolute left-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
              )}
              
              <input
                type="text"
                value={currentQuery}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder={activeTab === 'sheet1' ? "Search NRC code (e.g., KAMAYA) or name..." : "Search by town/township..."}
                className="w-full bg-[#252547] border-2 border-transparent focus:border-indigo-500 focus:bg-[#0f0f23] rounded-xl py-3.5 pl-11 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              
              {currentQuery && (
                <button 
                  onClick={clearQuery}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-[#2d2d5a] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <button
              onClick={performSearch}
              disabled={isLoading}
              className="bg-gradient-to-br from-indigo-600 to-indigo-800 disabled:from-indigo-800 disabled:to-indigo-900 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Search <Search className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 animate-in fade-in">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm">Fetching data from Google Sheets...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMsg && (
          <div className="bg-[#1a1a2e] rounded-2xl p-8 text-center border border-red-500/20 shadow-lg animate-in fade-in">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <X className="w-6 h-6" />
            </div>
            <p className="text-red-400 font-medium mb-1">Error</p>
            <p className="text-slate-400 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Results Section */}
        {!isLoading && !errorMsg && hasSearched && (
          <div className="bg-[#1a1a2e] rounded-2xl p-4 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            {results.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                  <h3 className="font-semibold text-slate-200">Search Results</h3>
                  <span className="text-sm font-medium text-cyan-500 bg-cyan-500/10 px-2.5 py-1 rounded-md">
                    {results.length} found
                  </span>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    
                    if (activeTab === 'sheet1') {
                      const name = getValue(item, ['name', 'Name']) || 'Unknown';
                      const nameMm = getValue(item, ['name_mm', 'Name_MM', 'Name MM']);
                      const shortName = getValue(item, ['short_name', 'Short_Name', 'Short Name']);
                      const shortNameMm = getValue(item, ['short_name_mm', 'Short_Name_MM', 'Short Name MM']);
                      const sheetName = getValue(item, ['_sheet_name', 'region', 'Region']);
                      const stateNo = getValue(item, ['state_no']);
                      const stateName = getValue(item, ['state_name']) || sheetName;
                      
                      let details = [];
                      if (nameMm) details.push(`Name MM: ${nameMm}`);
                      if (shortNameMm) details.push(`Short Name MM: ${shortNameMm}`);
                      
                      const detailText = details.join(' | ') || getValue(item, ['details', 'Details']) || 'No additional details';
                      
                      let mainTitle = '';
                      if (stateNo && shortName && stateName) {
                        mainTitle = `${stateNo}/${shortName} - ${name} - ${stateName}`;
                      } else if (shortName) {
                        mainTitle = `${shortName} - ${name}`;
                      } else {
                        mainTitle = name;
                      }

                      return (
                        <div 
                          key={index} 
                          onClick={() => setSelectedIndex(index)}
                          className={`bg-[#252547] rounded-xl p-4 transition-all cursor-pointer border ${isSelected ? 'border-cyan-500 bg-cyan-500/5' : 'border-transparent hover:border-indigo-500/50 hover:bg-[#2d2d5a]'}`}
                        >
                          <div className="font-semibold text-slate-100 text-lg mb-1">{mainTitle}</div>
                          <div className="text-sm text-slate-400 leading-relaxed mb-3">{detailText}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#0f0f23] rounded-md">
                              <ClipboardList className="w-3.5 h-3.5" />
                              NRC Format
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      const township = getValue(item, ['Township', 'township']);
                      const townTownship = getValue(item, ['Town_Township', 'town_township', 'town']);
                      const region = getValue(item, ['Region', 'region']);
                      const engVillage = getValue(item, ['ENG_Quarter_Village', 'eng_quarter_village']);
                      const mmVillage = getValue(item, ['MM_Quarter_Village', 'mm_quarter_village']);
                      const postalCode = getValue(item, ['Postal_Code', 'postal_code', 'Postal Code']);
                      
                      let details = [];
                      if (region) details.push(`Region: ${region}`);
                      if (townTownship) details.push(`Town/Township: ${townTownship}`);
                      if (engVillage) details.push(`Village: ${engVillage}`);
                      if (mmVillage) details.push(`(MM: ${mmVillage})`);
                      if (postalCode) details.push(`Postal Code: ${postalCode}`);
                      
                      let baseName = township || townTownship || 'Unknown Township';
                      const shortPostal = postalCode ? String(postalCode).substring(0, 5) : '';
                      let titleText = shortPostal ? `${baseName} (${shortPostal})` : baseName;
                      if (region) titleText += ` - ${region}`;
                      
                      const detailText = details.join(' | ') || getValue(item, ['details', 'Details']) || 'No additional details';

                      return (
                        <div 
                          key={index} 
                          onClick={() => setSelectedIndex(index)}
                          className={`bg-[#252547] rounded-xl p-4 transition-all cursor-pointer border ${isSelected ? 'border-cyan-500 bg-cyan-500/5' : 'border-transparent hover:border-indigo-500/50 hover:bg-[#2d2d5a]'}`}
                        >
                          <div className="font-semibold text-slate-100 text-lg mb-1">{titleText}</div>
                          <div className="text-sm text-slate-400 leading-relaxed mb-3">{detailText}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#0f0f23] rounded-md">
                              <MapPin className="w-3.5 h-3.5" />
                              Sheet 2 (Location)
                            </span>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <button 
                    onClick={exportToCSV}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-700 hover:border-emerald-500 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 font-medium transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Export to CSV
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Database className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
                <p className="text-lg text-slate-200 mb-1">No results found</p>
                <p className="text-sm text-slate-500">We couldn't find any matches for "{currentQuery}". Try adjusting your search.</p>
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f0f23;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}

