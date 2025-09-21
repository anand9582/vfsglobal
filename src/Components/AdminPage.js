import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { FaTrash } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Add Roboto font import
const robotoStyle = {
  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
};

function getStorageKey() {
  return 'vfs_applications';
}

function readAllApplications() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAllApplications(list) {
  localStorage.setItem(getStorageKey(), JSON.stringify(list));
}

function AdminPage() {
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const [name, setName] = useState('');
  const [passport, setPassport] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [applicationDate, setApplicationDate] = useState(null);
  const [status, setStatus] = useState('Under Process');

  const [rows, setRows] = useState(() => readAllApplications());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const controlHeight = 40; // unify input and addon heights
  const [apiHttpCode, setApiHttpCode] = useState(null);
  const [apiReturnedStatus, setApiReturnedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState([]);
  const [useApiData, setUseApiData] = useState(false);

  useEffect(() => {
    writeAllApplications(rows);
  }, [rows]);

  // Load API data automatically when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://192.168.11.107:8081/user/getAll', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setApiHttpCode(response.status);
          
          // Convert API data to our format
          const apiRecords = Array.isArray(data) ? data : (data.data || []);
          const convertedRecords = apiRecords.map((record, index) => ({
            userId: record.userId || null,
            name: record.name || '',
            passport: record.passportNo || '',
            trackingId: record.trackingId || `API-${index + 1}`,
            dob: record.dob || '',
            status: record.status === 'UP' ? 'Under Process' : (record.status === 'DP' ? 'Dispatch' : 'Under Process'),
            createdAt: record.createdAt || new Date().toISOString(),
            updatedAt: record.updatedAt || new Date().toISOString()
          }));
          
          setApiData(convertedRecords);
          setUseApiData(true);
        } else {
          console.log('API not available, using local data');
        }
      } catch (error) {
        console.log('API not available, using local data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput === '7788') {
      setUnlocked(true);
    } else {
      alert('Wrong PIN');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Convert selectedDate to string format
    const dobString = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    const applicationDateString = applicationDate ? applicationDate.toISOString().split('T')[0] : '';

    try {
      // Convert status to API format
      const apiStatus = status === 'Under Process' ? 'UP' : 'DP';
      
      // API call
      const response = await fetch('http://192.168.11.107:8081/user/create', {
        method: 'POST',
         headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          passportNo: passport,
          dob: dobString,
          expectedDate: applicationDateString,
          status: apiStatus
        })
      });

      if (response.ok) {
        let returnedStatus = '';
        let returnedTrackingId = '';
        try {
          const data = await response.json();
          returnedStatus = (data && (data.status || (data.data && data.data.status))) || '';
          returnedTrackingId = (data && (data.trackingId || (data.data && data.data.trackingId))) || '';
        } catch (_) {
          // ignore JSON parse errors if no body
        }

        setApiHttpCode(response.status);
        setApiReturnedStatus(returnedStatus);

        // Use returned status if provided by API (UP/DP)
        let statusToStore = status;
        if (returnedStatus === 'UP') statusToStore = 'Under Process';
        if (returnedStatus === 'DP') statusToStore = 'Dispatch';
        
        // Use returned tracking ID if provided by API
        const finalTrackingId = returnedTrackingId || trackingId;
        
        // API success - also save to localStorage for local display
        const exists = rows.some(r => r.trackingId === finalTrackingId);
        const now = new Date().toISOString();
        const record = { name, passport, trackingId: finalTrackingId, dob: dobString, applicationDate: applicationDateString, status: statusToStore, createdAt: now };
        setRows(prev => exists ? prev.map(r => (r.trackingId === finalTrackingId ? record : r)) : [record, ...prev]);
        
        // Also add to API data if we're currently viewing API data
        if (useApiData) {
          setApiData(prev => [record, ...prev]);
        }
        
        // Clear form
        setName('');
        setPassport('');
        setTrackingId('');
        setSelectedDate(null);
        setApplicationDate(null);
        setStatus('Under Process');
        setCurrentPage(1);
        setSubmitAttempted(false);
        
        // Show SweetAlert success message
        Swal.fire({
          title: 'Success!',
          html: `
            <div style="font-family: 'Roboto', sans-serif;">
              <p style="color: #28a745; font-size: 18px; margin-bottom: 15px;">
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                User created successfully!
              </p>
                <p style="margin: 0; font-weight: bold; color: #333;">Tracking ID:</p>
                <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 16px; color: #007bff;">${finalTrackingId}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Status: ${statusToStore}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#007bff',
          timer: 5000,
          timerProgressBar: true,
          showConfirmButton: true,
          allowOutsideClick: true,
          customClass: {
            popup: 'swal2-popup-custom',
            title: 'swal2-title-custom',
            content: 'swal2-content-custom'
          }
        });
      } else {
        setApiHttpCode(response.status);
        try {
          const errorData = await response.json();
          setApiReturnedStatus(errorData && (errorData.status || errorData.message) ? (errorData.status || errorData.message) : '');
          alert(`Error: ${errorData.message || 'Failed to create user'}`);
        } catch (_) {
          setApiReturnedStatus('');
          alert('Failed to create user');
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const filtered = useMemo(() => {
    const dataToSearch = useApiData ? apiData : rows;
    if (!searchTerm.trim()) return dataToSearch;
    const term = searchTerm.toLowerCase();
    return dataToSearch.filter(r => 
      r.name.toLowerCase().includes(term) ||
      r.passport.toLowerCase().includes(term) ||
      r.trackingId.toLowerCase().includes(term)
    );
  }, [rows, apiData, searchTerm, useApiData]);

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filtered.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const loadFromAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.11.107:8081/user/getAll', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiHttpCode(response.status);
        
        // Convert API data to our format
        const apiRecords = Array.isArray(data) ? data : (data.data || []);
        const convertedRecords = apiRecords.map((record, index) => ({
          userId: record.userId || null,
          name: record.name || '',
          passport: record.passportNo || '',
          trackingId: record.trackingId || `API-${index + 1}`,
          dob: record.dob || '',
          status: record.status === 'UP' ? 'Under Process' : (record.status === 'DP' ? 'Dispatch' : 'Under Process'),
          createdAt: record.createdAt || new Date().toISOString(),
          updatedAt: record.updatedAt || new Date().toISOString()
        }));
        
        setApiData(convertedRecords);
        setUseApiData(true);
        setCurrentPage(1);
        alert(`Loaded ${convertedRecords.length} records from API for search/filter`);
      } else {
        setApiHttpCode(response.status);
        alert(`Failed to load data: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    if (useApiData && record.userId) {
      // Delete from API
      try {
        const response = await fetch(`http://10.46.167.139:8081/user/delete/${record.userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          // Remove from API data
          setApiData(prev => prev.filter(r => r.userId !== record.userId));
          alert('Record deleted successfully from API');
        } else {
          alert(`Failed to delete: HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Delete API Error:', error);
        alert('Network error while deleting');
      }
    } else {
      // Delete from local storage
      setRows(prev => prev.filter(x => x.trackingId !== record.trackingId));
      alert('Record deleted from local storage');
    }
  };

  if (!unlocked) {
    return (
      <div className="container-fluid" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', ...robotoStyle }}>
        <div className="row justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <div className="col-md-4 col-sm-8">
            <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
              <div className="card-header text-center border-0" style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', borderRadius: '15px 15px 0 0' }}>
                <h4 className="text-white mb-0" style={robotoStyle}>
                  <i className="fas fa-lock mr-2"></i>
                  Admin Access
                </h4>
                <small className="text-white-50" style={robotoStyle}>Enter PIN to continue</small>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleUnlock}>
                  <div className="form-group">
                    <label className="text-muted small" style={robotoStyle}>Security PIN</label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text bg-light border-0">
                          <i className="fas fa-key text-primary"></i>
                        </span>
                      </div>
                      <input 
                        type="password" 
                        className="form-control border-0 bg-light" 
                        placeholder="Enter 4-digit PIN" 
                        value={pinInput} 
                        onChange={(e) => setPinInput(e.target.value)}
                        style={{ height: '50px', ...robotoStyle }}
                      />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-block" type="submit" style={{ height: '50px', borderRadius: '25px', ...robotoStyle }}>
                    <i className="fas fa-unlock mr-2"></i>
                    Unlock Dashboard
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ background: '#e5e5e5', minHeight: '100vh',fontSize: '14px', ...robotoStyle }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="mb-1 text-primary" style={robotoStyle}>
                    <i className="fas fa-users-cog mr-2"></i>
                    Admin Dashboard
                  </h2>
                  <p className="text-muted mb-0" style={robotoStyle}>Manage user applications and tracking</p>
                  {(apiHttpCode || apiReturnedStatus) && (
                    <div className="mt-2">
                      <span className={`badge badge-${apiHttpCode === 200 ? 'success' : 'warning'} mr-2`}>
                        HTTP {apiHttpCode || '-'}
                      </span>
                      {apiReturnedStatus && (
                        <span className="badge badge-info">
                          Status: {apiReturnedStatus}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                 <div className="d-flex align-items-center">
                   {loading && (
                     <div className="mr-3">
                       <i className="fas fa-spinner fa-spin text-primary mr-1"></i>
                       <span style={robotoStyle}>Loading API data...</span>
                     </div>
                   )}
                   <button 
                     className="btn btn-info mr-2" 
                     onClick={loadFromAPI} 
                     disabled={loading}
                     style={robotoStyle}
                   >
                     <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync'} mr-1`}></i>
                     {loading ? 'Loading...' : 'Refresh API Data'}
                   </button>
                   {useApiData && (
                     <button 
                       className="btn btn-warning mr-2" 
                       onClick={() => setUseApiData(false)}
                       style={robotoStyle}
                     >
                       <i className="fas fa-database mr-1"></i>
                       Use Local Data
                     </button>
                   )}
                   <span className="badge badge-success badge-pill mr-3 px-3 py-2" style={robotoStyle}>
                     <i className="fas fa-check-circle mr-1"></i>
                     Unlocked
                   </span>
                   <button className="btn btn-outline-danger" onClick={() => setUnlocked(false)} style={robotoStyle}>
                     <i className="fas fa-lock mr-1"></i>
                     Lock
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Update Form */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white border-0">
              <h5 className="mb-0" style={robotoStyle}>
                <i className="fas fa-plus-circle mr-2"></i>
                Add New Application
              </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleAdd}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-weight-bold text-dark" style={robotoStyle}>
                      <i className="fas fa-user text-primary mr-1"></i>
                      Full Name
                    </label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text bg-light border-0" style={{ height: controlHeight }}>
                          <i className="fas fa-user text-primary"></i>
                        </span>
                      </div>
                      <input 
                        className={`form-control border-0 bg-light ${submitAttempted && !name ? 'is-invalid' : ''}`} 
                        style={{ height: controlHeight, ...robotoStyle }} 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Enter full name" 
                      />
                    </div>
                    {submitAttempted && !name && <div className="invalid-feedback d-block" style={robotoStyle}>Name is required</div>}
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-weight-bold text-dark" style={robotoStyle}>
                      <i className="fas fa-passport text-primary mr-1"></i>
                      Passport Number
                    </label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text bg-light border-0" style={{ height: controlHeight }}>
                          <i className="fas fa-passport text-primary"></i>
                        </span>
                      </div>
                      <input 
                        className={`form-control border-0 bg-light ${submitAttempted && !passport ? 'is-invalid' : ''}`} 
                        style={{ height: controlHeight, ...robotoStyle }} 
                        value={passport} 
                        onChange={(e) => setPassport(e.target.value.toUpperCase())} 
                        placeholder="Enter passport number" 
                      />
                    </div>
                    <small className="form-text text-muted" style={robotoStyle}>
                      <i className="fas fa-info-circle mr-1"></i>
                      Auto-uppercase applied
                    </small>
                    {submitAttempted && !passport && <div className="invalid-feedback d-block" style={robotoStyle}>Passport number is required</div>}
                  </div>
                  
                   <div className="col-md-6 mb-3">
                     <label className="form-label font-weight-bold text-dark" style={robotoStyle}>
                       <i className="fas fa-calendar text-primary mr-1"></i>
                       Date of Birth <span className="text-muted">(Optional)</span>
                     </label>
                     <div className="input-group">
                       <div className="input-group-prepend">
                         <span className="input-group-text bg-light border-0" style={{ height: controlHeight }}>
                           <i className="fas fa-calendar text-primary"></i>
                         </span>
                       </div>
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date) => {
                            setSelectedDate(date);
                          }}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date (optional)"
                          className={`form-control border-0 bg-light ${submitAttempted && !selectedDate ? 'is-invalid' : ''}`}
                          style={{ 
                            height: controlHeight, 
                            width: '100%', 
                            borderRadius: '6px',
                            backgroundColor: '#f8f9fa',
                            border: 'none',
                            padding: '8px 12px',
                            fontSize: '14px',
                            color: '#495057',
                            ...robotoStyle 
                          }}
                          isClearable
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          maxDate={new Date()}
                          yearDropdownItemNumber={100}
                        />
                     </div>
                     <small className="form-text text-muted" style={robotoStyle}>
                       <i className="fas fa-info-circle mr-1"></i>
                       Optional field - can be left empty
                     </small>
                   </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-weight-bold text-dark" style={robotoStyle}>
                      <i className="fas fa-calendar-check text-primary mr-1"></i>
                      Application Date <span className="text-muted">(Optional)</span>
                    </label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text bg-light border-0" style={{ height: controlHeight }}>
                          <i className="fas fa-calendar-check text-primary"></i>
                        </span>
                      </div>
                      <DatePicker
                        selected={applicationDate}
                        onChange={(date) => {
                          setApplicationDate(date);
                        }}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select application date (optional)"
                        className={`form-control border-0 bg-light ${submitAttempted && !applicationDate ? 'is-invalid' : ''}`}
                        style={{ 
                          height: controlHeight, 
                          width: '100%', 
                          borderRadius: '6px',
                          backgroundColor: '#f8f9fa',
                          border: 'none',
                          padding: '8px 12px',
                          fontSize: '14px',
                          color: '#495057',
                          ...robotoStyle 
                        }}
                        isClearable
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        maxDate={new Date()}
                        yearDropdownItemNumber={100}
                      />
                    </div>
                    <small className="form-text text-muted" style={robotoStyle}>
                      <i className="fas fa-info-circle mr-1"></i>
                      Optional field - can be left empty
                    </small>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-weight-bold text-dark" style={robotoStyle}>
                      <i className="fas fa-tasks text-primary mr-1"></i>
                      Status
                    </label>
                    <select 
                      className="form-control border-0 bg-light" 
                      style={{ height: controlHeight, ...robotoStyle }} 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option>Under Process</option>
                      <option>Dispatch</option>
                    </select>
                  </div>
                </div>
                
                <div className="d-flex justify-content-end mt-4">
                  <button 
                    type="button" 
                    className="btn btn-light mr-3 px-4" 
                    onClick={() => { setName(''); setPassport(''); setTrackingId(''); setSelectedDate(null); setApplicationDate(null); setStatus('Under Process'); setSubmitAttempted(false); }}
                    style={{ height: '45px', ...robotoStyle }}
                  >
                    <i className="fas fa-undo mr-2"></i>
                    Reset
                  </button>
                  <button 
                    className="btn btn-primary px-4" 
                    style={{ height: '45px', ...robotoStyle }}
                  >
                    <i className="fas fa-save mr-2"></i>
                    Create Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Records Section */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h5 className="mb-0 text-dark" style={robotoStyle}>
                    <i className="fas fa-search text-primary mr-2"></i>
                    Search & Filter
                  </h5>
                </div>
                <div className="col-md-6">
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text bg-white border-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control border-0 bg-white"
                      placeholder="Search by name, passport, or tracking ID..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      style={{ height: '45px', ...robotoStyle }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
                <div>
                  <h6 className="mb-0 text-dark" style={robotoStyle}>
                    <i className="fas fa-list text-primary mr-2"></i>
                    Applications
                  </h6>
                   <small className="text-muted" style={robotoStyle}>
                     Showing {filtered.length} of {useApiData ? apiData.length : rows.length} records
                     {searchTerm && ` (filtered by "${searchTerm}")`}
                     {useApiData && ' - API Data'}
                   </small>
                 </div>
                 <span className={`badge badge-pill px-3 py-2 ${useApiData ? 'badge-info' : 'badge-primary'}`} style={robotoStyle}>
                   <i className={`fas ${useApiData ? 'fa-cloud' : 'fa-database'} mr-1`}></i>
                   {useApiData ? apiData.length : rows.length} Total
                 </span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-hashtag text-muted mr-1"></i>
                        #
                      </th>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-user text-muted mr-1"></i>
                        Name
                      </th>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-passport text-muted mr-1"></i>
                        Passport
                      </th>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-id-card text-muted mr-1"></i>
                        Tracking ID
                      </th>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-calendar text-muted mr-1"></i>
                        DOB
                      </th>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-calendar-check text-muted mr-1"></i>
                         Date
                      </th>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-tasks text-muted mr-1"></i>
                        Status
                      </th>
                      <th className="border-0" style={robotoStyle}>
                        <i className="fas fa-clock text-muted mr-1"></i>
                        Created
                      </th>
                      <th className="border-0 text-center" style={robotoStyle}>
                        <i className="fas fa-cog text-muted mr-1"></i>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((r, i) => (
                      <tr key={r.trackingId} className="border-bottom">
                        <td className="text-muted font-weight-bold" style={robotoStyle}>{startIndex + i + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                           
                            <span className="font-weight-bold" style={robotoStyle}>{r.name}</span>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded" style={robotoStyle}>{r.passport}</code>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded" style={robotoStyle}>{r.trackingId}</code>
                        </td>
                        <td className="text-muted" style={robotoStyle}>{r.dob}</td>
                        <td className="text-muted" style={robotoStyle}>{r.applicationDate || '-'}</td>
                        <td>
                          <span className={`badge badge-pill px-3 py-2 ${r.status === 'Dispatch' ? 'badge-success' : 'badge-info'}`} style={robotoStyle}>
                            <i className={`fas ${r.status === 'Dispatch' ? 'fa-truck' : 'fa-clock'} mr-1`}></i>
                            {r.status}
                          </span>
                        </td>
                        <td className="text-muted small" style={robotoStyle}>{new Date(r.createdAt).toLocaleString()}</td>
                         <td className="text-center">
                           <button 
                             className="btn btn-sm btn-outline-danger" 
                             onClick={() => handleDelete(r)}
                             title="Delete record"
                             style={{ 
                               width: '32px', 
                               height: '32px', 
                               padding: '0',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               borderRadius: '6px'
                             }}
                           >
                             <FaTrash size={12} />
                           </button>
                         </td>
                      </tr>
                    ))}
                    {currentRecords.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <div className="text-muted">
                            <i className="fas fa-inbox fa-3x mb-3"></i>
                            <h5 style={robotoStyle}>{searchTerm ? 'No records found' : 'No applications yet'}</h5>
                            <p className="mb-0" style={robotoStyle}>
                              {searchTerm ? 'Try adjusting your search terms' : 'Create your first application above'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted" style={robotoStyle}>
                    <i className="fas fa-info-circle mr-1"></i>
                    Page {currentPage} of {totalPages} ({filtered.length} records)
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border-0" 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{ borderRadius: '20px', margin: '0 2px', ...robotoStyle }}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                      </li>
                      
                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                            <button 
                              className="page-link border-0" 
                              onClick={() => handlePageChange(pageNum)}
                              style={{ 
                                borderRadius: '20px', 
                                margin: '0 2px',
                                backgroundColor: currentPage === pageNum ? '#007bff' : 'transparent',
                                color: currentPage === pageNum ? 'white' : '#6c757d',
                                ...robotoStyle
                              }}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link border-0" 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{ borderRadius: '20px', margin: '0 2px', ...robotoStyle }}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;


