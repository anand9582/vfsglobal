/**
 * Hybrid Google Sheets Service
 * Tries Google Sheets first, falls back to localStorage if it fails
 */

import simpleGoogleSheetsService from './googleSheetsServiceSimple';
import localStorageService from './localStorageService';

class HybridGoogleSheetsService {
  constructor() {
    this.googleSheetsEnabled = true;
    this.lastError = null;
  }

  /**
   * Read data - try Google Sheets first, then localStorage
   */
  async readData() {
    if (this.googleSheetsEnabled) {
      try {
        const data = await simpleGoogleSheetsService.readData();
        this.lastError = null;
        return data;
      } catch (error) {
        console.warn('Google Sheets failed, falling back to localStorage:', error);
        this.lastError = error;
        this.googleSheetsEnabled = false;
      }
    }
    
    return await localStorageService.readData();
  }

  /**
   * Test connection
   */
  async testConnection() {
    if (this.googleSheetsEnabled) {
      try {
        const result = await simpleGoogleSheetsService.testConnection();
        if (result.success) {
          this.lastError = null;
          return result;
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.warn('Google Sheets test failed, testing localStorage:', error);
        this.lastError = error;
        this.googleSheetsEnabled = false;
      }
    }
    
    return await localStorageService.testConnection();
  }

  /**
   * Add single application
   */
  async addApplication(application) {
    if (this.googleSheetsEnabled) {
      try {
        const result = await simpleGoogleSheetsService.addApplication(application);
        this.lastError = null;
        return result;
      } catch (error) {
        console.warn('Google Sheets add failed, falling back to localStorage:', error);
        this.lastError = error;
        this.googleSheetsEnabled = false;
      }
    }
    
    return await localStorageService.addApplication(application);
  }

  /**
   * Sync all data
   */
  async syncAllData(applications) {
    if (this.googleSheetsEnabled) {
      try {
        const result = await simpleGoogleSheetsService.syncAllData(applications);
        this.lastError = null;
        return result;
      } catch (error) {
        console.warn('Google Sheets sync failed, falling back to localStorage:', error);
        this.lastError = error;
        this.googleSheetsEnabled = false;
      }
    }
    
    return await localStorageService.syncAllData(applications);
  }

  /**
   * Add header
   */
  async addHeader() {
    if (this.googleSheetsEnabled) {
      try {
        const result = await simpleGoogleSheetsService.addHeader();
        this.lastError = null;
        return result;
      } catch (error) {
        console.warn('Google Sheets header add failed, falling back to localStorage:', error);
        this.lastError = error;
        this.googleSheetsEnabled = false;
      }
    }
    
    return await localStorageService.addHeader();
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    if (this.googleSheetsEnabled) {
      try {
        const result = await simpleGoogleSheetsService.clearAllData();
        this.lastError = null;
        return result;
      } catch (error) {
        console.warn('Google Sheets clear failed, falling back to localStorage:', error);
        this.lastError = error;
        this.googleSheetsEnabled = false;
      }
    }
    
    return await localStorageService.clearAllData();
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      googleSheetsEnabled: this.googleSheetsEnabled,
      lastError: this.lastError,
      currentService: this.googleSheetsEnabled ? 'Google Sheets' : 'Local Storage'
    };
  }

  /**
   * Reset to try Google Sheets again
   */
  reset() {
    this.googleSheetsEnabled = true;
    this.lastError = null;
  }
}

// Create singleton instance
const hybridGoogleSheetsService = new HybridGoogleSheetsService();

export default hybridGoogleSheetsService;
