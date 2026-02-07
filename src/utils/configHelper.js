/**
 * Configuration Helper
 * Helps with Google Sheets setup and validation
 */

export const getConfigTemplate = () => {
  return `
// Copy this template to src/config/googleSheetsConfig.js
export const GOOGLE_SHEETS_CONFIG = {
  API_KEY: 'YOUR_API_KEY_HERE', // Replace with your actual API key
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE', // Replace with your actual Spreadsheet ID
  RANGE: 'Sheet1!A:F',
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};
`;
};

export const getSetupSteps = () => {
  return [
    {
      step: 1,
      title: 'Create Google Sheet',
      description: 'Go to Google Drive and create a new Google Sheet',
      action: 'Google Drive → New → Google Sheets',
      details: 'Name it "VFS Applications"'
    },
    {
      step: 2,
      title: 'Add Headers',
      description: 'Add these exact headers in the first row',
      action: 'Row 1: Name | Email | DOB | ApplicationDate | TrackingID | Status',
      details: 'Make sure headers are exactly as shown'
    },
    {
      step: 3,
      title: 'Share Sheet',
      description: 'Make the sheet accessible to your app',
      action: 'Click Share → "Anyone with link can edit"',
      details: 'This allows the API to read and write data'
    },
    {
      step: 4,
      title: 'Get Spreadsheet ID',
      description: 'Copy the ID from your Google Sheets URL',
      action: 'From URL: /d/SPREADSHEET_ID_HERE/edit',
      details: 'The long string between /d/ and /edit'
    },
    {
      step: 5,
      title: 'Google Cloud Console',
      description: 'Set up API access',
      action: 'Google Cloud Console → Create Project → Enable Google Sheets API → Create API Key',
      details: 'Make sure to enable Google Sheets API specifically'
    },
    {
      step: 6,
      title: 'Update Configuration',
      description: 'Replace the placeholder values in your config file',
      action: 'Edit src/config/googleSheetsConfig.js with your actual values',
      details: 'Replace YOUR_API_KEY_HERE and YOUR_SPREADSHEET_ID_HERE'
    }
  ];
};

export const validateGoogleSheetsUrl = (url) => {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const getCommonErrors = () => {
  return [
    {
      error: 'API_KEY not set',
      solution: 'Update API_KEY in googleSheetsConfig.js with your actual API key from Google Cloud Console'
    },
    {
      error: 'SPREADSHEET_ID not set',
      solution: 'Update SPREADSHEET_ID in googleSheetsConfig.js with your actual Spreadsheet ID from the URL'
    },
    {
      error: 'HTTP 403 Forbidden',
      solution: 'Check if Google Sheets API is enabled in Google Cloud Console and API key is correct'
    },
    {
      error: 'HTTP 404 Not Found',
      solution: 'Check if Spreadsheet ID is correct and sheet is shared properly'
    },
    {
      error: 'CORS error',
      solution: 'Google Sheets API doesn\'t have CORS issues. Check your API key and permissions'
    },
    {
      error: 'No data returned',
      solution: 'Check if sheet has data and headers are in the first row'
    }
  ];
};

