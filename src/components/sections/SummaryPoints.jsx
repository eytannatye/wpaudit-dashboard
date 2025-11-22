import SectionCard from '../common/SectionCard';
import { safeGet } from '../../utils/jsonParser';

const SummaryPoints = ({ data }) => {
  const summaryPoints = safeGet(data, 'summary_points', []);

  if (!summaryPoints || summaryPoints.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Summary Points" icon="📋">
      <ul className="summary-list">
        {summaryPoints.map((point, index) => (
          <li key={index} className="summary-item">
            {point}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

export default SummaryPoints;

