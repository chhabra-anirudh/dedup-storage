import React, { useEffect, useState } from "react";

export default function FileList({ refreshKey }) {
  const [files, setFiles] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalFiles: 0,
    uniqueChunks: 0,
    totalCompressed: 0,
    totalOriginal: 0,
    totalSavings: 0,
  });

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:5001/files");
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);

        // Compute overall stats
        const totalFiles = data.files.length;
        const uniqueChunks = data.files.reduce((sum, f) => sum + f.chunks, 0);
        const totalCompressed = data.files.reduce((sum, f) => sum + f.compressed, 0);
        const totalOriginal = data.files.reduce((sum, f) => sum + f.original, 0);
        const totalSavings = totalOriginal - totalCompressed;

        setOverallStats({ totalFiles, uniqueChunks, totalCompressed, totalOriginal, totalSavings });
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
        <div><strong>Total Files:</strong> {overallStats.totalFiles}</div>
        <div><strong>Unique Chunks:</strong> {overallStats.uniqueChunks}</div>
        <div><strong>Compressed:</strong> {overallStats.totalCompressed.toLocaleString()} B</div>
        <div><strong>Original:</strong> {overallStats.totalOriginal.toLocaleString()} B</div>
        <div><strong>Total Savings:</strong> {overallStats.totalSavings.toLocaleString()} B</div>
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
              {["File","Chunks","Avg Chunk (B)","Original Size","Compressed Size","Savings (B)","Actions"].map(h => (
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
                  <td style={{ padding: "10px" }}>{f.avgChunk.toFixed(2)}</td>
                  <td style={{ padding: "10px" }}>{f.original.toLocaleString()} B</td>
                  <td style={{ padding: "10px" }}>{f.compressed.toLocaleString()} B</td>
                  <td style={{ padding: "10px", color: savingsColor, fontWeight: "bold" }}>
                    {f.savings.toLocaleString()} B
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
