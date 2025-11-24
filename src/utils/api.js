import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Extract report prefix from filename
 * Format: wpaudit_report_{domain}_{timestamp}_{type}
 */
export const getReportPrefix = (filename) => {
  const match = filename.match(/^(wpaudit_report_[^_]+_\d{8}_\d{6})_/);
  return match ? match[1] : null;
};

/**
 * Detect file type from filename
 */
export const detectFileType = (filename) => {
  if (filename.includes('_FULL_REPORT.json')) {
    return 'full_report';
  } else if (filename.includes('_wpscan_') && filename.endsWith('.json')) {
    return 'wpscan_json';
  } else if (filename.includes('_subfinder.txt')) {
    return 'subfinder_txt';
  } else if (filename.includes('_wpscan_') && filename.endsWith('.log')) {
    return 'wpscan_log';
  }
  return null;
};

/**
 * Generate a unique fingerprint for a report to prevent duplicates
 */
const generateFingerprint = (reportData, fileType, filename) => {
  const reportPrefix = getReportPrefix(filename);
  const metadata = reportData.scan_metadata || {};
  const targetInfo = metadata.target_info || {};
  
  // Calculate a simple content size (not perfect but good enough)
  const contentSize = JSON.stringify(reportData).length;
  
  const fingerprint = {
    reportPrefix,
    fileType,
    scanStartTime: metadata.start_time || null,
    targetUrl: targetInfo.url || null,
    contentSize
  };
  
  // Create a string hash from the fingerprint
  const fingerprintString = `${reportPrefix}|${fileType}|${metadata.start_time}|${targetInfo.url}|${contentSize}`;
  
  return {
    fingerprint,
    fingerprintString
  };
};

/**
 * Extract metadata from report data
 * @param {*} reportData - The report data
 * @param {string} fileType - The file type
 * @param {string} reportPrefix - Optional report prefix to extract domain from
 */
const extractMetadata = (reportData, fileType, reportPrefix = null) => {
  // Try to extract domain from reportPrefix as fallback
  let domainFromPrefix = null;
  if (reportPrefix) {
    const domainMatch = reportPrefix.match(/^wpaudit_report_([^_]+)_\d{8}_\d{6}$/);
    if (domainMatch) {
      domainFromPrefix = domainMatch[1];
    }
  }

  if (fileType !== 'full_report' || typeof reportData !== 'object' || !reportData) {
    return {
      target_url: domainFromPrefix ? `https://${domainFromPrefix}` : null,
      hostname: domainFromPrefix,
      scan_date: null,
      scan_start_time: null,
      scan_end_time: null,
      vulnerabilities_count: 0,
      critical_alerts_count: 0
    };
  }

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
    target_url: targetInfo.url || (domainFromPrefix ? `https://${domainFromPrefix}` : null),
    hostname: targetInfo.hostname || domainFromPrefix,
    scan_date: metadata.start_time ? metadata.start_time.split('T')[0] : null,
    scan_start_time: metadata.start_time || null,
    scan_end_time: metadata.end_time || null,
    vulnerabilities_count: vulnCount,
    critical_alerts_count: (reportData.critical_alerts || []).length
  };
};

/**
 * Save a report to Firestore
 */
export const saveReport = async (reportData, filename = null) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save reports');
    }

    const fileType = filename ? detectFileType(filename) : null;
    const reportPrefix = filename ? getReportPrefix(filename) : null;
    
    console.log('Saving to Firestore:', { filename, fileType, reportPrefix });

    // Check if a report with this prefix already exists (to prevent duplicates)
    if (reportPrefix) {
      const reportsRef = collection(db, 'reports');
      const q = query(
        reportsRef,
        where('userId', '==', auth.currentUser.uid),
        where('reportPrefix', '==', reportPrefix),
        firestoreLimit(1)
      );
      const existingCheck = await getDocs(q);

      if (!existingCheck.empty) {
        const existingDoc = existingCheck.docs[0];
        const existingData = existingDoc.data();
        const uploadedDate = existingData.createdAt?.toDate?.()?.toLocaleDateString('he-IL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) || 'Unknown';
        
        // Try to extract domain from reportPrefix if metadata is not available
        let targetUrl = existingData.metadata?.target_url || existingData.metadata?.hostname;
        if (!targetUrl && reportPrefix) {
          // Extract domain from reportPrefix (wpaudit_report_domain_timestamp)
          const domainMatch = reportPrefix.match(/^wpaudit_report_([^_]+)_\d{8}_\d{6}$/);
          if (domainMatch) {
            targetUrl = domainMatch[1];
          }
        }
        targetUrl = targetUrl || reportPrefix || 'Unknown URL';
        
        throw new Error(`⚠️ דוח זה כבר קיים במערכת!\n\n📊 אתר: ${targetUrl}\n📅 הועלה בתאריך: ${uploadedDate}\n\n💡 כל הקבצים של הסריקה הזו כבר נשמרו.\nאין צורך להעלות אותם שוב.`);
      }
    }
    
    // Generate fingerprint for tracking (but not blocking anymore)
    const { fingerprint, fingerprintString } = generateFingerprint(reportData, fileType, filename);

    // Note: We removed the "update existing report" logic because 
    // we now prevent duplicates entirely at the reportPrefix level

    // Create new report
    const metadata = extractMetadata(reportData, fileType, reportPrefix);
    
    const reportDoc = {
      userId: auth.currentUser.uid,
      reportPrefix: reportPrefix,
      fingerprintString: fingerprintString,
      fingerprint: fingerprint,
      files: {
        [fileType]: reportData
      },
      metadata: metadata,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'reports'), reportDoc);

    return {
      id: docRef.id,
      message: 'Report saved successfully',
      fileType
    };
  } catch (error) {
    console.error('saveReport error:', error);
    throw error;
  }
};

/**
 * Get all reports for the current user with pagination and filtering
 */
export const getReports = async (params = {}) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const reportsRef = collection(db, 'reports');
    let q = query(
      reportsRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // Apply limit if specified
    if (params.limit) {
      q = query(q, firestoreLimit(params.limit));
    }

    const querySnapshot = await getDocs(q);
    const reports = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data.metadata,
        created_at: data.createdAt?.toDate?.()?.toISOString() || null,
        updated_at: data.updatedAt?.toDate?.()?.toISOString() || null
      });
    });

    // Apply search filter if specified (client-side for now)
    let filteredReports = reports;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredReports = reports.filter(r => 
        r.hostname?.toLowerCase().includes(searchLower) ||
        r.target_url?.toLowerCase().includes(searchLower)
      );
    }

    if (params.hostname) {
      filteredReports = filteredReports.filter(r => r.hostname === params.hostname);
    }

    const total = filteredReports.length;
    const limit = params.limit || 20;
    const page = params.page || 1;
    const totalPages = Math.ceil(total / limit);

    return {
      reports: filteredReports,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('getReports error:', error);
    throw error;
  }
};

/**
 * Get a single report by ID
 */
export const getReport = async (id, fileType = null) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const docRef = doc(db, 'reports', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Report not found');
    }

    const data = docSnap.data();

    // Check if user owns this report
    if (data.userId !== auth.currentUser.uid) {
      throw new Error('Unauthorized');
    }

    if (fileType && data.files[fileType]) {
      return {
        id: docSnap.id,
        data: data.files[fileType],
        metadata: data.metadata
      };
    }

    return {
      id: docSnap.id,
      data: data.files.full_report || null,
      files: data.files,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('getReport error:', error);
    throw error;
  }
};

/**
 * Get all files for a report
 */
export const getReportFiles = async (id) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const docRef = doc(db, 'reports', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Report not found');
    }

    const data = docSnap.data();

    // Check if user owns this report
    if (data.userId !== auth.currentUser.uid) {
      throw new Error('Unauthorized');
    }

    return {
      availableFiles: Object.keys(data.files || {})
    };
  } catch (error) {
    console.error('getReportFiles error:', error);
    throw error;
  }
};

/**
 * Delete a report
 */
export const deleteReport = async (id) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const docRef = doc(db, 'reports', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Report not found');
    }

    const data = docSnap.data();

    // Check if user owns this report
    if (data.userId !== auth.currentUser.uid) {
      throw new Error('Unauthorized');
    }

    await deleteDoc(docRef);

    return { success: true, message: 'Report deleted successfully' };
  } catch (error) {
    console.error('deleteReport error:', error);
    throw error;
  }
};

/**
 * Get unique hostnames for filtering
 */
export const getHostnames = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('userId', '==', auth.currentUser.uid));
    const querySnapshot = await getDocs(q);

    const hostnames = new Set();
    querySnapshot.forEach((doc) => {
      const hostname = doc.data().metadata?.hostname;
      if (hostname) {
        hostnames.add(hostname);
      }
    });

    return {
      hostnames: Array.from(hostnames).sort()
    };
  } catch (error) {
    console.error('getHostnames error:', error);
    throw error;
  }
};

/**
 * Get statistics
 */
export const getStats = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('userId', '==', auth.currentUser.uid));
    const querySnapshot = await getDocs(q);

    let totalVulnerabilities = 0;
    let totalCriticalAlerts = 0;
    const hostnames = new Set();
    const recentReports = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const metadata = data.metadata || {};
      
      totalVulnerabilities += metadata.vulnerabilities_count || 0;
      totalCriticalAlerts += metadata.critical_alerts_count || 0;
      
      if (metadata.hostname) {
        hostnames.add(metadata.hostname);
      }

      recentReports.push({
        id: doc.id,
        ...metadata,
        created_at: data.createdAt?.toDate?.()?.toISOString() || null
      });
    });

    // Sort by date and get top 5
    recentReports.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return {
      totalReports: querySnapshot.size,
      totalVulnerabilities,
      totalCriticalAlerts,
      uniqueHostnames: hostnames.size,
      recentReports: recentReports.slice(0, 5),
      topVulnerableReports: recentReports
        .sort((a, b) => (b.vulnerabilities_count || 0) - (a.vulnerabilities_count || 0))
        .slice(0, 5)
    };
  } catch (error) {
    console.error('getStats error:', error);
    throw error;
  }
};

/**
 * Compare multiple reports
 */
export const compareReports = async (reportIds) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const reports = await Promise.all(
      reportIds.map(id => getReport(id))
    );

    return reports;
  } catch (error) {
    console.error('compareReports error:', error);
    throw error;
  }
};
