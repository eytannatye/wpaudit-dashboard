import { useState, useEffect, useMemo } from 'react';
import Tabs from './Tabs';
import ReportOverview from './report/ReportOverview';
import ReportSidebar from './report/ReportSidebar';
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
import WPScanJSONViewer from './viewers/WPScanJSONViewer';
import SubfinderViewer from './viewers/SubfinderViewer';
import LogViewer from './viewers/LogViewer';
import { getReport } from '../utils/api';
import { calculateReportStats } from '../utils/reportStats';
import { safeGet } from '../utils/jsonParser';
import './ReportViewer.css';

const ReportViewer = ({ data, files, reportId }) => {
  const [allFiles, setAllFiles] = useState(files || {});
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('metadata'); // Start with metadata
  const [searchQuery, setSearchQuery] = useState('');

  // Load additional files if reportId is provided
  useEffect(() => {
    if (reportId && !files) {
      loadAllFiles();
    } else if (files) {
      setAllFiles(files);
    }
  }, [reportId, files]);

  const loadAllFiles = async () => {
    if (!reportId) return;
    
    setLoading(true);
    try {
      const fileTypes = ['full_report', 'wpscan_json', 'subfinder_txt', 'wpscan_log'];
      const loadedFiles = {};
      
      for (const fileType of fileTypes) {
        try {
          const fileData = await getReport(reportId, fileType);
          loadedFiles[fileType] = fileData;
        } catch (err) {
          // File doesn't exist, skip it
          console.debug(`File ${fileType} not found`);
        }
      }
      
      setAllFiles(loadedFiles);
      // Set full_report as default data if available
      if (loadedFiles.full_report && !data) {
        // This will be handled by parent component
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine if we should show tabs (multiple files) or single view
  const hasMultipleFiles = Object.keys(allFiles).length > 1 || (allFiles.full_report && Object.keys(allFiles).length > 0);
  const fullReportData = data || allFiles.full_report;

  // Calculate stats for badges
  const stats = useMemo(() => calculateReportStats(fullReportData), [fullReportData]);
  const criticalAlerts = safeGet(fullReportData, 'critical_alerts', []);
  const remediationSuggestions = safeGet(fullReportData, 'remediation_suggestions', []);
  
  // Calculate subdomains count
  const subdomainsCount = useMemo(() => {
    if (allFiles.subfinder_txt && typeof allFiles.subfinder_txt === 'string') {
      const lines = allFiles.subfinder_txt.split('\n').filter(line => line.trim().length > 0);
      return lines.length;
    }
    return stats.subdomainsCount;
  }, [allFiles.subfinder_txt, stats.subdomainsCount]);

  // Build sections with categories and badges
  const buildSections = () => {
    const sections = [
      // Overview category
      { id: 'metadata', label: 'Scan Metadata', component: ScanMetadata, category: 'Overview' },
      { id: 'summary', label: 'Summary', component: SummaryPoints, category: 'Overview' },
      
      // Scan Info category
      { id: 'tools', label: 'Tool Checks', component: ToolChecks, category: 'Scan Info' },
      { id: 'wpscan', label: 'WPScan Results', component: WPScanResults, category: 'Scan Info', badge: stats.totalVulnerabilities > 0 ? { value: stats.totalVulnerabilities, type: 'danger' } : null },
      { id: 'analyzer', label: 'WP Analyzer', component: WPAnalyzer, category: 'Scan Info' },
      { id: 'xss', label: 'XSS Analysis', component: WPAnalyzerXSS, category: 'Scan Info' },
      
      // Security Issues category
      { id: 'alerts', label: 'Critical Alerts', component: CriticalAlerts, category: 'Security Issues', badge: criticalAlerts.length > 0 ? { value: criticalAlerts.length, type: 'danger' } : null },
      { id: 'subdomains', label: 'Subdomains', component: Subdomains, category: 'Security Issues', badge: subdomainsCount > 0 ? { value: subdomainsCount, type: 'info' } : null },
      
      // Details category
      { id: 'errors', label: 'Tool Errors', component: ToolErrors, category: 'Details' },
      
      // Recommendations category
      { id: 'remediation', label: 'Remediation Suggestions', component: RemediationSuggestions, category: 'Recommendations', badge: remediationSuggestions.length > 0 ? { value: remediationSuggestions.length, type: 'info' } : null },
    ];
    return sections;
  };

  const sections = buildSections();

  // Build tabs array
  const tabs = [];
  
  // Full Report tab
  if (fullReportData) {

    tabs.push({
      id: 'full_report',
      label: 'Full Report',
      content: (
        <div className="report-viewer-layout">
          <ReportSidebar
            sections={sections}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <div className="report-main-content">
            <ReportOverview data={fullReportData} subfinderData={allFiles.subfinder_txt} />
            
            <div className="report-sections">
              {sections
                .filter(section => section.id === activeSection)
                .map(({ id, label, component: Component, badge }) => {
                  if (id === 'subdomains' && allFiles.subfinder_txt) {
                    return <Component key={id} data={fullReportData} subfinderData={allFiles.subfinder_txt} badge={badge} id={id} />;
                  }
                  return <Component key={id} data={fullReportData} badge={badge} id={id} />;
                })}
            </div>
          </div>
        </div>
      )
    });
  }

  // WPScan JSON tab
  if (allFiles.wpscan_json) {
    tabs.push({
      id: 'wpscan_json',
      label: 'WPScan JSON',
      content: <WPScanJSONViewer data={allFiles.wpscan_json} />
    });
  }

  // Subfinder tab
  if (allFiles.subfinder_txt) {
    tabs.push({
      id: 'subfinder',
      label: 'Subfinder',
      content: <SubfinderViewer data={allFiles.subfinder_txt} />
    });
  }

  // WPScan Log tab
  if (allFiles.wpscan_log) {
    tabs.push({
      id: 'wpscan_log',
      label: 'WPScan Log',
      content: <LogViewer data={allFiles.wpscan_log} />
    });
  }

  if (tabs.length === 0) {
    return (
      <div className="report-viewer">
        <div className="report-header">
          <h1>WPAudit Report Viewer</h1>
          <p>No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-viewer">
      <div className="report-header">
        <h1>WPAudit Report Viewer</h1>
        {fullReportData?.scan_metadata?.target_info?.url && (
          <p className="target-url">Target: {fullReportData.scan_metadata.target_info.url}</p>
        )}
      </div>

      {hasMultipleFiles && tabs.length > 1 ? (
        <Tabs tabs={tabs} defaultTab="full_report" />
      ) : (
        <div className="report-content">
          {tabs[0]?.content}
        </div>
      )}
    </div>
  );
};

export default ReportViewer;

