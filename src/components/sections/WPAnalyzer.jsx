import { useState } from 'react';
import SectionCard from '../common/SectionCard';
import VulnerabilityDetails from '../VulnerabilityDetails';
import PluginCVELookup from '../PluginCVELookup';
import { safeGet } from '../../utils/jsonParser';
import './WPAnalyzer.css';

const WPAnalyzer = ({ data }) => {
  const [selectedVuln, setSelectedVuln] = useState(null);
  const wpAnalyzer = safeGet(data, 'findings.wp_analyzer', {});

  if (!wpAnalyzer || Object.keys(wpAnalyzer).length === 0) {
    return null;
  }

  return (
    <SectionCard title="WP Analyzer" icon="🛡️" defaultExpanded={true}>
      <div className="wp-analyzer-content">
        {wpAnalyzer.security_headers && (
          <SecurityHeaders data={wpAnalyzer.security_headers} />
        )}
        {wpAnalyzer.user_registration && (
          <UserRegistration data={wpAnalyzer.user_registration} />
        )}
        {wpAnalyzer.xml_rpc && (
          <XMLRPC data={wpAnalyzer.xml_rpc} />
        )}
        {wpAnalyzer.sensitive_file_exposure && (
          <SensitiveFileExposure data={wpAnalyzer.sensitive_file_exposure} />
        )}
        {wpAnalyzer.wp_debug_exposure && (
          <WPDebugExposure data={wpAnalyzer.wp_debug_exposure} />
        )}
        {wpAnalyzer.extension_vulnerabilities && (
          <ExtensionVulnerabilities 
            data={wpAnalyzer.extension_vulnerabilities}
            onVulnClick={setSelectedVuln}
          />
        )}
        {wpAnalyzer.core_vulnerabilities && (
          <CoreVulnerabilities data={wpAnalyzer.core_vulnerabilities} />
        )}
        {wpAnalyzer.configuration_audit && (
          <ConfigurationAudit data={wpAnalyzer.configuration_audit} />
        )}
        {wpAnalyzer.auth_hardening && (
          <AuthHardening data={wpAnalyzer.auth_hardening} />
        )}
        {wpAnalyzer.advanced_user_enum && (
          <AdvancedUserEnum data={wpAnalyzer.advanced_user_enum} />
        )}
        {wpAnalyzer.admin_area_security && (
          <AdminAreaSecurity data={wpAnalyzer.admin_area_security} />
        )}
        {wpAnalyzer.comment_security && (
          <CommentSecurity data={wpAnalyzer.comment_security} />
        )}
        {wpAnalyzer.cron_analysis && (
          <CronAnalysis data={wpAnalyzer.cron_analysis} />
        )}
        {wpAnalyzer.directory_listing && (
          <DirectoryListing data={wpAnalyzer.directory_listing} />
        )}
        {wpAnalyzer.directory_listing_enhanced && (
          <DirectoryListingEnhanced data={wpAnalyzer.directory_listing_enhanced} />
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

// Sub-components for each analyzer section
const SecurityHeaders = ({ data }) => {
  const targetAnalysis = safeGet(data, 'target_url_analysis', {});
  const headersPresent = safeGet(targetAnalysis, 'headers_present', {});
  const missing = safeGet(targetAnalysis, 'missing_recommended', []);
  const misconfigured = safeGet(targetAnalysis, 'misconfigured', []);

  return (
    <div className="analyzer-subsection">
      <h4>Security Headers</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details_summary && <p className="subsection-summary">{data.details_summary}</p>}
      
      {missing.length > 0 && (
        <div className="subsection-item">
          <strong>Missing Headers ({missing.length}):</strong>
          <ul>
            {missing.map((header, idx) => (
              <li key={idx}>{header}</li>
            ))}
          </ul>
        </div>
      )}

      {misconfigured.length > 0 && (
        <div className="subsection-item">
          <strong>Misconfigured Headers ({misconfigured.length}):</strong>
          {misconfigured.map((item, idx) => (
            <div key={idx} className="misconfigured-item">
              <strong>{item.header}:</strong> {item.value}
              <p className="misconfigured-details">{item.details}</p>
            </div>
          ))}
        </div>
      )}

      {Object.keys(headersPresent).length > 0 && (
        <div className="subsection-item">
          <strong>Headers Present:</strong>
          <div className="headers-grid">
            {Object.entries(headersPresent).map(([header, value]) => (
              <div key={header} className="header-item">
                <span className="header-name">{header}:</span>
                <span className={value === 'Not Present' ? 'header-missing' : 'header-present'}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const UserRegistration = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>User Registration</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      <p>{data.details_summary || 'No details available'}</p>
      {data.registration_enabled && (
        <p><strong>Registration Enabled:</strong> {data.registration_enabled}</p>
      )}
    </div>
  );
};

const XMLRPC = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>XML-RPC</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && (
        <div className="subsection-item">
          <p>{JSON.stringify(data.details, null, 2)}</p>
        </div>
      )}
    </div>
  );
};

const SensitiveFileExposure = ({ data }) => {
  const foundFiles = safeGet(data, 'found_files', []);

  return (
    <div className="analyzer-subsection">
      <h4>Sensitive File Exposure</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {foundFiles.length > 0 ? (
        <div className="subsection-item">
          <strong>Found Files ({foundFiles.length}):</strong>
          <ul>
            {foundFiles.map((file, idx) => (
              <li key={idx}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.url}
                </a>
                <span className="file-info"> ({file.size} bytes, {file.content_type})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No sensitive files found.</p>
      )}
    </div>
  );
};

const WPDebugExposure = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>WP Debug Exposure</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details_summary && <p>{data.details_summary}</p>}
      {data.exposed_debug_log_url && (
        <div className="alert-item alert-warning">
          Debug log exposed: <a href={data.exposed_debug_log_url} target="_blank" rel="noopener noreferrer">
            {data.exposed_debug_log_url}
          </a>
        </div>
      )}
    </div>
  );
};

const ExtensionVulnerabilities = ({ data, onVulnClick }) => {
  const themes = safeGet(data, 'enumerated_themes', []);
  const plugins = safeGet(data, 'enumerated_plugins', []);
  const vulnerableThemes = safeGet(data, 'vulnerable_themes', []);
  const vulnerablePlugins = safeGet(data, 'vulnerable_plugins', []);

  return (
    <div className="analyzer-subsection">
      <h4>Extension Vulnerabilities</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      
      {themes.length > 0 && (
        <div className="subsection-item">
          <strong>Themes Enumerated ({themes.length}):</strong>
          <ul>
            {themes.map((theme, idx) => (
              <li key={idx}>
                {theme.name} {theme.version ? `(v${theme.version})` : ''}
                {theme.vulnerabilities && theme.vulnerabilities.length > 0 && (
                  <>
                    <span className="vuln-badge"> {theme.vulnerabilities.length} vulnerabilities</span>
                    <div className="vuln-list-mini">
                      {theme.vulnerabilities.map((vuln, vidx) => (
                        <div
                          key={vidx}
                          className="vuln-mini-item clickable"
                          onClick={() => onVulnClick && onVulnClick(vuln)}
                        >
                          {vuln.title || 'Vulnerability'}
                          {vuln.references?.cve && (
                            <span className="cve-mini"> {vuln.references.cve[0]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plugins.length > 0 && (
        <div className="subsection-item">
          <strong>Plugins Enumerated ({plugins.length}):</strong>
          <ul className="plugins-enumerated-list">
            {plugins.map((plugin, idx) => (
              <li key={idx} className="plugin-enumerated-item">
                <div className="plugin-enumerated-header">
                  <span>{plugin.name} {plugin.version ? `(v${plugin.version})` : ''}</span>
                  {plugin.vulnerabilities && plugin.vulnerabilities.length > 0 && (
                    <span className="vuln-badge"> {plugin.vulnerabilities.length} vulnerabilities</span>
                  )}
                </div>
                {plugin.vulnerabilities && plugin.vulnerabilities.length > 0 && (
                  <div className="vuln-list-mini">
                    {plugin.vulnerabilities.map((vuln, vidx) => (
                      <div
                        key={vidx}
                        className="vuln-mini-item clickable"
                        onClick={() => onVulnClick && onVulnClick(vuln)}
                      >
                        {vuln.title || 'Vulnerability'}
                        {vuln.references?.cve && (
                          <span className="cve-mini"> {vuln.references.cve[0]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="plugin-lookup-wrapper">
                  <PluginCVELookup 
                    pluginName={plugin.name} 
                    version={plugin.version} 
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CoreVulnerabilities = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>Core Vulnerabilities</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      {data.detected_version && (
        <p><strong>Detected Version:</strong> {data.detected_version}</p>
      )}
      {data.potential_vulnerabilities && data.potential_vulnerabilities.length > 0 && (
        <div className="subsection-item">
          <strong>Potential Vulnerabilities:</strong>
          <ul>
            {data.potential_vulnerabilities.map((vuln, idx) => (
              <li key={idx}>{JSON.stringify(vuln, null, 2)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ConfigurationAudit = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>Configuration Audit</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      
      {data.disallow_file_edit_check && (
        <div className="subsection-item">
          <strong>DISALLOW_FILE_EDIT:</strong> {data.disallow_file_edit_check.likely_false ? 'False (editors enabled)' : 'True'}
        </div>
      )}
      
      {data.debug_log_access_check && (
        <div className="subsection-item">
          <strong>Debug Log Access:</strong> {data.debug_log_access_check.accessible ? 'Accessible' : 'Not Accessible'}
          {data.debug_log_access_check.details && <p>{data.debug_log_access_check.details}</p>}
        </div>
      )}
    </div>
  );
};

const AuthHardening = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>Auth Hardening</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      {data.login_page_url && (
        <p><strong>Login Page:</strong> <a href={data.login_page_url} target="_blank" rel="noopener noreferrer">{data.login_page_url}</a></p>
      )}
      {data.captcha_details && (
        <p><strong>CAPTCHA Detected:</strong> {data.captcha_details.detected_types.length > 0 ? 'Yes' : 'No'}</p>
      )}
      {data.tfa_plugin_footprints && data.tfa_plugin_footprints.length > 0 && (
        <p><strong>2FA Plugin:</strong> Detected</p>
      )}
    </div>
  );
};

const AdvancedUserEnum = ({ data }) => {
  const allUsers = safeGet(data, 'all_discovered_usernames_combined', []);
  const authorArchiveUsers = safeGet(data, 'author_archive_users', []);
  const oembedUsers = safeGet(data, 'oembed_disclosed_authors', []);
  const restApiUsers = safeGet(data, 'rest_api_users', []);
  const loginErrorUsers = safeGet(data, 'login_error_users', []);

  // Create a map of users to their discovery methods
  const userMethods = new Map();
  
  authorArchiveUsers.forEach(username => {
    if (!userMethods.has(username)) {
      userMethods.set(username, []);
    }
    userMethods.get(username).push('Author Archive');
  });

  oembedUsers.forEach(user => {
    const username = user.username_slug || user.display_name;
    if (!userMethods.has(username)) {
      userMethods.set(username, []);
    }
    userMethods.get(username).push('oEmbed');
  });

  restApiUsers.forEach(user => {
    const username = user.slug || user.name;
    if (!userMethods.has(username)) {
      userMethods.set(username, []);
    }
    userMethods.get(username).push('REST API');
  });

  loginErrorUsers.forEach(username => {
    if (!userMethods.has(username)) {
      userMethods.set(username, []);
    }
    userMethods.get(username).push('Login Error');
  });

  // Create table data
  const tableData = Array.from(userMethods.entries()).map(([username, methods]) => ({
    username,
    methods: methods.join(', '),
    methodCount: methods.length
  }));

  // If we have REST API users with more details, include them
  const detailedUsers = restApiUsers.map(user => ({
    username: user.slug || user.name,
    displayName: user.name,
    id: user.id,
    methods: 'REST API'
  }));

  return (
    <div className="analyzer-subsection">
      <h4>Advanced User Enumeration</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      
      {allUsers.length > 0 ? (
        <div className="subsection-item">
          <div className="user-enum-summary">
            <strong>Total Unique Usernames Discovered: {allUsers.length}</strong>
          </div>

          {tableData.length > 0 && (
            <div className="user-enum-table-wrapper">
              <table className="user-enum-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>User ID</th>
                    <th>Discovery Methods</th>
                    <th>Methods Count</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedUsers.length > 0 ? (
                    detailedUsers.map((user, idx) => {
                      const methods = userMethods.get(user.username) || ['REST API'];
                      return (
                        <tr key={idx}>
                          <td><strong>{user.username}</strong></td>
                          <td>{user.displayName || 'N/A'}</td>
                          <td>{user.id || 'N/A'}</td>
                          <td>
                            <div className="method-badges">
                              {methods.map((method, midx) => (
                                <span key={midx} className="method-badge">{method}</span>
                              ))}
                            </div>
                          </td>
                          <td><span className="method-count">{methods.length}</span></td>
                        </tr>
                      );
                    })
                  ) : (
                    tableData.map((user, idx) => (
                      <tr key={idx}>
                        <td><strong>{user.username}</strong></td>
                        <td>N/A</td>
                        <td>N/A</td>
                        <td>
                          <div className="method-badges">
                            {user.methods.split(', ').map((method, midx) => (
                              <span key={midx} className="method-badge">{method}</span>
                            ))}
                          </div>
                        </td>
                        <td><span className="method-count">{user.methodCount}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {authorArchiveUsers.length > 0 && (
            <div className="user-enum-breakdown">
              <h5>Breakdown by Method:</h5>
              <ul>
                <li><strong>Author Archives:</strong> {authorArchiveUsers.length} user(s) - {authorArchiveUsers.join(', ')}</li>
                {oembedUsers.length > 0 && (
                  <li><strong>oEmbed:</strong> {oembedUsers.length} user(s)</li>
                )}
                {restApiUsers.length > 0 && (
                  <li><strong>REST API:</strong> {restApiUsers.length} user(s)</li>
                )}
                {loginErrorUsers.length > 0 && (
                  <li><strong>Login Error:</strong> {loginErrorUsers.length} user(s)</li>
                )}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p>No users discovered via enumeration techniques.</p>
      )}
    </div>
  );
};

const AdminAreaSecurity = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>Admin Area Security</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      {data.standard_login_status && (
        <div className="subsection-item">
          <strong>Login Page:</strong> {data.standard_login_status.accessible ? 'Accessible' : 'Not Accessible'}
          {data.standard_login_status.status_code && (
            <span> (Status: {data.standard_login_status.status_code})</span>
          )}
        </div>
      )}
    </div>
  );
};

const CommentSecurity = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>Comment Security</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
    </div>
  );
};

const CronAnalysis = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>Cron Analysis</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      {data.wp_cron_accessible !== undefined && (
        <p><strong>WP-Cron Accessible:</strong> {data.wp_cron_accessible ? 'Yes' : 'No'}</p>
      )}
      {data.potential_dos_risk && (
        <div className="alert-item alert-warning">
          Potential DoS risk detected
        </div>
      )}
    </div>
  );
};

const DirectoryListing = ({ data }) => {
  return (
    <div className="analyzer-subsection">
      <h4>Directory Listing</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.vulnerable_paths && data.vulnerable_paths.length > 0 && (
        <div className="subsection-item">
          <strong>Vulnerable Paths:</strong>
          <ul>
            {data.vulnerable_paths.map((path, idx) => (
              <li key={idx}>{path}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const DirectoryListingEnhanced = ({ data }) => {
  const vulnerablePaths = safeGet(data, 'vulnerable_paths_map', {});

  return (
    <div className="analyzer-subsection">
      <h4>Directory Listing (Enhanced)</h4>
      <p className="subsection-status">Status: {data.status || 'Unknown'}</p>
      {data.details && <p>{data.details}</p>}
      {Object.keys(vulnerablePaths).length > 0 && (
        <div className="subsection-item">
          <strong>Vulnerable Paths Found:</strong>
          {Object.entries(vulnerablePaths).map(([path, listings]) => (
            <div key={path} className="path-listing">
              <strong>Path: {path || '/'}</strong>
              {Array.isArray(listings) && listings.map((listing, idx) => (
                <div key={idx}>
                  <p>URL: <a href={listing.url} target="_blank" rel="noopener noreferrer">{listing.url}</a></p>
                  <p>Directories: {listing.listed_dirs_count}, Files: {listing.listed_files_count}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WPAnalyzer;

