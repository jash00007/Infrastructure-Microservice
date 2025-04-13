// pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-800">Lab Infrastructure Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link
          to="/lab-creation"
          className="bg-green-600 text-white px-6 py-4 rounded shadow hover:bg-green-700 transition"
        >
          ➕ Create Lab
        </Link>

        <Link
          to="/lab-deletion"
          className="bg-red-600 text-white px-6 py-4 rounded shadow hover:bg-red-700 transition"
        >
          🗑️ Delete Lab
        </Link>

        <Link
          to="/lab-monitoring"
          className="bg-yellow-500 text-white px-6 py-4 rounded shadow hover:bg-yellow-600 transition"
        >
          📊 Monitor Labs
        </Link>

        <Link
          to="/server-performance"
          className="bg-purple-600 text-white px-6 py-4 rounded shadow hover:bg-purple-700 transition"
        >
          🖥️ Server Performance
        </Link>

        <Link
          to="/resource-allocation"
          className="bg-blue-600 text-white px-6 py-4 rounded shadow hover:bg-blue-700 transition"
        >
          ⚙️ Resource Allocation
        </Link>

        {/* Add more links if you add new services like reports, access logs, etc. */}
        <Link
          to="/logs"
          className="bg-gray-700 text-white px-6 py-4 rounded shadow hover:bg-gray-800 transition"
        >
          📁 View Logs
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
