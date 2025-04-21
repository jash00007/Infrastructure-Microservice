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


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lab-creation" element={<CreateLabPage />} />
        <Route path="/lab-deletion" element={<DeleteLabPage />} />
        <Route path="/lab-monitoring" element={<MonitorPage />} />
        <Route path="/server-performance" element={<PerformancePage />} />
        <Route path="/resource-allocation" element={<ResourceAllocationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
