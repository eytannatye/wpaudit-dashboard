import { useState, useEffect } from 'react';
import { getReports, deleteReport, getHostnames, getReport } from '../utils/api';
import { formatDate } from '../utils/dataFormatters';
import './ReportsList.css';

const ReportsList = ({ onSelectReport, onCompareReports }) => {
  const [reports, setReports] = useState([]);
  const [hostnames, setHostnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    hostname: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    loadReports();
    loadHostnames();
  }, [filters, pagination.page]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await getReports({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setReports(response.reports);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHostnames = async () => {
    try {
      const response = await getHostnames();
      setHostnames(response.hostnames);
    } catch (err) {
      console.error('Failed to load hostnames:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteReport(id);
      loadReports();
      if (selectedReports.includes(id)) {
        setSelectedReports(selectedReports.filter(rid => rid !== id));
      }
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  const handleSelectReport = (id) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(rid => rid !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  const handleCompare = () => {
    if (selectedReports.length < 2) {
      alert('Please select at least 2 reports to compare');
      return;
    }
    onCompareReports(selectedReports);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="reports-list">
      <div className="reports-header">
        <h2>Saved Reports</h2>
        <div className="reports-actions">
          {selectedReports.length >= 2 && (
            <button onClick={handleCompare} className="btn-compare">
              Compare {selectedReports.length} Reports
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by URL or hostname..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={filters.hostname}
            onChange={(e) => handleFilterChange('hostname', e.target.value)}
            className="filter-select"
          >
            <option value="">All Hostnames</option>
            {hostnames.map(hostname => (
              <option key={hostname} value={hostname}>{hostname}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="filter-select"
          >
            <option value="created_at">Sort by Date</option>
            <option value="scan_date">Sort by Scan Date</option>
            <option value="target_url">Sort by URL</option>
            <option value="critical_alerts_count">Sort by Alerts</option>
            <option value="vulnerabilities_count">Sort by Vulnerabilities</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="filter-select"
          >
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <p>No reports found. Upload a report to get started.</p>
        </div>
      ) : (
        <>
          <div className="reports-grid">
            {reports.map(report => (
              <div
                key={report.id}
                className={`report-card ${selectedReports.includes(report.id) ? 'selected' : ''}`}
                onClick={() => handleSelectReport(report.id)}
              >
                <div className="report-card-header">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => handleSelectReport(report.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    className="btn-delete"
                    title="Delete report"
                  >
                    ×
                  </button>
                </div>
                <div className="report-card-body" onClick={() => onSelectReport(report.id)}>
                  <h3>{report.target_url || 'Unknown URL'}</h3>
                  <div className="report-meta">
                    <div className="meta-item">
                      <span className="meta-label">Hostname:</span>
                      <span className="meta-value">{report.hostname || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Scan Date:</span>
                      <span className="meta-value">{formatDate(report.scan_date)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Created:</span>
                      <span className="meta-value">{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                  <div className="report-stats">
                    <div className="stat-item stat-alerts">
                      <span className="stat-value">{report.critical_alerts_count || 0}</span>
                      <span className="stat-label">Alerts</span>
                    </div>
                    <div className="stat-item stat-vulns">
                      <span className="stat-value">{report.vulnerabilities_count || 0}</span>
                      <span className="stat-label">Vulnerabilities</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="page-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="page-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsList;

