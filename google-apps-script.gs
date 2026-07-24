/**
 * Google Apps Script for MM Data Search - Myanmar NRC Format
 * 
 * This script reads from your Google Sheet with multiple tabs.
 * Deploy this for Sheet 1 (Myanmar_NRC_Format)
 */

// ===== CONFIGURATION =====
const SHEET_ID = '1nrMBnmgdjtefTNzW0ZBzeOp_mvBHBdSLeFHW_qPfLeo';

// ===== MAIN FUNCTION =====
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    // Get all sheets (tabs)
    const sheets = spreadsheet.getSheets();
    
    // Collect data from ALL sheets
    let allData = [];
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      const data = sheet.getDataRange().getValues();
      
      // Skip if empty or only has headers
      if (data.length <= 1) return;
      
      // First row is headers
      const headers = data[0];
      
      // Remaining rows are data
      const rows = data.slice(1);
      
      // Convert to objects
      rows.forEach(row => {
        const obj = {};
        headers.forEach((header, index) => {
          // Convert header to snake_case
          const key = header.toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
          obj[key] = row[index];
        });
        
        // Add sheet name for reference
        obj['_sheet_name'] = sheetName;
        
        // Only add if has data
        if (obj['name'] || obj['name_mm'] || obj['short_name']) {
          allData.push(obj);
        }
      });
    });
    
    // Return as JSON
    return ContentService
      .createTextOutput(JSON.stringify(allData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== HELPER: TEST FUNCTION =====
function testDoGet() {
  const result = doGet({ parameter: {} });
  const data = JSON.parse(result.getContent());
  Logger.log('Total records: ' + data.length);
  Logger.log('First 3 records: ' + JSON.stringify(data.slice(0, 3), null, 2));
}
