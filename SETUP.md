# MM Data Search - Setup Guide

## Quick Start

### Step 1: Deploy Google Apps Script for Sheet 1

1. Go to **https://script.google.com/**
2. Click **"New Project"**
3. Delete all existing code
4. Copy and paste the code from `google-apps-script.gs`
5. Update the `SHEET_ID` line with your Sheet 1 ID:
   ```javascript
   const SHEET_ID = '1nrMBnmgdjtefTNzW0ZBzeOp_mvBHBdSLeFHW_qPfLeo';
   ```
6. Click **"Deploy"** > **"New deployment"**
7. Click the gear icon > select **"Web app"**
8. Fill in:
   - Description: "MM Data Search Sheet 1"
   - Who has access: **"Anyone"**
9. Click **"Deploy"**
10. Click **"Copy"** to copy the URL

### Step 2: Deploy Google Apps Script for Sheet 2

1. Go back to **https://script.google.com/**
2. Click **"New Project"** again
3. Delete all existing code
4. Copy and paste the code from `google-apps-script.gs`
5. Update the `SHEET_ID` line with your Sheet 2 ID:
   ```javascript
   const SHEET_ID = '1VcB_oia94R7dqRTl7U7fhxQznCwgnxDlHNCDN8ygagM';
   ```
6. Click **"Deploy"** > **"New deployment"**
7. Click the gear icon > select **"Web app"**
8. Fill in:
   - Description: "MM Data Search Sheet 2"
   - Who has access: **"Anyone"**
9. Click **"Deploy"**
10. Click **"Copy"** to copy the URL

### Step 3: Update app.js Configuration

Open `app.js` and update the CONFIG object with your URLs:

```javascript
const CONFIG = {
    sheet1: {
        url: 'PASTE_YOUR_SHEET1_URL_HERE',  // From Step 1
        searchColumn: 'Name',
        nameKey: 'name',
        detailKey: 'details'
    },
    sheet2: {
        url: 'PASTE_YOUR_SHEET2_URL_HERE',  // From Step 2
        searchColumn: 'Town_Township',
        nameKey: 'town_township',
        detailKey: 'details'
    }
};
```

### Step 4: Test the App

1. Open `index.html` in your browser
2. Type "Yesagyo" in the search box
3. Click "Search"
4. You should see results from your Google Sheet!

## Troubleshooting

### "No results found" but data exists

1. Check the browser console (F12) for errors
2. Make sure the Apps Script URLs are correct
3. Verify the Apps Script is deployed as "Anyone can access"
4. Check that your Google Sheet is accessible

### CORS Errors

If you see CORS errors in the console:
1. The Apps Script might not be deployed correctly
2. Try redeploying with "Anyone" access
3. Make sure you're using the correct URL (ends with /exec)

### Data not loading

1. Open the Apps Script URL directly in your browser
2. You should see JSON data
3. If you see an error, check the Apps Script editor for errors

## Understanding the Data

The app automatically converts Google Sheet headers to lowercase with underscores:
- "Name" → "name"
- "Town_Township" → "town_township"
- "Phone Number" → "phone_number"

When you search:
- **Sheet 1**: Searches in the "Name" column
- **Sheet 2**: Searches in the "Town_Township" column

All other columns are shown as details in the results.

## Need Help?

If you're still having issues, please provide:
1. The exact error message from the browser console
2. Whether the Apps Script URL works when opened directly
3. A screenshot of your Google Sheet (first few rows)
