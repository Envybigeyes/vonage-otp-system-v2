import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function CallInitiator({ token }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [scriptId, setScriptId] = useState('1');
  const [language, setLanguage] = useState('en-US');
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/scripts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScripts(response.data);
    } catch (err) {
      console.error('Error fetching scripts:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/api/calls/initiate`,
        {
          phone_number: phoneNumber,
          script_id: parseInt(scriptId),
          language: language,
          recording_enabled: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage(`✅ Call initiated! UUID: ${response.data.call_uuid}`);
      setPhoneNumber('');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || 'Call failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Initiate Call</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            required
          />
        </div>

        <div className="form-group">
          <label>Script</label>
          <select value={scriptId} onChange={(e) => setScriptId(e.target.value)}>
            {scripts.map(script => (
              <option key={script.id} value={script.id}>
                {script.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Spanish (ES)</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Calling...' : 'Initiate Call'}
        </button>

        {message && <div className={message.includes('✅') ? 'success-message' : 'error-message'}>{message}</div>}
      </form>
    </div>
  );
}

export default CallInitiator;
