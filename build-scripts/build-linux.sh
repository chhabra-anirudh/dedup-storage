#!/bin/bash
# Make sure OpenSSL is installed: sudo apt install libssl-dev zlib1g-dev
# Make script executable: chmod +x build-linux.sh

echo "Compiling dedup for Linux..."

g++ -std=c++20 src/*.cpp -Iinclude -lssl -lcrypto -lz -o dedup

if [ $? -eq 0 ]; then
    echo "Compilation successful! Binary: ./dedup"
else
    echo "Compilation failed."
fi
