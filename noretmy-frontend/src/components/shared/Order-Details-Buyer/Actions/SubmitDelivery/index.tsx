import { useState } from 'react';
import { FaTimes, FaUpload } from 'react-icons/fa';

interface SubmitDeliveryProps {
  onSubmit: (deliveryNote: string, files: File[]) => void;
  onClose: () => void;
}

const SubmitDelivery: React.FC<SubmitDeliveryProps> = ({
  onSubmit,
  onClose,
}) => {
  const [deliveryNote, setDeliveryNote] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const uploadedFiles = Array.from(event.target.files);
      setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (deliveryNote.trim() || files.length > 0) {
      onSubmit(deliveryNote, files);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Submit Delivery
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Delivery Note */}
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-gray-600"
          placeholder="Describe your delivery details..."
          rows={4}
          value={deliveryNote}
          onChange={(e) => setDeliveryNote(e.target.value)}
        />

        {/* File Upload */}
        <div className="mb-4">
          <label className="cursor-pointer flex items-center gap-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-all">
            <FaUpload />
            <span>Upload File</span>
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Display Uploaded Files */}
        {files.length > 0 && (
          <div className="mb-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-100 p-2 rounded-lg mb-2"
              >
                <span className="text-sm truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`py-2 px-4 rounded-lg transition-all ${
              deliveryNote.trim() || files.length > 0
                ? 'bg-gray-800 text-white hover:bg-gray-900'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            disabled={!deliveryNote.trim() && files.length === 0}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitDelivery;
