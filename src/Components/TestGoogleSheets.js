import React, { useState, useEffect } from 'react';
import { validateConfig } from '../config/googleSheetsConfig';
import googleSheetsServiceReal from '../services/googleSheetsServiceReal';

const TestGoogleSheets = () => {
  const [configStatus, setConfigStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [serviceStatus, setServiceStatus] = useState(null);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = () => {
    const validation = validateConfig();
    setConfigStatus(validation);
  };

  const testConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const result = await googleSheetsServiceReal.testConnection();
      setTestResult(result);
      
      if (result.success) {
        // Load actual data
        const sheetsData = await googleSheetsServiceReal.readData();
        setData(sheetsData);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`
      });
      
      // Set service status
      setServiceStatus({
        currentService: 'Google Sheets',
        googleSheetsEnabled: false,
        lastError: error
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestData = async () => {
    try {
      const testApplication = {
        name: 'Test User',
        passport: 'A1234567',
        trackingId: 'TEST' + Date.now(),
        dob: '1990-01-01',
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'Under Process'
      };
      
      await googleSheetsServiceReal.addApplication(testApplication);
      alert('Test data added successfully!');
      testConnection(); // Refresh data
    } catch (error) {
      alert('Error adding test data: ' + error.message);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center', marginBottom: '30px' }}>
        Google Sheets Test Page
      </h1>
      
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
        {!configStatus?.valid && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Get Google Sheets API key from Google Cloud Console</li>
              <li>Update API_KEY in src/config/googleSheetsConfig.js</li>
              <li>Make sure your Google Sheet is shared as "Anyone with link can edit"</li>
            </ol>
          </div>
        )}
      </div>

      {/* Test Buttons */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={testConnection}
          disabled={loading || !configStatus?.valid}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: configStatus?.valid ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: configStatus?.valid ? 'pointer' : 'not-allowed',
            opacity: configStatus?.valid ? 1 : 0.6,
            marginRight: '10px'
          }}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button 
          onClick={addTestData}
          disabled={loading || !configStatus?.valid}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: configStatus?.valid ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: configStatus?.valid ? 'pointer' : 'not-allowed',
            opacity: configStatus?.valid ? 1 : 0.6
          }}
        >
          Add Test Data
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
          <p style={{ margin: '0', color: testResult.success ? '#155724' : '#721c24' }}>
            {testResult.message}
          </p>
        </div>
      )}

      {/* Service Status */}
      {serviceStatus && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          border: '2px solid #17a2b8',
          borderRadius: '8px',
          backgroundColor: '#d1ecf1'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>
            🔧 Service Status
          </h3>
          <p style={{ margin: '0 0 5px 0', color: '#0c5460' }}>
            <strong>Current Service:</strong> {serviceStatus.currentService}
          </p>
          <p style={{ margin: '0 0 5px 0', color: '#0c5460' }}>
            <strong>Google Sheets Enabled:</strong> {serviceStatus.googleSheetsEnabled ? 'Yes' : 'No'}
          </p>
          {serviceStatus.lastError && (
            <p style={{ margin: '0', color: '#721c24' }}>
              <strong>Last Error:</strong> {serviceStatus.lastError.message}
            </p>
          )}
        </div>
      )}

      {/* Data Display */}
      {data.length > 0 && (
        <div style={{ 
          marginTop: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <h3 style={{ 
            margin: '0', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderBottom: '1px solid #ddd' 
          }}>
            Google Sheets Data ({data.length} rows)
          </h3>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Passport</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Tracking ID</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>DOB</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>
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
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e7f3ff', 
        border: '1px solid #b3d9ff',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#0066cc' }}>Setup Instructions</h3>
        <ol style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Google Cloud Console:</strong> Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">console.cloud.google.com</a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Create Project:</strong> Create a new project or select existing one
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Enable API:</strong> Go to APIs & Services → Library → Search "Google Sheets API" → Enable
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Create API Key:</strong> Go to APIs & Services → Credentials → Create Credentials → API Key
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Update Config:</strong> Copy your API key and update src/config/googleSheetsConfig.js
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Share Sheet:</strong> In your Google Sheet, click Share → "Anyone with link can edit"
          </li>
        </ol>
      </div>
    </div>
  );
};

export default TestGoogleSheets;
