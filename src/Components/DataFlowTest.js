import React, { useState, useEffect } from 'react';
import googleSheetsServiceReal from '../services/googleSheetsServiceReal';

const DataFlowTest = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testTrackingId, setTestTrackingId] = useState('');
  const [testDob, setTestDob] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsServiceReal.readData();
      setAllData(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    if (!testTrackingId || !testDob) {
      alert('Please enter both Tracking ID and DOB');
      return;
    }

    try {
      const result = await googleSheetsServiceReal.findApplication(testTrackingId, testDob);
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult(null);
    }
  };

  const robotoStyle = {
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
  };

  return (
    <div className="container-fluid py-4" style={robotoStyle}>
      <div className="row">
        <div className="col-12">
          <h1 className="h3 mb-4 text-dark">Data Flow Test</h1>
          
          {/* Search Test */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Test Search Function</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Tracking ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={testTrackingId}
                    onChange={(e) => setTestTrackingId(e.target.value)}
                    placeholder="Enter Tracking ID"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">DOB</label>
                  <input
                    type="text"
                    className="form-control"
                    value={testDob}
                    onChange={(e) => setTestDob(e.target.value)}
                    placeholder="Enter DOB (YYYY-MM-DD)"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">&nbsp;</label>
                  <button
                    className="btn btn-primary d-block"
                    onClick={testSearch}
                  >
                    Test Search
                  </button>
                </div>
              </div>
              
              {searchResult && (
                <div className="mt-3">
                  <h6>Search Result:</h6>
                  <div className="alert alert-success">
                    <pre>{JSON.stringify(searchResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Data Display */}
          <div className="card">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">All Data in Google Sheets Service</h5>
              <button
                className="btn btn-light btn-sm"
                onClick={loadAllData}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Passport</th>
                      <th>Tracking ID</th>
                      <th>DOB</th>
                      <th>Application Date</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allData.slice(1).reverse().map((row, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {allData.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">No data found. Add some applications from Admin Page.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataFlowTest;
