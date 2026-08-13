@echo off
echo ====================================
echo    My Form App - Android Build
echo ====================================
echo.

echo [1/3] Building Android project...
cd android
call gradlew.bat assembleDebug

echo [2/3] APK location:
echo android\app\build\outputs\apk\debug\app-debug.apk

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
