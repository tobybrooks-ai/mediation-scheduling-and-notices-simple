import React, { useState, useRef } from 'react';

const PDFUpload = ({ 
  onFileSelect, 
  onFileRemove, 
  currentFile = null, 
  loading = false, 
  error = null,
  maxSizeBytes = 10 * 1024 * 1024 // 10MB default
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const errors = [];

    // Check file type
    if (file.type !== 'application/pdf') {
      errors.push('Only PDF files are allowed');
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      errors.push(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push('File name is too long');
    }

    return errors;
  };

  const handleFileSelect = (file) => {
    const validationErrors = validateFile(file);
    
    if (validationErrors.length > 0) {
      onFileSelect(null, validationErrors[0]);
      return;
    }

    onFileSelect(file, null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    return (
      <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  };

  if (currentFile) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getFileIcon()}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {currentFile.name || 'Uploaded PDF'}
              </h3>
              <p className="text-sm text-gray-600">
                {currentFile.size ? formatFileSize(currentFile.size) : 'PDF Document'}
              </p>
              {currentFile.uploadedAt && (
                <p className="text-xs text-gray-500">
                  Uploaded: {new Date(currentFile.uploadedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentFile.url && (
              <a
                href={currentFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Preview
              </a>
            )}
            
            <button
              onClick={handleButtonClick}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Replace
            </button>
            
            <button
              onClick={handleRemoveFile}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Remove
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {loading ? 'Uploading PDF...' : 'Upload Mediation Notice PDF'}
            </h3>
            
            {!loading && (
              <>
                <p className="text-gray-600 mb-4">
                  Drag and drop your PDF file here, or click to browse
                </p>
                
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Choose PDF File
                </button>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="max-w-xs mx-auto">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {uploadProgress}% complete
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Requirements */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">File Requirements:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• PDF format only</li>
          <li>• Maximum file size: {Math.round(maxSizeBytes / (1024 * 1024))}MB</li>
          <li>• File will be attached to email notifications</li>
          <li>• Ensure the document contains all necessary mediation details</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-sm mr-2">⚠️</div>
            <div>
              <h4 className="text-red-800 font-medium text-sm">Upload Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};

export default PDFUpload;