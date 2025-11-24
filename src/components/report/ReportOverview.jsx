import { useMemo } from 'react';
import { calculateReportStats, getRiskLevel } from '../../utils/reportStats';
import { formatDate } from '../../utils/dataFormatters';
import { safeGet } from '../../utils/jsonParser';
import './ReportOverview.css';

const ReportOverview = ({ data, subfinderData }) => {
  const stats = useMemo(() => calculateReportStats(data), [data]);
  
  // Update subdomains count if subfinder data is available
  const subdomainsCount = useMemo(() => {
    if (subfinderData && typeof subfinderData === 'string') {
      const lines = subfinderData.split('\n').filter(line => line.trim().length > 0);
      return lines.length;
    }
    return stats.subdomainsCount;
  }, [subfinderData, stats.subdomainsCount]);

  const riskLevel = getRiskLevel(stats.riskScore);
  const targetUrl = safeGet(data, 'scan_metadata.target_info.url', 'N/A');
  const scanDate = safeGet(data, 'scan_metadata.start_time', null);

  return (
    <div className="report-overview">
      <div className="overview-header-simple">
        <h2>Security Overview</h2>
        <p className="target-info">{targetUrl}</p>
        {scanDate && <p className="scan-date">Scanned: {formatDate(scanDate)}</p>}
      </div>
    </div>
  );
};

export default ReportOverview;

