import { getCurrentUserToken } from './authService';

const API_BASE_URL = process.env.REACT_APP_FUNCTIONS_URL || 'http://localhost:5001/mediation-scheduling-simple/us-central1';

/**
 * Make authenticated API request
 */
const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const token = await getCurrentUserToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get upload URL for PDF file
 */
export const getUploadUrl = async (caseId, fileName, fileType) => {
  try {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/getUploadUrl?caseId=${caseId}&fileName=${encodeURIComponent(fileName)}&fileType=${fileType}`
    );
    return response;
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
};

/**
 * Upload file to signed URL
 */
export const uploadFileToSignedUrl = async (signedUrl, file, onProgress) => {
  try {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        });
      }
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            status: xhr.status,
            statusText: xhr.statusText
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });
      
      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.send(file);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Process uploaded file and get download URL
 */
export const processUploadedFile = async (filePath, caseId) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/processUploadedFile`, {
      method: 'POST',
      body: JSON.stringify({ filePath, caseId })
    });
    return response;
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    throw error;
  }
};

/**
 * Delete a file
 */
export const deleteFile = async (filePath, caseId) => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/deleteFile`, {
      method: 'POST',
      body: JSON.stringify({ filePath, caseId })
    });
    return response;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get file information
 */
export const getFileInfo = async (filePath, caseId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/getFileInfo?filePath=${encodeURIComponent(filePath)}&caseId=${caseId}`
    );
    return response;
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
};

/**
 * Complete file upload process
 */
export const uploadPDFFile = async (file, caseId, onProgress) => {
  try {
    // Validate file
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Step 1: Get upload URL
    const uploadUrlResponse = await getUploadUrl(caseId, file.name, file.type);
    
    // Step 2: Upload file to signed URL
    await uploadFileToSignedUrl(uploadUrlResponse.signedUrl, file, onProgress);
    
    // Step 3: Process uploaded file
    const processedFile = await processUploadedFile(uploadUrlResponse.filePath, caseId);
    
    return {
      success: true,
      filePath: processedFile.filePath,
      fileName: processedFile.fileName,
      downloadUrl: processedFile.downloadUrl,
      fileSize: processedFile.fileSize,
      uploadedAt: processedFile.uploadedAt
    };
  } catch (error) {
    console.error('Error in complete upload process:', error);
    throw error;
  }
};

/**
 * Validate PDF file
 */
export const validatePDFFile = (file) => {
  const errors = [];
  
  // Check file type
  if (file.type !== 'application/pdf') {
    errors.push('Only PDF files are allowed');
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatFileSize(maxSize)}`);
  }
  
  // Check file name
  if (!file.name || file.name.trim() === '') {
    errors.push('File must have a name');
  }
  
  // Check for valid file extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.push('File must have a .pdf extension');
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.join(', '),
    errors
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Generate safe filename
 */
export const generateSafeFilename = (filename) => {
  // Remove or replace unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * Check if file is PDF
 */
export const isPDFFile = (file) => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Create file preview data
 */
export const createFilePreview = (file) => {
  return {
    name: file.name,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    type: file.type,
    lastModified: file.lastModified,
    lastModifiedFormatted: new Date(file.lastModified).toLocaleString(),
    isPDF: isPDFFile(file),
    isValid: validatePDFFile(file).isValid,
    validationErrors: validatePDFFile(file).errors
  };
};

/**
 * Download file from URL
 */
export const downloadFile = (url, filename) => {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download.pdf';
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};

/**
 * Open file in new tab
 */
export const openFileInNewTab = (url) => {
  try {
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
};

/**
 * Get file upload progress message
 */
export const getUploadProgressMessage = (progress) => {
  if (progress < 25) {
    return 'Starting upload...';
  } else if (progress < 50) {
    return 'Uploading...';
  } else if (progress < 75) {
    return 'Almost there...';
  } else if (progress < 100) {
    return 'Finalizing...';
  } else {
    return 'Upload complete!';
  }
};

/**
 * Handle file upload errors
 */
export const handleFileUploadError = (error) => {
  console.error('File upload error:', error);
  
  if (error.message.includes('Unauthorized')) {
    return 'You are not authorized to upload files. Please log in again.';
  } else if (error.message.includes('File too large')) {
    return 'File is too large. Maximum size is 10MB.';
  } else if (error.message.includes('Invalid file type')) {
    return 'Only PDF files are allowed.';
  } else if (error.message.includes('Network error')) {
    return 'Network error. Please check your connection and try again.';
  } else {
    return error.message || 'An error occurred while uploading the file.';
  }
};