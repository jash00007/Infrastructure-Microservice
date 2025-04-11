import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Performance from './pages/Performance';
import LabMonitoring from './pages/LabMonitoring';
import CreateLab from './pages/CreateLab';
import DeleteLab from './pages/DeleteLab';
import ResourceAllocation from './pages/ResourceAllocation';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
      <Route path="/" element={<Home />} />
      <Route index element={<Home />} />

        <Route path="/performance" element={<Performance />} />
        <Route path="/monitoring" element={<LabMonitoring />} />
        <Route path="/create-lab" element={<CreateLab />} />
        <Route path="/delete-lab" element={<DeleteLab />} />
        <Route path="/allocate-resources" element={<ResourceAllocation />} />
      </Routes>
    </Router>
  );
}

export default App;
