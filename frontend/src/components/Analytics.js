import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function Analytics({ token }) {
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    avgDuration: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calls/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const callData = response.data;
      setCalls(callData);

      const total = callData.length;
      const completed = callData.filter(c => c.status === 'completed').length;
      const failed = callData.filter(c => c.status === 'failed').length;
      const durations = callData.filter(c => c.duration).map(c => c.duration);
      const avgDuration = durations.length > 0 
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      setStats({ total, completed, failed, avgDuration });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  return (
    <div className="analytics-container">
      <h3>Call Analytics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Calls</h4>
          <p className="stat-value">{stats.total}</p>
        </div>
        
        <div className="stat-card">
          <h4>Completed</h4>
          <p className="stat-value success">{stats.completed}</p>
        </div>
        
        <div className="stat-card">
          <h4>Failed</h4>
          <p className="stat-value error">{stats.failed}</p>
        </div>
        
        <div className="stat-card">
          <h4>Avg Duration</h4>
          <p className="stat-value">{stats.avgDuration}s</p>
        </div>
      </div>

      <div className="card">
        <h4>Call History</h4>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Language</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Started At</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr key={call.id}>
                <td>{call.phone_number}</td>
                <td>{call.language}</td>
                <td className={`status-${call.status}`}>{call.status}</td>
                <td>{call.duration ? `${call.duration}s` : '-'}</td>
                <td>{new Date(call.started_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Analytics;
