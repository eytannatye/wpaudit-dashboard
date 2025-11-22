import ScanMetadata from './sections/ScanMetadata';
import ToolChecks from './sections/ToolChecks';
import SummaryPoints from './sections/SummaryPoints';
import CriticalAlerts from './sections/CriticalAlerts';
import WPScanResults from './sections/WPScanResults';
import WPAnalyzer from './sections/WPAnalyzer';
import WPAnalyzerXSS from './sections/WPAnalyzerXSS';
import RemediationSuggestions from './sections/RemediationSuggestions';
import ToolErrors from './sections/ToolErrors';
import Subdomains from './sections/Subdomains';
import './ReportViewer.css';

const ReportViewer = ({ data }) => {
  if (!data) {
    return null;
  }

  const sections = [
    { id: 'metadata', label: 'Scan Metadata', component: ScanMetadata },
    { id: 'tools', label: 'Tool Checks', component: ToolChecks },
    { id: 'summary', label: 'Summary', component: SummaryPoints },
    { id: 'subdomains', label: 'Subdomains', component: Subdomains },
    { id: 'alerts', label: 'Critical Alerts', component: CriticalAlerts },
    { id: 'wpscan', label: 'WPScan Results', component: WPScanResults },
    { id: 'analyzer', label: 'WP Analyzer', component: WPAnalyzer },
    { id: 'xss', label: 'XSS Analysis', component: WPAnalyzerXSS },
    { id: 'remediation', label: 'Remediation Suggestions', component: RemediationSuggestions },
    { id: 'errors', label: 'Tool Errors', component: ToolErrors },
  ];

  return (
    <div className="report-viewer">
      <div className="report-header">
        <h1>WPAudit Report Viewer</h1>
        {data.scan_metadata?.target_info?.url && (
          <p className="target-url">Target: {data.scan_metadata.target_info.url}</p>
        )}
      </div>

      <div className="report-content">
        {sections.map(({ id, label, component: Component }) => (
          <Component key={id} data={data} />
        ))}
      </div>
    </div>
  );
};

export default ReportViewer;

