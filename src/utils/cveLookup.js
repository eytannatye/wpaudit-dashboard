/**
 * Fetch CVE information from NVD API or other sources
 * Note: NVD API has rate limits, so we'll use a combination of approaches
 */

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

/**
 * Fetch CVE details from NVD API
 */
export const fetchCVEInfo = async (cveId) => {
  try {
    // Try NVD API first
    const response = await fetch(`${NVD_API_BASE}?cveId=${cveId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.vulnerabilities && data.vulnerabilities.length > 0) {
        const vuln = data.vulnerabilities[0].cve;
        const descriptions = vuln.descriptions || [];
        const englishDesc = descriptions.find(d => d.lang === 'en') || descriptions[0];
        
        // Get CVSS score if available
        let cvssScore = null;
        let severity = null;
        
        if (vuln.metrics && vuln.metrics.cvssMetricV31 && vuln.metrics.cvssMetricV31.length > 0) {
          const cvss = vuln.metrics.cvssMetricV31[0].cvssData;
          cvssScore = cvss.baseScore;
          severity = getSeverityFromScore(cvssScore);
        } else if (vuln.metrics && vuln.metrics.cvssMetricV30 && vuln.metrics.cvssMetricV30.length > 0) {
          const cvss = vuln.metrics.cvssMetricV30[0].cvssData;
          cvssScore = cvss.baseScore;
          severity = getSeverityFromScore(cvssScore);
        } else if (vuln.metrics && vuln.metrics.cvssMetricV2 && vuln.metrics.cvssMetricV2.length > 0) {
          const cvss = vuln.metrics.cvssMetricV2[0].cvssData;
          cvssScore = cvss.baseScore;
          severity = getSeverityFromScore(cvssScore);
        }

        return {
          description: englishDesc?.value || 'No description available',
          severity: severity,
          cvss: cvssScore,
          published: vuln.published || null,
          modified: vuln.lastModified || null,
          source: 'NVD'
        };
      }
    }

    // Fallback: Return basic info with links
    return {
      description: `CVE ${cveId} - Click the links above for detailed information from CVE and NVD databases.`,
      severity: null,
      cvss: null,
      published: null,
      source: 'fallback'
    };
  } catch (error) {
    console.error('Error fetching CVE info:', error);
    // Return fallback info
    return {
      description: `CVE ${cveId} - Unable to fetch details automatically. Please check the CVE and NVD links above for more information.`,
      severity: null,
      cvss: null,
      published: null,
      source: 'error'
    };
  }
};

/**
 * Get severity level from CVSS score
 */
function getSeverityFromScore(score) {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  if (score >= 0.1) return 'LOW';
  return 'NONE';
}

/**
 * Search for CVEs by plugin name and version
 * Uses NVD API keyword search
 */
export const searchCVEsByPlugin = async (pluginName, version = null) => {
  try {
    // Build search query - search for WordPress plugin name
    // Try multiple search strategies
    const searchQueries = [];
    
    // Strategy 1: "wordpress plugin [name]"
    searchQueries.push(`wordpress plugin ${pluginName}`);
    
    // Strategy 2: If version provided, search with version
    if (version) {
      searchQueries.push(`wordpress plugin ${pluginName} ${version}`);
      searchQueries.push(`${pluginName} ${version}`);
    }
    
    // Strategy 3: Just plugin name
    searchQueries.push(pluginName);
    
    const allResults = [];
    
    // Search with each query (limit to first query to avoid rate limits)
    for (const query of searchQueries.slice(0, 1)) {
      try {
        // NVD API keyword search
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `${NVD_API_BASE}?keywordSearch=${encodedQuery}&resultsPerPage=20`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            // Filter and process results
            const processed = data.vulnerabilities.map(v => {
              const cve = v.cve;
              const descriptions = cve.descriptions || [];
              const englishDesc = descriptions.find(d => d.lang === 'en') || descriptions[0];
              
              // Get CVSS score
              let cvssScore = null;
              let severity = null;
              
              if (cve.metrics?.cvssMetricV31?.length > 0) {
                const cvss = cve.metrics.cvssMetricV31[0].cvssData;
                cvssScore = cvss.baseScore;
                severity = getSeverityFromScore(cvssScore);
              } else if (cve.metrics?.cvssMetricV30?.length > 0) {
                const cvss = cve.metrics.cvssMetricV30[0].cvssData;
                cvssScore = cvss.baseScore;
                severity = getSeverityFromScore(cvssScore);
              } else if (cve.metrics?.cvssMetricV2?.length > 0) {
                const cvss = cve.metrics.cvssMetricV2[0].cvssData;
                cvssScore = cvss.baseScore;
                severity = getSeverityFromScore(cvssScore);
              }
              
              return {
                id: cve.id,
                description: englishDesc?.value || 'No description available',
                severity: severity,
                cvss: cvssScore,
                published: cve.published || null,
                modified: cve.lastModified || null,
                // Check if description mentions the plugin name or version
                relevance: checkRelevance(englishDesc?.value || '', pluginName, version)
              };
            });
            
            // Filter by relevance and sort
            const relevant = processed
              .filter(cve => cve.relevance > 0)
              .sort((a, b) => {
                // Sort by relevance first, then by CVSS score
                if (b.relevance !== a.relevance) return b.relevance - a.relevance;
                if (b.cvss && a.cvss) return b.cvss - a.cvss;
                return 0;
              });
            
            allResults.push(...relevant);
          }
        }
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Error searching with query "${query}":`, err);
      }
    }
    
    // Remove duplicates and return
    const uniqueResults = Array.from(
      new Map(allResults.map(cve => [cve.id, cve])).values()
    );
    
    return {
      results: uniqueResults.slice(0, 10), // Limit to top 10
      total: uniqueResults.length,
      pluginName,
      version
    };
  } catch (error) {
    console.error('Error searching CVEs by plugin:', error);
    return {
      results: [],
      total: 0,
      pluginName,
      version,
      error: error.message
    };
  }
};

/**
 * Check relevance of a CVE to a specific plugin/version
 * Returns a relevance score (0-10)
 */
function checkRelevance(description, pluginName, version) {
  if (!description) return 0;
  
  const descLower = description.toLowerCase();
  const pluginLower = pluginName.toLowerCase();
  
  let relevance = 0;
  
  // Check if plugin name appears in description
  if (descLower.includes(pluginLower)) {
    relevance += 5;
  }
  
  // Check for WordPress plugin mentions
  if (descLower.includes('wordpress') && descLower.includes('plugin')) {
    relevance += 2;
  }
  
  // If version provided, check if it's mentioned
  if (version) {
    const versionLower = version.toLowerCase();
    if (descLower.includes(versionLower)) {
      relevance += 3;
    }
  }
  
  return relevance;
}

/**
 * Get exploitability information
 * This could be enhanced with additional APIs or databases
 */
export const getExploitabilityInfo = async (cveId) => {
  // Placeholder for exploitability information
  // Could integrate with Exploit-DB API, Metasploit, etc.
  return {
    hasExploit: null,
    exploitCount: null,
    lastExploit: null,
    sources: []
  };
};

