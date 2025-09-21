/**
 * Local Storage Service as fallback
 * This service provides the same interface as Google Sheets service
 * but stores data in localStorage instead
 */

class LocalStorageService {
  constructor() {
    this.storageKey = 'vfs_applications_google_sheets';
  }

  /**
   * Read data from localStorage
   */
  async readData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        // Return header row if no data
        return [['Name', 'Passport', 'Tracking ID', 'DOB', 'Date', 'Status', 'Created', 'Actions']];
      }
      return JSON.parse(data);
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
        message: 'Local Storage connection successful',
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
      localStorage.setItem(this.storageKey, JSON.stringify(currentData));
      
      return { success: true };
    } catch (error) {
      console.error('Error adding application to localStorage:', error);
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
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Error syncing all data to localStorage:', error);
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
        localStorage.setItem(this.storageKey, JSON.stringify(data));
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
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing localStorage data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

export default localStorageService;
