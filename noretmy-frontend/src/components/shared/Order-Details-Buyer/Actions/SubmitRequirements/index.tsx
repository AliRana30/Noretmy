import React, { useState } from 'react';
import { File, X } from 'lucide-react';

interface SubmitRequirementsProps {
  onSubmit: (requirements: string, files: File[]) => void;
  onClose: () => void;
}

const SubmitRequirements: React.FC<SubmitRequirementsProps> = ({
  onSubmit,
  onClose,
}) => {
  const [requirements, setRequirements] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  const handleSubmit = () => {
    if (requirements.trim()) {
      onSubmit(requirements, files);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'text-red-500';
      case 'doc':
      case 'docx':
        return 'text-blue-500';
      case 'xls':
      case 'xlsx':
        return 'text-orange-500';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="mt-6 p-6">
      <textarea
        placeholder="Describe your requirements clearly..."
        className="w-full p-3 border border-black rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-black"
        rows={6}
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
      />

      {/* File Upload */}
      <div className="mb-4">
        <label 
          htmlFor="file-upload" 
          className="block w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-black transition-all"
        >
          <span className="text-gray-600">+ Upload Files</span>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center border rounded-lg p-2 relative"
              >
                <File className={`w-8 h-8 mr-2 ${getFileIcon(file.name)}`} />
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button 
                  onClick={() => removeFile(file)}
                  className="absolute top-1 right-1 text-red-500 hover:bg-red-100 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!requirements.trim()}
          className="bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default SubmitRequirements;