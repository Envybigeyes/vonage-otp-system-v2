import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';

function LiveCallMonitor({ token }) {
  const [calls, setCalls] = useState([]);
  const [dtmfEvents, setDtmfEvents] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    fetchCallHistory();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'dtmf') {
        setDtmfEvents(prev => [data.data, ...prev].slice(0, 10));
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 3000);
    };

    setWs(websocket);
  };

  const fetchCallHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calls/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalls(response.data.slice(0, 5));
    } catch (err) {
      console.error('Error fetching call history:', err);
    }
  };

  return (
    <div className="card">
      <h3>Live Call Monitor</h3>
      
      <div className="monitor-section">
        <h4>Recent DTMF Events</h4>
        {dtmfEvents.length === 0 ? (
          <p className="no-data">No DTMF events yet</p>
        ) : (
          <ul className="dtmf-list">
            {dtmfEvents.map((event, index) => (
              <li key={index}>
                <span className="dtmf-digit">{event.dtmf}</span>
                <span className="dtmf-uuid">{event.call_uuid.slice(0, 8)}...</span>
                <span className="dtmf-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="monitor-section">
        <h4>Recent Calls</h4>
        {calls.length === 0 ? (
          <p className="no-data">No calls yet</p>
        ) : (
          <ul className="call-list">
            {calls.map((call) => (
              <li key={call.id}>
                <span className="call-number">{call.phone_number}</span>
                <span className={`call-status status-${call.status}`}>{call.status}</span>
                <span className="call-time">{new Date(call.started_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={fetchCallHistory} className="btn-secondary">
        Refresh
      </button>
    </div>
  );
}

export default LiveCallMonitor;
