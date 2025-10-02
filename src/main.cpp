#include "FileManager.hpp"
#include "DedupEngine.hpp"
#include "MetadataStore.hpp"
#include <iostream>

using namespace std;

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cout << "Usage:\n"
             << "  ./dedup store <file>\n"
             << "  ./dedup retrieve <file>\n"
             << "  ./dedup delete <file>\n"
             << "  ./dedup list\n";
        return 1;
    }

    string command = argv[1];
    string filePath = (argc >= 3) ? argv[2] : "";

    FileManager fm;
    DedupEngine de;
    MetadataStore ms;
    ms.loadMetadata();

    if (command == "store") {
        if (filePath.empty()) {
            cerr << "Error: Please provide a file to store.\n";
            return 1;
        }

        size_t chunkSize = 4096; // default 4 KB
        if (argc >= 4) {
            try {
                chunkSize = stoul(argv[3]);
            } catch (...) {
                cerr << "Invalid chunk size provided. Using default 4096 bytes.\n";
            }
        }

        auto chunks = fm.chunkFile(filePath, chunkSize);
        if (chunks.empty()) {
            cerr << "Error: Failed to read or chunk file." << endl;
            return 1;
        }

        auto hashes = de.storeChunks(chunks);
        ms.addFile(filePath, hashes);
        ms.saveMetadata();
        cout << "Stored file with deduplication: " << filePath 
            << " | Chunk size: " << chunkSize << " bytes" << endl;
    }
    else if (command == "retrieve") {
        if (filePath.empty()) {
            cerr << "Error: Please provide a file to retrieve.\n";
            return 1;
        }
        auto hashes = ms.getChunks(filePath);
        if (hashes.empty()) {
            cerr << "Error: File not found in metadata: " << filePath << endl;
            return 1;
        }
        fm.reconstructFile("retrieved_" + filePath, hashes, de);
    }

    else if (command == "delete") {
        if (filePath.empty()) {
            cerr << "Error: Please provide a file to delete.\n";
            return 1;
        }
        ms.removeFile(filePath);
    }
    else if (command == "list") {
        ms.listFiles(de);
    }
    else {
        cerr << "Unknown command: " << command << endl;
        cout << "Usage:\n"
             << "  ./dedup store <file>\n"
             << "  ./dedup retrieve <file>\n"
             << "  ./dedup delete <file>\n"
             << "  ./dedup list\n";
        return 1;
    }

    return 0;
}
