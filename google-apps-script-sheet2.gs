/**
 * Google Apps Script for MM Data Search - Myanmar Locations & Postal Code
 * 
 * Deploy this for Sheet 2 (Myanmar_Locations_Postal_Code)
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1VcB_oia94R7dqRTl7U7fhxQznCwgnxDlHNCDN8ygagM/edit
 */

// ===== CONFIGURATION =====
const SHEET_ID = '1VcB_oia94R7dqRTl7U7fhxQznCwgnxDlHNCDN8ygagM';

// ===== MAIN FUNCTION =====
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip if empty or only has headers
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // First row is headers
    const headers = data[0];
    
    // Remaining rows are data
    const rows = data.slice(1);
    
    // Convert to objects
    let allData = [];
    
    rows.forEach(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Keep original header name (don't convert to snake_case)
        const key = header.toString().trim();
        obj[key] = row[index];
      });
      
      // Only add if has data
      if (obj['Township'] || obj['Town_Township'] || obj['Region']) {
        allData.push(obj);
      }
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
  Logger.log('First record: ' + JSON.stringify(data[0], null, 2));
  Logger.log('Sample township values: ' + JSON.stringify(data.slice(0, 5).map(d => d['Township'])));
}
