import SectionCard from '../common/SectionCard';
import { getSeverityColor, getSeverityBadgeClass } from '../../utils/dataFormatters';
import { safeGet } from '../../utils/jsonParser';

const RemediationSuggestions = ({ data }) => {
  const suggestions = safeGet(data, 'remediation_suggestions', {});

  if (!suggestions || Object.keys(suggestions).length === 0) {
    return null;
  }

  const suggestionsList = Object.entries(suggestions).map(([key, suggestion]) => ({
    key,
    ...suggestion
  }));

  // Group by severity
  const grouped = suggestionsList.reduce((acc, suggestion) => {
    const severity = suggestion.severity || 'Info';
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(suggestion);
    return acc;
  }, {});

  const severityOrder = ['Critical', 'High', 'Medium', 'Low', 'Info'];

  return (
    <SectionCard title="Remediation Suggestions" icon="💡">
      <div className="remediation-content">
        {severityOrder.map(severity => {
          if (!grouped[severity] || grouped[severity].length === 0) return null;
          
          return (
            <div key={severity} className="severity-group">
              <h4 className={`severity-header ${getSeverityBadgeClass(severity)}`}>
                {severity} ({grouped[severity].length})
              </h4>
              {grouped[severity].map((suggestion, idx) => (
                <div key={suggestion.key || idx} className="suggestion-item">
                  <div className="suggestion-header">
                    <span className="suggestion-source">{suggestion.source || 'Unknown'}</span>
                    <span 
                      className={`severity-badge ${getSeverityBadgeClass(severity)}`}
                      style={{ backgroundColor: getSeverityColor(severity) }}
                    >
                      {severity}
                    </span>
                  </div>
                  <p className="suggestion-description">{suggestion.description}</p>
                  {suggestion.remediation && (
                    <div className="suggestion-remediation">
                      <strong>Remediation:</strong>
                      <p>{suggestion.remediation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default RemediationSuggestions;

