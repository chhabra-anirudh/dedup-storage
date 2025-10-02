@echo off
REM Requires MSYS2, Cygwin, or MinGW with g++
REM Make sure OpenSSL and zlib are installed for MinGW/MSYS2

echo Compiling dedup for Windows...

g++ -std=c++20 src\*.cpp -Iinclude -lssl -lcrypto -lz -o dedup.exe

if %ERRORLEVEL%==0 (
    echo Compilation successful! Binary: dedup.exe
) else (
    echo Compilation failed.
)
pause

