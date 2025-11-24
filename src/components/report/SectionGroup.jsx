import { useState, useEffect } from 'react';
import './SectionGroup.css';

const SectionGroup = ({ title, icon, children, defaultExpanded = false, badge, category }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Listen for navigation events to expand this group when a child section is clicked
  useEffect(() => {
    const handleNavigate = (event) => {
      const { sectionId, category: targetCategory } = event.detail;
      if (targetCategory === category) {
        setIsExpanded(true);
      }
    };

    window.addEventListener('navigateToSection', handleNavigate);
    return () => window.removeEventListener('navigateToSection', handleNavigate);
  }, [category]);

  return (
    <div className="section-group" data-category={category}>
      <div 
        className="section-group-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="section-group-title">
          {icon && <span className="section-group-icon">{icon}</span>}
          <h4>{title}</h4>
          {badge && (
            <span className={`section-group-badge badge-${badge.type || 'default'}`}>
              {badge.value}
            </span>
          )}
        </div>
        <span className={`section-group-toggle ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>
      {isExpanded && (
        <div className="section-group-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default SectionGroup;

