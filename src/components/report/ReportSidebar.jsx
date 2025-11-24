import { useState, useEffect, useRef } from 'react';
import './ReportSidebar.css';

const ReportSidebar = ({ sections, activeSection, onSectionClick, searchQuery, onSearchChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef(null);

  const scrollToSection = (sectionId) => {
    // Just change the active section, no scrolling needed
    onSectionClick(sectionId);
  };

  const filteredSections = sections.filter(section => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return section.label.toLowerCase().includes(query) ||
           section.category?.toLowerCase().includes(query);
  });

  return (
    <div className={`report-sidebar ${isCollapsed ? 'collapsed' : ''}`} ref={sidebarRef}>
      <button 
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {!isCollapsed && (
        <>
          <div className="sidebar-header">
            <h3>Navigation</h3>
          </div>

          {onSearchChange && (
            <div className="sidebar-search">
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          <nav className="sidebar-nav">
            {['Overview', 'Scan Info', 'Security Issues', 'Details', 'Recommendations'].map(category => {
              const categorySections = filteredSections.filter(s => s.category === category);
              if (categorySections.length === 0) return null;

              return (
                <div key={category} className="nav-category">
                  <div className="nav-category-header">
                    {category === 'Overview' && '📊'}
                    {category === 'Scan Info' && '🔍'}
                    {category === 'Security Issues' && '⚠️'}
                    {category === 'Details' && '📝'}
                    {category === 'Recommendations' && '🔧'}
                    <span className="nav-category-label">{category}</span>
                  </div>
                  <ul className="nav-section-list">
                    {categorySections.map(section => (
                      <li key={section.id}>
                        <button
                          className={`nav-section-item ${activeSection === section.id ? 'active' : ''}`}
                          onClick={() => scrollToSection(section.id)}
                        >
                          <span className="nav-section-label">{section.label}</span>
                          {section.badge && (
                            <span className={`nav-section-badge badge-${section.badge.type || 'default'}`}>
                              {section.badge.value}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
};

export default ReportSidebar;

