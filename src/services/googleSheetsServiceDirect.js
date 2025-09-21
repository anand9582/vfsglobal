/**
 * Direct Google Sheets Service
 * Uses Google Sheets API with proper authentication
 */

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
  API_KEY: 'AIzaSyATICMwPuYaVBd4jXBqAy4rWlyTB6y2tac',
  SPREADSHEET_ID: '1ZiRqclmNtWnZCMka37z2dmDdl2tjDw4hZUbTCkYUW54',
  RANGE: 'Sheet1!A:H',
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};

class DirectGoogleSheetsService {
  constructor() {
    this.apiKey = GOOGLE_SHEETS_CONFIG.API_KEY;
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
    this.range = GOOGLE_SHEETS_CONFIG.RANGE;
    this.baseUrl = GOOGLE_SHEETS_CONFIG.BASE_URL;
  }

  /**
   * Read data from Google Sheets
   */
  async readData() {
    try {
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${this.range}?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection() {
    try {
      const data = await this.readData();
      return {
        success: true,
        message: 'Google Sheets connection successful',
        dataCount: data.length,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        message: `Google Sheets connection failed: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Add single application to Google Sheets
   */
  async addApplication(application) {
    try {
      // First, get current data to find the next empty row
      const currentData = await this.readData();
      const nextRow = currentData.length + 1; // +1 because we have headers
      
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

      // Use batch update to add data
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/Sheet1!A${nextRow}:H${nextRow}?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding application to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Update application status in Google Sheets
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
      
      const range = `Sheet1!A${rowIndex + 1}:H${rowIndex + 1}`;
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [data[rowIndex]]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  /**
   * Delete application from Google Sheets
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
      
      // Clear the range and update with remaining data
      const range = `Sheet1!A1:H${data.length}`;
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  }

  /**
   * Sync all applications to Google Sheets
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
      
      // Update entire sheet
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/Sheet1!A1:H${data.length}?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      return true;
    } catch (error) {
      console.error('Error syncing all data to Google Sheets:', error);
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
}

// Create singleton instance
const directGoogleSheetsService = new DirectGoogleSheetsService();

export default directGoogleSheetsService;

