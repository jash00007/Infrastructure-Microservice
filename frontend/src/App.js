// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar'; // 👈 Add this line
// Page imports

import HomePage from './pages/HomePage';
import CreateLabPage from './pages/CreateLabPage';
import DeleteLabPage from './pages/DeleteLabPage';
import MonitorPage from './pages/MonitorPage';
import PerformancePage from './pages/PerformancePage';
import ResourceAllocationPage from './pages/ResourceAllocationPage';
import LoginPage from './pages/LoginPage';
import S3Page from './pages/S3Page';
import Calendar from './pages/CalendarPage';


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/lab-creation" element={<CreateLabPage />} />
        <Route path="/lab-deletion" element={<DeleteLabPage />} />
        <Route path="/lab-monitoring" element={<MonitorPage />} />
        <Route path="/server-performance" element={<PerformancePage />} />
        <Route path="/resource-allocation" element={<ResourceAllocationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/S3-storage" element={<S3Page />} />
        <Route path="/calendar" element={<Calendar />} />
      </Routes>
    </Router>
  );
}

export default App;
