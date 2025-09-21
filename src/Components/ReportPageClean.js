import React, { useEffect, useState } from 'react';
import { FaSync, FaSearch, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const ReportPageClean = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  
  const recordsPerPage = 10;

  useEffect(() => {
    loadApplicationsFromFirebase();
  }, []);

  const loadApplicationsFromFirebase = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const firebaseData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdDate = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        const createdTimestamp = data.createdAt ? data.createdAt.toDate().getTime() : new Date().getTime();
        
        return {
          id: doc.id,
          name: data.name || '',
          passport: data.passport || '',
          trackingId: data.trackingId || '',
          dob: data.dob || '',
          applicationDate: data.applicationDate || '',
          status: data.status || 'Under Process',
          created: createdDate,
          createdTimestamp: createdTimestamp,
          // Add month and year for filtering
          createdMonth: new Date(createdDate).getMonth() + 1,
          createdYear: new Date(createdDate).getFullYear(),
          foundIn: 'Firebase'
        };
      });
      
      // Set Firebase data directly (replace existing data)
      setApplications(firebaseData);
      
      setSyncStatus('Data loaded from Firebase successfully!');
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
      if (error.code === 'permission-denied') {
        setSyncStatus('Firebase permission denied. Please update Firestore security rules to allow read/write access.');
      } else {
        setSyncStatus('Error loading data from Firebase. Please try again.');
      }
      setError('Failed to load applications from Firebase');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadApplicationsFromFirebase();
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchTerm || 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.passport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.trackingId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = !selectedMonth || app.createdMonth === parseInt(selectedMonth);
    const matchesYear = !selectedYear || app.createdYear === parseInt(selectedYear);
    
    return matchesSearch && matchesMonth && matchesYear;
  });

  const totalPages = Math.ceil(filteredApplications.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredApplications.slice(startIndex, endIndex);

  const monthlyStats = applications.reduce((stats, app) => {
    const month = app.createdMonth;
    const year = app.createdYear;
    const key = `${year}-${month}`;
    
    if (!stats[key]) {
      stats[key] = { count: 0, underProcess: 0, dispatch: 0 };
    }
    
    stats[key].count++;
    if (app.status === 'Under Process') {
      stats[key].underProcess++;
    } else if (app.status === 'Dispatch') {
      stats[key].dispatch++;
    }
    
    return stats;
  }, {});

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">
                <FaChartBar className="mr-2" />
                Applications Report (Firebase)
              </h3>
              <button 
                className="btn btn-light btn-sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <FaSync className={loading ? 'fa-spin' : ''} />
                {loading ? ' Loading...' : ' Refresh'}
              </button>
            </div>
            <div className="card-body">
              {syncStatus && (
                <div className={`alert ${syncStatus.includes('Error') || syncStatus.includes('failed') ? 'alert-danger' : 'alert-success'} mb-3`}>
                  {syncStatus}
                </div>
              )}

              {/* Search and Filters */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <FaSearch />
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, passport, or tracking ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-control"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">All Months</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                      <option key={month} value={month}>
                        {new Date(2024, month-1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-control"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-primary btn-block"
                    onClick={() => setShowMonthlyReport(!showMonthlyReport)}
                  >
                    <FaCalendarAlt className="mr-1" />
                    {showMonthlyReport ? 'Hide' : 'Show'} Monthly
                  </button>
                </div>
              </div>

              {/* Monthly Report */}
              {showMonthlyReport && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Monthly Statistics</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Month/Year</th>
                            <th>Total</th>
                            <th>Under Process</th>
                            <th>Dispatch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(monthlyStats).map(([key, stats]) => {
                            const [year, month] = key.split('-');
                            const monthName = new Date(parseInt(year), parseInt(month)-1).toLocaleString('default', { month: 'long' });
                            return (
                              <tr key={key}>
                                <td>{monthName} {year}</td>
                                <td><span className="badge badge-primary">{stats.count}</span></td>
                                <td><span className="badge badge-warning">{stats.underProcess}</span></td>
                                <td><span className="badge badge-success">{stats.dispatch}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Applications Table */}
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Passport</th>
                      <th>Tracking ID</th>
                      <th>DOB</th>
                      <th>App Date</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : currentRecords.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No applications found
                        </td>
                      </tr>
                    ) : (
                      currentRecords.map(app => (
                        <tr key={app.id}>
                          <td>{app.name}</td>
                          <td>{app.passport}</td>
                          <td><strong className="text-primary">{app.trackingId}</strong></td>
                          <td>{app.dob}</td>
                          <td>{app.applicationDate}</td>
                          <td>
                            <span className={`badge ${
                              app.status === 'Under Process' ? 'badge-warning' :
                              app.status === 'Dispatch' ? 'badge-success' :
                              'badge-secondary'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td>{new Date(app.created).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}

              {/* Summary */}
              <div className="mt-3 text-muted">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of {filteredApplications.length} entries
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPageClean;
