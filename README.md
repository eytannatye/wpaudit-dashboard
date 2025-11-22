# WPAudit JSON Viewer

A React-based web application for viewing and analyzing WordPress security audit reports in JSON format.

## Features

- 📤 **File Upload**: Drag-and-drop or click to upload WPAudit JSON reports
- 💾 **Database Storage**: JSON file-based storage to save and manage all reports
- 📋 **Report Management**: List, search, filter, and view saved reports
- 🔄 **Report Comparison**: Compare multiple reports side-by-side
- 📊 **Structured Display**: Organized sections for all report data
- 🎨 **Modern UI**: Clean, responsive design with color-coded severity levels
- 🔍 **Comprehensive Analysis**: View all aspects of the security audit:
  - Scan metadata and tool checks
  - WPScan results (WordPress version, themes, plugins, vulnerabilities)
  - WP Analyzer findings (security headers, file exposure, configuration audit, etc.)
  - XSS analysis
  - Critical alerts and remediation suggestions
  - Tool errors

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

3. Start the backend server (in one terminal):
```bash
cd server
npm start
```

4. Start the frontend development server (in another terminal):
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Running Both Servers

You can run both servers simultaneously. The backend API runs on `http://localhost:3001` and the frontend on `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Click "Browse Files" or drag and drop a WPAudit JSON report file
2. The application will parse and validate the JSON
3. View all sections of the report in an organized, easy-to-read format
4. Click section headers to expand/collapse sections
5. Use "Upload New Report" to analyze another file

## Project Structure

```
cursor-wpaudit/
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx          # File upload component
│   │   ├── ReportViewer.jsx        # Main report display
│   │   ├── sections/                # Individual report sections
│   │   └── common/                 # Reusable components
│   ├── utils/                       # Utility functions
│   ├── styles/                      # Global styles
│   ├── App.jsx                      # Main app component
│   └── main.jsx                     # Entry point
├── package.json
└── vite.config.js
```

## Technologies Used

- React 18
- Vite
- CSS3

## License

This project is based on the WPAudit project and uses the MIT License. See [LICENSE.txt](LICENSE.txt) for details.

Copyright (c) 2025 Huzaifa Shoukat



