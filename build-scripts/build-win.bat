@echo off
REM =========================================================
REM Build dedup CLI for Windows
REM Project structure:
REM dedup-storage/
REM ├─ src/
REM ├─ include/
REM ├─ build-scripts/
REM =========================================================

echo Compiling dedup for Windows...

REM Set project root (one level up from this script)
set ROOT=%~dp0..
cd /d %ROOT%

REM Check if src and include folders exist
if not exist src (
    echo ERROR: src folder not found at %ROOT%\src
    pause
    exit /b 1
)
if not exist include (
    echo ERROR: include folder not found at %ROOT%\include
    pause
    exit /b 1
)

REM === Set OpenSSL and zlib paths ===
REM User needs to install OpenSSL and zlib, update paths if needed
set OPENSSL_INCLUDE=C:\OpenSSL-Win64\include
set OPENSSL_LIB=C:\OpenSSL-Win64\lib
set ZLIB_INCLUDE=C:\zlib\include
set ZLIB_LIB=C:\zlib\lib

REM Compile all cpp files in src folder
g++ -std=c++20 src\*.cpp ^
    -I"include" ^
    -I"%OPENSSL_INCLUDE%" ^
    -I"%ZLIB_INCLUDE%" ^
    -L"%OPENSSL_LIB%" ^
    -L"%ZLIB_LIB%" ^
    -lssl -lcrypto -lz ^
    -o dedup.exe

IF %ERRORLEVEL% NEQ 0 (
    echo Compilation failed.
    pause
    exit /b 1
)

echo Compilation successful!
echo dedup.exe created in %ROOT%
pause
