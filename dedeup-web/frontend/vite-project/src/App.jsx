import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";

export default function App() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div style={{
      width: "100vw",
      minHeight: "100vh",
      backgroundColor: "#121212",
      color: "#fff",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "2rem",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start"
    }}>
      <h1 style={{
        textAlign: "center",
        width: "100%",
        color: "#4caf50",
        marginBottom: "1rem"
      }}>
        Dedup Storage
      </h1>

      {/* Explanatory note */}
      <div style={{
        width: "90%",
        maxWidth: "800px",
        backgroundColor: "#1f1f1f",
        padding: "1.5rem 2rem",
        borderRadius: "12px",
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        color: "#ccc",
        fontSize: "0.92rem",
        lineHeight: "1.6",
        border: "1px solid #2a2a2a"
      }}>
        <h2 style={{ color: "#4caf50", marginBottom: "0.8rem" }}>How Dedup Storage Works</h2>
        <p>
          Dedup Storage intelligently saves space by avoiding storing duplicate parts of files. 
          When you upload files, each file is broken into <strong>chunks</strong> — small pieces of data. 
          The system checks if a chunk already exists and only stores new, unique chunks.
        </p>
        <p>
          <strong>Why it matters:</strong> If you upload two or more files that share the same content, 
          the duplicate chunks are not stored twice. This means you can save storage without even noticing it!
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.8rem" }}>
          <li><strong>Total Files</strong> → Number of files stored in the system.</li>
          <li><strong>Potential Chunks</strong> → Total chunks if all files were stored fully, with no deduplication.</li>
          <li><strong>Unique Chunks Stored</strong> → Actual unique chunks stored after deduplication.</li>
          <li><strong>Deduplication Efficiency</strong> → Percentage of storage saved thanks to deduplication.</li>
        </ul>
        <p style={{ marginTop: "0.8rem", fontStyle: "italic", color: "#aaa" }}>
          Tip: Upload files with shared content and watch how deduplication saves space automatically!
        </p>
      </div>


      {/* File upload section */}
      <FileUpload onUploaded={() => setRefresh(!refresh)} />

      {/* File list and stats */}
      <div style={{ width: "95%", marginTop: "2rem" }}>
        <FileList key={refresh} />
      </div>

      {/* Footer */}
      <div style={{
        width: "100%",
        textAlign: "center",
        marginTop: "3rem",
        padding: "1rem 0",
        borderTop: "1px solid #2a2a2a",
        color: "#888",
        fontSize: "0.85rem"
      }}>
        Built by <strong>Anirudh Chhabra</strong> &mdash; 
        <a href="mailto:anirudhbuilds@gmail.com" style={{ color: "#4caf50", textDecoration: "none", margin: "0 0.3rem" }}>Email</a> | 
        <a href="https://github.com/chhabra-anirudh" target="_blank" rel="noopener noreferrer" style={{ color: "#4caf50", textDecoration: "none", margin: "0 0.3rem" }}>GitHub</a> | 
        <a href="https://www.linkedin.com/in/anirudh-chhabra-cs/" target="_blank" rel="noopener noreferrer" style={{ color: "#4caf50", textDecoration: "none", margin: "0 0.3rem" }}>LinkedIn</a>
      </div>
    </div>
  );
}
