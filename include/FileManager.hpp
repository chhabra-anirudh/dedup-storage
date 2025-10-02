#pragma once
#include <vector>
#include <string>
#include "DedupEngine.hpp"

class FileManager {
public:
    static std::vector<std::vector<char>> chunkFile(const std::string& filePath, size_t chunkSize = 4096);

    // Add DedupEngine reference for decompression
    static void reconstructFile(const std::string& outputPath, const std::vector<std::string>& chunkHashes, DedupEngine& de);
};
