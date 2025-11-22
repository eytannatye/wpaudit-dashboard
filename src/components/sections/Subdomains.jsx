import SectionCard from '../common/SectionCard';
import { safeGet } from '../../utils/jsonParser';
import DataTable from '../common/DataTable';
import './Subdomains.css';

const Subdomains = ({ data }) => {
  // Check multiple possible locations for subdomain data
  const subdomainScanner = safeGet(data, 'findings.subdomain_scanner', {});
  const takeoverChecks = safeGet(subdomainScanner, 'takeover_checks', {});
  
  // Try to find subdomains in various possible formats
  const subdomains = safeGet(subdomainScanner, 'subdomains', []) ||
                     safeGet(subdomainScanner, 'discovered_subdomains', []) ||
                     safeGet(subdomainScanner, 'results', []) ||
                     safeGet(subdomainScanner, 'subdomain_list', []) ||
                     safeGet(data, 'findings.subdomains', []) ||
                     [];

  // Check if there are any subdomains in takeover_checks
  const potentialTakeovers = safeGet(takeoverChecks, 'potential_takeovers', []);
  
  // Extract subdomains from potential takeovers if they exist
  const takeoverSubdomains = potentialTakeovers.map(t => t.subdomain || t.domain || t.url).filter(Boolean);

  // Combine all found subdomains
  const allSubdomains = [...new Set([...subdomains, ...takeoverSubdomains])];

  // Parse summary points to extract subdomain count if list isn't available
  const summaryPoints = safeGet(data, 'summary_points', []);
  let subdomainCountFromSummary = null;
  const subdomainSummaryPoint = summaryPoints.find(point => 
    typeof point === 'string' && point.toLowerCase().includes('subfinder') && point.toLowerCase().includes('subdomain')
  );
  
  if (subdomainSummaryPoint) {
    // Extract number from summary like "Subfinder found 24 subdomains for domain.com"
    const match = subdomainSummaryPoint.match(/(\d+)\s+subdomain/i);
    if (match) {
      subdomainCountFromSummary = parseInt(match[1], 10);
    }
  }

  // If no subdomains found, check if subdomain scan was even run
  const phasesExecuted = safeGet(data, 'phases_executed', []);
  const hasSubdomainScan = phasesExecuted.includes('subdomain_scan');

  if (!hasSubdomainScan && allSubdomains.length === 0) {
    return null; // Don't show section if subdomain scan wasn't run
  }

  // Prepare table data
  const tableData = allSubdomains.map((subdomain, idx) => {
    // Try to extract additional info if subdomain is an object
    if (typeof subdomain === 'object') {
      return {
        id: idx + 1,
        subdomain: subdomain.domain || subdomain.url || subdomain.name || JSON.stringify(subdomain),
        status: subdomain.status || 'Unknown',
        ip: subdomain.ip || 'N/A',
        takeover_risk: subdomain.takeover_risk || (subdomain.vulnerable ? 'Yes' : 'No'),
      };
    }
    return {
      id: idx + 1,
      subdomain: subdomain,
      status: 'Discovered',
      ip: 'N/A',
      takeover_risk: 'Unknown',
    };
  });

  const columns = [
    { header: '#', accessor: 'id' },
    { 
      header: 'Subdomain', 
      render: (row) => (
        <a 
          href={`https://${row.subdomain}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="subdomain-link"
        >
          {row.subdomain}
        </a>
      )
    },
    { header: 'Status', accessor: 'status' },
    { header: 'IP Address', accessor: 'ip' },
    { 
      header: 'Takeover Risk', 
      render: (row) => (
        <span className={`takeover-risk ${row.takeover_risk.toLowerCase()}`}>
          {row.takeover_risk}
        </span>
      )
    },
  ];

  return (
    <SectionCard title="Discovered Subdomains" icon="🌐">
      <div className="subdomains-content">
        {takeoverChecks.status && (
          <div className="subdomain-status">
            <p><strong>Scan Status:</strong> {takeoverChecks.status}</p>
          </div>
        )}

        {allSubdomains.length > 0 ? (
          <>
            <p className="subdomain-count">
              <strong>{allSubdomains.length}</strong> subdomain{allSubdomains.length !== 1 ? 's' : ''} discovered
            </p>
            <DataTable columns={columns} data={tableData} />
            
            {potentialTakeovers.length > 0 && (
              <div className="takeover-warning">
                <h4>⚠️ Potential Subdomain Takeover Risks</h4>
                <ul>
                  {potentialTakeovers.map((takeover, idx) => (
                    <li key={idx}>
                      <strong>{takeover.subdomain || takeover.domain || takeover.url}</strong>
                      {takeover.reason && <span> - {takeover.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : subdomainCountFromSummary ? (
          <div className="subdomains-found-but-not-listed">
            <div className="subdomain-info-box">
              <p className="subdomain-count-large">
                <strong>{subdomainCountFromSummary}</strong> subdomain{subdomainCountFromSummary !== 1 ? 's' : ''} discovered
              </p>
              <p className="subdomain-warning-text">
                ⚠️ Subdomains were discovered by Subfinder, but the detailed list is not stored in this report JSON.
              </p>
              <p className="subdomain-suggestion">
                The subdomain list may be available in:
              </p>
              <ul className="subdomain-sources">
                <li>Subfinder output files (if saved separately)</li>
                <li>WPAudit scan logs or output directory</li>
                <li>Subfinder's default output location</li>
              </ul>
              {subdomainSummaryPoint && (
                <p className="subdomain-summary-ref">
                  <strong>Summary:</strong> {subdomainSummaryPoint}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="no-subdomains">
            <p>No subdomains were discovered during the scan.</p>
            {hasSubdomainScan && (
              <p className="subdomain-note">
                Subdomain scanning was executed, but no subdomains were found or the results were not stored in the report.
              </p>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default Subdomains;

