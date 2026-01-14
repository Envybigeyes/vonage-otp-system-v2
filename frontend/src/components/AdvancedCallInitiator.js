import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function AdvancedCallInitiator({ token }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [voice, setVoice] = useState('Joey');
  const [steps, setSteps] = useState([
    { message: 'Please enter your 6 digit one time passcode.', expectedDigits: 6, timeout: 30 }
  ]);
  const [finalMessage, setFinalMessage] = useState('Thank you. Your code has been received. Goodbye.');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addStep = () => {
    setSteps([...steps, { message: '', expectedDigits: 1, timeout: 30 }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/api/advanced-calls/initiate-advanced`,
        {
          phone_number: phoneNumber,
          language: language,
          voice: voice,
          script_flow: {
            steps: steps,
            finalMessage: finalMessage
          },
          recording_enabled: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage(`✅ Advanced call initiated! UUID: ${response.data.call_uuid}`);
      setPhoneNumber('');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || 'Call failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card advanced-call-card">
      <h3>Advanced Call Flow Builder</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
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
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish (ES)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Voice</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)}>
              <option value="Joey">Joey (Male)</option>
              <option value="Joanna">Joanna (Female)</option>
              <option value="Lucia">Lucia (Spanish Female)</option>
            </select>
          </div>
        </div>

        <div className="steps-container">
          <h4>Call Flow Steps</h4>
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-header">
                <h5>Step {index + 1}</h5>
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(index)} className="btn-remove">
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={step.message}
                  onChange={(e) => updateStep(index, 'message', e.target.value)}
                  placeholder="Enter the message to speak"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expected Digits</label>
                  <input
                    type="number"
                    value={step.expectedDigits}
                    onChange={(e) => updateStep(index, 'expectedDigits', parseInt(e.target.value))}
                    min="1"
                    max="20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Timeout (seconds)</label>
                  <input
                    type="number"
                    value={step.timeout}
                    onChange={(e) => updateStep(index, 'timeout', parseInt(e.target.value))}
                    min="5"
                    max="60"
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addStep} className="btn-secondary">
            + Add Step
          </button>
        </div>

        <div className="form-group">
          <label>Final Message</label>
          <textarea
            value={finalMessage}
            onChange={(e) => setFinalMessage(e.target.value)}
            placeholder="Message to play after all steps complete"
            rows="2"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Initiating Call...' : 'Start Advanced Call'}
        </button>

        {message && <div className={message.includes('✅') ? 'success-message' : 'error-message'}>{message}</div>}
      </form>
    </div>
  );
}

export default AdvancedCallInitiator;
