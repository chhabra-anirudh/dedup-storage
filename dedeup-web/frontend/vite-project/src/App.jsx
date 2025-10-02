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
        marginBottom: "2rem"
      }}>
        Dedup Storage
      </h1>

      {/* File upload section */}
      <FileUpload onUploaded={() => setRefresh(!refresh)} />

      {/* File list and stats */}
      <div style={{ width: "95%", marginTop: "2rem" }}>
        <FileList key={refresh} />
      </div>
    </div>
  );
}
