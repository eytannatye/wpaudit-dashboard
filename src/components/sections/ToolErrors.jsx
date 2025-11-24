import SectionCard from '../common/SectionCard';
import { safeGet } from '../../utils/jsonParser';

const ToolErrors = ({ data }) => {
  const errors = safeGet(data, 'tool_errors', []);

  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Tool Errors" icon="❌" defaultExpanded={true}>
      <div className="errors-list">
        {errors.map((error, index) => (
          <div key={index} className="error-item">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default ToolErrors;

