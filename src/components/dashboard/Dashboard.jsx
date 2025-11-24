import { useState, useEffect } from 'react';
import { getReports } from '../../utils/api';
import './Dashboard.css';

const Dashboard = ({ onSelectReport }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getReports({ page: 1, limit: 50 });
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="dashboard-empty">
        <h2>No Reports</h2>
        <p>Upload your first WPAudit report to get started</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Reports</h1>
          <p className="dashboard-subtitle">{reports.length} {reports.length === 1 ? 'report' : 'reports'}</p>
        </div>

        <div className="reports-list">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="report-row"
              onClick={() => onSelectReport && onSelectReport(report.id)}
            >
              <div className="report-name">
                {report.hostname || report.target_url || 'Unknown'}
              </div>
              <div className="report-meta">
                <span className="report-date">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
                {report.vulnerabilities_count > 0 && (
                  <span className="report-vulns">
                    {report.vulnerabilities_count} vuln{report.vulnerabilities_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
