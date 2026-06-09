'use client';
import React, { useState } from 'react';

import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AnalyticsModule from './components/AnalyticsModule';

export default function App() {
  const [appState, setAppState] = useState('landing'); 
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const handleStart = (roleOrBadge) => {
    if (roleOrBadge.startsWith('ADMIN') || roleOrBadge.startsWith('CMD')) {
      setAppState('admin');
    } else {
      setAppState('operator');
    }
  };

  const handleLogout = () => {
    setAppState('landing');
    setIsAnalyticsOpen(false); 
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#020617' }}>
      
      {/* --- ROUTING --- */}
      {appState === 'landing' && <LandingPage onStart={handleStart} />}
      {appState === 'operator' && <Dashboard onBack={handleLogout} />}
      {appState === 'admin' && <AdminDashboard onLogout={handleLogout} />}

      {/* --- FLOATING BUTTON (NOW ONLY VISIBLE TO STANDARD OPERATORS) --- */}
      {appState === 'operator' && (
        <button
          onClick={() => setIsAnalyticsOpen(true)}
          className="fixed right-5 bottom-[120px] lg:right-[30px] lg:bottom-[30px] z-[2500] bg-blue-500 text-white border-none py-3 px-5 lg:py-[15px] lg:px-[25px] rounded-full text-sm lg:text-base font-bold cursor-pointer shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] transition-all duration-200 hover:bg-blue-600 hover:-translate-y-1"
        >
          📊 Open Analytics
        </button>
      )}

      {/* --- MODAL OVERLAY --- */}
      {isAnalyticsOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.90)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9000, padding: '20px'
        }}>
          <AnalyticsModule onClose={() => setIsAnalyticsOpen(false)} />
        </div>
      )}
    </div>
  );
}