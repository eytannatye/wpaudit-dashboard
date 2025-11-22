import SectionCard from '../common/SectionCard';
import { safeGet } from '../../utils/jsonParser';

const CriticalAlerts = ({ data }) => {
  const alerts = safeGet(data, 'critical_alerts', []);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Critical Alerts" icon="⚠️" defaultExpanded={true}>
      <div className="alerts-list">
        {alerts.map((alert, index) => (
          <div key={index} className="alert-item alert-critical">
            <span className="alert-icon">🚨</span>
            <span className="alert-text">{alert}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default CriticalAlerts;

