import SectionCard from '../common/SectionCard';
import { formatDate } from '../../utils/dataFormatters';
import { safeGet } from '../../utils/jsonParser';
import './ScanMetadata.css';

const ScanMetadata = ({ data }) => {
  const metadata = safeGet(data, 'scan_metadata', {});
  const targetInfo = safeGet(metadata, 'target_info', {});
  const configUsed = safeGet(metadata, 'config_used', {});

  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  return (
    <SectionCard title="Scan Metadata" icon="📊">
      <div className="metadata-grid">
        <div className="metadata-item">
          <label>Start Time:</label>
          <span>{formatDate(metadata.start_time)}</span>
        </div>
        <div className="metadata-item">
          <label>End Time:</label>
          <span>{formatDate(metadata.end_time)}</span>
        </div>
        <div className="metadata-item">
          <label>Target URL:</label>
          <span>{targetInfo.url || 'N/A'}</span>
        </div>
        <div className="metadata-item">
          <label>Hostname:</label>
          <span>{targetInfo.hostname || 'N/A'}</span>
        </div>
        <div className="metadata-item">
          <label>IP Address:</label>
          <span>{targetInfo.ip || 'N/A'}</span>
        </div>
        <div className="metadata-item">
          <label>Profile Name:</label>
          <span>{configUsed.profile_name || 'N/A'}</span>
        </div>
        <div className="metadata-item">
          <label>Report Prefix:</label>
          <span className="metadata-value-small">{metadata.report_file_prefix || 'N/A'}</span>
        </div>
      </div>
    </SectionCard>
  );
};

export default ScanMetadata;

