import { useState } from 'react';
import FileUpload from './components/FileUpload';
import ReportViewer from './components/ReportViewer';
import ReportsList from './components/ReportsList';
import ReportCompare from './components/ReportCompare';
import { getReport } from './utils/api';
import './styles/App.css';

function App() {
  const [view, setView] = useState('upload'); // 'upload', 'list', 'view', 'compare'
  const [reportData, setReportData] = useState(null);
  const [compareIds, setCompareIds] = useState(null);
  const [error, setError] = useState(null);

  const handleFileParsed = (data) => {
    setReportData(data);
    setView('view');
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setReportData(null);
  };

  const handleSelectReport = async (id) => {
    try {
      const data = await getReport(id);
      setReportData(data);
      setView('view');
      setError(null);
    } catch (err) {
      setError('Failed to load report: ' + err.message);
    }
  };

  const handleCompareReports = (ids) => {
    setCompareIds(ids);
    setView('compare');
  };

  const handleBackToList = () => {
    setView('list');
    setReportData(null);
    setCompareIds(null);
  };

  const handleBackToUpload = () => {
    setView('upload');
    setReportData(null);
    setCompareIds(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>WPAudit JSON Viewer</h1>
        <p>Upload and analyze your WordPress security audit reports</p>
        <nav className="app-nav">
          <button
            onClick={handleBackToUpload}
            className={view === 'upload' ? 'nav-active' : ''}
          >
            Upload
          </button>
          <button
            onClick={handleBackToList}
            className={view === 'list' ? 'nav-active' : ''}
          >
            Saved Reports
          </button>
        </nav>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-reset">Dismiss</button>
          </div>
        )}

        {view === 'upload' && (
          <FileUpload onFileParsed={handleFileParsed} onError={handleError} />
        )}

        {view === 'list' && (
          <ReportsList
            onSelectReport={handleSelectReport}
            onCompareReports={handleCompareReports}
          />
        )}

        {view === 'view' && reportData && (
          <div className="report-container">
            <button onClick={handleBackToList} className="reset-button">
              Back to List
            </button>
            <ReportViewer data={reportData} />
          </div>
        )}

        {view === 'compare' && compareIds && (
          <ReportCompare
            reportIds={compareIds}
            onClose={handleBackToList}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>WPAudit JSON Viewer - Security Report Analysis Tool</p>
      </footer>
    </div>
  );
}

export default App;

