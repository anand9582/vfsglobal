import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Roboto font style is now used inline throughout the component

function AdminPage() {
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const [name, setName] = useState('');
  const [passport, setPassport] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [applicationDate, setApplicationDate] = useState(null);
  const [status, setStatus] = useState('Under Process');

  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const controlHeight = 40;

  // Load data from Firebase on component mount
  useEffect(() => {
    loadDataFromFirebase();
  }, []);

  const loadDataFromFirebase = async () => {
    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const applications = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          name: data.name || '',
          passport: data.passport || '',
          trackingId: data.trackingId || '',
          dob: data.dob || '',
          applicationDate: data.applicationDate || '',
          status: data.status || '',
          created: data.createdAt || '',
          actions: 'View',
          createdTimestamp: new Date(data.createdAt || new Date()).getTime()
        });
      });
      
      setRows(applications);
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
      setSyncStatus('Error loading data from Firebase');
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput === '7788') {
      setUnlocked(true);
    } else {
      alert('Invalid PIN');
    }
  };

  const generateTrackingId = (date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    // Generate 5 random digits for the sequence number
    let sequenceNumber = '';
    for (let i = 0; i < 5; i++) {
      sequenceNumber += Math.floor(Math.random() * 10);
    }
    
    // Format: YYYYMMDDINCDTKTXXXXX (19 characters total)
    return `${year}${month}${day}INCDTKT${sequenceNumber}`;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Convert selectedDate to string format
    const dobString = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    const applicationDateString = applicationDate ? applicationDate.toISOString().split('T')[0] : '';

    // Generate tracking ID based on application date
    const trackingDate = applicationDateString || new Date().toISOString().split('T')[0];
    const finalTrackingId = generateTrackingId(trackingDate);

    try {
      // Create application object with proper date handling
      const application = {
        name: name,
        email: '', // Add email field if needed
        passport: passport,
        trackingId: finalTrackingId,
        dob: dobString,
        applicationDate: applicationDateString,
        status: status,
        createdAt: new Date().toISOString(),
        // Add year for easy filtering and long-term storage
        year: new Date().getFullYear(),
        // Add expiry date (1 year from creation)
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        // Add last accessed timestamp
        lastAccessed: new Date().toISOString(),
        // Add access count
        accessCount: 0
      };

      // Add to Firebase
      try {
        console.log('Adding application to Firebase:', application);
        await addDoc(collection(db, 'submissions'), application);
        console.log('Successfully added to Firebase:', finalTrackingId);
        setSyncStatus(`Application added successfully! Tracking ID: ${finalTrackingId}`);
        
        // Reload data from Firebase
        await loadDataFromFirebase();
      } catch (error) {
        console.error('Failed to add application to Firebase:', error);
        setSyncStatus('Failed to add application. Please try again.');
      }
      
      // Clear form
      setName('');
      setPassport('');
      setSelectedDate(null);
      setApplicationDate(null);
      setStatus('Under Process');
      setCurrentPage(1);
      setSubmitAttempted(false);

      // Show success message
      Swal.fire({
        title: 'Success!',
        html: `
          <div style="font-family: 'Roboto', sans-serif;">
            <p style="color: #28a745; font-size: 18px; margin-bottom: 15px;">
              <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
              Application created successfully!
            </p>
            <p style="margin: 0; font-weight: bold; color: #333;">Tracking ID:</p>
            <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 16px; color: #007bff;">${finalTrackingId}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Status: ${status}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #28a745;">✅ Synced to Firebase</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#007bff',
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: true,
        allowOutsideClick: true
      });

    } catch (error) {
      console.error('Error creating application:', error);
      alert('Error creating application. Please try again.');
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(r => 
      r.name.toLowerCase().includes(term) ||
      (r.passport && r.passport.toLowerCase().includes(term)) ||
      r.trackingId.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filtered.slice(startIndex, endIndex);

  if (!unlocked) {
    return (
      <div className="min-vh-100 d-flex align-items-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Roboto', sans-serif"
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-lg" style={{
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <div className="card-body p-5">
                  {/* Header Section */}
                  <div className="text-center mb-4">
                    <div className="mb-3">
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)'
                      }}>
                        <i className="fas fa-shield-alt text-white" style={{ fontSize: '2rem' }}></i>
                      </div>
                    </div>
                    <h2 className="fw-bold text-dark mb-2" style={{ fontSize: '1.4rem' }}>
                      Admin Access
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                      Enter your secure PIN to continue
                    </p>
                  </div>

                  {/* Form Section */}
                  <form onSubmit={handleUnlock}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: '0.8rem' }}>
                        <i className="fas fa-key me-2 text-primary"></i>
                        Security PIN
                      </label>
                      <div className="position-relative">
                        <input
                          type="password"
                          className="form-control form-control-lg border-0"
                          placeholder="Enter your 4-digit PIN"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          style={{
                            borderRadius: '15px',
                            background: '#f8f9fa',
                            padding: '12px 18px',
                            fontSize: '1rem',
                            letterSpacing: '2px',
                            textAlign: 'center',
                            fontWeight: '600',
                            border: '2px solid transparent',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.background = '#fff';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(102, 126, 234, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'transparent';
                            e.target.style.background = '#f8f9fa';
                            e.target.style.boxShadow = 'none';
                          }}
                          maxLength="4"
                          required
                        />
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <i className="fas fa-lock text-muted"></i>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn w-100 text-white fw-bold py-3"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '15px',
                        fontSize: '1rem',
                        letterSpacing: '0.5px',
                        border: 'none',
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 12px 25px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      <i className="fas fa-unlock me-2"></i>
                      Unlock Dashboard
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="text-center mt-4">
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      <i className="fas fa-shield-alt me-1"></i>
                      Secure Admin Portal
                    </small>
                  </div>
                </div>
              </div>

              {/* Additional Info Card */}
              <div className="card border-0 mt-4" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(5px)',
                borderRadius: '15px'
              }}>
                <div className="card-body p-3 text-center">
                  <div className="row text-white">
                    <div className="col-4">
                      <i className="fas fa-users fa-2x mb-2 d-block"></i>
                      <small className="fw-semibold">Manage Users</small>
                    </div>
                    <div className="col-4">
                      <i className="fas fa-chart-line fa-2x mb-2 d-block"></i>
                      <small className="fw-semibold">View Reports</small>
                    </div>
                    <div className="col-4">
                      <i className="fas fa-cog fa-2x mb-2 d-block"></i>
                      <small className="fw-semibold">System Control</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Roboto', sans-serif"
    }}>
      <div className="container py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="me-3" style={{
                      width: '60px',
                      height: '60px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="fas fa-tachometer-alt fa-2x"></i>
                    </div>
                    <div>
                      <h1 className="mb-0 fw-bold text-white" style={{ fontSize: '1.8rem', letterSpacing: '2px' }}>
                        VFS GLOBAL
                      </h1>
                      <h2 className="mb-1 fw-bold ml-3 text-white" style={{ fontSize: '1.2rem' }}>
                        Admin Dashboard
                      </h2>
                      <p className="mb-0 opacity-75 ml-3" style={{ fontSize: '0.9rem' }}>
                        <i className="fas fa-database me-2"></i>
                        • Real-time Management
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn btn-light btn-lg px-4 py-2 fw-bold"
                    onClick={() => setUnlocked(false)}
                    style={{
                      borderRadius: '15px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Lock Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Add/Update Form */}
        <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 text-white" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px 20px 0 0'
          }}>
            <div className="d-flex align-items-center">
              <div className="me-3" style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-plus-circle"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold ml-3 " style={{ fontSize: '1.1rem' }}>
                  Add New Application
                </h5>
                <small className="opacity-75 ml-3 " style={{ fontSize: '0.8rem' }}>Create and track new user applications</small>
              </div>
            </div>
          </div>
          <div className="card-body p-4">
            {syncStatus && (
              <div className={`alert ${syncStatus.includes('Error') || syncStatus.includes('failed') ? 'alert-danger' : 'alert-success'} mb-4 border-0`} 
                   style={{ borderRadius: '15px' }} role="alert">
                <i className={`fas ${syncStatus.includes('Error') || syncStatus.includes('failed') ? 'fa-exclamation-triangle' : 'fa-check-circle'} me-2`}></i>
                {syncStatus}
              </div>
            )}
            <form onSubmit={handleAdd}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold text-dark" style={{fontFamily: "'Roboto', sans-serif"}}>
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
                    type="text"
                    className={`form-control border-0 bg-light ${submitAttempted && !name ? 'is-invalid' : ''}`} 
                    style={{ height: controlHeight, fontFamily: "'Roboto', sans-serif" }} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter full name" 
                    required
                  />
                </div>
                {submitAttempted && !name && <div className="invalid-feedback d-block" style={{fontFamily: "'Roboto', sans-serif"}}>Name is required</div>}
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold text-dark" style={{fontFamily: "'Roboto', sans-serif"}}>
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
                    type="text"
                    className={`form-control border-0 bg-light ${submitAttempted && !passport ? 'is-invalid' : ''}`} 
                    style={{ height: controlHeight, fontFamily: "'Roboto', sans-serif" }} 
                    value={passport} 
                    onChange={(e) => setPassport(e.target.value.toUpperCase())} 
                    placeholder="Enter passport number" 
                    required
                  />
                </div>
                <small className="form-text text-muted" style={{fontFamily: "'Roboto', sans-serif"}}>
                  <i className="fas fa-info-circle mr-1"></i>
                  Auto-uppercase applied
                </small>
                {submitAttempted && !passport && <div className="invalid-feedback d-block" style={{fontFamily: "'Roboto', sans-serif"}}>Passport number is required</div>}
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold text-dark" style={{fontFamily: "'Roboto', sans-serif"}}>
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
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select date (optional)"
                    className="form-control border-0 bg-light"
                    style={{ 
                      height: controlHeight, 
                      width: '100%', 
                      borderRadius: '6px',
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#495057',
                      fontFamily: "'Roboto', sans-serif"
                    }}
                    isClearable
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                    yearDropdownItemNumber={100}
                  />
                </div>
                <small className="form-text text-muted" style={{fontFamily: "'Roboto', sans-serif"}}>
                  <i className="fas fa-info-circle mr-1"></i>
                  Optional field - can be left empty
                </small>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold text-dark" style={{fontFamily: "'Roboto', sans-serif"}}>
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
                    onChange={(date) => setApplicationDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select application date (optional)"
                    className="form-control border-0 bg-light"
                    style={{ 
                      height: controlHeight, 
                      width: '100%', 
                      borderRadius: '6px',
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#495057',
                      fontFamily: "'Roboto', sans-serif"
                    }}
                    isClearable
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                    yearDropdownItemNumber={100}
                  />
                </div>
                <small className="form-text text-muted" style={{fontFamily: "'Roboto', sans-serif"}}>
                  <i className="fas fa-info-circle mr-1"></i>
                  Optional field - can be left empty
                </small>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold text-dark" style={{fontFamily: "'Roboto', sans-serif"}}>
                  <i className="fas fa-tasks text-primary mr-1"></i>
                  Status
                </label>
                <select 
                  className="form-control border-0 bg-light" 
                  style={{ height: controlHeight, fontFamily: "'Roboto', sans-serif" }} 
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
                onClick={() => { setName(''); setPassport(''); setSelectedDate(null); setApplicationDate(null); setStatus('Under Process'); setSubmitAttempted(false); }}
                style={{ height: '45px', fontFamily: "'Roboto', sans-serif" }}
              >
                <i className="fas fa-undo mr-2"></i>
                Reset
              </button>
              <button 
                type="submit"
                className="btn btn-primary px-4" 
                style={{ height: '45px', fontFamily: "'Roboto', sans-serif" }}
              >
                <i className="fas fa-save mr-2"></i>
                Create Application
              </button>
            </div>
          </form>
        </div>
      </div>

        {/* Applications Table */}
        <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 text-white" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px 20px 0 0'
          }}>
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <div className="me-3" style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-list"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '1.1rem' }}>
                      Applications
                    </h5>
                    <small className="opacity-75" style={{ fontSize: '0.8rem' }}>{filtered.length} total applications</small>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-white border-0" style={{ borderRadius: '15px 0 0 15px' }}>
                      <i className="fas fa-search text-muted"></i>
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control border-0 bg-white"
                    placeholder="Search by name, passport, or tracking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      fontFamily: "'Roboto', sans-serif",
                      borderRadius: '0 15px 15px 0',
                      padding: '10px 12px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {filtered.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <i className="fas fa-inbox fa-2x text-muted"></i>
                </div>
                <h5 className="fw-bold mb-2">No Applications Found</h5>
                <p className="mb-0">Start by adding your first application above</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                  }}>
                    <tr>
                      <th className="border-0 fw-bold text-dark py-4" style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-user me-2 text-primary"></i>Name
                      </th>
                      <th className="border-0 fw-bold text-dark py-4" style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-id-card me-2 text-primary"></i>Passport
                      </th>
                      <th className="border-0 fw-bold text-dark py-4" style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-barcode me-2 text-primary"></i>Tracking ID
                      </th>
                      <th className="border-0 fw-bold text-dark py-4" style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-birthday-cake me-2 text-primary"></i>DOB
                      </th>
                      <th className="border-0 fw-bold text-dark py-4" style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-calendar me-2 text-primary"></i>Date
                      </th>
                      <th className="border-0 fw-bold text-dark py-4" style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-flag me-2 text-primary"></i>Status
                      </th>
                      <th className="border-0 fw-bold text-dark py-4" style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fas fa-clock me-2 text-primary"></i>Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((row, index) => (
                      <tr key={row.id || index} style={{
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid #f8f9fa'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <td className="py-2" style={{
                          fontFamily: "'Roboto', sans-serif",
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}>
                          <div className="d-flex align-items-center">
                            <div className="me-2" style={{
                              width: '35px',
                              height: '35px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              marginRight: '10px',
                              fontWeight: 'bold'
                            }}>
                              {row.name ? row.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="fw-semibold">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-2" style={{
                          fontFamily: "'Roboto', sans-serif",
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}>
                          <span className="badge bg-light text-dark px-3 py-2 fw-bold" style={{
                            fontSize: '0.75rem',
                            borderRadius: '10px'
                          }}>
                            {row.passport}
                          </span>
                        </td>
                        <td className="py-2" style={{
                          fontFamily: "'Roboto', sans-serif"
                        }}>
                          <span className="badge bg-primary text-white px-3 py-2 fw-bold" style={{
                            fontSize: '0.75rem',
                            borderRadius: '10px',
                            letterSpacing: '0.5px'
                          }}>
                            <i className="fas fa-barcode me-1"></i>
                            {row.trackingId}
                          </span>
                        </td>
                        <td className="py-2" style={{
                          fontFamily: "'Roboto', sans-serif",
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}>
                          <i className="fas fa-calendar-alt me-2 text-muted"></i>
                          {row.dob}
                        </td>
                        <td className="py-2" style={{
                          fontFamily: "'Roboto', sans-serif",
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}>
                          <i className="fas fa-calendar me-2 text-muted"></i>
                          {row.applicationDate}
                        </td>
                        <td className="py-3">
                          <span className={`badge px-3 py-2 rounded-pill fw-bold ${
                            row.status === 'Under Process' ? 'bg-warning text-dark' :
                            row.status === 'Dispatch' ? 'bg-info text-white' :
                            row.status === 'Approved' ? 'bg-success text-white' :
                            'bg-danger text-white'
                          }`} style={{
                            fontSize: '0.75rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <i className={`fas ${
                              row.status === 'Under Process' ? 'fa-clock' :
                              row.status === 'Dispatch' ? 'fa-truck' :
                              row.status === 'Approved' ? 'fa-check-circle' :
                              'fa-times-circle'
                            } me-1`}></i>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2" style={{
                          fontFamily: "'Roboto', sans-serif",
                          fontWeight: '500',
                          fontSize: '0.9rem',
                          color: '#6c757d'
                        }}>
                          <i className="fas fa-clock me-2"></i>
                          {new Date(row.created).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          )}
        </div>
          {totalPages > 1 && (
            <div className="card-footer border-0" style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '0 0 20px 20px'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <i className="fas fa-info-circle me-2 text-primary"></i>
                  <small className="text-muted fw-semibold" style={{fontFamily: "'Roboto', sans-serif", fontSize: '0.8rem'}}>
                    Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} applications
                  </small>
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link border-0 fw-bold" 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          borderRadius: '10px',
                          margin: '0 2px',
                          background: currentPage === 1 ? '#e9ecef' : '#fff',
                          color: currentPage === 1 ? '#6c757d' : '#667eea',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== 1) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                      >
                        <i className="fas fa-chevron-left me-1"></i>Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link border-0 fw-bold" 
                          onClick={() => setCurrentPage(i + 1)}
                          style={{
                            borderRadius: '10px',
                            margin: '0 2px',
                            background: currentPage === i + 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                            color: currentPage === i + 1 ? '#fff' : '#667eea',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage !== i + 1) {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link border-0 fw-bold" 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          borderRadius: '10px',
                          margin: '0 2px',
                          background: currentPage === totalPages ? '#e9ecef' : '#fff',
                          color: currentPage === totalPages ? '#6c757d' : '#667eea',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== totalPages) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                      >
                        Next<i className="fas fa-chevron-right ms-1"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;