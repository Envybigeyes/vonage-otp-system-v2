import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setCurrentView('dashboard');
  };

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Vonage Call System</h1>
        <div className="nav-links">
          <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
          <button onClick={() => setCurrentView('advanced')}>Advanced Calls</button>
          <button onClick={() => setCurrentView('analytics')}>Analytics</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Dashboard token={token} currentView={currentView} />
      </main>
    </div>
  );
}

export default App;
