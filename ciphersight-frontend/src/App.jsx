'use client';
import React, { useState } from 'react';

import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [appState, setAppState] = useState('landing'); 

  const handleStart = (roleOrBadge) => {
    if (roleOrBadge.startsWith('ADMIN') || roleOrBadge.startsWith('CMD')) {
      setAppState('admin');
    } else {
      setAppState('operator');
    }
  };

  const handleLogout = () => {
    setAppState('landing');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#020617' }}>
      
      {/* --- ROUTING --- */}
      {appState === 'landing' && <LandingPage onStart={handleStart} />}
      {appState === 'operator' && <Dashboard onBack={handleLogout} />}
      {appState === 'admin' && <AdminDashboard onLogout={handleLogout} />}
    </div>
  );
}