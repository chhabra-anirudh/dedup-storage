#!/bin/bash

echo "Compiling dedup for macOS..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"
INCLUDE_DIR="$ROOT_DIR/include"
OUTPUT="$ROOT_DIR/dedup"

# Homebrew OpenSSL path
OPENSSL_DIR=$(brew --prefix openssl@3)

# Remove old executable
rm -f "$OUTPUT"

clang++ -std=c++20 "$SRC_DIR"/*.cpp -I"$INCLUDE_DIR" \
    -I"$OPENSSL_DIR/include" -L"$OPENSSL_DIR/lib" \
    -lssl -lcrypto -lz \
    -o "$OUTPUT"

if [ $? -eq 0 ]; then
    echo "Compilation succeeded! Executable: $OUTPUT"
else
    echo "Compilation failed."
fi
