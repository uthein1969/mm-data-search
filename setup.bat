@echo off
echo ====================================
echo    MM Data Search - Setup Script
echo ====================================
echo.

echo [1/4] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Installing dependencies...
call npm install

echo [3/4] Installing Capacitor...
call npm install @capacitor/core @capacitor/cli @capacitor/android

echo [4/4] Initializing Capacitor...
call npx cap init "MM Data Search" "com.mm.datasearch" --web-dir .

echo.
echo ====================================
echo    Setup Complete!
echo ====================================
echo.
echo To run locally:
echo   npm start
echo.
echo To create Android APK:
echo   1. npx cap add android
echo   2. npx cap copy android
echo   3. npx cap open android
echo   4. In Android Studio: Build > Build APK
echo.
echo Or use PWABuilder:
echo   https://www.pwabuilder.com/
echo.
pause
