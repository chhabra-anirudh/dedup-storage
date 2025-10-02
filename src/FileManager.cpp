#include "FileManager.hpp"
#include "DedupEngine.hpp"
#include <fstream>
#include <vector>
#include <iostream>
#include <filesystem>
#include <chrono>
#include <cmath>

using namespace std;
namespace fs = std::filesystem;

static void showProgress(size_t current, size_t total, size_t barWidth = 50);

// Adaptive chunk thresholds
const size_t MIN_CHUNK_SIZE = 1024;   // 1 KB
const size_t MAX_CHUNK_SIZE = 8192;   // 8 KB
const size_t BASE_CHUNK_SIZE = 4096;  // 4 KB

// ------------------------
// Adaptive chunking: smaller files -> smaller chunks, larger files -> larger chunks
// ------------------------
vector<vector<char>> FileManager::chunkFile(const string& filePath, size_t /*ignored*/) {
    ifstream file(filePath, ios::binary | ios::ate);
    if (!file) {
        cerr << "Error: Cannot open file " << filePath << endl;
        return {};
    }

    size_t fileSize = file.tellg();
    file.seekg(0, ios::beg);

    vector<vector<char>> chunks;
    size_t processed = 0;

    while (!file.eof()) {
        size_t remaining = fileSize - processed;
        size_t chunkSize = min(MAX_CHUNK_SIZE,
                               max(MIN_CHUNK_SIZE,
                                   static_cast<size_t>(BASE_CHUNK_SIZE * pow(double(remaining) / double(fileSize), 0.5))));

        vector<char> buffer(chunkSize);
        file.read(buffer.data(), chunkSize);
        buffer.resize(file.gcount()); // last chunk may be smaller
        if (!buffer.empty()) chunks.push_back(buffer);

        processed += buffer.size();
        showProgress(processed, fileSize);
    }

    return chunks;
}

// ------------------------
// Reconstruct file
// ------------------------
void FileManager::reconstructFile(const string& outputPath, const vector<string>& chunkHashes, DedupEngine& de) {
    ofstream out(outputPath, ios::binary);
    if (!out) {
        cerr << "Error: Cannot create output file " << outputPath << endl;
        return;
    }

    size_t totalChunks = chunkHashes.size();
    for (size_t i = 0; i < totalChunks; ++i) {
        const auto& hash = chunkHashes[i];
        vector<char> buffer = de.loadAndDecompressChunk(hash);
        if (buffer.empty()) {
            cerr << "Warning: Chunk " << hash << " could not be loaded. Skipping." << endl;
            continue;
        }
        out.write(buffer.data(), buffer.size());
        showProgress(i + 1, totalChunks);
    }

    cout << "File reconstructed successfully: " << outputPath << endl;
}

// ------------------------
// Progress bar
// ------------------------
void showProgress(size_t current, size_t total, size_t barWidth) {
    double progress = double(current) / total;
    size_t pos = static_cast<size_t>(barWidth * progress);

    cout << "[";
    for (size_t i = 0; i < barWidth; ++i) {
        if (i < pos) cout << "=";
        else if (i == pos) cout << ">";
        else cout << " ";
    }
    cout << "] " << int(progress * 100.0) << " %\r";
    cout.flush();

    if (current == total) cout << endl;
}
