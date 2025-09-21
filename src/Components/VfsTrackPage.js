import React, { useEffect, useRef, useState } from 'react';

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

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
    // First try API checkStatus, then fallback to local storage
    try {
      const url = `http://192.168.11.107:8081/user/checkStatus?trackId=${encodeURIComponent(trackingId)}&dob=${encodeURIComponent(dob)}`;
      const resp = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (resp.ok) {
        let payload = null;
        try { payload = await resp.json(); } catch (_) { payload = null; }

        // Support multiple response shapes
        let apiStatusRaw = '';
        let apiTrackingId = trackingId;
        let apiDate = '';

        if (payload && Array.isArray(payload.data)) {
          // Example: { status: true, data: ["UP", "20250918INCDTKT90001", "name", "2025-10-01"] }
          apiStatusRaw = String(payload.data[0] || '').toUpperCase();
          apiTrackingId = payload.data[1] || trackingId;
          apiDate = payload.data[3] || ''; // Get the date from index 3
        } else if (payload && typeof payload === 'object') {
          apiStatusRaw = (payload.status || (payload.data && payload.data.status) || '').toString().toUpperCase();
          apiTrackingId = (payload.trackingId || (payload.data && payload.data.trackingId) || trackingId);
        }

        if (apiStatusRaw === 'UP') {
          // Show exact style message using API date or entered DOB date
          let processDate;
          if (apiDate) {
            // Convert API date from YYYY-MM-DD to YYYY/MM/DD format
            processDate = apiDate.replace(/-/g, '/');
          } else {
            // Fallback to entered DOB date
            processDate = (dob || '').replace(/-/g, '/');
          }
          setResultMsg(`Your application, tracking ID No.${apiTrackingId} has been received and is under process at the IRCC Office on ${processDate}`);
          return;
        }

        if (apiStatusRaw === 'DP') {
          // Show dispatch message with API date in YYYY/MM/DD format
          let dispatchDate;
          if (apiDate) {
            // Convert API date from YYYY-MM-DD to YYYY/MM/DD format
            dispatchDate = apiDate.replace(/-/g, '/');
          } else {
            // Fallback to current date if no API date
            const currentDate = new Date();
            dispatchDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
          }
          setResultMsg(`Your application, tracking ID No.${apiTrackingId} has been received and is dispatch at the IRCC Office on ${dispatchDate}`);
          return;
        }
      }
    } catch (_) {
      // ignore and fallback
    }

    // Fallback: lookup in localStorage for admin-saved status
    try {
      const raw = localStorage.getItem('vfs_applications');
      const list = raw ? JSON.parse(raw) : [];
      const found = Array.isArray(list) ? list.find(r => r.trackingId === trackingId && r.dob === dob) : undefined;
      if (found) {
        // Handle dispatch status with proper message format
        if (found.status && found.status.toUpperCase() === 'DP') {
          const currentDate = new Date();
          const dispatchDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
          setResultMsg(`Your application, tracking ID No.${found.trackingId} has been received and is dispatch at the IRCC Office on ${dispatchDate}`);
        } else {
          setResultMsg(`Your application, Tracking ID No. ${found.trackingId} has status: ${found.status}.`);
        }
      } else {
        const todayStr = formatDate(new Date());
        setResultMsg(`Your application, Tracking ID No. has been received and is under process at the VAC. (Date: ${todayStr})`);
      }
    } catch {
      const todayStr = formatDate(new Date());
      setResultMsg(`Your application, Tracking ID No. has been received and is under process at the VAC. (Date: ${todayStr})`);
    }
  };

  return (
    <div style={{ minHeight: '100vh'}}>
      <div style={{ backgroundColor: '#0b355a', color: '#fff' }}>
        <div className="container py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <img className='w-5 h-4' src={`${process.env.PUBLIC_URL}/vfs-logo2.png`} alt="logo"  />
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
              <div className="mb-2 d-flex align-items-center" style={{ marginTop: 6 }}>
                <label className="mb-0" style={{ fontWeight: 700, width: 210 }}>
                  Tracking ID No<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: 209, height: 26,  background: '#fff', border: touched.trackingId && !trackingId ? '1px solid #dc3545' : undefined }}
                  placeholder="Tracking ID No"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, trackingId: true }))}
                />
              </div>
              {touched.trackingId && !trackingId && (
                <div className="mb-2" style={{ color: '#dc3545', fontWeight: 700, marginLeft: 210 }}>Required</div>
              )}

              <div className="mb-3 d-flex align-items-center" style={{ marginTop: 6, position: 'relative' }}>
                <label className="mb-0" style={{ fontWeight: 700, width: 210 }}>
                  Date of Birth (YYYY-<br/>MM-DD)<span className="text-danger">*</span>
                </label>
                <div className="date-picker-container" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: 209, height: 26, borderRadius: 6, border: touched.dob && !dob ? '1px solid #dc3545' : '1px solid #ccc', background: '#fff' }}
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
                      borderRadius: 4,
                      padding: 0,
                      minWidth: 200,
                      fontFamily: 'Arial, sans-serif',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {/* Calendar Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        borderBottom: '1px solid #e0e0e0',
                        gap: 8
                      }}>
                        <select
                          value={selectedDate.getMonth()}
                          onChange={(e) => {
                            const newDate = new Date(selectedDate);
                            newDate.setMonth(parseInt(e.target.value));
                            setSelectedDate(newDate);
                          }}
                          style={{ 
                            border: '1px solid #d0d0d0', 
                            borderRadius: 3, 
                            padding: '4px 8px',
                            backgroundColor: '#f8f8f8',
                            fontSize: 12,
                            color: '#333',
                            fontWeight: 'bold',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 4px center',
                            backgroundSize: '12px',
                            paddingRight: '20px'
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{getMonthName(i)}</option>
                          ))}
                        </select>
                        <select
                          value={selectedDate.getFullYear()}
                          onChange={(e) => {
                            const newDate = new Date(selectedDate);
                            newDate.setFullYear(parseInt(e.target.value));
                            setSelectedDate(newDate);
                          }}
                          style={{ 
                            border: '1px solid #d0d0d0', 
                            borderRadius: 3, 
                            padding: '4px 8px',
                            backgroundColor: '#f8f8f8',
                            fontSize: 12,
                            color: '#333',
                            fontWeight: 'bold',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 4px center',
                            backgroundSize: '12px',
                            paddingRight: '20px'
                          }}
                        >
                          {Array.from({ length: 20 }, (_, i) => {
                            const year = new Date().getFullYear() - 10 + i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                      </div>

                      {/* Days of Week */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 0, 
                        borderBottom: '1px solid #e0e0e0',
                        padding: '6px 0'
                      }}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} style={{ 
                            textAlign: 'center', 
                            fontSize: 11, 
                            fontWeight: 'bold', 
                            color: '#333'
                          }}>
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 0,
                        padding: '4px'
                      }}>
                        {Array.from({ length: getFirstDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => (
                          <div key={`empty-${i}`} style={{ 
                            height: 28, 
                            width: 28, 
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#f8f8f8',
                            margin: '1px'
                          }}></div>
                        ))}
                        {Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => {
                          const day = i + 1;
                          const isSelected = day === selectedDate.getDate();
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleDateSelect(day)}
                              style={{
                                height: 28,
                                width: 28,
                                border: '1px solid #e0e0e0',
                                background: isSelected ? '#ffffff' : '#f8f8f8',
                                cursor: 'pointer',
                                borderRadius: 0,
                                fontSize: 11,
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '1px',
                                fontWeight: 'normal'
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
                  <div className="col-lg-4 col-md-6 col-12 m-0 p-0">
                    <div className="position-relative d-flex align-items-center" style={{ background: '#fff' }}>
                      <canvas ref={canvasRef} style={{ width: 300, height: 75, display: 'block', maxWidth: '100%', border: 'none' }} />
                    </div>
                  </div>
                  <div className="col-lg-8 col-md--6 col-12">
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
                      className="form-control"
                      style={{ width: 270, border: touched.captcha && !captchaText ? '1px solid #dc3545' : '1px solid #cfd6e4', height: 36, borderRadius: 6, background: '#fff' }}
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
              <div className="d-flex gap-2 justify-content-end">
                <button type="submit" className="btn btn-primary mr-2" style={{ backgroundColor: '#0b355a', borderColor: '#0b355a', padding: '4px 14px', fontSize: 13 }}>SUBMIT</button>
                <button type="reset" className="btn btn-outline-secondary" style={{ padding: '4px 14px', fontSize: 13 }} onClick={() => { setTrackingId(''); setDob(''); setCaptchaText(''); setResultMsg(''); setTouched({ trackingId: false, dob: false, captcha: false }); refreshCaptcha(); }}>RESET</button>
              </div>
              </div>
              </div>
            </form>
            {resultMsg && (
              <div className="mt-3" style={{ color: '#0b3ca1', fontSize: 14, fontWeight: 600 }}>
                {resultMsg}
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


