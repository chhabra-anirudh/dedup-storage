// DedupEngine.cpp
#include "DedupEngine.hpp"
#include <openssl/sha.h>
#include <zlib.h>
#include <iomanip>
#include <sstream>
#include <fstream>
#include <iostream>
#include <filesystem>
#include <cstdint>

using namespace std;
namespace fs = std::filesystem;

constexpr size_t MIN_COMPRESS_SIZE = 512; // Skip compression for chunks < 512 B

// ------------------------
// Convert bytes to hex string
// ------------------------
string bytesToHex(const unsigned char* bytes, size_t length) {
    stringstream ss;
    for (size_t i = 0; i < length; ++i)
        ss << hex << setw(2) << setfill('0') << (int)bytes[i];
    return ss.str();
}

// ------------------------
// SHA-256 hash of a chunk
// ------------------------
string DedupEngine::hashChunk(const vector<char>& chunk) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256(reinterpret_cast<const unsigned char*>(chunk.data()), chunk.size(), hash);
    return bytesToHex(hash, SHA256_DIGEST_LENGTH);
}

// ------------------------
// Compress chunk with original size header
// Skip compression for very small chunks
// ------------------------
vector<char> DedupEngine::compressChunk(const vector<char>& data) {
    if (data.size() < MIN_COMPRESS_SIZE) {
        vector<char> rawChunk(sizeof(uint32_t) + data.size());
        uint32_t origSize = static_cast<uint32_t>(data.size());
        memcpy(rawChunk.data(), &origSize, sizeof(origSize));
        memcpy(rawChunk.data() + sizeof(origSize), data.data(), data.size());
        return rawChunk;
    }

    uLongf compressedSize = compressBound(data.size());
    vector<char> compressed(compressedSize + sizeof(uint32_t));

    uint32_t origSize = static_cast<uint32_t>(data.size());
    memcpy(compressed.data(), &origSize, sizeof(origSize));

    int ret = compress(reinterpret_cast<Bytef*>(compressed.data() + sizeof(origSize)), &compressedSize,
                       reinterpret_cast<const Bytef*>(data.data()), data.size());
    if (ret != Z_OK || compressedSize >= data.size()) {
        // fallback to raw if compression fails or not effective
        memcpy(compressed.data() + sizeof(origSize), data.data(), data.size());
        compressed.resize(sizeof(origSize) + data.size());
    } else {
        compressed.resize(compressedSize + sizeof(origSize));
    }

    return compressed;
}

// ------------------------
// Decompress chunk
// ------------------------
vector<char> DedupEngine::decompressChunk(const vector<char>& data) {
    if (data.size() < sizeof(uint32_t)) {
        cerr << "Warning: Chunk too small, returning raw data." << endl;
        return data;
    }

    uint32_t origSize;
    memcpy(&origSize, data.data(), sizeof(origSize));

    // If small chunk, it's raw
    if (data.size() == origSize + sizeof(uint32_t)) {
        vector<char> raw(origSize);
        memcpy(raw.data(), data.data() + sizeof(origSize), origSize);
        return raw;
    }

    vector<char> decompressed(origSize);
    uLongf destLen = origSize;

    int ret = uncompress(reinterpret_cast<Bytef*>(decompressed.data()), &destLen,
                         reinterpret_cast<const Bytef*>(data.data() + sizeof(origSize)),
                         data.size() - sizeof(origSize));
    if (ret != Z_OK || destLen != origSize) {
        cerr << "Warning: Decompression failed, returning raw data." << endl;
        return data;
    }

    return decompressed;
}

// ------------------------
// Store chunks (dedup + compression)
// ------------------------
vector<string> DedupEngine::storeChunks(const vector<vector<char>>& chunks) {
    vector<string> chunkHashes;

    if (!fs::exists(chunkDir)) fs::create_directory(chunkDir);

    for (const auto& chunk : chunks) {
        string hash = hashChunk(chunk);
        chunkHashes.push_back(hash);

        string chunkPath = chunkDir + hash;

        if (!fs::exists(chunkPath)) {
            vector<char> compressed = compressChunk(chunk);
            ofstream out(chunkPath, ios::binary);
            if (!out) {
                cerr << "Error: Cannot write chunk " << hash << endl;
                continue;
            }
            out.write(compressed.data(), compressed.size());
        }
    }

    return chunkHashes;
}

// ------------------------
// Load and decompress chunk
// ------------------------
vector<char> DedupEngine::loadAndDecompressChunk(const string& hash) {
    string chunkPath = chunkDir + hash;
    if (!fs::exists(chunkPath)) {
        cerr << "Error: Chunk not found " << hash << endl;
        return {};
    }

    ifstream in(chunkPath, ios::binary | ios::ate);
    if (!in) {
        cerr << "Error: Cannot open chunk " << hash << endl;
        return {};
    }

    streamsize size = in.tellg();
    in.seekg(0, ios::beg);

    vector<char> buffer(size);
    in.read(buffer.data(), size);

    return decompressChunk(buffer);
}
