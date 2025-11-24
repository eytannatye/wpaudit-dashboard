import { safeGet } from './jsonParser';

/**
 * Calculate comprehensive statistics from report data
 */
export const calculateReportStats = (data) => {
  if (!data) {
    return {
      totalVulnerabilities: 0,
      vulnerabilitiesBySeverity: { high: 0, medium: 0, low: 0, unknown: 0 },
      criticalAlerts: 0,
      pluginsCount: 0,
      themesCount: 0,
      subdomainsCount: 0,
      riskScore: 0,
      securityHeadersMissing: 0,
      wpVersion: null,
      wpVersionStatus: null
    };
  }

  const stats = {
    totalVulnerabilities: 0,
    vulnerabilitiesBySeverity: { high: 0, medium: 0, low: 0, unknown: 0 },
    criticalAlerts: 0,
    pluginsCount: 0,
    themesCount: 0,
    subdomainsCount: 0,
    riskScore: 0,
    securityHeadersMissing: 0,
    wpVersion: null,
    wpVersionStatus: null
  };

  // Critical Alerts
  const criticalAlerts = safeGet(data, 'critical_alerts', []);
  stats.criticalAlerts = criticalAlerts.length;

  // WPScan Results
  const wpscanResults = safeGet(data, 'findings.wpscan_results', {});
  const targets = safeGet(wpscanResults, 'targets', {});
  
  Object.values(targets).forEach(target => {
    const scanData = safeGet(target, 'data', {});
    
    // WordPress Version
    if (scanData.version?.number && !stats.wpVersion) {
      stats.wpVersion = scanData.version.number;
      stats.wpVersionStatus = scanData.version.status;
    }
    
    // Version vulnerabilities
    if (scanData.version?.vulnerabilities) {
      scanData.version.vulnerabilities.forEach(vuln => {
        stats.totalVulnerabilities++;
        const severity = getSeverityFromVuln(vuln);
        stats.vulnerabilitiesBySeverity[severity]++;
      });
    }
    
    // Theme vulnerabilities
    if (scanData.main_theme?.vulnerabilities) {
      scanData.main_theme.vulnerabilities.forEach(vuln => {
        stats.totalVulnerabilities++;
        const severity = getSeverityFromVuln(vuln);
        stats.vulnerabilitiesBySeverity[severity]++;
      });
    }
    
    // Plugins
    if (scanData.plugins) {
      stats.pluginsCount = Object.keys(scanData.plugins).length;
      Object.values(scanData.plugins).forEach(plugin => {
        if (plugin.vulnerabilities) {
          plugin.vulnerabilities.forEach(vuln => {
            stats.totalVulnerabilities++;
            const severity = getSeverityFromVuln(vuln);
            stats.vulnerabilitiesBySeverity[severity]++;
          });
        }
      });
    }
    
    // Themes count
    if (scanData.themes) {
      stats.themesCount = Object.keys(scanData.themes).length;
    }
  });

  // WP Analyzer vulnerabilities
  const wpAnalyzer = safeGet(data, 'findings.wp_analyzer', {});
  if (wpAnalyzer.extension_vulnerabilities) {
    const extVulns = safeGet(wpAnalyzer.extension_vulnerabilities, 'vulnerabilities', []);
    extVulns.forEach(vuln => {
      stats.totalVulnerabilities++;
      const severity = getSeverityFromVuln(vuln);
      stats.vulnerabilitiesBySeverity[severity]++;
    });
  }

  // Security Headers
  const securityHeaders = safeGet(wpAnalyzer, 'security_headers.target_url_analysis', {});
  const missingHeaders = safeGet(securityHeaders, 'missing_recommended', []);
  stats.securityHeadersMissing = missingHeaders.length;

  // Subdomains (from summary or subdomain scanner)
  const summaryPoints = safeGet(data, 'summary_points', []);
  const subdomainPoint = summaryPoints.find(p => 
    typeof p === 'string' && p.toLowerCase().includes('subfinder') && p.toLowerCase().includes('subdomain')
  );
  if (subdomainPoint) {
    const match = subdomainPoint.match(/(\d+)\s+subdomain/i);
    if (match) {
      stats.subdomainsCount = parseInt(match[1], 10);
    }
  }

  // Calculate Risk Score (0-100)
  // High vulnerabilities = 10 points each
  // Medium vulnerabilities = 5 points each
  // Low vulnerabilities = 1 point each
  // Critical alerts = 15 points each
  // Missing security headers = 2 points each
  stats.riskScore = Math.min(100, 
    (stats.vulnerabilitiesBySeverity.high * 10) +
    (stats.vulnerabilitiesBySeverity.medium * 5) +
    (stats.vulnerabilitiesBySeverity.low * 1) +
    (stats.criticalAlerts * 15) +
    (stats.securityHeadersMissing * 2)
  );

  return stats;
};

/**
 * Get severity from vulnerability object
 */
const getSeverityFromVuln = (vuln) => {
  // Check if vulnerability has severity field
  if (vuln.severity) {
    const sev = vuln.severity.toLowerCase();
    if (sev.includes('high') || sev.includes('critical')) return 'high';
    if (sev.includes('medium')) return 'medium';
    if (sev.includes('low')) return 'low';
  }
  
  // Check CVSS score if available
  if (vuln.cvss) {
    const score = parseFloat(vuln.cvss);
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }
  
  // Default to medium if we can't determine
  return 'unknown';
};

/**
 * Get risk level from risk score
 */
export const getRiskLevel = (score) => {
  if (score >= 70) return { level: 'Critical', color: '#dc3545' };
  if (score >= 50) return { level: 'High', color: '#fd7e14' };
  if (score >= 30) return { level: 'Medium', color: '#ffc107' };
  if (score >= 10) return { level: 'Low', color: '#28a745' };
  return { level: 'Minimal', color: '#6c757d' };
};

