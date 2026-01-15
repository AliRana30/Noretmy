'use client';
import axios from 'axios';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const DocumentUpload = () => {
  const [files, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const documentStatus = useSelector((state: any) => state.auth.user?.documentStatus || 'none');

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!acceptedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF, JPEG, or PNG file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should not exceed 5MB.');
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!files) {
      return;
    }

    setLoading(true);
    setStatus('Uploading document...');

    try {
      const formData = new FormData();
      formData.append('images', files); // this key MUST match the field name in multer

      const response = await axios.post(`${BACKEND_URL}/api/upload/verify`,
        formData
        , {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      if (!response) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = response.data;
      setStatus('Document uploaded successfully!');
      setFile(null);

    } catch (error) {
      setError(`Failed to upload document: ${error}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    setStatus('');
  };

  const renderContent = () => {
    switch (documentStatus) {
      case 'none':
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Document Verification</h2>
            <p className="text-gray-600 mb-6">
              Please upload a verification document. Maximum 1 file allowed.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                {!files ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          ></path>
                        </svg>
                        <span className="text-gray-600 mb-1">
                          Drag and drop or click to upload
                        </span>
                        <span className="text-gray-500 text-sm">
                          PDF, JPEG, or PNG (max 5MB)
                        </span>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="w-8 h-8 text-blue-500 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                        <div>
                          <p className="font-medium truncate max-w-xs">{files.name}</p>
                          <p className="text-gray-500 text-sm">
                            {(files.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              {status && (
                <div className="mb-4 p-2 bg-blue-50 text-blue-600 rounded-md text-sm">
                  {status}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
                disabled={!files || loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Upload Document'
                )}
              </button>
            </form>
          </>
        );

      case 'pending':
        return (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-yellow-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h2 className="text-xl font-semibold mb-2">Document Under Review</h2>
              <p className="text-gray-600">
                Your verification document has been submitted and is currently being reviewed.
                This process typically takes 1-2 business days.
              </p>
            </div>
          </div>
        );

      case 'approved':
        return (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-orange-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h2 className="text-xl font-semibold mb-2">Document Approved</h2>
              <p className="text-gray-600">
                Your verification document has been approved. You now have full access to all features.
              </p>
            </div>
          </div>
        );

      case 'rejected':
        return (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h2 className="text-xl font-semibold mb-2">Document Rejected</h2>
              <p className="text-gray-600 mb-4">
                Your verification document was rejected. Please upload a new document that meets our requirements.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
              >
                Upload New Document
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <p className="text-gray-600">
              Please log in to access document verification.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md my-6">
      {renderContent()}
    </div>
  );
};

export default DocumentUpload;