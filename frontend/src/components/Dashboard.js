import React from 'react';
import CallInitiator from './CallInitiator';
import AdvancedCallInitiator from './AdvancedCallInitiator';
import Analytics from './Analytics';
import LiveCallMonitor from './LiveCallMonitor';

function Dashboard({ token, currentView }) {
  return (
    <div className="dashboard">
      {currentView === 'dashboard' && (
        <>
          <div className="dashboard-grid">
            <CallInitiator token={token} />
            <LiveCallMonitor token={token} />
          </div>
        </>
      )}
      {currentView === 'advanced' && (
        <AdvancedCallInitiator token={token} />
      )}
      {currentView === 'analytics' && (
        <Analytics token={token} />
      )}
    </div>
  );
}

export default Dashboard;
