/**
 * Real Google Sheets Service
 * Uses Google Sheets API directly with API key
 */

import { GOOGLE_SHEETS_CONFIG } from '../config/googleSheetsConfig';

class GoogleSheetsServiceReal {
  constructor() {
    this.apiKey = GOOGLE_SHEETS_CONFIG.API_KEY;
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
    this.range = GOOGLE_SHEETS_CONFIG.RANGE;
    this.baseUrl = GOOGLE_SHEETS_CONFIG.BASE_URL;
  }

  /**
   * Make API request to Google Sheets
   */
  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}/${this.spreadsheetId}/${endpoint}?key=${this.apiKey}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Sheets API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Google Sheets API Request Error:', error);
      throw error;
    }
  }

  /**
   * Read data from Google Sheets
   */
  async readData() {
    try {
      const endpoint = `values/${this.range}`;
      const response = await this.makeRequest(endpoint);
      
      if (response.values && response.values.length > 0) {
        return response.values;
      }
      
      // Return header row if no data
      return [['Name', 'Passport', 'Tracking ID', 'DOB', 'Application Date', 'Status', 'Created', 'Actions']];
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Test connection
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
        message: `Connection failed: ${error.message}`,
        data: null
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
        application.passport || '',
        application.trackingId || '',
        application.dob || '',
        application.applicationDate || '',
        application.status || '',
        new Date().toISOString(),
        'View'
      ];

      const body = {
        values: [rowData]
      };

      const endpoint = `values/${this.range}:append?valueInputOption=USER_ENTERED`;
      await this.makeRequest(endpoint, 'POST', body);
      
      return { success: true };
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
      // First, find the row with the tracking ID
      const data = await this.readData();
      const rowIndex = data.findIndex(row => row[2] === trackingId);
      
      if (rowIndex === -1) {
        throw new Error('Application not found');
      }

      // Update the status (column F, index 5)
      const updateRange = `Sheet1!F${rowIndex + 1}`;
      const body = {
        values: [[newStatus]]
      };

      const endpoint = `values/${updateRange}?valueInputOption=USER_ENTERED`;
      await this.makeRequest(endpoint, 'PUT', body);
      
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
      // First, find the row with the tracking ID
      const data = await this.readData();
      const rowIndex = data.findIndex(row => row[2] === trackingId);
      
      if (rowIndex === -1) {
        throw new Error('Application not found');
      }

      // Delete the row
      const body = {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Assuming first sheet
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      };

      const endpoint = 'batchUpdate';
      await this.makeRequest(endpoint, 'POST', body);
      
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
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
        row[2] === trackingId && row[3] === dob
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
   * Sync all applications to Google Sheets
   */
  async syncAllData(applications) {
    try {
      // Clear existing data first
      await this.clearAllData();
      
      // Add header row
      const headerRow = ['Name', 'Passport', 'Tracking ID', 'DOB', 'Application Date', 'Status', 'Created', 'Actions'];
      
      // Add all applications
      const allData = [headerRow];
      for (const app of applications) {
        allData.push([
          app.name || '',
          app.passport || '',
          app.trackingId || '',
          app.dob || '',
          app.applicationDate || '',
          app.status || '',
          new Date().toISOString(),
          'View'
        ]);
      }
      
      const body = {
        values: allData
      };

      const endpoint = `values/${this.range}?valueInputOption=USER_ENTERED`;
      await this.makeRequest(endpoint, 'PUT', body);
      
      return true;
    } catch (error) {
      console.error('Error syncing all data:', error);
      throw error;
    }
  }

  /**
   * Clear all data from Google Sheets
   */
  async clearAllData() {
    try {
      const body = {
        requests: [{
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1000, // Clear first 1000 rows
              startColumnIndex: 0,
              endColumnIndex: 8 // Clear first 8 columns
            },
            fields: 'userEnteredValue'
          }
        }]
      };

      const endpoint = 'batchUpdate';
      await this.makeRequest(endpoint, 'POST', body);
      
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const googleSheetsServiceReal = new GoogleSheetsServiceReal();

export default googleSheetsServiceReal;

