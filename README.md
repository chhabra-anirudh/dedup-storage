# Dedup Storage

A full-stack **data deduplication system** to efficiently store large files by splitting into chunks, compressing, and avoiding duplicate storage. Reduces storage usage by up to **90%** for repeated files.

## Features

- **C++ CLI**: Chunking, SHA-256 hashing, compression, metadata management, and file reconstruction.
- **Node.js / Express Backend**: Bridges CLI operations to the web interface, handles file upload, retrieve, and delete.
- **React Web Interface**: Responsive UI to:
  - Upload and retrieve files
  - Delete files
  - Monitor **real-time storage stats** and deduplication savings
- **Storage Optimization**:
  - View file stats: chunk count, average chunk size, original/compressed sizes, total savings
  - Real-time feedback on storage efficiency

## Tech Stack

- **C++** – CLI for deduplication engine
- **Node.js / Express** – Backend server
- **React** – Frontend UI
- **SHA-256** – For chunk hashing
- **zlib** – For compression
- **HTML/CSS/JS** – Responsive web interface

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/chhabra-anirudh/dedup-storage.git
cd dedup-storage
```

2. **Install backend dependencies**
```bash
cd dedeup-web/backend
npm install
```

3. **Install frontend dependencies**
- Run inside dedup-storage/dedeup-web/frontend/vite-project
```bash
npm install
npm run dev
```

4. **Start backend**
- Run inside dedup-storage/dedeup-web/backend
```bash
node server.js
```

## Usage

- Open the web interface (React app) in your browser.
- Upload files using the File Upload component.
- View file stats and overall storage savings.
- Retrieve or delete files directly from the web interface.
- CLI can also be used directly for advanced workflows:

**CLI Commands**
- Run inside root that is dedup-storage
```bash
./dedup store <filename> <chunk_size>
./dedup list
./dedup retrieve <filename>
./dedup delete <filename>
```
