import React, { useState, useEffect } from 'react';
import { validateConfig } from '../config/googleSheetsConfig';

const GoogleSheetsTest = () => {
  const [configStatus, setConfigStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = () => {
    const validation = validateConfig();
    setConfigStatus(validation);
  };

  const testGoogleSheets = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Test if we can make a request to Google Sheets
      const { GOOGLE_SHEETS_CONFIG } = await import('../config/googleSheetsConfig');
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/values/${GOOGLE_SHEETS_CONFIG.RANGE}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: 'Google Sheets connection successful!',
          data: data.values || []
        });
      } else {
        setTestResult({
          success: false,
          message: `HTTP Error: ${response.status} - ${response.statusText}`,
          data: null
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>Google Sheets Test</h1>
      
      {/* Configuration Status */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        border: '2px solid',
        borderColor: configStatus?.valid ? '#28a745' : '#dc3545',
        borderRadius: '8px',
        backgroundColor: configStatus?.valid ? '#d4edda' : '#f8d7da'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: configStatus?.valid ? '#155724' : '#721c24' }}>
          {configStatus?.valid ? '✅ Configuration Valid' : '❌ Configuration Invalid'}
        </h3>
        <p style={{ margin: '0', color: configStatus?.valid ? '#155724' : '#721c24' }}>
          {configStatus?.message}
        </p>
      </div>

      {/* Test Button */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={testGoogleSheets}
          disabled={loading || !configStatus?.valid}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: configStatus?.valid ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: configStatus?.valid ? 'pointer' : 'not-allowed',
            opacity: configStatus?.valid ? 1 : 0.6
          }}
        >
          {loading ? 'Testing...' : 'Test Google Sheets Connection'}
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          border: '2px solid',
          borderColor: testResult.success ? '#28a745' : '#dc3545',
          borderRadius: '8px',
          backgroundColor: testResult.success ? '#d4edda' : '#f8d7da'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: testResult.success ? '#155724' : '#721c24' }}>
            {testResult.success ? '✅ Test Successful' : '❌ Test Failed'}
          </h3>
          <p style={{ margin: '0 0 10px 0', color: testResult.success ? '#155724' : '#721c24' }}>
            {testResult.message}
          </p>
          {testResult.data && (
            <div>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                Data Rows: {testResult.data.length}
              </p>
              {testResult.data.length > 0 && (
                <div style={{ 
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>Name</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>Email</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>DOB</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>AppDate</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>TrackingID</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResult.data.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} style={{ border: '1px solid #ccc', padding: '4px' }}>
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {testResult.data.length > 5 && (
                    <p style={{ margin: '5px', fontSize: '11px', color: '#666' }}>
                      ... and {testResult.data.length - 5} more rows
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Setup Instructions */}
      {!configStatus?.valid && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#d1ecf1', 
          border: '1px solid #bee5eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>Setup Instructions</h3>
          <ol style={{ margin: '0', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Create Google Sheet:</strong> Go to Google Drive → New → Google Sheets
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Add Headers:</strong> Name, Email, DOB, ApplicationDate, TrackingID, Status
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Share Sheet:</strong> Click Share → "Anyone with link can edit"
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Get Spreadsheet ID:</strong> Copy from URL (long string after /d/ and before /edit)
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Google Cloud Console:</strong> Create project → Enable Google Sheets API → Create API Key
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Update Config:</strong> Edit src/config/googleSheetsConfig.js with your API key and Spreadsheet ID
            </li>
          </ol>
        </div>
      )}

      {/* Quick Fix */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Quick Fix</h3>
        <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
          If you're getting errors, make sure:
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#856404' }}>
          <li>API key is correct and has Google Sheets API enabled</li>
          <li>Spreadsheet ID is correct (from the URL)</li>
          <li>Google Sheet is shared as "Anyone with link can edit"</li>
          <li>Google Sheet has the correct headers in the first row</li>
        </ul>
      </div>
    </div>
  );
};

export default GoogleSheetsTest;
