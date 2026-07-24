# MM Data Search

A web-based application to search data from multiple Google Sheets with both web UI and Android APK support.

## Features

- **Dual Search**: Search by Name (Sheet 1) or Location (Sheet 2)
- **Column-Specific Search**: Targeted search in specific columns
- **Export to CSV**: Download search results
- **Responsive Design**: Works on mobile and desktop
- **APK Support**: Can be wrapped as Android app

## Quick Start

### 1. Test with Demo Data

Simply open `index.html` in a browser to test with demo data.

### 2. Connect to Google Sheets

#### Step 1: Create Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Paste the following code:

```javascript
function doGet(e) {
  const sheetId = e.parameter.sheetId;
  const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Replace `sheetId` with your actual Google Sheet ID
5. Deploy as web app (Deploy > New deployment > Web app)
6. Copy the deployment URL

#### Step 2: Update Configuration

In `app.js`, update the CONFIG object with your deployment URLs:

```javascript
const CONFIG = {
    sheet1: {
        url: 'YOUR_SHEET1_APPS_SCRIPT_URL',
        searchColumn: 'Name',
        nameKey: 'name',
        detailKey: 'details'
    },
    sheet2: {
        url: 'YOUR_SHEET2_APPS_SCRIPT_URL',
        searchColumn: 'Town_Township',
        nameKey: 'town',
        detailKey: 'details'
    }
};
```

### 3. Create Android APK

#### Option A: Using Capacitor (Recommended)

1. Install Node.js and npm
2. Initialize the project:
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli
   npx cap init "MM Data Search" "com.mm.datasearch"
   ```

3. Add Android platform:
   ```bash
   npx cap add android
   ```

4. Copy web assets:
   ```bash
   npx cap copy android
   ```

5. Open in Android Studio:
   ```bash
   npx cap open android
   ```

6. Build APK in Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)

#### Option B: Using PWABuilder

1. Go to [PWABuilder](https://www.pwabuilder.com/)
2. Enter your hosted app URL
3. Click "Package for stores"
4. Download the APK

#### Option C: Using WebView Wrapper

Create a simple Android app with WebView:

```java
// MainActivity.java
public class MainActivity extends AppCompatActivity {
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.loadUrl("file:///android_asset/index.html");
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

## File Structure

```
mm-data-search/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── app.js              # JavaScript logic
├── manifest.json       # PWA manifest
└── README.md           # This file
```

## Customization

### Changing Search Columns

In `app.js`, update the CONFIG object:

```javascript
const CONFIG = {
    sheet1: {
        searchColumn: 'YourColumnName',  // Column to search
        nameKey: 'resultName',           // Key for display name
        detailKey: 'resultDetails'       // Key for details
    }
};
```

### Adding More Sheets

1. Add a new tab in HTML
2. Add corresponding search input
3. Add new config entry in CONFIG object
4. Update the fetchSheetData function

## Troubleshooting

### CORS Issues

If you encounter CORS errors when fetching from Google Apps Script:

1. Make sure the Apps Script is deployed as "Anyone can access"
2. Use JSONP or a CORS proxy if needed

### Data Not Loading

1. Check browser console for errors
2. Verify Apps Script URL is correct
3. Ensure Google Sheet is shared with appropriate permissions

## License

MIT License
