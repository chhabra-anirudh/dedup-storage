#!/bin/bash
echo "Compiling dedup for macOS with static OpenSSL and zlib..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"
INCLUDE_DIR="$ROOT_DIR/include"
OUTPUT="$ROOT_DIR/dedup"

OPENSSL_DIR=$(brew --prefix openssl@3)
ZLIB_DIR=$(brew --prefix zlib)

rm -f "$OUTPUT"

clang++ -std=c++20 "$SRC_DIR"/*.cpp -I"$INCLUDE_DIR" \
  -I"$OPENSSL_DIR/include" -I"$ZLIB_DIR/include" \
  "$OPENSSL_DIR/lib/libssl.a" "$OPENSSL_DIR/lib/libcrypto.a" "$ZLIB_DIR/lib/libz.a" \
  -o "$OUTPUT"

if [ $? -eq 0 ]; then
  echo "Compilation succeeded! Executable: $OUTPUT"
else
  echo "Compilation failed."
fi
