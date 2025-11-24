import { useState } from 'react';
import SectionCard from '../common/SectionCard';
import DataTable from '../common/DataTable';
import VulnerabilityDetails from '../VulnerabilityDetails';
import PluginCVELookup from '../PluginCVELookup';
import { formatDate } from '../../utils/dataFormatters';
import { safeGet } from '../../utils/jsonParser';
import './WPScanJSONViewer.css';

const WPScanJSONViewer = ({ data }) => {
  const [selectedVuln, setSelectedVuln] = useState(null);

  if (!data || typeof data !== 'object') {
    return (
      <SectionCard title="WPScan JSON Results" icon="🔍">
        <div className="wpscan-json-error">
          <p>Invalid WPScan JSON data format</p>
        </div>
      </SectionCard>
    );
  }

  const banner = data.banner || {};
  const targetUrl = data.target_url || data.effective_url || 'N/A';
  const targetIp = data.target_ip || 'N/A';
  const interestingFindings = data.interesting_findings || [];
  const version = data.version || {};
  const mainTheme = data.main_theme || {};
  const plugins = data.plugins || {};
  const users = data.users || {};
  const timthumbs = data.timthumbs || [];
  const configBackups = data.config_backups || [];
  const dbExports = data.db_exports || [];
  const medias = data.medias || [];
  const vulnApi = data.vuln_api || {};

  return (
    <div className="wpscan-json-viewer">
      {/* Banner Info */}
      {banner.description && (
        <SectionCard title="WPScan Information" icon="ℹ️" defaultExpanded={false}>
          <div className="banner-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Description:</label>
                <span>{banner.description}</span>
              </div>
              {banner.version && (
                <div className="info-item">
                  <label>WPScan Version:</label>
                  <span>{banner.version}</span>
                </div>
              )}
              {banner.authors && banner.authors.length > 0 && (
                <div className="info-item">
                  <label>Authors:</label>
                  <span>{banner.authors.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Target Information */}
      <SectionCard title="Target Information" icon="🎯" defaultExpanded={false}>
        <div className="info-grid">
          <div className="info-item">
            <label>Target URL:</label>
            <span>
              <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                {targetUrl}
              </a>
            </span>
          </div>
          {targetIp !== 'N/A' && (
            <div className="info-item">
              <label>Target IP:</label>
              <span>{targetIp}</span>
            </div>
          )}
          {data.start_time && (
            <div className="info-item">
              <label>Scan Start Time:</label>
              <span>{new Date(data.start_time * 1000).toLocaleString()}</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Interesting Findings */}
      {interestingFindings.length > 0 && (
        <SectionCard title="Interesting Findings" icon="🔎" defaultExpanded={false}>
          <div className="findings-list">
            {interestingFindings.map((finding, idx) => (
              <div key={idx} className="finding-item">
                <div className="finding-header">
                  <strong>{finding.to_s || finding.type || 'Finding'}</strong>
                  {finding.confidence && (
                    <span className="confidence-badge">{finding.confidence}% confidence</span>
                  )}
                </div>
                <div className="finding-details">
                  {finding.url && (
                    <div>
                      <label>URL:</label>
                      <a href={finding.url} target="_blank" rel="noopener noreferrer">
                        {finding.url}
                      </a>
                    </div>
                  )}
                  {finding.found_by && (
                    <div>
                      <label>Found By:</label>
                      <span>{finding.found_by}</span>
                    </div>
                  )}
                  {finding.type && (
                    <div>
                      <label>Type:</label>
                      <span>{finding.type}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* WordPress Version */}
      {version.number && (
        <SectionCard title="WordPress Version" icon="📦" defaultExpanded={false}>
          <div className="info-grid">
            <div className="info-item">
              <label>Version:</label>
              <span>{version.number}</span>
            </div>
            {version.status && (
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-${version.status?.toLowerCase() || 'unknown'}`}>
                  {version.status}
                </span>
              </div>
            )}
            {version.release_date && (
              <div className="info-item">
                <label>Release Date:</label>
                <span>{version.release_date}</span>
              </div>
            )}
            {version.found_by && (
              <div className="info-item">
                <label>Found By:</label>
                <span>{version.found_by}</span>
              </div>
            )}
          </div>
          {version.vulnerabilities && version.vulnerabilities.length > 0 && (
            <div className="vuln-section">
              <h5>Vulnerabilities:</h5>
              <div className="vuln-list">
                {version.vulnerabilities.map((vuln, idx) => (
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
        </SectionCard>
      )}

      {/* Main Theme */}
      {mainTheme.slug && (
        <SectionCard title="Main Theme" icon="🎨" defaultExpanded={false}>
          <div className="info-grid">
            <div className="info-item">
              <label>Theme:</label>
              <span>{mainTheme.slug}</span>
            </div>
            {mainTheme.version?.number && (
              <div className="info-item">
                <label>Version:</label>
                <span>{mainTheme.version.number}</span>
              </div>
            )}
            {mainTheme.latest_version && (
              <div className="info-item">
                <label>Latest Version:</label>
                <span>{mainTheme.latest_version}</span>
              </div>
            )}
            {mainTheme.outdated !== undefined && (
              <div className="info-item">
                <label>Outdated:</label>
                <span>{mainTheme.outdated ? 'Yes' : 'No'}</span>
              </div>
            )}
          </div>
          {mainTheme.vulnerabilities && mainTheme.vulnerabilities.length > 0 && (
            <div className="vuln-section">
              <h5>Vulnerabilities:</h5>
              <div className="vuln-list">
                {mainTheme.vulnerabilities.map((vuln, idx) => (
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
        </SectionCard>
      )}

      {/* Plugins */}
      {Object.keys(plugins).length > 0 && (
        <SectionCard title="Plugins" icon="🔌" defaultExpanded={false}>
          <div className="plugins-list">
            {Object.entries(plugins).map(([slug, plugin]) => (
              <div key={slug} className="plugin-item">
                <div className="plugin-header">
                  <h5>{slug}</h5>
                  {plugin.version?.number && (
                    <span className="plugin-version">v{plugin.version.number}</span>
                  )}
                </div>
                <div className="plugin-details">
                  {plugin.location && (
                    <div>
                      <label>Location:</label>
                      <a href={plugin.location} target="_blank" rel="noopener noreferrer">
                        {plugin.location}
                      </a>
                    </div>
                  )}
                  {plugin.latest_version && (
                    <div>
                      <label>Latest Version:</label>
                      <span>{plugin.latest_version}</span>
                    </div>
                  )}
                  {plugin.outdated !== undefined && (
                    <div>
                      <label>Outdated:</label>
                      <span>{plugin.outdated ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
                {plugin.vulnerabilities && plugin.vulnerabilities.length > 0 && (
                  <div className="plugin-vulns">
                    <strong>Vulnerabilities ({plugin.vulnerabilities.length}):</strong>
                    <div className="vuln-list">
                      {plugin.vulnerabilities.map((vuln, idx) => (
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
                <div className="plugin-actions">
                  <PluginCVELookup pluginName={slug} pluginVersion={plugin.version?.number || null} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Users */}
      {Object.keys(users).length > 0 && (
        <SectionCard title="Users" icon="👤" defaultExpanded={false}>
          <div className="users-list">
            {Object.entries(users).map(([id, user]) => (
              <div key={id} className="user-item">
                <div className="user-header">
                  <strong>ID: {id}</strong>
                </div>
                <div className="user-details">
                  {user.name && (
                    <div>
                      <label>Name:</label>
                      <span>{user.name}</span>
                    </div>
                  )}
                  {user.slug && (
                    <div>
                      <label>Slug:</label>
                      <span>{user.slug}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Vulnerability API Info */}
      {vulnApi.plan && (
        <SectionCard title="Vulnerability API" icon="🔐" defaultExpanded={false}>
          <div className="info-grid">
            <div className="info-item">
              <label>Plan:</label>
              <span>{vulnApi.plan}</span>
            </div>
            {vulnApi.requests_done_during_scan && (
              <div className="info-item">
                <label>Requests Done:</label>
                <span>{vulnApi.requests_done_during_scan}</span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Vulnerability Details Modal */}
      {selectedVuln && (
        <VulnerabilityDetails
          vulnerability={selectedVuln}
          onClose={() => setSelectedVuln(null)}
        />
      )}
    </div>
  );
};

export default WPScanJSONViewer;

