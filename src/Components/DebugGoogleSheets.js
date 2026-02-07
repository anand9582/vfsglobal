import React, { useState, useEffect } from 'react';
import googleSheetsService from '../services/googleSheetsService';
import { validateConfig } from '../config/googleSheetsConfig';

const DebugGoogleSheets = () => {
  const [configStatus, setConfigStatus] = useState(null);
  const [sheetsData, setSheetsData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    const validation = validateConfig();
    setConfigStatus(validation);
  };

  const testGoogleSheets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await googleSheetsService.readData();
      setSheetsData(data);
      console.log('Google Sheets data:', data);
    } catch (err) {
      setError(err.message);
      console.error('Google Sheets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await googleSheetsService.testConnection();
      console.log('Connection test result:', result);
      alert(`Connection test: ${result.success ? 'SUCCESS' : 'FAILED'}\nMessage: ${result.message}`);
    } catch (err) {
      setError(err.message);
      console.error('Connection test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Google Sheets Debug Tool</h2>
      
      {/* Configuration Status */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Configuration Status</h3>
        <div style={{ 
          color: configStatus?.valid ? 'green' : 'red',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          {configStatus?.valid ? '✅ Valid' : '❌ Invalid'}
        </div>
        <div style={{ color: 'red' }}>
          {configStatus?.message}
        </div>
        
        {!configStatus?.valid && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <strong>Steps to fix:</strong>
            <ol>
              <li>Go to Google Cloud Console</li>
              <li>Enable Google Sheets API</li>
              <li>Create API Key</li>
              <li>Create Google Sheet with headers: Name, Email, DOB, ApplicationDate, TrackingID, Status</li>
              <li>Update src/config/googleSheetsConfig.js with your API key and Spreadsheet ID</li>
            </ol>
          </div>
        )}
      </div>

      {/* Test Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button 
          onClick={testGoogleSheets}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Load Data'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '5px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Data Display */}
      {sheetsData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Google Sheets Data ({sheetsData.length} rows)</h3>
          <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ccc' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>DOB</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>ApplicationDate</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>TrackingID</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sheetsData.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#d1ecf1', 
        border: '1px solid #bee5eb',
        borderRadius: '5px'
      }}>
        <h3>Quick Setup Guide</h3>
        <ol>
          <li><strong>Create Google Sheet:</strong> Go to Google Drive → New → Google Sheets</li>
          <li><strong>Add Headers:</strong> Name, Email, DOB, ApplicationDate, TrackingID, Status</li>
          <li><strong>Share Sheet:</strong> "Anyone with link can edit"</li>
          <li><strong>Get Spreadsheet ID:</strong> Copy from URL (the long string after /d/ and before /edit)</li>
          <li><strong>Google Cloud Console:</strong> Create project → Enable Google Sheets API → Create API Key</li>
          <li><strong>Update Config:</strong> Replace API_KEY and SPREADSHEET_ID in googleSheetsConfig.js</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugGoogleSheets;
