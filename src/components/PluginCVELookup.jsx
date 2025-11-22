import { useState } from 'react';
import { searchCVEsByPlugin } from '../utils/cveLookup';
import './PluginCVELookup.css';

const PluginCVELookup = ({ pluginName, version }) => {
  const [cves, setCves] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    setError(null);
    setExpanded(true);
    
    try {
      const result = await searchCVEsByPlugin(pluginName, version);
      setCves(result);
    } catch (err) {
      setError(err.message);
      setCves(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plugin-cve-lookup">
      <button 
        className="lookup-cve-btn"
        onClick={handleLookup}
        disabled={loading}
      >
        {loading ? '🔍 Searching...' : '🔍 Lookup Potential CVEs'}
      </button>

      {error && (
        <div className="lookup-error">
          <p>Error: {error}</p>
          <p className="lookup-hint">
            Try searching manually: <a 
              href={`https://nvd.nist.gov/vuln/search/results?query=${encodeURIComponent(`wordpress plugin ${pluginName}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search NVD
            </a>
          </p>
        </div>
      )}

      {cves && expanded && (
        <div className="lookup-results">
          <div className="lookup-results-header">
            <h5>
              Potential CVEs for {pluginName}
              {version && ` (v${version})`}
            </h5>
            <button 
              className="close-lookup"
              onClick={() => setExpanded(false)}
            >
              ✕
            </button>
          </div>
          
          {cves.results && cves.results.length > 0 ? (
            <>
              <p className="lookup-summary">
                Found {cves.results.length} potentially relevant CVE{cves.results.length !== 1 ? 's' : ''}
                {cves.total > cves.results.length && ` (showing top ${cves.results.length} of ${cves.total})`}
              </p>
              <div className="cve-results-list">
                {cves.results.map((cve) => (
                  <div key={cve.id} className="cve-result-item">
                    <div className="cve-result-header">
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cve-result-id"
                      >
                        {cve.id}
                      </a>
                      {cve.cvss && (
                        <span className={`cve-severity severity-${cve.severity?.toLowerCase() || 'unknown'}`}>
                          CVSS: {cve.cvss} ({cve.severity || 'N/A'})
                        </span>
                      )}
                    </div>
                    <p className="cve-result-description">{cve.description}</p>
                    {cve.published && (
                      <div className="cve-result-meta">
                        <span>Published: {new Date(cve.published).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="lookup-disclaimer">
                ⚠️ These CVEs are found by keyword search and may not all be directly related to this specific plugin version. 
                Please verify relevance before taking action.
              </p>
            </>
          ) : (
            <div className="no-cves-found">
              <p>No CVEs found for this plugin.</p>
              <p className="lookup-hint">
                Try searching manually: <a 
                  href={`https://nvd.nist.gov/vuln/search/results?query=${encodeURIComponent(`wordpress plugin ${pluginName} ${version || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Search NVD Database
                </a> or <a
                  href={`https://wpscan.com/plugins/${pluginName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Check WPScan Database
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PluginCVELookup;

