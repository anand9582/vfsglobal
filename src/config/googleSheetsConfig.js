/**
 * Google Sheets Configuration
 * Update these values with your Google Sheets details
 */

export const GOOGLE_SHEETS_CONFIG = {
  // Get this from Google Cloud Console
  API_KEY: 'AIzaSyATICMwPuYaVBd4jXBqAy4rWlyTB6y2tac', // ← यहाँ अपना API key डालें
  
  // Get this from your Google Sheets URL
  // Example: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
  SPREADSHEET_ID: '1IjQoEtUXbAUr3tW1uzi5xGpOPqTjOinuxrEEk2zb2ts', // ← आपका Spreadsheet ID
  
  // Range for data (A to H columns) - Name, Passport, Tracking ID, DOB, Date, Status, Created, Actions
  RANGE: 'Sheet1!A:H',
  
  // Google Sheets API base URL
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};

// Instructions for setup:
export const SETUP_INSTRUCTIONS = {
  step1: {
    title: 'Create Google Sheet',
    description: 'Create a new Google Sheet with headers: Name, Email, DOB, ApplicationDate, TrackingID, Status',
    action: 'Go to Google Drive → New → Google Sheets'
  },
  step2: {
    title: 'Get Spreadsheet ID',
    description: 'Copy the ID from your Google Sheets URL',
    example: 'https://docs.google.com/spreadsheets/d/YOUR_ID_HERE/edit'
  },
  step3: {
    title: 'Enable Google Sheets API',
    description: 'Go to Google Cloud Console and enable Google Sheets API',
    action: 'Google Cloud Console → APIs & Services → Library → Google Sheets API'
  },
  step4: {
    title: 'Create API Key',
    description: 'Generate an API key in Google Cloud Console',
    action: 'APIs & Services → Credentials → Create Credentials → API Key'
  },
  step5: {
    title: 'Update Configuration',
    description: 'Replace the values in this file with your actual API key and Spreadsheet ID',
    action: 'Update API_KEY and SPREADSHEET_ID in this file'
  }
};

// Validation function
export const validateConfig = () => {
  const { API_KEY, SPREADSHEET_ID } = GOOGLE_SHEETS_CONFIG;
  
  if (API_KEY === 'YOUR_API_KEY_HERE' || !API_KEY) {
    return {
      valid: false,
      message: 'Please update API_KEY in googleSheetsConfig.js'
    };
  }
  
  if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE' || !SPREADSHEET_ID) {
    return {
      valid: false,
      message: 'Please update SPREADSHEET_ID in googleSheetsConfig.js'
    };
  }
  
  return {
    valid: true,
    message: 'Configuration is valid'
  };
};

// Example configuration (replace with your actual values):
/*
export const GOOGLE_SHEETS_CONFIG = {
  API_KEY: 'AIzaSyBvOkBwv7wjK8jL9mN0pQrS2tU3vWxYzA1bC2dE3f',
  SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  RANGE: 'Sheet1!A:F',
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};
*/