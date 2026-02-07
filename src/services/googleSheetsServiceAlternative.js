/**
 * Alternative Google Sheets Service
 * Uses a different approach to work with Google Sheets
 */

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
  API_KEY: 'AIzaSyATICMwPuYaVBd4jXBqAy4rWlyTB6y2tac',
  SPREADSHEET_ID: '1ZiRqclmNtWnZCMka37z2dmDdl2tjDw4hZUbTCkYUW54',
  RANGE: 'Sheet1!A:H',
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};

class AlternativeGoogleSheetsService {
  constructor() {
    this.apiKey = GOOGLE_SHEETS_CONFIG.API_KEY;
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
    this.range = GOOGLE_SHEETS_CONFIG.RANGE;
    this.baseUrl = GOOGLE_SHEETS_CONFIG.BASE_URL;
    this.localStorageKey = 'vfs_applications_google_sheets';
  }

  /**
   * Read data from localStorage (fallback)
   */
  async readData() {
    try {
      // First try to read from localStorage
      const localData = localStorage.getItem(this.localStorageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // If no local data, return header row
      return [['Name', 'Passport', 'Tracking ID', 'DOB', 'Date', 'Status', 'Created', 'Actions']];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [['Name', 'Passport', 'Tracking ID', 'DOB', 'Date', 'Status', 'Created', 'Actions']];
    }
  }

  /**
   * Test connection (always successful for localStorage)
   */
  async testConnection() {
    try {
      const data = await this.readData();
      return {
        success: true,
        message: 'Local Storage connection successful (Google Sheets API requires OAuth2)',
        dataCount: data.length,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        message: `Local Storage connection failed: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Add single application to localStorage
   */
  async addApplication(application) {
    try {
      const currentData = await this.readData();
      
      const rowData = [
        application.name || '',
        application.passport || '',
        application.trackingId || '',
        application.dob || '',
        application.applicationDate || '',
        application.status || '',
        new Date().toLocaleDateString(),
        'View'
      ];

      // Add to data
      currentData.push(rowData);
      
      // Save back to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(currentData));
      
      return { success: true };
    } catch (error) {
      console.error('Error adding application to localStorage:', error);
      throw error;
    }
  }

  /**
   * Update application status in localStorage
   */
  async updateApplicationStatus(trackingId, newStatus) {
    try {
      const data = await this.readData();
      const rowIndex = data.findIndex(row => row[2] === trackingId); // Tracking ID is in column C (index 2)
      
      if (rowIndex === -1) {
        throw new Error('Application not found');
      }

      // Update status (column F, index 5)
      data[rowIndex][5] = newStatus;
      
      // Save back to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  /**
   * Delete application from localStorage
   */
  async deleteApplication(trackingId) {
    try {
      const data = await this.readData();
      const rowIndex = data.findIndex(row => row[2] === trackingId); // Tracking ID is in column C (index 2)
      
      if (rowIndex === -1) {
        throw new Error('Application not found');
      }

      // Remove the row
      data.splice(rowIndex, 1);
      
      // Save back to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  }

  /**
   * Sync all applications to localStorage
   */
  async syncAllData(applications) {
    try {
      // Start with header
      const data = [['Name', 'Passport', 'Tracking ID', 'DOB', 'Date', 'Status', 'Created', 'Actions']];
      
      // Add all applications
      for (const app of applications) {
        data.push([
          app.name || '',
          app.passport || '',
          app.trackingId || '',
          app.dob || '',
          app.applicationDate || '',
          app.status || '',
          new Date().toLocaleDateString(),
          'View'
        ]);
      }
      
      // Save to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Error syncing all data to localStorage:', error);
      throw error;
    }
  }

  /**
   * Find application by tracking ID and DOB
   */
  async findApplication(trackingId, dob) {
    try {
      const data = await this.readData();
      const foundApplication = data.find(row => 
        row[2] === trackingId && row[3] === dob // Tracking ID in column C, DOB in column D
      );
      
      if (foundApplication) {
        return {
          name: foundApplication[0] || '',
          passport: foundApplication[1] || '',
          trackingId: foundApplication[2] || '',
          dob: foundApplication[3] || '',
          applicationDate: foundApplication[4] || '',
          status: foundApplication[5] || '',
          created: foundApplication[6] || '',
          actions: foundApplication[7] || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error finding application:', error);
      throw error;
    }
  }

  /**
   * Add header row
   */
  async addHeader() {
    try {
      const data = await this.readData();
      if (data.length === 0 || data[0][0] !== 'Name') {
        data.unshift(['Name', 'Passport', 'Tracking ID', 'DOB', 'Date', 'Status', 'Created', 'Actions']);
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      }
      return true;
    } catch (error) {
      console.error('Error adding header to localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear all data from localStorage
   */
  async clearAllData() {
    try {
      localStorage.removeItem(this.localStorageKey);
      return true;
    } catch (error) {
      console.error('Error clearing localStorage data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const alternativeGoogleSheetsService = new AlternativeGoogleSheetsService();

export default alternativeGoogleSheetsService;

