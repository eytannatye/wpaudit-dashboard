import SectionCard from '../common/SectionCard';
import DataTable from '../common/DataTable';
import { safeGet } from '../../utils/jsonParser';

const ToolChecks = ({ data }) => {
  const toolChecks = safeGet(data, 'tool_checks', {});

  if (!toolChecks || Object.keys(toolChecks).length === 0) {
    return null;
  }

  const tools = Object.entries(toolChecks).map(([name, info]) => ({
    name,
    status: info.status || 'Unknown',
    version: info.version || 'N/A',
    versionOk: info.version_ok === true ? '✓' : info.version_ok === false ? '✗' : '?',
    path: info.path || 'N/A'
  }));

  const columns = [
    { header: 'Tool', accessor: 'name' },
    { header: 'Status', accessor: 'status' },
    { header: 'Version', accessor: 'version' },
    { header: 'Version OK', accessor: 'versionOk' },
    { header: 'Path', accessor: 'path' }
  ];

  return (
    <SectionCard title="Tool Checks" icon="🔧">
      <DataTable data={tools} columns={columns} />
    </SectionCard>
  );
};

export default ToolChecks;

