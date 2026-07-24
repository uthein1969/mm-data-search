# MM Data Search - Android APK Setup Guide

## App Description
A search-only Android app that fetches data from Google Sheets and displays results on screen. No forms, no data entry - just search and display.

## Features
- Dark theme design matching the original web app
- Two search modes: Name Search and Location Search
- Tab navigation between search types
- Real-time search results with highlighted data
- Export to CSV functionality
- Loading indicator while fetching data
- Error handling with retry option

## Data Sources
The app fetches data from your Google Sheets via Apps Script:
- **Sheet 1**: Name search (Myanmar NRC data)
- **Sheet 2**: Location search (Town/Township data)

## Prerequisites
- Android Studio installed
- Android SDK installed
- Internet connection (for data fetching)

## How to Build

### Step 1: Open Project in Android Studio
1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to: `D:\My Projects\MM Data\mm-data-search\android`
4. Click "OK"
5. Wait for Android Studio to sync the project

### Step 2: Build the APK
**Option A: Using Android Studio**
1. Click "Build" menu
2. Select "Build Bundle(s) / APK(s)"
3. Click "Build APK(s)"
4. Wait for the build to complete

**Option B: Using Command Line**
1. Open Command Prompt
2. Navigate to: `D:\My Projects\MM Data\mm-data-search\android`
3. Run: `gradlew.bat assembleDebug`

### Step 3: Get the APK
The APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 4: Install on Device
1. Enable USB Debugging on your Android device
2. Connect device to computer via USB
3. Run: `adb install android\app\build\outputs\apk\debug\app-debug.apk`

## How It Works
1. User opens the app
2. Selects search type (Name or Location) via tabs
3. Enters search term in the input field
4. Taps Search button
5. App fetches data from Google Sheets
6. Displays matching results in a list
7. User can tap Export to CSV to download results

## Customization
- To change data sources, edit the CONFIG section in `index.html`
- To modify the design, edit the CSS variables at the top of the style section
- To change search behavior, modify the filterData() function

## Troubleshooting
- **No results showing**: Ensure internet connection is working
- **Build fails**: Verify Android SDK is installed and ANDROID_HOME is set
- **SDK not found**: Open Android Studio > File > Project Structure > SDK Location
- **App crashes**: Check logcat in Android Studio for error details
