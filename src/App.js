import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VfsTrackPage from './Components/VfsTrackPage';
import AdminPage from './Components/AdminPage';
import ReportPage from './Components/ReportPage';
import DataFlowTest from './Components/DataFlowTest';
// import GoogleSheetsTest from './Components/GoogleSheetsTest';
import TestGoogleSheets from './Components/TestGoogleSheets';
import GoogleSheetsConnectionTest from './Components/GoogleSheetsConnectionTest';
import './App.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<VfsTrackPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/dataflow" element={<DataFlowTest />} />
        <Route path="/test" element={<TestGoogleSheets />} />
        <Route path="/connection-test" element={<GoogleSheetsConnectionTest />} />
        {/* <Route path="/debug" element={<GoogleSheetsTest />} /> */}
      </Routes>
    </>
  );
}

export default App;
