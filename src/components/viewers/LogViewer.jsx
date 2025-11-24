import SectionCard from '../common/SectionCard';
import './LogViewer.css';

const LogViewer = ({ data }) => {
  if (!data || typeof data !== 'string') {
    return (
      <SectionCard title="WPScan Log" icon="📋">
        <div className="log-error">
          <p>Invalid log data format</p>
        </div>
      </SectionCard>
    );
  }

  const lines = data.split('\n');
  
  if (lines.length === 0) {
    return (
      <SectionCard title="WPScan Log" icon="📋">
        <div className="log-empty">
          <p>Log file is empty.</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="WPScan Log" icon="📋" defaultExpanded={true}>
      <div className="log-viewer">
        <div className="log-header">
          <p className="log-info">
            <strong>{lines.length}</strong> line{lines.length !== 1 ? 's' : ''} in log file
          </p>
        </div>
        <div className="log-content">
          <pre className="log-text">
            {data}
          </pre>
        </div>
      </div>
    </SectionCard>
  );
};

export default LogViewer;

