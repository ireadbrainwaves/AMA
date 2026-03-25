@echo off
REM ============================================================
REM  Aseprite v1.3.14 — Automated Source Compilation for Win x64
REM  Based on: https://gist.github.com/Mitra-88/3fd0188afeb8d49f219efb008b612197
REM ============================================================
REM
REM  PREREQUISITES (install these first):
REM    1. Visual Studio Community 2022
REM       - Workload: "Desktop Development with C++"
REM       - Individual Component: "Windows 10.0 SDK (latest)"
REM    2. CMake  (cmake-4.x-windows-x86_64.msi)
REM       - During install, choose "Add CMake to PATH"
REM    3. Download and place these files in C:\deps\:
REM       a) Aseprite source:  https://github.com/aseprite/aseprite/releases
REM          -> Extract to C:\aseprite\
REM       b) Skia pre-built:   https://github.com/nickvdp/aseprite-build/releases
REM          -> Extract to C:\deps\skia\
REM       c) Ninja Build:      https://github.com/nickvdp/aseprite-build/releases
REM          -> Copy ninja.exe to "C:\Program Files\CMake\bin\"
REM
REM  Then just run this script from a normal Command Prompt.
REM ============================================================

echo.
echo ===================================
echo   Aseprite Compilation Script
echo ===================================
echo.

REM Check prerequisites exist
if not exist "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" (
    echo [ERROR] Visual Studio 2022 Community not found.
    echo         Install from: https://visualstudio.microsoft.com/vs/community/
    echo         Select "Desktop Development with C++" workload
    pause
    exit /b 1
)

where cmake >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] CMake not found in PATH.
    echo         Install from: https://cmake.org/download/
    echo         Choose "Add CMake to PATH" during install
    pause
    exit /b 1
)

if not exist "C:\deps\skia\out\Release-x64\skia.lib" (
    echo [ERROR] Skia not found at C:\deps\skia\
    echo         Download Skia-Windows-Release-x64.zip and extract to C:\deps\skia\
    pause
    exit /b 1
)

if not exist "C:\aseprite\CMakeLists.txt" (
    echo [ERROR] Aseprite source not found at C:\aseprite\
    echo         Download source from GitHub releases and extract to C:\aseprite\
    pause
    exit /b 1
)

echo [OK] All prerequisites found. Starting compilation...
echo.

REM Initialize VS2022 x64 build environment
call "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" -arch=x64

REM Navigate to aseprite and create build directory
cd /d C:\aseprite
if not exist build mkdir build
cd build

echo [STEP 1/2] Running CMake configuration...
cmake -DCMAKE_BUILD_TYPE=RelWithDebInfo ^
      -DLAF_BACKEND=skia ^
      -DSKIA_DIR=C:\deps\skia ^
      -DSKIA_LIBRARY_DIR=C:\deps\skia\out\Release-x64 ^
      -DSKIA_LIBRARY=C:\deps\skia\out\Release-x64\skia.lib ^
      -G Ninja ..

if %errorlevel% neq 0 (
    echo [ERROR] CMake configuration failed.
    pause
    exit /b 1
)

echo.
echo [STEP 2/2] Compiling with Ninja (this takes a few minutes)...
ninja aseprite

if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    pause
    exit /b 1
)

echo.
echo ===================================
echo   SUCCESS! Aseprite compiled.
echo ===================================
echo.
echo Executable: C:\aseprite\build\bin\aseprite.exe
echo.
echo Starting Aseprite...
start "" "C:\aseprite\build\bin\aseprite.exe"

pause
