#!/bin/bash
echo "Compiling dedup for Windows (static + system libraries)..."

# Root and source directories
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"
INCLUDE_DIR="$ROOT_DIR/include"
OUTPUT="$ROOT_DIR/dedup.exe"

# MSYS2 OpenSSL & zlib paths
OPENSSL_DIR="/mingw64"
ZLIB_DIR="/mingw64"

# Clean previous executable
rm -f "$OUTPUT"

# Compile
x86_64-w64-mingw32-g++ -std=c++20 "$SRC_DIR"/*.cpp -I"$INCLUDE_DIR" \
  -I"$OPENSSL_DIR/include" -I"$ZLIB_DIR/include" \
  "$OPENSSL_DIR/lib/libssl.a" "$OPENSSL_DIR/lib/libcrypto.a" "$ZLIB_DIR/lib/libz.a" \
  -static-libgcc -static-libstdc++ \
  -lws2_32 -lcrypt32 -luser32 -lgdi32 -ladvapi32 \
  -o "$OUTPUT"

# Check compilation result
if [ $? -eq 0 ]; then
  echo "Compilation succeeded! Executable: $OUTPUT"
else
  echo "Compilation failed."
fi
