import React, { useState } from 'react';

const FileUpload = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf')) {
      setFile(selectedFile);
    } else {
      alert('Hanya file gambar atau PDF yang diizinkan');
    }
  };

  const handleSubmit = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileUpload({
          name: file.name,
          type: file.type,
          data: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="file-upload">
      <input type="file" accept="image/*,application/pdf" onChange={handleChange} />
      <button onClick={handleSubmit} disabled={!file}>
        Proses Faktur
      </button>
    </div>
  );
};

export default FileUpload;