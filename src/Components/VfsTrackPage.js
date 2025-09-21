import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

function VfsTrackPage() {
  const [trackingId, setTrackingId] = useState('');
  const [dob, setDob] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [touched, setTouched] = useState({ trackingId: false, dob: false, captcha: false });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const canvasRef = useRef(null);

  const generateText = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 5; i += 1) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };

  // Function to format tracking ID as YYYYMMDDINCDTKTXXXXX
  const formatTrackingId = (value) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
    
    // If empty, return empty
    if (!cleaned) return '';
    
    // If it starts with INCDTKT, keep it as is
    if (cleaned.startsWith('INCDTKT')) {
      return cleaned.substring(0, 19); // Limit to 19 characters
    }
    
    // If it's all digits and length is 8 or more, format as YYYYMMDDINCDTKTXXXXX
    if (/^\d+$/.test(cleaned) && cleaned.length >= 8) {
      const datePart = cleaned.substring(0, 8);
      const remaining = cleaned.substring(8);
      return datePart + 'INCDTKT' + remaining.substring(0, 5);
    }
    
    // If it contains INCDTKT in the middle, format it properly
    if (cleaned.includes('INCDTKT')) {
      const parts = cleaned.split('INCDTKT');
      if (parts.length === 2) {
        const before = parts[0].substring(0, 8);
        const after = parts[1].substring(0, 5);
        return before + 'INCDTKT' + after;
      }
    }
    
    // For other cases, just return cleaned value limited to 19 characters
    return cleaned.substring(0, 19);
  };

  // Function to handle tracking ID input change
  const handleTrackingIdChange = (e) => {
    const value = e.target.value.toUpperCase();
    const formatted = formatTrackingId(value);
    setTrackingId(formatted);
  };

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 300;
    const height = 90;
    canvas.width = width;
    canvas.height = height;

    // white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // dotted background grid (denser, light gray)
    ctx.fillStyle = '#e6e9ef';
    for (let y = 4; y < height; y += 4) {
      for (let x = 4; x < width; x += 4) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // dense blue speckles (more dots)
    for (let i = 0; i < 420; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.2 + 0.2;
      ctx.fillStyle = `rgba(38, 70, 225, ${0.65 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw text using offscreen bitmap, then dot-ify to match screenshot
    const baseX = 32;
    const gap = 44;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const fontSize = 44; // consistent size
      const angle = (Math.random() - 0.5) * 0.22;

      // offscreen canvas to rasterize the glyph
      const off = document.createElement('canvas');
      const ow = 64;
      const oh = 80;
      off.width = ow;
      off.height = oh;
      const octx = off.getContext('2d');
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, ow, oh);
      octx.save();
      octx.translate(ow / 2, oh / 2);
      octx.rotate(angle);
      octx.transform(1, 0, -0.15, 1, 0, 0);
      octx.font = `700 ${fontSize}px Arial, sans-serif`;
      octx.fillStyle = '#1f3fe3';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(ch, 0, 6);
      octx.restore();

      // read pixels and draw blue dots for non-white pixels
      const img = octx.getImageData(0, 0, ow, oh);
      const step = 2; // dot grid
      ctx.save();
      ctx.translate(baseX + i * gap - ow / 2, height / 2 - oh / 2);
      for (let y = 0; y < oh; y += step) {
        for (let x = 0; x < ow; x += step) {
          const idx = (y * ow + x) * 4;
          const r = img.data[idx];
          const g = img.data[idx + 1];
          const b = img.data[idx + 2];
          const a = img.data[idx + 3];
          if (a > 40 && (r < 240 || g < 240 || b < 240)) {
            // draw small blue dot with slight jitter
            const jx = (Math.random() - 0.5) * 1.2;
            const jy = (Math.random() - 0.5) * 1.2;
            ctx.fillStyle = '#1f3fe3';
            ctx.beginPath();
            ctx.arc(x + jx, y + jy, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // no border to match screenshot
  };

  const refreshCaptcha = () => {
    const next = generateText();
    setGeneratedText(next);
    drawCaptcha(next);
  };

  // Search in Firebase with access tracking
  const searchInFirebase = async (searchTrackingId, searchDob) => {
    try {
      const q = query(
        collection(db, 'submissions'),
        where('trackingId', '==', searchTrackingId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0];
        const data = docRef.data();
        
        // Check DOB match if provided
        if (searchDob && data.dob && data.dob !== searchDob) {
          return null; // DOB doesn't match
        }
        
        // Check if application is still valid (not expired)
        const now = new Date();
        const expiresAt = new Date(data.expiresAt);
        if (now > expiresAt) {
          console.log('Application has expired');
          return null; // Application expired
        }
        
        // Update access tracking
        try {
          await updateDoc(doc(db, 'submissions', docRef.id), {
            lastAccessed: new Date().toISOString(),
            accessCount: increment(1)
          });
        } catch (updateError) {
          console.log('Could not update access tracking:', updateError);
          // Continue even if update fails
        }
        
        return {
          id: docRef.id,
          ...data,
          foundIn: 'Firebase'
        };
      }
      return null;
    } catch (error) {
      console.error('Firebase search error:', error);
      if (error.code === 'permission-denied') {
        console.log('Firebase permission denied. Please update Firestore security rules.');
      }
      return null;
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
    setDob(formatDate(newDate));
    setShowDatePicker(false);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };


  


  useEffect(() => {
    refreshCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ trackingId: true, dob: true, captcha: true });
    if (!trackingId || !dob || !captchaText) {
      return;
    }
    const entered = captchaText.trim().toUpperCase();
    if (entered.length === 0) {
      alert('Please enter the captcha.');
      return;
    }
    const ok = entered === generatedText;
    if (!ok) {
      alert('Captcha does not match. Please try again.');
      refreshCaptcha();
      return;
    }
    // First try Firebase search
    try {
      console.log('Searching for application with Tracking ID:', trackingId, 'DOB:', dob);
      const foundApplication = await searchInFirebase(trackingId, dob);
      console.log('Found application:', foundApplication);
      
      if (foundApplication) {
        const apiStatusRaw = foundApplication.status || '';
        const apiTrackingId = foundApplication.trackingId || trackingId;
        const apiDate = foundApplication.applicationDate || ''; // This is the application date from admin form
        const userName = foundApplication.name || '';

        console.log('Found application details:', {
          name: userName,
          status: apiStatusRaw,
          trackingId: apiTrackingId,
          applicationDate: apiDate
        });

        // Get status icon and color
        const getStatusInfo = (status) => {
          switch (status.toUpperCase()) {
            case 'UNDER PROCESS':
            case 'UP':
              return { icon: 'fa-clock', color: 'warning', text: 'Under Process' };
            case 'DISPATCH':
            case 'DP':
              return { icon: 'fa-truck', color: 'info', text: 'Dispatch' };
            case 'APPROVED':
              return { icon: 'fa-check-circle', color: 'success', text: 'Approved' };
            case 'REJECTED':
              return { icon: 'fa-times-circle', color: 'danger', text: 'Rejected' };
            default:
              return { icon: 'fa-clock', color: 'warning', text: 'Under Process' };
          }
        };

        const statusInfo = getStatusInfo(apiStatusRaw);
        let displayDate;
        if (apiDate) {
          displayDate = apiDate.replace(/-/g, '/');
        } else {
          displayDate = (dob || '').replace(/-/g, '/');
        }

        // Create styled status message
        setResultMsg(`
          <div class="alert alert-${statusInfo.color} border-0 shadow-sm" style="border-left: 4px solid var(--bs-${statusInfo.color}) !important;">
            <div class="d-flex align-items-center mb-2">
              <i class="fas ${statusInfo.icon} fa-2x me-3 text-${statusInfo.color}"></i>
              <div>
                <h5 class="alert-heading mb-1 fw-bold">Application Status</h5>
                <p class="mb-0 text-muted">Tracking ID: <strong class="text-primary">${apiTrackingId}</strong></p>
              </div>
            </div>
            <hr class="my-3">
            <div class="row">
              <div class="col-md-6">
                <p class="mb-2"><strong>Status:</strong> 
                  <span class="badge bg-${statusInfo.color} text-white px-3 py-2 rounded-pill ms-2">
                    <i class="fas ${statusInfo.icon} me-1"></i>
                    ${statusInfo.text}
                  </span>
                </p>
              </div>
              <div class="col-md-6">
                <p class="mb-2"><strong>Application Date:</strong> <span class="text-primary fw-bold">${displayDate}</span></p>
              </div>
            </div>
            <div class="mt-3 p-3 bg-light rounded">
              <p class="mb-0 text-center fw-bold">
                <i class="fas fa-building me-2"></i>
                Your application has been received and is ${statusInfo.text.toLowerCase()} at the IRCC Office on ${displayDate}
              </p>
            </div>
          </div>
        `);
        return;
      }
    } catch (error) {
      console.error('Firebase search error:', error);
    }

    // Fallback: No application found
    setResultMsg('No application found with the provided tracking ID and date of birth.');
  };

  return (
    <div style={{ minHeight: '100vh'}}>
      <div className='d-flex justify-content-between d-lg-inline'>

      
      <div className=' logo-container ' style={{ backgroundColor: '#0b355a', color: '#fff' }}>
        <div className="container py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <img className='w-5 h-4 logo' src={`${process.env.PUBLIC_URL}/vfs-logo2.png`} alt="logo"  />
          </div>
           <div className="d-none d-md-block" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '10pt' }}>
             <span>Apply for Visa to Canada </span>
              <span role="img" aria-label="canada">
                <img src={`${process.env.PUBLIC_URL}/Canada.png`} alt="canada" style={{ width: 24, height: 34, objectFit: 'contain' }} />
              </span>
            <span className="ms-2 ml-1">In India</span>
          </div>
        </div>
      </div>
      <span className='pr-3 mt-2 d-md-none' role="img" aria-label="canada">
                <img src={`${process.env.PUBLIC_URL}/Canada.png`} alt="canada" style={{ width: 24, height: 34, objectFit: 'contain' }} />
       </span>
       </div>

      <div className="container border" >
        <div className="row">
          <div className="col-12 col-lg-12 mx-auto p-0">
          <div className="py-4 p-4 pt-2" style={{ height: 610 }}>
            <div className="d-flex align-items-end justify-content-between">
              <h2 className='mb-0'>TRACK YOUR APPLICATION</h2>
              <div className="ms-3" >
                <label className="form-label mb-1 d-block" style={{ fontWeight: 700, marginBottom: 4 }}>
                  Mandatory <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  style={{
                    backgroundColor: '#f1fbf3',
                    border: '1px solid #cfd9cf',
                    borderRadius: 8,
                    color: '#0b0f14',
                    fontSize: 16,
                    height: 44,
                    padding: '8px 14px'
                  }}
                >
                  <option>English</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-2 d-md-flex align-items-center" style={{ marginTop: 6 }}>
                <label className="mb-2 mb-lg-0" style={{ fontWeight: 700, width: 210 }}>
                  Tracking ID No<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control tracking-input"
                  style={{  background: '#fff', border: touched.trackingId && !trackingId ? '1px solid #dc3545' : undefined }}
                  placeholder="Tracking ID No"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, trackingId: true }))}
                />
              </div>
              {touched.trackingId && !trackingId && (
                <div className="mb-2" style={{ color: '#dc3545', fontWeight: 700, marginLeft: 210 }}>Required</div>
              )}

              <div className="mb-3 d-md-flex  align-items-center" style={{ marginTop: 6, position: 'relative' }}>
                <label className="mb-2 mb-lg-0 date-brith">
                  Date of Birth (YYYY-<span className="desktop-br"><br /></span>MM-DD)<span className="text-danger">*</span>
                </label>
                <div className="date-picker-container" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control tracking-input"
                    style={{ 
                      borderRadius: 6, 
                      border: touched.dob && !dob ? '1px solid #dc3545' : '1px solid #ccc', 
                      background: '#fff',
                      fontSize: 12,
                      fontFamily: 'Arial, sans-serif',
                      color: '#333'
                    }}
                    placeholder="YYYY-MM-DD"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    onFocus={() => setShowDatePicker(true)}
                    onBlur={() => setTouched(prev => ({ ...prev, dob: true }))}
                  />
                  {showDatePicker && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 1000,
                      backgroundColor: '#fff',
                      border: '1px solid #d0d0d0',
                      borderRadius: 6,
                      padding: 12,
                      minWidth: 280,
                      fontFamily: 'Arial, sans-serif',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      fontSize: 12
                    }}>
                      {/* Calendar Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: 12,
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        <button
                          type="button"
                          onClick={() => navigateMonth(-1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 12,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 4,
                            color: '#333'
                          }}
                        >
                          ‹
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>
                          {getMonthName(selectedDate.getMonth())} {selectedDate.getFullYear()}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigateMonth(1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 12,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 4,
                            color: '#333'
                          }}
                        >
                          ›
                        </button>
                      </div>

                      {/* Days of Week */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 2, 
                        marginBottom: 8
                      }}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} style={{ 
                            textAlign: 'center', 
                            fontSize: 12, 
                            fontWeight: 'bold', 
                            color: '#666',
                            padding: '4px 0'
                          }}>
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 2
                      }}>
                        {Array.from({ length: getFirstDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => (
                          <div key={`empty-${i}`} style={{ 
                            height: 32, 
                            width: 32
                          }}></div>
                        ))}
                        {Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => {
                          const day = i + 1;
                          const isSelected = day === selectedDate.getDate();
                          const isToday = new Date().toDateString() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString();
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleDateSelect(day)}
                              style={{
                                height: 32,
                                width: 32,
                                border: '1px solid #e0e0e0',
                                background: isSelected ? '#007bff' : isToday ? '#f8f9fa' : '#fff',
                                cursor: 'pointer',
                                borderRadius: 4,
                                fontSize: 12,
                                color: isSelected ? '#fff' : '#333',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'normal',
                                fontFamily: 'Arial, sans-serif'
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {touched.dob && !dob && (
                <div className="mb-2" style={{ color: '#dc3545', fontWeight: 700, marginLeft: 210 }}>Required</div>
              )}

              <div className="col-lg-6 col-md-12 col-12 p-0" style={{ marginTop: 8 }}>
                <div className="row g-3 align-items-center" style={{ border: '1px solid #d7dee8', borderRadius: 6, padding: 10, margin: 0 }}>
                  <div className="col-lg-4 col-md-6 col-5 m-0 p-0">
                    <div className="position-relative d-flex align-items-center" style={{ background: '#fff' }}>
                      <canvas ref={canvasRef} style={{ width: 300, height: 75, display: 'block', maxWidth: '100%', border: 'none' }} />
                    </div>
                  </div>
                  <div className="col-lg-8 col-md--6 col-7">
                    <div className="d-flex align-items-center mb-1" style={{ gap: 8}}>
                      <div
                        role="button"
                        title="Refresh captcha"
                        onClick={refreshCaptcha}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <img src={`${process.env.PUBLIC_URL}/refresh.png`} alt="refresh" style={{ width: 24, height: 24 }} />
                      </div>
                      <label className="mb-0" >Enter the text shown in image</label>
                    </div>
                    <input
                      type="text"
                      className="form-control text-shown"
                      style={{ border: touched.captcha && !captchaText ? '1px solid #dc3545' : '1px solid #cfd6e4', height: 36, borderRadius: 6, background: '#fff' }}
                      value={captchaText}
                      onChange={(e) => setCaptchaText(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, captcha: true }))}
                      placeholder=""
                    />
                  </div>
                </div>
              </div>

         <div className="row">
          <div className="col-12 col-lg-6">
              <div className="d-md-flex gap-2 justify-content-end">
                <button type="submit" className="btn btn-primary mr-2 btn-submit" style={{ backgroundColor: '#0b355a', borderColor: '#0b355a', padding: '4px 14px', fontSize: 13 }}>SUBMIT</button>
                <button type="reset" className="btn btn-outline-secondary btn-submit" style={{ padding: '4px 14px', fontSize: 13 }} onClick={() => { setTrackingId(''); setDob(''); setCaptchaText(''); setResultMsg(''); setTouched({ trackingId: false, dob: false, captcha: false }); refreshCaptcha(); }}>RESET</button>
              </div>
              </div>
              </div>
            </form>
            {resultMsg && (
              <div className="mt-3">
                <div dangerouslySetInnerHTML={{ __html: resultMsg }} />
              </div>
            )}
            <div className="py-5"></div>
            </div>
            <footer style={{ backgroundColor: '#0b355a', color: '#fff' }}>
        <div className="container">
          <div className="row align-items-center py-3">
            <div className="col-12 col-md-8">
              <div style={{ fontSize: 14 }}>Copyright 2025 . VFS Global. All Rights Reserved.</div>
            </div>
            <div className="col-12 col-md-4 d-flex justify-content-md-end mt-2 mt-md-0">
              <div style={{ fontSize: 14 }}>
                In Association With
                  <img className='ml-1' src={`${process.env.PUBLIC_URL}/IOM-Logo.png`} alt="IOM Logo" style={{ width: 30, height: 30, objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        </div>
      </footer>
          </div>
        </div>
      </div>
 
    </div>
  );
}

export default VfsTrackPage;


