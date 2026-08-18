import React, { useRef, useState } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ImageUploader = ({ 
  onUpload, 
  accept = 'image/*',
  multiple = false,
  maxSize = 5, // MB
  label = 'Upload Gambar'
}) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validasi ukuran
    const validFiles = selectedFiles.filter(file => {
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > maxSize) {
        toast.error(`${file.name} melebihi ${maxSize}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setFiles(validFiles);
    
    // Generate preview
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(previews);

    if (onUpload) {
      setLoading(true);
      onUpload(validFiles)
        .then(() => {
          toast.success('Upload berhasil!');
        })
        .catch((error) => {
          toast.error(error.message || 'Upload gagal');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    URL.revokeObjectURL(previews[index]);
  };

  const handleClearAll = () => {
    setFiles([]);
    setPreviews([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const event = { target: { files: droppedFiles } };
      handleFileChange(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="w-full">
      {files.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition"
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
          <FiImage size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">{label}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Drag & drop atau klik untuk pilih
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Maks {maxSize}MB per file
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <FiX size={12} />
                </button>
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition"
            >
              <FiUpload size={14} />
              Tambah Lagi
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Hapus Semua
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;