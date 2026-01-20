/**
 * Simple Google Sheets Service using API Key
 * This service uses a different approach to work with Google Sheets
 */

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
  API_KEY: 'AIzaSyATICMwPuYaVBd4jXBqAy4rWlyTB6y2tac',
  SPREADSHEET_ID: '1ZiRqclmNtWnZCMka37z2dmDdl2tjDw4hZUbTCkYUW54',
  RANGE: 'Sheet1!A:H',
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};

class SimpleGoogleSheetsService {
  constructor() {
    this.apiKey = GOOGLE_SHEETS_CONFIG.API_KEY;
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
    this.range = GOOGLE_SHEETS_CONFIG.RANGE;
    this.baseUrl = GOOGLE_SHEETS_CONFIG.BASE_URL;
  }

  /**
   * Read data from Google Sheets using GET request
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
   * Add single application to Google Sheets using batch update
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
   * Sync all applications to Google Sheets
   */
  async syncAllData(applications) {
    try {
      // Clear existing data first
      await this.clearAllData();
      
      // Add header
      await this.addHeader();
      
      // Add all applications
      for (const app of applications) {
        await this.addApplication(app);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing all data to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Add header row
   */
  async addHeader() {
    try {
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/Sheet1!A1:H1?key=${this.apiKey}&valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [['Name', 'Passport', 'Tracking ID', 'DOB', 'Date', 'Status', 'Created', 'Actions']]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      return true;
    } catch (error) {
      console.error('Error adding header to Google Sheets:', error);
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
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing Google Sheets data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const simpleGoogleSheetsService = new SimpleGoogleSheetsService();

export default simpleGoogleSheetsService;

