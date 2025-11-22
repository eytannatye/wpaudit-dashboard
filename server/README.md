# WPAudit API Server

Backend API server for the WPAudit JSON Viewer application.

## Features

- SQLite database for storing full JSON reports
- RESTful API endpoints for CRUD operations
- Search and filter capabilities
- Report comparison functionality
- Statistics endpoint

## Installation

```bash
cd server
npm install
```

## Running the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### POST /api/reports
Save a new report to the database.

**Request Body:**
```json
{
  "scan_metadata": {...},
  "findings": {...},
  ...
}
```

**Response:**
```json
{
  "id": 1,
  "message": "Report saved successfully",
  "target_url": "https://example.com",
  ...
}
```

### GET /api/reports
Get all reports with pagination and filtering.

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `search` - Search by URL or hostname
- `hostname` - Filter by hostname
- `sortBy` - Sort column (created_at, scan_date, target_url, etc.)
- `sortOrder` - ASC or DESC

**Response:**
```json
{
  "reports": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/reports/:id
Get a single report by ID.

**Response:**
Full JSON report data

### DELETE /api/reports/:id
Delete a report by ID.

### GET /api/hostnames
Get list of unique hostnames for filtering.

### POST /api/reports/compare
Compare multiple reports.

**Request Body:**
```json
{
  "reportIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "reports": [
    {"id": 1, "data": {...}},
    {"id": 2, "data": {...}}
  ]
}
```

### GET /api/stats
Get database statistics.

**Response:**
```json
{
  "totalReports": 50,
  "totalVulnerabilities": 150,
  "totalCriticalAlerts": 75,
  "uniqueHostnames": 10
}
```

## Database

The database uses a JSON file (`wpaudit-db.json`) that is created automatically in the `server` directory. This approach is simple, portable, and doesn't require any native compilation, making it compatible with all Node.js versions.

## Environment Variables

- `PORT` - Server port (default: 3001)

