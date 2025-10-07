const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const os = require('os'); // For detecting platform

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Temporary upload folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Detect OS and architecture, set dedup binary
const cwdRoot = path.resolve(__dirname, '../../');
let dedupCmd;

const platform = os.platform();       // 'win32', 'darwin', 'linux'
const arch = os.arch();               // 'x64', 'ia32', 'arm64', etc.

if (platform === 'win32') {
    if (arch === 'x64') {
        dedupCmd = path.join(cwdRoot, 'executables', 'win-x64', 'dedup.exe');
    } else if (arch === 'ia32') {
        dedupCmd = path.join(cwdRoot, 'executables', 'win-x86', 'dedup.exe');
    } else {
        throw new Error(`Unsupported Windows architecture: ${arch}`);
    }
} else if (platform === 'darwin') {
    if (arch === 'arm64') {
        dedupCmd = path.join(cwdRoot, 'executables', 'mac-arm64', 'dedup');
    } else if (arch === 'x64') {
        dedupCmd = path.join(cwdRoot, 'executables', 'mac-x64', 'dedup'); // optional future build
    } else {
        throw new Error(`Unsupported macOS architecture: ${arch}`);
    }
} else if (platform === 'linux') {
    if (arch === 'x64') {
        dedupCmd = path.join(cwdRoot, 'executables', 'linux-x64', 'dedup');
    } else if (arch === 'ia32') {
        dedupCmd = path.join(cwdRoot, 'executables', 'linux-x86', 'dedup');
    } else if (arch === 'arm64') {
        dedupCmd = path.join(cwdRoot, 'executables', 'linux-arm64', 'dedup');
    } else {
        throw new Error(`Unsupported Linux architecture: ${arch}`);
    }
} else {
    throw new Error(`Unsupported platform: ${platform}`);
}

// ------------------------
// Upload
// ------------------------
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const tempPath = req.file.path;
  const baseName = path.basename(tempPath);

  // Move to project root for CLI metadata
  const storePath = path.join(cwdRoot, baseName);
  fs.renameSync(tempPath, storePath);

  exec(`"${dedupCmd}" store "${baseName}" 4096`, { cwd: cwdRoot }, (err, stdout, stderr) => {
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);

    if (err) {
      console.error('Dedup CLI error:', stderr);
      return res.status(500).json({ success: false, message: 'Dedup storage failed' });
    }
    console.log('Dedup CLI stdout:', stdout);
    return res.json({ success: true, message: 'File stored', filename: baseName });
  });
});

// ------------------------
// List files with stats
// ------------------------
app.get('/files', (req, res) => {
  exec(`"${dedupCmd}" list`, { cwd: cwdRoot }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, message: 'Cannot list files' });

    const files = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
      if (!line.startsWith(' - ')) continue;

      try {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 6) continue;

        const displayName = parts[0].replace(/^-\s*/, '');
        const cliName = displayName;

        const chunks = parseInt(parts[1].split(':')[1].replace(/,/g,'').trim()) || 0;
        const avgChunk = parseFloat(parts[2].split(':')[1].replace('bytes','').trim()) || 0;
        const compressed = parseInt(parts[3].split(':')[1].replace(/,/g,'').replace('bytes','').trim()) || 0;
        const original = parseInt(parts[4].split(':')[1].replace(/,/g,'').replace('bytes','').trim()) || 0;
        const savings = parseFloat(parts[5].split(':')[1].replace('%','').trim()) || 0;

        files.push({ name: cliName, displayName, chunks, avgChunk, compressed, original, savings });
      } catch (parseErr) {
        console.error('Failed to parse line:', line, parseErr);
      }
    }

    res.json({ success: true, files });
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

      // Delete retrieved file after sending
      if (fs.existsSync(tempRetrievedPath)) {
        try {
          fs.unlinkSync(tempRetrievedPath);
          console.log('Deleted temporary retrieved file:', tempRetrievedPath);
        } catch (unlinkErr) {
          console.error('Failed to delete retrieved file:', tempRetrievedPath, unlinkErr);
        }
      }
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
