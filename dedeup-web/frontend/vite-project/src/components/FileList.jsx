import React, { useEffect, useState } from "react";

// Utility: Convert bytes to human-readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
}

export default function FileList({ refreshKey }) {
  const [files, setFiles] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalFiles: 0,
    potentialChunks: 0,
    uniqueChunks: 0,
    dedupRatePercent: 0,
  });

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:5001/files");
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        if (data.overallStats) setOverallStats(data.overallStats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchFiles(); }, [refreshKey]);

  const handleRetrieve = async (filename) => {
    const res = await fetch("http://localhost:5001/retrieve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleDelete = async (filename) => {
    await fetch("http://localhost:5001/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    fetchFiles();
  };

  return (
    <div style={{ width: "100%", padding: "1rem" }}>
      
      {/* Overall Stats Card */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1rem",
        padding: "1rem",
        background: "#1e1e1e",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        color: "#fff"
      }}>
        <div title="Total number of files stored in the system">
          <strong>Total Files:</strong> {overallStats.totalFiles}
        </div>
        <div title="Sum of chunks each file would occupy if no deduplication was done">
          <strong>Potential Chunks:</strong> {overallStats.potentialChunks}
        </div>
        <div title="Actual unique chunks stored in the system after deduplication">
          <strong>Unique Chunks Stored:</strong> {overallStats.uniqueChunks}
        </div>
        <div title="Percentage of chunk storage saved by deduplication">
          <strong>Deduplication Efficiency:</strong> {overallStats.dedupRatePercent} %
        </div>
      </div>

      {/* File Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          minWidth: "800px",
          borderCollapse: "collapse",
          background: "#2a2a2a",
          borderRadius: "8px"
        }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #555" }}>
              {["File","Chunks","Avg Chunk","Original Size","Compressed Size","Savings (%)","Actions"].map(h => (
                <th key={h} style={{ padding: "12px", textAlign: "left", color: "#ccc" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map(f => {
              const savingsColor = f.savings < 0 ? "#f44336" : "#4caf50";
              return (
                <tr key={f.name}
                    style={{
                      borderBottom: "1px solid #444",
                      background: "#2a2a2a",
                      transition: "background 0.3s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#333"}
                    onMouseLeave={e => e.currentTarget.style.background = "#2a2a2a"}>
                  <td style={{ padding: "10px" }}>{f.name}</td>
                  <td style={{ padding: "10px" }}>{f.chunks}</td>
                  <td style={{ padding: "10px" }}>{formatBytes(f.avgChunk)}</td>
                  <td style={{ padding: "10px" }}>{formatBytes(f.original)}</td>
                  <td style={{ padding: "10px" }}>{formatBytes(f.compressed)}</td>
                  <td style={{ padding: "10px", color: savingsColor, fontWeight: "bold" }}>
                    {f.savings.toFixed(2)} %
                  </td>
                  <td style={{ padding: "10px", display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleRetrieve(f.name)} style={{
                      padding: "6px 12px", background: "#4caf50", border: "none",
                      borderRadius: "4px", color: "#fff", cursor: "pointer"
                    }}>Retrieve</button>
                    <button onClick={() => handleDelete(f.name)} style={{
                      padding: "6px 12px", background: "#f44336", border: "none",
                      borderRadius: "4px", color: "#fff", cursor: "pointer"
                    }}>Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          table { min-width: 600px; }
        }

        @media (max-width: 500px) {
          table { min-width: 400px; }
          td, th { padding: 6px; font-size: 0.85rem; }
        }
      `}</style>
    </div>
  );
}
