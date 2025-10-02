#!/bin/bash
# Make sure OpenSSL is installed: brew install openssl@3
# Make script executable: chmod +x build-mac.sh

echo "Compiling dedup for macOS..."

g++ -std=c++20 src/*.cpp -Iinclude -lssl -lcrypto -lz -o dedup

if [ $? -eq 0 ]; then
    echo "Compilation successful! Binary: ./dedup"
else
    echo "Compilation failed."
fi

