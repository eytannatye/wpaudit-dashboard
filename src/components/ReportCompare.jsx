import { useState, useEffect } from 'react';
import { compareReports } from '../utils/api';
import SectionCard from './common/SectionCard';
import { safeGet } from '../utils/jsonParser';
import './ReportCompare.css';

const ReportCompare = ({ reportIds, onClose }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, [reportIds]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await compareReports(reportIds);
      setReports(response.reports);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="compare-container">
        <div className="loading">Loading reports for comparison...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compare-container">
        <div className="error-message">Error: {error}</div>
        <button onClick={onClose} className="btn-close">Close</button>
      </div>
    );
  }

  const getTargetUrl = (report) => {
    return safeGet(report, 'data.scan_metadata.target_info.url', 'Unknown');
  };

  const getWordPressVersion = (report) => {
    const targets = safeGet(report, 'data.findings.wpscan_results.targets', {});
    const targetUrl = Object.keys(targets)[0];
    if (targetUrl) {
      return safeGet(targets[targetUrl], 'data.version.number', 'Unknown');
    }
    return 'Unknown';
  };

  const getVulnerabilityCount = (report) => {
    let count = 0;
    const targets = safeGet(report, 'data.findings.wpscan_results.targets', {});
    Object.values(targets).forEach(target => {
      const data = target.data || {};
      if (data.version?.vulnerabilities) count += data.version.vulnerabilities.length;
      if (data.main_theme?.vulnerabilities) count += data.main_theme.vulnerabilities.length;
      if (data.plugins) {
        Object.values(data.plugins).forEach(plugin => {
          if (plugin.vulnerabilities) count += plugin.vulnerabilities.length;
        });
      }
    });
    return count;
  };

  const getCriticalAlertsCount = (report) => {
    return (safeGet(report, 'data.critical_alerts', [])).length;
  };

  const getSecurityHeadersMissing = (report) => {
    const analysis = safeGet(report, 'data.findings.wp_analyzer.security_headers.target_url_analysis', {});
    return safeGet(analysis, 'missing_recommended', []).length;
  };

  return (
    <div className="compare-container">
      <div className="compare-header">
        <h2>Comparing {reports.length} Reports</h2>
        <button onClick={onClose} className="btn-close">Close</button>
      </div>

      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              {reports.map((report, idx) => (
                <th key={report.id}>
                  <div className="report-header">
                    <div className="report-title">{getTargetUrl(report)}</div>
                    <div className="report-id">Report #{report.id}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>WordPress Version</strong></td>
              {reports.map((report) => (
                <td key={report.id}>{getWordPressVersion(report)}</td>
              ))}
            </tr>
            <tr>
              <td><strong>Vulnerabilities</strong></td>
              {reports.map((report) => (
                <td key={report.id} className={getVulnerabilityCount(report) > 0 ? 'has-vulns' : ''}>
                  {getVulnerabilityCount(report)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Critical Alerts</strong></td>
              {reports.map((report) => (
                <td key={report.id} className={getCriticalAlertsCount(report) > 0 ? 'has-alerts' : ''}>
                  {getCriticalAlertsCount(report)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Missing Security Headers</strong></td>
              {reports.map((report) => (
                <td key={report.id} className={getSecurityHeadersMissing(report) > 0 ? 'has-issues' : ''}>
                  {getSecurityHeadersMissing(report)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Scan Date</strong></td>
              {reports.map((report) => (
                <td key={report.id}>
                  {safeGet(report, 'data.scan_metadata.start_time', 'Unknown')}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="compare-details">
        {reports.map((report) => (
          <SectionCard
            key={report.id}
            title={`Report #${report.id} - ${getTargetUrl(report)}`}
            defaultExpanded={false}
          >
            <div className="compare-report-details">
              <p><strong>WordPress Version:</strong> {getWordPressVersion(report)}</p>
              <p><strong>Vulnerabilities:</strong> {getVulnerabilityCount(report)}</p>
              <p><strong>Critical Alerts:</strong> {getCriticalAlertsCount(report)}</p>
              <p><strong>Missing Security Headers:</strong> {getSecurityHeadersMissing(report)}</p>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
};

export default ReportCompare;

