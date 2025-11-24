import { useState, useCallback } from 'react';
import { parseWPAuditJSON } from '../utils/jsonParser';
import { saveReport, detectFileType } from '../utils/api';
import './common/FileUpload.css';

const FileUpload = ({ onFileParsed, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Read text file (for .txt and .log)
  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const fileType = detectFileType(file.name);
    
    // Validate file type
    if (!fileType && !file.name.endsWith('.json') && !file.name.endsWith('.txt') && !file.name.endsWith('.log')) {
      onError('Please upload a valid WPAudit file (JSON, TXT, or LOG)');
      return;
    }

    setIsLoading(true);
    try {
      let fileData;
      
      if (fileType === 'full_report' || fileType === 'wpscan_json') {
        // Parse JSON files
        if (fileType === 'full_report') {
          fileData = await parseWPAuditJSON(file);
        } else {
          // For wpscan JSON, just parse as regular JSON
          const text = await readTextFile(file);
          fileData = JSON.parse(text);
        }
      } else if (fileType === 'subfinder_txt' || fileType === 'wpscan_log') {
        // Read text files
        fileData = await readTextFile(file);
      } else if (file.name.endsWith('.json')) {
        // Fallback for JSON files without recognized pattern
        fileData = await parseWPAuditJSON(file);
      } else {
        onError('Unsupported file type');
        return;
      }
      
      // Validate fileData was loaded
      if (fileData === null || fileData === undefined) {
        onError(`Failed to load file data for ${file.name}`);
        return;
      }
      
      // Save to database
      try {
        console.log('Saving file:', { 
          name: file.name, 
          type: fileType, 
          dataType: typeof fileData, 
          dataLength: typeof fileData === 'string' ? fileData.length : 'N/A',
          dataPreview: typeof fileData === 'string' 
            ? fileData.substring(0, 200) 
            : (typeof fileData === 'object' ? JSON.stringify(fileData).substring(0, 200) : 'N/A'),
          isNull: fileData === null,
          isUndefined: fileData === undefined
        });
        const result = await saveReport(fileData, file.name);
        console.log('Save result:', result);
        setUploadedFiles(prev => [...prev, { name: file.name, type: fileType }]);
      } catch (saveError) {
        console.error('Failed to save report to database:', saveError);
        
        // Check if it's a duplicate error (starts with ⚠️)
        if (saveError.message && saveError.message.includes('⚠️')) {
          // Show the duplicate message as-is (it's user-friendly)
          onError(saveError.message);
          setIsLoading(false);
          return;
        }
        
        // For other errors, show detailed message
        console.error('Error details:', {
          message: saveError.message,
          stack: saveError.stack,
          file: file.name,
          fileType: fileType,
          dataType: typeof fileData
        });
        const errorMsg = saveError.message || 'Unknown error';
        onError(`Failed to save ${file.name}: ${errorMsg}. Check console for details.`);
        setIsLoading(false);
        return;
      }
      
      // If this is a full_report, trigger onFileParsed for immediate viewing
      if (fileType === 'full_report') {
        onFileParsed(fileData);
      } else {
        // For other file types, show success message
        onError(`✅ ${file.name} saved successfully! View it in "Saved Reports" or upload the FULL_REPORT.json to see all files together.`);
      }
    } catch (error) {
      onError(error.message || 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  }, [onFileParsed, onError]);

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    let duplicateError = null;
    let successCount = 0;
    let failCount = 0;
    
    try {
      const fileArray = Array.from(files);
      let fullReportData = null;

      // Process all files
      for (const file of fileArray) {
        const fileType = detectFileType(file.name);
        
        if (!fileType && !file.name.endsWith('.json') && !file.name.endsWith('.txt') && !file.name.endsWith('.log')) {
          continue; // Skip invalid files
        }

        try {
          let fileData;
          
          if (fileType === 'full_report' || fileType === 'wpscan_json') {
            if (fileType === 'full_report') {
              fileData = await parseWPAuditJSON(file);
              fullReportData = fileData; // Store for onFileParsed
            } else {
              const text = await readTextFile(file);
              fileData = JSON.parse(text);
            }
          } else if (fileType === 'subfinder_txt' || fileType === 'wpscan_log') {
            fileData = await readTextFile(file);
          } else if (file.name.endsWith('.json')) {
            fileData = await parseWPAuditJSON(file);
            if (!fullReportData) fullReportData = fileData;
          } else {
            continue;
          }
          
          // Save to database
          try {
            await saveReport(fileData, file.name);
            setUploadedFiles(prev => [...prev, { name: file.name, type: fileType }]);
            successCount++;
          } catch (saveError) {
            failCount++;
            console.warn(`Failed to save ${file.name}:`, saveError);
            
            // Capture duplicate error message
            if (saveError.message && saveError.message.includes('⚠️') && !duplicateError) {
              duplicateError = saveError.message;
            }
          }
        } catch (error) {
          failCount++;
          console.warn(`Failed to process ${file.name}:`, error);
        }
      }

      // Show results
      if (duplicateError && successCount === 0) {
        // All files failed due to duplicate - show the error message
        onError(duplicateError);
        setIsLoading(false);
        return;
      }

      if (successCount > 0 && fullReportData) {
        // If we have a full report and at least one file was saved, trigger onFileParsed
        onFileParsed(fullReportData);
      } else if (successCount > 0) {
        // Files were uploaded but no full report
        onError(`✅ הועלו בהצלחה ${successCount} קבצים! צפו בהם ב"דוחות שמורים" או העלו את FULL_REPORT.json.`);
      } else if (failCount > 0 && !duplicateError) {
        // All failed but not due to duplicates
        onError(`❌ כל הקבצים נכשלו. בדקו את הקונסול לפרטים.`);
      }
    } catch (error) {
      onError(error.message || 'Failed to process files');
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (files.length === 1) {
        handleFile(files[0]);
      } else {
        handleFiles(files);
      }
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        handleFile(files[0]);
      } else {
        handleFiles(files);
      }
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
            <h3>Upload WPAudit Files</h3>
            <p>Drag and drop your files here (JSON, TXT, LOG), or click to browse</p>
            <p className="upload-hint">You can upload multiple files at once</p>
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-list">
                <p>Uploaded files:</p>
                <ul>
                  {uploadedFiles.map((f, idx) => (
                    <li key={idx}>{f.name} ({f.type || 'unknown'})</li>
                  ))}
                </ul>
              </div>
            )}
            <input
              type="file"
              accept=".json,.txt,.log,application/json,text/plain"
              onChange={handleFileInput}
              className="file-input"
              id="file-input"
              multiple
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

