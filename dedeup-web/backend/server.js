const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Upload folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Determine dedup CLI
const cwdRoot = path.resolve(__dirname, '../../');
let dedupCmd;
const platform = os.platform();
const arch = os.arch();

if (platform === 'win32') {
  dedupCmd = arch === 'x64' ? path.join(cwdRoot, 'executables', 'win-x64', 'dedup.exe') : path.join(cwdRoot, 'executables', 'win-x86', 'dedup.exe');
} else if (platform === 'darwin') {
  dedupCmd = arch === 'arm64' ? path.join(cwdRoot, 'executables', 'mac-arm64', 'dedup') : path.join(cwdRoot, 'executables', 'mac-x64', 'dedup');
} else if (platform === 'linux') {
  dedupCmd = arch === 'x64' ? path.join(cwdRoot, 'executables', 'linux', 'dedup-x64') : path.join(cwdRoot, 'executables', 'linux', 'dedup-x86');
} else {
  throw new Error(`Unsupported platform/arch: ${platform} ${arch}`);
}

// ------------------------
// Upload
// ------------------------
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const tempPath = req.file.path;
  const baseName = path.basename(tempPath);
  const storePath = path.join(cwdRoot, baseName);
  fs.renameSync(tempPath, storePath);

  exec(`"${dedupCmd}" store "${baseName}" 4096`, { cwd: cwdRoot }, (err, stdout, stderr) => {
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
    if (err) {
      console.error('Dedup CLI error:', stderr);
      return res.status(500).json({ success: false, message: 'Dedup storage failed' });
    }
    console.log(stdout);
    return res.json({ success: true, message: 'File stored', filename: baseName });
  });
});

// ------------------------
// List files with stats
// ------------------------
app.get('/files', (req, res) => {
  exec(`"${dedupCmd}" list`, { cwd: cwdRoot }, (err, stdout, stderr) => {
    if (err) {
      console.error('Dedup CLI list error:', stderr);
      return res.status(500).json({ success: false, message: 'Cannot list files' });
    }

    const files = [];
    let totalFiles = 0;
    let potentialChunks = 0;   // total chunks if no deduplication
    let uniqueChunks = 0;      // actual unique chunks stored

    const lines = stdout.split('\n');
    let parsingOverall = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('Overall stats:')) {
        parsingOverall = true;
        continue;
      }

      if (!parsingOverall && line.startsWith('- ')) {
        // Parse individual file line
        try {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length < 6) continue;

          const displayName = parts[0].replace(/^-\s*/, '');
          const chunks = parseInt(parts[1].split(':')[1].replace(/,/g, '').trim()) || 0;
          const avgChunk = parseFloat(parts[2].split(':')[1].replace('bytes','').trim()) || 0;
          const compressed = parseInt(parts[3].split(':')[1].replace(/,/g,'').replace('bytes','').trim()) || 0;
          const original = parseInt(parts[4].split(':')[1].replace(/,/g,'').replace('bytes','').trim()) || 0;
          const savings = parseFloat(parts[5].split(':')[1].replace('%','').trim()) || 0;

          files.push({ name: displayName, displayName, chunks, avgChunk, compressed, original, savings });

          totalFiles += 1;
          potentialChunks += chunks; // sum of all file chunks (as if stored fully)
        } catch (parseErr) {
          console.error('Failed to parse line:', line, parseErr);
        }
      }

      if (parsingOverall && line.toLowerCase().includes('unique chunks:')) {
        // Use CLI-reported unique chunks
        const match = line.match(/Unique chunks:\s*([\d,]+)/i);
        if (match) uniqueChunks = parseInt(match[1].replace(/,/g, ''));
      }
    }

    // Deduplication efficiency in %
    const dedupRatePercent = potentialChunks > 0
      ? ((potentialChunks - uniqueChunks) / potentialChunks * 100).toFixed(2)
      : 0;

    const overallStats = {
      totalFiles,
      potentialChunks,
      uniqueChunks,
      dedupRatePercent
    };

    res.json({ success: true, files, overallStats });
  });
});

// ------------------------
// Retrieve
// ------------------------
app.post('/retrieve', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ success: false, message: 'Filename missing' });

  const tempRetrievedPath = path.join(cwdRoot, 'retrieved_' + filename);

  exec(`"${dedupCmd}" retrieve "${filename}"`, { cwd: cwdRoot }, (err, stdout, stderr) => {
    if (err) {
      console.error('Dedup CLI retrieve error:', stderr);
      return res.status(500).json({ success: false, message: 'Retrieve failed' });
    }

    if (!fs.existsSync(tempRetrievedPath)) {
      console.error('Retrieved file not found:', tempRetrievedPath);
      return res.status(500).json({ success: false, message: 'File not found after retrieval' });
    }

    res.download(tempRetrievedPath, filename, (err) => {
      if (err) console.error('Error sending file:', err);
      if (fs.existsSync(tempRetrievedPath)) fs.unlinkSync(tempRetrievedPath);
    });
  });
});

// ------------------------
// Delete
// ------------------------
app.post('/delete', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ success: false, message: 'Filename missing' });

  exec(`"${dedupCmd}" delete "${filename}"`, { cwd: cwdRoot }, (err, stdout, stderr) => {
    if (err) {
      console.error('Dedup CLI delete error:', stderr);
      return res.status(500).json({ success: false, message: 'Delete failed' });
    }
    return res.json({ success: true, message: 'File deleted successfully' });
  });
});

// ------------------------
app.listen(PORT, () => console.log(`Dedup backend running at http://localhost:${PORT}`));
