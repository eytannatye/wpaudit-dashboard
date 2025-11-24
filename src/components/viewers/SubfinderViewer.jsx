import DataTable from '../common/DataTable';
import SectionCard from '../common/SectionCard';
import './SubfinderViewer.css';

const SubfinderViewer = ({ data }) => {
  if (!data || typeof data !== 'string') {
    return (
      <SectionCard title="Subfinder Results" icon="🌐">
        <div className="subfinder-error">
          <p>Invalid subfinder data format</p>
        </div>
      </SectionCard>
    );
  }

  // Parse subdomains from text (one per line)
  const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return (
      <SectionCard title="Subfinder Results" icon="🌐">
        <div className="subfinder-empty">
          <p>No subdomains found in the subfinder output.</p>
        </div>
      </SectionCard>
    );
  }

  // Prepare table data
  const tableData = lines.map((subdomain, idx) => ({
    id: idx + 1,
    subdomain: subdomain,
    status: 'Discovered',
  }));

  const columns = [
    { header: '#', accessor: 'id' },
    { 
      header: 'Subdomain', 
      render: (row) => {
        if (!row || !row.subdomain) {
          console.error('SubfinderViewer: Invalid row data', row);
          return '-';
        }
        return (
          <a 
            href={`https://${row.subdomain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="subdomain-link"
          >
            {row.subdomain}
          </a>
        );
      }
    },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <SectionCard title="Subfinder Results" icon="🌐" defaultExpanded={true}>
      <div className="subfinder-content">
        <p className="subdomain-count">
          <strong>{lines.length}</strong> subdomain{lines.length !== 1 ? 's' : ''} discovered
        </p>
        <DataTable columns={columns} data={tableData} />
      </div>
    </SectionCard>
  );
};

export default SubfinderViewer;

