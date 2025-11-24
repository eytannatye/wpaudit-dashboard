import SectionCard from '../common/SectionCard';
import { safeGet } from '../../utils/jsonParser';
import './WPAnalyzerXSS.css';

const WPAnalyzerXSS = ({ data }) => {
  const xssData = safeGet(data, 'findings.wp_analyzer_xss', {});

  if (!xssData || Object.keys(xssData).length === 0) {
    return null;
  }

  const potentialXSS = safeGet(xssData, 'potential_reflected_xss', []);

  return (
    <SectionCard title="XSS Analysis" icon="🔐" defaultExpanded={true}>
      <div className="xss-content">
        <p className="subsection-status">Status: {xssData.status || 'Unknown'}</p>
        {xssData.details && <p>{xssData.details}</p>}
        
        {potentialXSS.length > 0 && (
          <div className="subsection-item">
            <strong>Potential Reflected XSS Points ({potentialXSS.length}):</strong>
            <div className="xss-list">
              {potentialXSS.slice(0, 10).map((xss, idx) => (
                <div key={idx} className="xss-item">
                  <div className="xss-url">
                    <a href={xss.url} target="_blank" rel="noopener noreferrer">
                      {xss.url}
                    </a>
                  </div>
                  <div className="xss-details">
                    <span className="xss-param">Parameter: {xss.parameter}</span>
                    <span className="xss-method">Method: {xss.method}</span>
                    <span className="xss-category">Category: {xss.payload_category}</span>
                  </div>
                  {xss.detail && (
                    <p className="xss-detail">{xss.detail}</p>
                  )}
                </div>
              ))}
              {potentialXSS.length > 10 && (
                <p className="xss-more">... and {potentialXSS.length - 10} more potential XSS points</p>
              )}
            </div>
          </div>
        )}

        {xssData.recommendation && (
          <div className="xss-recommendation">
            <strong>Recommendation:</strong>
            <p>{xssData.recommendation}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default WPAnalyzerXSS;

