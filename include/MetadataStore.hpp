#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <nlohmann/json.hpp>
#include "DedupEngine.hpp"


class MetadataStore {
private:
    std::unordered_map<std::string, std::vector<std::string>> fileToChunks;
    std::string metadataFile = "metadata.json";
public:
    void addFile(const std::string& filePath, const std::vector<std::string>& chunkHashes);
    std::vector<std::string> getChunks(const std::string& filePath);
    void saveMetadata();
    void loadMetadata();
    void removeFile(const std::string& filePath);
    std::unordered_map<std::string, int> chunkRefCount; // Tracks how many files use each chunk
    // Update listFiles to accept DedupEngine reference
    void listFiles(DedupEngine& de);
};
