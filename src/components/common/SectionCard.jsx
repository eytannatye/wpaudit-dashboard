import { useState } from 'react';
import './SectionCard.css';

const SectionCard = ({ title, children, defaultExpanded = true, icon = null }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="section-card">
      <div className="section-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="section-card-title">
          {icon && <span className="section-icon">{icon}</span>}
          <h3>{title}</h3>
        </div>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      {isExpanded && (
        <div className="section-card-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default SectionCard;

