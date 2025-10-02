#pragma once
#include <vector>
#include <string>

class DedupEngine {
private:
    std::string chunkDir = "chunks/";

    std::vector<char> compressChunk(const std::vector<char>& data);
    std::vector<char> decompressChunk(const std::vector<char>& data);

public:
    std::string hashChunk(const std::vector<char>& chunk);
    std::vector<std::string> storeChunks(const std::vector<std::vector<char>>& chunks);
    std::vector<char> loadAndDecompressChunk(const std::string& hash);
};
