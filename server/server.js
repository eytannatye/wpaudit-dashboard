import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database (JSON file-based)
const dbPath = join(__dirname, 'wpaudit-db.json');

let reports = [];

// Load existing reports
function loadDatabase() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      reports = JSON.parse(data);
    } else {
      reports = [];
    }
  } catch (error) {
    console.error('Error loading database:', error);
    reports = [];
  }
}

// Save reports to file
function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
    throw error;
  }
}

// Initialize database
loadDatabase();

// Helper function to extract metadata from report
function extractMetadata(reportData) {
  const metadata = reportData.scan_metadata || {};
  const targetInfo = metadata.target_info || {};
  const findings = reportData.findings || {};
  const wpscanResults = findings.wpscan_results || {};
  
  // Count vulnerabilities
  let vulnCount = 0;
  const targets = wpscanResults.targets || {};
  Object.values(targets).forEach(target => {
    const data = target.data || {};
    if (data.version?.vulnerabilities) vulnCount += data.version.vulnerabilities.length;
    if (data.main_theme?.vulnerabilities) vulnCount += data.main_theme.vulnerabilities.length;
    if (data.plugins) {
      Object.values(data.plugins).forEach(plugin => {
        if (plugin.vulnerabilities) vulnCount += plugin.vulnerabilities.length;
      });
    }
  });

  return {
    target_url: targetInfo.url || null,
    hostname: targetInfo.hostname || null,
    scan_date: metadata.start_time ? metadata.start_time.split('T')[0] : null,
    scan_start_time: metadata.start_time || null,
    scan_end_time: metadata.end_time || null,
    summary_points: reportData.summary_points || [],
    critical_alerts_count: (reportData.critical_alerts || []).length,
    vulnerabilities_count: vulnCount
  };
}

// API Routes

// Save a report
app.post('/api/reports', (req, res) => {
  try {
    const reportData = req.body;
    
    if (!reportData || !reportData.scan_metadata) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    const metadata = extractMetadata(reportData);
    
    // Generate ID
    const id = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1;
    
    const report = {
      id,
      ...metadata,
      report_data: reportData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    reports.push(report);
    saveDatabase();

    res.json({
      id: report.id,
      message: 'Report saved successfully',
      target_url: metadata.target_url,
      hostname: metadata.hostname,
      scan_date: metadata.scan_date
    });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ error: 'Failed to save report', details: error.message });
  }
});

// Get all reports (with pagination and filtering)
app.get('/api/reports', (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', hostname = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let filtered = [...reports];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r => 
        (r.target_url && r.target_url.toLowerCase().includes(searchLower)) ||
        (r.hostname && r.hostname.toLowerCase().includes(searchLower))
      );
    }

    // Apply hostname filter
    if (hostname) {
      filtered = filtered.filter(r => r.hostname === hostname);
    }

    // Sort
    const validSortColumns = ['created_at', 'scan_date', 'target_url', 'hostname', 'critical_alerts_count', 'vulnerabilities_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (sortColumn === 'created_at' || sortColumn === 'scan_date') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'ASC') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    // Paginate
    const total = filtered.length;
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    // Format response (exclude full report_data)
    const formatted = paginated.map(r => ({
      id: r.id,
      target_url: r.target_url,
      hostname: r.hostname,
      scan_date: r.scan_date,
      scan_start_time: r.scan_start_time,
      scan_end_time: r.scan_end_time,
      critical_alerts_count: r.critical_alerts_count,
      vulnerabilities_count: r.vulnerabilities_count,
      created_at: r.created_at
    }));

    res.json({
      reports: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
});

// Get a single report by ID
app.get('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const report = reports.find(r => r.id === parseInt(id));

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report.report_data);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report', details: error.message });
  }
});

// Delete a report
app.delete('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = reports.findIndex(r => r.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    reports.splice(index, 1);
    saveDatabase();

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report', details: error.message });
  }
});

// Get unique hostnames for filtering
app.get('/api/hostnames', (req, res) => {
  try {
    const hostnames = [...new Set(reports.map(r => r.hostname).filter(h => h))].sort();
    res.json({ hostnames });
  } catch (error) {
    console.error('Error fetching hostnames:', error);
    res.status(500).json({ error: 'Failed to fetch hostnames', details: error.message });
  }
});

// Compare reports
app.post('/api/reports/compare', (req, res) => {
  try {
    const { reportIds } = req.body;
    
    if (!Array.isArray(reportIds) || reportIds.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 report IDs to compare' });
    }

    const foundReports = reportIds
      .map(id => reports.find(r => r.id === parseInt(id)))
      .filter(r => r !== undefined);

    if (foundReports.length !== reportIds.length) {
      return res.status(404).json({ error: 'One or more reports not found' });
    }

    const result = foundReports.map(r => ({
      id: r.id,
      data: r.report_data
    }));

    res.json({ reports: result });
  } catch (error) {
    console.error('Error comparing reports:', error);
    res.status(500).json({ error: 'Failed to compare reports', details: error.message });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const totalReports = reports.length;
    const totalVulns = reports.reduce((sum, r) => sum + (r.vulnerabilities_count || 0), 0);
    const totalAlerts = reports.reduce((sum, r) => sum + (r.critical_alerts_count || 0), 0);
    const uniqueHostnames = new Set(reports.map(r => r.hostname).filter(h => h)).size;

    res.json({
      totalReports,
      totalVulnerabilities: totalVulns,
      totalCriticalAlerts: totalAlerts,
      uniqueHostnames
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database file: ${dbPath}`);
});
