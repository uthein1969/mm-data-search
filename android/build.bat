@echo off
echo ====================================
echo    My Form App - Android Build
echo ====================================
echo.

echo Checking for Gradle wrapper...
if not exist "gradlew.bat" (
    echo ERROR: gradlew.bat not found!
    echo Please open this project in Android Studio first.
    echo Android Studio will automatically set up the Gradle wrapper.
    echo.
    echo Steps:
    echo 1. Open Android Studio
    echo 2. Click "Open an Existing Project"
    echo 3. Navigate to: D:\My Projects\MM Data\mm-data-search\android
    echo 4. Wait for Android Studio to sync the project
    echo 5. Then run this script again
    echo.
    pause
    exit /b 1
)

echo Building APK...
call gradlew.bat assembleDebug

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ====================================
echo    Build Complete!
echo ====================================
echo.
echo APK file is ready at:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To install on device:
echo   adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
