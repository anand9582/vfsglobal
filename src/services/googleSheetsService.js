/**
 * Google Sheets Service for React
 * Direct integration with Google Sheets API
 */

// Import configuration from config file
import { GOOGLE_SHEETS_CONFIG } from '../config/googleSheetsConfig';

class GoogleSheetsService {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Append data to Google Sheets
   */
  async appendData(rowData) {
    try {
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${this.range}:append?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error appending to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Update specific row in Google Sheets
   */
  async updateRow(rowIndex, rowData) {
    try {
      const range = `Sheet1!A${rowIndex}:H${rowIndex}`; // Updated to H column
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}&valueInputOption=RAW`;
      
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Clear row in Google Sheets
   */
  async clearRow(rowIndex) {
    try {
      const range = `Sheet1!A${rowIndex}:H${rowIndex}`; // Updated to H column
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [['', '', '', '', '', '', '', '']] // Clear the row (8 columns)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing Google Sheets row:', error);
      throw error;
    }
  }

  /**
   * Sync all applications to Google Sheets
   */
  async syncAllData(applications) {
    try {
      // First, clear existing data (except header)
      await this.clearAllData();
      
      // Add header (matching your Google Sheet)
      await this.appendData(['Name', 'Passport', 'Tracking ID', 'DOB', 'Date', 'Status', 'Created', 'Actions']);
      
      // Add all applications
      for (const app of applications) {
        await this.appendData([
          app.name || '',
          app.passport || '', // Changed from email to passport
          app.trackingId || '',
          app.dob || '',
          app.applicationDate || '', // This is your Date column
          app.status || '',
          new Date().toLocaleDateString(), // Created date
          'View' // Actions
        ]);
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing all data to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Clear all data from Google Sheets (except header)
   */
  async clearAllData() {
    try {
      const range = 'Sheet1!A2:Z1000'; // Clear from row 2 to 1000
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing Google Sheets data:', error);
      throw error;
    }
  }

  /**
   * Test Google Sheets connection
   */
  async testConnection() {
    try {
      const data = await this.readData();
      return {
        success: true,
        message: 'Google Sheets connection successful',
        dataCount: data.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Google Sheets connection failed: ${error.message}`
      };
    }
  }

  /**
   * Add single application to Google Sheets
   */
  async addApplication(application) {
    try {
      const rowData = [
        application.name || '',
        application.passport || '', // Changed from email to passport
        application.trackingId || '',
        application.dob || '',
        application.applicationDate || '', // This is your Date column
        application.status || '',
        new Date().toLocaleDateString(), // Created date
        'View' // Actions
      ];
      
      return await this.appendData(rowData);
    } catch (error) {
      console.error('Error adding application to Google Sheets:', error);
      throw error;
    }
  }
}

// Create singleton instance
const googleSheetsService = new GoogleSheetsService();

export default googleSheetsService;
