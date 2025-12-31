'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadMultimediaProps {
  photos: File[]; 
  onAddPhoto: (files: File[]) => void;
}

const UploadMultimedia: React.FC<UploadMultimediaProps> = ({
  photos,
  onAddPhoto,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const maxFiles = 5;

  // Sync selected files to parent
  useEffect(() => {
    onAddPhoto(files);
  }, [files, onAddPhoto]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFiles = Array.from(e.dataTransfer.files);
      const imageFiles = droppedFiles
        .filter((file) => file.type.startsWith('image/'))
        .slice(0, maxFiles - files.length);

      setFiles((prev) => [...prev, ...imageFiles].slice(0, maxFiles));
    },
    [files],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    const imageFiles = selectedFiles
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, maxFiles - files.length);

    setFiles((prev) => [...prev, ...imageFiles].slice(0, maxFiles));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 space-y-6">
      {/* Upload Dropzone */}
      <div
        className="relative mb-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 mb-4 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Images only (Maximum {maxFiles} files)
            </p>
          </div>
        </label>
      </div>

      {/* File Previews */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Uploaded Files ({files.length}/{maxFiles})
          </h3>
          {files.length > 0 && (
            <button
              onClick={() => setFiles([])}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UploadMultimedia;
