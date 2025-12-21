import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ReportService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Get all reports for current user
  async getMyReports(params = {}) {
    try {
      const response = await this.api.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report by ID
  async getReportDetails(reportId) {
    try {
      const response = await this.api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new report
  async createReport(reportData) {
    try {
      const response = await this.api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update report
  async updateReport(reportId, reportData) {
    try {
      const response = await this.api.put(`/reports/${reportId}`, reportData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete report
  async deleteReport(reportId) {
    try {
      const response = await this.api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Regenerate report
  async regenerateReport(reportId) {
    try {
      const response = await this.api.post(`/reports/${reportId}/regenerate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Download report
  async downloadReport(reportId, format = 'pdf') {
    try {
      const response = await this.api.get(`/reports/${reportId}/download`, {
        params: { format },
        responseType: 'blob', // Important for file downloads
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report statistics
  async getReportStats() {
    try {
      const response = await this.api.get('/reports/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report templates
  async getTemplates() {
    try {
      const response = await this.api.get('/reports/templates');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get scheduled reports
  async getScheduledReports() {
    try {
      const response = await this.api.get('/reports/scheduled');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Schedule report
  async scheduleReport(reportId, scheduleConfig) {
    try {
      const response = await this.api.post(`/reports/${reportId}/schedule`, scheduleConfig);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancel scheduled report
  async cancelScheduledReport(scheduleId) {
    try {
      const response = await this.api.delete(`/reports/scheduled/${scheduleId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Share report
  async shareReport(reportId, shareData) {
    try {
      const response = await this.api.post(`/reports/${reportId}/share`, shareData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get shared reports
  async getSharedReports() {
    try {
      const response = await this.api.get('/reports/shared');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Revoke report share
  async revokeShare(shareId) {
    try {
      const response = await this.api.delete(`/reports/share/${shareId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report categories
  async getCategories() {
    try {
      const response = await this.api.get('/reports/categories');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Export report data (raw data)
  async exportReportData(reportId, format = 'json') {
    try {
      const response = await this.api.get(`/reports/${reportId}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_data_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report generation history
  async getGenerationHistory(reportId) {
    try {
      const response = await this.api.get(`/reports/${reportId}/history`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report preview (thumbnail or summary)
  async getReportPreview(reportId) {
    try {
      const response = await this.api.get(`/reports/${reportId}/preview`, {
        responseType: 'blob',
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Clone report
  async cloneReport(reportId, newName) {
    try {
      const response = await this.api.post(`/reports/${reportId}/clone`, { newName });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Batch delete reports
  async batchDeleteReports(reportIds) {
    try {
      const response = await this.api.post('/reports/batch-delete', { reportIds });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search reports
  async searchReports(query, filters = {}) {
    try {
      const response = await this.api.post('/reports/search', {
        query,
        filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report formats
  getAvailableFormats() {
    return [
      { value: 'pdf', label: 'PDF Document', icon: 'FileText', mimeType: 'application/pdf' },
      { value: 'excel', label: 'Excel Spreadsheet', icon: 'Table', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { value: 'csv', label: 'CSV File', icon: 'FileSpreadsheet', mimeType: 'text/csv' },
      { value: 'json', label: 'JSON Data', icon: 'Code', mimeType: 'application/json' },
      { value: 'html', label: 'HTML Report', icon: 'FileCode', mimeType: 'text/html' },
    ];
  }

  // Get report types
  getAvailableTypes() {
    return [
      { value: 'analytics', label: 'Analytics Report', description: 'Performance metrics and analytics' },
      { value: 'performance', label: 'Performance Report', description: 'System performance overview' },
      { value: 'usage', label: 'Usage Report', description: 'User and resource usage statistics' },
      { value: 'financial', label: 'Financial Report', description: 'Revenue and cost analysis' },
      { value: 'audit', label: 'Audit Report', description: 'Security and compliance audit' },
      { value: 'custom', label: 'Custom Report', description: 'Build your own report' },
    ];
  }

  // Get date range options
  getDateRangeOptions() {
    return [
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'last_7_days', label: 'Last 7 days' },
      { value: 'last_30_days', label: 'Last 30 days' },
      { value: 'this_month', label: 'This month' },
      { value: 'last_month', label: 'Last month' },
      { value: 'this_quarter', label: 'This quarter' },
      { value: 'last_quarter', label: 'Last quarter' },
      { value: 'this_year', label: 'This year' },
      { value: 'last_year', label: 'Last year' },
      { value: 'custom', label: 'Custom range' },
    ];
  }

  // Get schedule frequency options
  getScheduleOptions() {
    return [
      { value: 'daily', label: 'Daily', description: 'Every day at specified time' },
      { value: 'weekly', label: 'Weekly', description: 'Every week on specified day' },
      { value: 'monthly', label: 'Monthly', description: 'Every month on specified date' },
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'yearly', label: 'Yearly', description: 'Every year' },
    ];
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Simulate report generation progress (for demo/testing)
  simulateReportGeneration(reportId, progressCallback, duration = 5000) {
    return new Promise((resolve) => {
      const steps = [
        { progress: 10, message: 'Initializing report generation...' },
        { progress: 25, message: 'Collecting data from sources...' },
        { progress: 40, message: 'Processing and analyzing data...' },
        { progress: 60, message: 'Generating charts and visualizations...' },
        { progress: 80, message: 'Formatting report layout...' },
        { progress: 95, message: 'Finalizing and optimizing...' },
        { progress: 100, message: 'Report generated successfully!' },
      ];

      let currentStep = 0;
      const intervalTime = duration / steps.length;

      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          const step = steps[currentStep];
          if (progressCallback) {
            progressCallback(step.progress, step.message);
          }
          currentStep++;
        } else {
          clearInterval(interval);
          resolve({
            id: reportId,
            status: 'completed',
            downloadUrl: `/api/reports/${reportId}/download`,
            size: this.formatFileSize(Math.floor(Math.random() * 5000000) + 1000000), // 1-6 MB
          });
        }
      }, intervalTime);
    });
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText;
      const status = error.response.status;
      
      return {
        message,
        status,
        data: error.response.data,
        isNetworkError: false,
      };
    } else if (error.request) {
      return {
        message: 'No response received from server. Please check your connection.',
        status: null,
        data: null,
        isNetworkError: true,
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred.',
        status: null,
        data: null,
        isNetworkError: false,
      };
    }
  }
}

// Create singleton instance
const reportService = new ReportService();

export { ReportService, reportService };