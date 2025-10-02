#include "MetadataStore.hpp"
#include <fstream>
#include <iostream>
#include <filesystem>
#include <numeric> 
#include <unordered_set>
#include "DedupEngine.hpp"
#include <iomanip>
#include <cstdint>
#include <sstream>
#include <locale>

using namespace std;
namespace fs = std::filesystem;
using json = nlohmann::json;

void MetadataStore::addFile(const string& filePath, const vector<string>& chunkHashes) {
    fileToChunks[filePath] = chunkHashes;

    for (const auto& hash : chunkHashes) {
        chunkRefCount[hash]++; // increment usage count
    }
}


vector<string> MetadataStore::getChunks(const string& filePath) {
    if (fileToChunks.count(filePath)) return fileToChunks[filePath];
    return {};
}

void MetadataStore::saveMetadata() {
    json j;
    j["files"] = json::object();
    for (auto& [file, chunks] : fileToChunks) {
        j["files"][file] = chunks;
    }

    j["chunks"] = json::object();
    for (auto& [hash, count] : chunkRefCount) {
        j["chunks"][hash] = count;
    }

    ofstream out(metadataFile);
    if (!out) {
        cerr << "Error: Cannot write metadata file." << endl;
        return;
    }
    out << j.dump(4);
}


void MetadataStore::loadMetadata() {
    ifstream in(metadataFile);
    if (!in) {
        cout << "No existing metadata file. Starting fresh." << endl;
        return;
    }

    // Check if file is empty
    in.seekg(0, ios::end);
    if (in.tellg() == 0) {
        cout << "Metadata file is empty. Starting fresh." << endl;
        return;
    }
    in.seekg(0, ios::beg);

    json j;
    try {
        in >> j;
    } catch (json::parse_error& e) {
        cerr << "Error parsing metadata.json: " << e.what() 
             << "\nStarting with empty metadata." << endl;
        fileToChunks.clear();
        chunkRefCount.clear();
        return;
    }

    fileToChunks.clear();
    chunkRefCount.clear();

    if (j.contains("files")) {
        for (auto& [file, chunks] : j["files"].items()) {
            fileToChunks[file] = chunks.get<vector<string>>();
        }
    }

    if (j.contains("chunks")) {
        for (auto& [hash, count] : j["chunks"].items()) {
            chunkRefCount[hash] = count.get<int>();
        }
    }
}



void MetadataStore::removeFile(const string& filePath) {
    if (!fileToChunks.count(filePath)) {
        cerr << "File not found in metadata: " << filePath << endl;
        return;
    }

    // Decrement reference count for each chunk
    for (const auto& hash : fileToChunks[filePath]) {
        if (chunkRefCount.count(hash)) {
            chunkRefCount[hash]--;
            if (chunkRefCount[hash] <= 0) {
                // Remove chunk file if no longer used
                string chunkPath = "chunks/" + hash;
                if (fs::exists(chunkPath)) fs::remove(chunkPath);
                chunkRefCount.erase(hash);
            }
        }
    }

    // Remove file from metadata
    fileToChunks.erase(filePath);
    saveMetadata();

    cout << "File deleted successfully: " << filePath << endl;
}

void MetadataStore::listFiles(DedupEngine& de) {
    if (fileToChunks.empty()) {
        cout << "No files stored yet." << endl;
        return;
    }

    // Helper for comma-separated numbers
    auto formatNumber = [](int64_t n) {
        std::stringstream ss;
        ss.imbue(std::locale(""));
        ss << n;
        return ss.str();
    };

    // Collect stats per file
    struct FileStat {
        string name;
        size_t chunks;
        int64_t compressed = 0;
        int64_t original = 0;
        double savingsPercent = 0.0;
    };
    vector<FileStat> stats;

    unordered_set<string> uniqueChunks;
    int64_t totalCompressed = 0, totalOriginal = 0;

    for (const auto& [file, chunks] : fileToChunks) {
        int64_t fileCompressed = 0, fileOriginal = 0;

        for (const auto& hash : chunks) {
            uniqueChunks.insert(hash);
            string chunkPath = "chunks/" + hash;
            if (!fs::exists(chunkPath)) continue;

            fileCompressed += static_cast<int64_t>(fs::file_size(chunkPath));
            vector<char> chunkData = de.loadAndDecompressChunk(hash);
            fileOriginal += static_cast<int64_t>(chunkData.size());
        }

        totalCompressed += fileCompressed;
        totalOriginal += fileOriginal;

        double savingsPercent = (fileOriginal > 0)
                                ? 100.0 * (1.0 - double(fileCompressed) / double(fileOriginal))
                                : 0.0;

        stats.push_back({file, chunks.size(), fileCompressed, fileOriginal, savingsPercent});
    }

    // Sort by original size descending for demo impact
    sort(stats.begin(), stats.end(), [](const FileStat& a, const FileStat& b){
        return a.original > b.original;
    });

    // Display
    cout << fixed << setprecision(2);
    cout << "Stored files:\n";
    for (const auto& f : stats) {
        double avgChunkSize = f.chunks ? double(f.original) / f.chunks : 0.0;
        cout << " - " << f.name
             << " | Chunks: " << f.chunks
             << " | Avg chunk size: " << avgChunkSize << " bytes"
             << " | Compressed: " << formatNumber(f.compressed) << " bytes"
             << " | Original: " << formatNumber(f.original) << " bytes"
             << " | Savings: " << f.savingsPercent << " %"
             << endl;
    }

    // Overall stats
    int64_t overallSavings = totalOriginal - totalCompressed;
    cout << "\nOverall stats:\n";
    cout << " Total files: " << fileToChunks.size() << endl;
    cout << " Unique chunks: " << uniqueChunks.size() << endl;
    cout << " Total compressed size: " << formatNumber(totalCompressed) << " bytes" << endl;
    cout << " Total original size: " << formatNumber(totalOriginal) << " bytes" << endl;
    cout << " Total dedup + compression savings: " << formatNumber(overallSavings) << " bytes" << endl;
}
