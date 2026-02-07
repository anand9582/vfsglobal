import React, { useState } from 'react';
import googleSheetsServiceReal from '../services/googleSheetsServiceReal';
import { validateConfig } from '../config/googleSheetsConfig';

const GoogleSheetsConnectionTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // First check configuration
      const config = validateConfig();
      setConfigStatus(config);
      
      if (!config.valid) {
        setTestResult({
          success: false,
          message: `Configuration Error: ${config.message}`,
          data: null
        });
        return;
      }

      // Test Google Sheets connection
      const result = await googleSheetsServiceReal.testConnection();
      setTestResult(result);
      
      if (result.success) {
        console.log('✅ Google Sheets connection successful!');
        console.log('Data count:', result.dataCount);
        console.log('Sample data:', result.data);
      } else {
        console.error('❌ Google Sheets connection failed:', result.message);
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestData = async () => {
    setLoading(true);
    try {
      const testApplication = {
        name: 'Test User',
        passport: 'TEST123456',
        trackingId: `TEST-${Date.now()}`,
        dob: '1990-01-01',
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'Under Process'
      };

      await googleSheetsServiceReal.addApplication(testApplication);
      setTestResult({
        success: true,
        message: 'Test data added successfully!',
        data: null
      });
      
      // Refresh connection test
      setTimeout(() => testConnection(), 1000);
    } catch (error) {
      console.error('Add test data error:', error);
      setTestResult({
        success: false,
        message: `Failed to add test data: ${error.message}`,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-table mr-2"></i>
                Google Sheets Connection Test
              </h4>
            </div>
            <div className="card-body">
              {/* Configuration Status */}
              {configStatus && (
                <div className={`alert ${configStatus.valid ? 'alert-success' : 'alert-danger'} mb-4`}>
                  <h6>
                    <i className={`fas ${configStatus.valid ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                    Configuration Status
                  </h6>
                  <p className="mb-0">{configStatus.message}</p>
                </div>
              )}

              {/* Test Buttons */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={testConnection}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Testing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-wifi mr-2"></i>
                        Test Connection
                      </>
                    )}
                  </button>
                </div>
                <div className="col-md-6">
                  <button
                    className="btn btn-success btn-block"
                    onClick={addTestData}
                    disabled={loading || !configStatus?.valid}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-2"></i>
                        Add Test Data
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Test Results */}
              {testResult && (
                <div className={`alert ${testResult.success ? 'alert-success' : 'alert-danger'}`}>
                  <h6>
                    <i className={`fas ${testResult.success ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
                    Test Result
                  </h6>
                  <p className="mb-2">{testResult.message}</p>
                  
                  {testResult.dataCount !== undefined && (
                    <p className="mb-0">
                      <strong>Data Count:</strong> {testResult.dataCount} rows
                    </p>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-4">
                <h6>Setup Instructions:</h6>
                <ol>
                  <li>Create a Google Sheet with headers: Name, Passport, Tracking ID, DOB, Application Date, Status, Created, Actions</li>
                  <li>Get your Spreadsheet ID from the URL</li>
                  <li>Enable Google Sheets API in Google Cloud Console</li>
                  <li>Create an API Key in Google Cloud Console</li>
                  <li>Update the configuration in <code>src/config/googleSheetsConfig.js</code></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsConnectionTest;

