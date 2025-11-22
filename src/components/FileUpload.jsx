import { useState, useCallback } from 'react';
import { parseWPAuditJSON } from '../utils/jsonParser';
import { saveReport } from '../utils/api';
import './common/FileUpload.css';

const FileUpload = ({ onFileParsed, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      onError('Please upload a valid JSON file');
      return;
    }

    setIsLoading(true);
    try {
      const jsonData = await parseWPAuditJSON(file);
      
      // Save to database
      try {
        await saveReport(jsonData);
      } catch (saveError) {
        console.warn('Failed to save report to database:', saveError);
        // Continue even if save fails - user can still view the report
      }
      
      onFileParsed(jsonData);
    } catch (error) {
      onError(error.message || 'Failed to parse JSON file');
    } finally {
      setIsLoading(false);
    }
  }, [onFileParsed, onError]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Parsing JSON file...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <h3>Upload WPAudit JSON Report</h3>
            <p>Drag and drop your JSON file here, or click to browse</p>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileInput}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="browse-button">
              Browse Files
            </label>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;

