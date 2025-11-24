import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from './FileUpload';
import ReportViewer from './ReportViewer';
import ReportsList from './ReportsList';
import ReportCompare from './ReportCompare';
import Dashboard from './dashboard/Dashboard';
import { getReport, getReportFiles } from '../utils/api';
import '../styles/App.css';

function MainApp() {
  const { currentUser, logout } = useAuth();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'upload', 'list', 'view', 'compare'
  const [reportData, setReportData] = useState(null);
  const [reportFiles, setReportFiles] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [compareIds, setCompareIds] = useState(null);
  const [error, setError] = useState(null);

  const handleFileParsed = (data) => {
    setReportData(data);
    setReportFiles({ full_report: data });
    setReportId(null);
    setView('view');
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setReportData(null);
    setReportFiles(null);
  };

  const handleSelectReport = async (id) => {
    try {
      // Get all files for this report
      const filesInfo = await getReportFiles(id);
      const files = {};
      
      // Load each available file
      for (const fileType of filesInfo.availableFiles || []) {
        try {
          const result = await getReport(id, fileType);
          files[fileType] = result.data;
        } catch (err) {
          console.warn(`Failed to load ${fileType}:`, err);
        }
      }
      
      // Set full_report as default data for backward compatibility
      setReportData(files.full_report || null);
      setReportFiles(files);
      setReportId(id);
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
    setReportFiles(null);
    setReportId(null);
    setCompareIds(null);
  };

  const handleBackToUpload = () => {
    setView('upload');
    setReportData(null);
    setReportFiles(null);
    setReportId(null);
    setCompareIds(null);
    setError(null);
  };

  const handleDashboardSelect = async (idOrAction) => {
    if (idOrAction === 'list') {
      setView('list');
    } else {
      // Clear previous state before loading new report
      setReportData(null);
      setReportFiles(null);
      setReportId(null);
      setError(null);
      await handleSelectReport(idOrAction);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>WPAudit Dashboard</h1>
            <p>WordPress Security Audit Reports</p>
          </div>
          <div className="header-user">
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <nav className="app-nav">
          <button
            onClick={() => setView('dashboard')}
            className={view === 'dashboard' ? 'nav-active' : ''}
          >
            Dashboard
          </button>
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

        {view === 'dashboard' && (
          <Dashboard onSelectReport={handleDashboardSelect} />
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

        {view === 'view' && (reportData || reportFiles) && (
          <div className="report-container">
            <button onClick={handleBackToList} className="reset-button">
              Back to List
            </button>
            <ReportViewer data={reportData} files={reportFiles} reportId={reportId} />
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
        <p>WPAudit Dashboard - Secure Security Report Analysis</p>
      </footer>
    </div>
  );
}

export default MainApp;

