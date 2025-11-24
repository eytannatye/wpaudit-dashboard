import { useState } from 'react';
import SectionCard from '../common/SectionCard';
import VulnerabilityDetails from '../VulnerabilityDetails';
import PluginCVELookup from '../PluginCVELookup';
import { formatDate, formatFileSize } from '../../utils/dataFormatters';
import { safeGet } from '../../utils/jsonParser';
import './WPScanResults.css';

const WPScanResults = ({ data }) => {
  const [selectedVuln, setSelectedVuln] = useState(null);
  const wpscanResults = safeGet(data, 'findings.wpscan_results', {});
  const targets = safeGet(wpscanResults, 'targets', {});

  if (!wpscanResults || Object.keys(targets).length === 0) {
    return null;
  }

  const targetUrl = Object.keys(targets)[0];
  const targetData = targets[targetUrl];
  const scanData = safeGet(targetData, 'data', {});

  // Safety check: ensure scanData is valid
  if (!scanData || typeof scanData !== 'object') {
    return null;
  }

  return (
    <SectionCard title="WPScan Results" icon="🔍" defaultExpanded={true}>
      <div className="wpscan-content">
        {targetData.status && (
          <div className="status-badge">
            Status: <strong>{targetData.status}</strong>
          </div>
        )}

        {scanData.version && scanData.version !== null && (
          <div className="wpscan-section">
            <h4>WordPress Version</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Version:</label>
                <span>{scanData.version?.number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-${scanData.version?.status?.toLowerCase() || 'unknown'}`}>
                  {scanData.version?.status || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <label>Release Date:</label>
                <span>{formatDate(scanData.version?.release_date)}</span>
              </div>
              {scanData.version?.vulnerabilities && scanData.version.vulnerabilities.length > 0 && (
                <div className="info-item full-width">
                  <label>Vulnerabilities:</label>
                  <div className="vuln-list">
                    {scanData.version.vulnerabilities.map((vuln, idx) => (
                      <div
                        key={idx}
                        className="vuln-item clickable"
                        onClick={() => setSelectedVuln(vuln)}
                        title="Click for details"
                      >
                        <div className="vuln-header">
                          <strong>{vuln.title}</strong>
                          <span className="vuln-info-icon">ℹ️</span>
                        </div>
                        {vuln.fixed_in && <span className="vuln-fixed">Fixed in: {vuln.fixed_in}</span>}
                        {vuln.references?.cve && vuln.references.cve.length > 0 && (
                          <div className="vuln-cves">
                            {vuln.references.cve.map((cve, cidx) => (
                              <a
                                key={cidx}
                                href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cve-badge"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cve}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {scanData.main_theme && scanData.main_theme !== null && (
          <div className="wpscan-section">
            <h4>Main Theme</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{scanData.main_theme?.slug || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Version:</label>
                <span>{scanData.main_theme?.version?.number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Latest Version:</label>
                <span>{scanData.main_theme?.latest_version || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Outdated:</label>
                <span>{scanData.main_theme?.outdated ? 'Yes' : 'No'}</span>
              </div>
              {scanData.main_theme?.vulnerabilities && scanData.main_theme.vulnerabilities.length > 0 && (
                <div className="info-item full-width">
                  <label>Vulnerabilities:</label>
                  <div className="vuln-list">
                    {scanData.main_theme.vulnerabilities.map((vuln, idx) => (
                      <div
                        key={idx}
                        className="vuln-item clickable"
                        onClick={() => setSelectedVuln(vuln)}
                        title="Click for details"
                      >
                        <div className="vuln-header">
                          <strong>{vuln.title}</strong>
                          <span className="vuln-info-icon">ℹ️</span>
                        </div>
                        {vuln.fixed_in && <span className="vuln-fixed">Fixed in: {vuln.fixed_in}</span>}
                        {vuln.references?.cve && vuln.references.cve.length > 0 ? (
                          <div className="vuln-cves">
                            {vuln.references.cve.map((cve, cidx) => (
                              <a
                                key={cidx}
                                href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cve-badge"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cve}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="vuln-no-cve">
                            <span className="no-cve-badge">No CVE assigned</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="wpscan-section">
          <h4>Plugins {scanData.plugins ? `(${Object.keys(scanData.plugins).length})` : '(0)'}</h4>
          {scanData.plugins && Object.keys(scanData.plugins).length > 0 ? (
            <div className="plugins-list">
              {Object.entries(scanData.plugins).map(([slug, plugin]) => (
                <div key={slug} className="plugin-item">
                  <div className="plugin-header">
                    <strong>{slug}</strong>
                    {plugin.outdated && <span className="badge badge-warning">Outdated</span>}
                    {plugin.vulnerabilities && plugin.vulnerabilities.length > 0 && (
                      <span className="badge badge-danger">{plugin.vulnerabilities.length} vulnerabilities</span>
                    )}
                  </div>
                  <div className="plugin-details">
                    <span>Version: {plugin.version?.number || 'Unknown'}</span>
                    <span>Latest: {plugin.latest_version || 'N/A'}</span>
                  </div>
                  {plugin.vulnerabilities && plugin.vulnerabilities.length > 0 && (
                    <div className="plugin-vulns">
                      {plugin.vulnerabilities.map((vuln, idx) => (
                        <div 
                          key={idx} 
                          className="vuln-item clickable"
                          onClick={() => setSelectedVuln(vuln)}
                        >
                          <div className="vuln-header">
                            <strong>{vuln.title}</strong>
                            <span className="vuln-info-icon">ℹ️</span>
                          </div>
                          {vuln.fixed_in && <span className="vuln-fixed">Fixed in: {vuln.fixed_in}</span>}
                          {vuln.references?.cve && vuln.references.cve.length > 0 ? (
                            <div className="vuln-cves">
                              {vuln.references.cve.map((cve, cidx) => (
                                <a
                                  key={cidx}
                                  href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cve-badge"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {cve}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="vuln-no-cve">
                              <span className="no-cve-badge">No CVE assigned</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <PluginCVELookup 
                    pluginName={slug} 
                    version={plugin.version?.number || plugin.latest_version} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-message">No plugins found in this scan.</p>
          )}
        </div>

        {scanData.interesting_findings && scanData.interesting_findings.length > 0 && (
          <div className="wpscan-section">
            <h4>Interesting Findings</h4>
            <ul className="findings-list">
              {scanData.interesting_findings.map((finding, idx) => (
                <li key={idx}>
                  <a href={finding.url} target="_blank" rel="noopener noreferrer">
                    {finding.to_s || finding.url}
                  </a>
                  <span className="finding-type">({finding.type})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {scanData.requests_done && (
          <div className="wpscan-section">
            <h4>Scan Statistics</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Requests Done:</label>
                <span>{scanData.requests_done}</span>
              </div>
              <div className="info-item">
                <label>Data Received:</label>
                <span>{scanData.data_received_humanised || formatFileSize(scanData.data_received)}</span>
              </div>
              <div className="info-item">
                <label>Elapsed Time:</label>
                <span>{scanData.elapsed ? `${scanData.elapsed}s` : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedVuln && (
        <VulnerabilityDetails
          vulnerability={selectedVuln}
          onClose={() => setSelectedVuln(null)}
        />
      )}
    </SectionCard>
  );
};

export default WPScanResults;

