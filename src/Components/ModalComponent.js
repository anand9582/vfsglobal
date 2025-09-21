import React, { useEffect } from 'react';

const ModalComponent = ({ isOpen, onClose, content }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle = {
    background: '#fff',
    borderRadius: '20px 0px 0px 20px',
    padding: '20px',
    minWidth: '500px', 
    maxWidth: '400px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    position: 'relative',
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '2.8rem',
    height: '2.8rem',
    border: 'none',
    background: '#fb5472',
    fontSize: '15px',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#fff',
  };

  return (
    <div className='login-model' style={modalOverlayStyle} onClick={handleOverlayClick}>
      <div style={modalContentStyle}>
        <button style={closeButtonStyle} onClick={onClose}>
            &times;
        </button>
        {content}
      </div>
    </div>
  );
};

export default ModalComponent;
