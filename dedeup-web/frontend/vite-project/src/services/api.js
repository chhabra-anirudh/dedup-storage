import axios from "axios";

const API_BASE = "http://localhost:5001"; // adjust to your backend URL

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${API_BASE}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function listFiles() {
  const response = await axios.get(`${API_BASE}/files`);
  return response.data; // should return array of file metadata
}

export async function retrieveFile(filename) {
  const response = await axios.get(`${API_BASE}/retrieve/${filename}`, {
    responseType: "blob",
  });
  return response.data;
}

export async function deleteFile(filename) {
  const response = await axios.delete(`${API_BASE}/delete/${filename}`);
  return response.data;
}
