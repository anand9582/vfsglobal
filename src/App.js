import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VfsTrackPage from './Components/VfsTrackPage';
import AdminPage from './Components/AdminPage';
import './App.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<VfsTrackPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default App;
