import React, { useState } from "react";

export default function FileUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5001/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Upload successful!");
        onUploaded();
      } else {
        setMessage("Upload failed!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload failed!");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "1rem",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#1e1e1e",
      padding: "1rem",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      width: "100%",       // full width
      maxWidth: "1000px",  // optional: match table width
      margin: "0 auto"
    }}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        style={{
          flex: "1",
          padding: "6px",
          borderRadius: "4px",
          border: "1px solid #333",
          backgroundColor: "#2a2a2a",
          color: "#fff",
        }}
      />
      <button
        onClick={handleUpload}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4caf50",
          border: "none",
          borderRadius: "4px",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Upload
      </button>
      <span style={{ color: "#ccc", minWidth: "120px" }}>{message}</span>
    </div>
  );
}
