/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Siren, Map as MapIcon, Camera, X, Play, RotateCcw, Activity, ShieldCheck, User, LogOut, Info, AlertTriangle, Fingerprint, LayoutDashboard, Route, Building2, FileText, HeartPulse, Menu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { io } from 'socket.io-client';

// ==========================================
// 🎨 INJECTED CSS
// ==========================================
const customStyles = `
  .custom-ambulance-improved { pointer-events: auto !important; overflow: visible; z-index: 1000 !important; transition: transform 2s linear !important; }
  .ambulance-icon-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 50%; position: relative; transition: all 0.3s ease; }
  .ambulance-icon-container::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; border-radius: 50%; background: radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,0,0,0) 70%); animation: flashingLights 1.2s infinite; z-index: 1; }
  .ambulance-icon-container:hover { transform: scale(1.15); box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
  .ambulance-body { background: white; width: 100%; height: 100%; border-radius: 50%; border: 3px solid #ef4444; display: flex; align-items: center; justify-content: center; position: relative; z-index: 5; box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); }
  @keyframes flashingLights { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 0.3; } 100% { transform: scale(1); opacity: 0.8; } }
  @keyframes lockdownPulse { 0% { background-color: rgba(239, 68, 68, 0.1); } 50% { background-color: rgba(239, 68, 68, 0.3); } 100% { background-color: rgba(239, 68, 68, 0.1); } }
  .lockdown-overlay { animation: lockdownPulse 1s infinite; }
  
  /* 📱 MOBILE SIDEBAR TRANSITION */
  .sidebar-transition { transition: transform 0.3s ease-in-out; }
`;

// ==========================================
// 📊 CIRCULAR GAUGE COMPONENT
// ==========================================
const CircularProgress = ({ value, max, label, unit, strokeColor }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full aspect-square bg-[#0a0f1c] rounded-2xl border border-white/5 shadow-lg p-4">
      <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase absolute top-4">{label}</h3>
      <div className="relative w-32 h-32 mt-4 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="8" />
          <circle cx="64" cy="64" r={radius} fill="transparent" stroke={strokeColor} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-500 ease-out" strokeLinecap="round" />
        </svg>
        <div className="flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{value}</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{unit}</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📍 MAP ICONS
// ==========================================
// ==========================================
// 📍 MAP ICONS
// ==========================================
const ambulanceIconImproved = new L.divIcon({
  className: 'custom-ambulance-improved',
  html: `<div class="ambulance-icon-container"><div class="ambulance-body"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div></div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

const baseStationIcon = new L.divIcon({ className: 'custom-b', html: `<div style="background: #f97316; width: 30px; height: 30px; border-radius: 5px; color: white; display:flex; align-items:center; justify-content:center; font-weight:bold; border: 2px solid white; box-shadow: 0 0 10px #f97316;">B</div>` });
const patientIcon = new L.divIcon({ className: 'custom-p', html: `<div style="background: #f59e0b; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #f59e0b;"></div>` });
const hospitalIconA = new L.divIcon({ className: 'custom-h-a', html: `<div style="background: #10b981; width: 30px; height: 30px; border-radius: 5px; color: white; display:flex; align-items:center; justify-content:center; font-weight:bold; border: 2px solid white; box-shadow: 0 0 15px #10b981;">H</div>` });
const hospitalIconB = new L.divIcon({ className: 'custom-h-b', html: `<div style="background: #3b82f6; width: 30px; height: 30px; border-radius: 5px; color: white; display:flex; align-items:center; justify-content:center; font-weight:bold; border: 2px solid white; box-shadow: 0 0 15px #3b82f6;">H</div>` });


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0f1c]/90 backdrop-blur-md border border-[#1e293b] p-3 rounded-lg shadow-2xl">
        <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">{`Progress: ${label}`}</p>
        <p className="text-[#3b82f6] text-xl font-black tracking-tight">{`ETA: ${payload[0].value} min`}</p>
      </div>
    );
  }
  return null;
};

// ==========================================
// 🚀 FEATURE PANELS (Sidebar Content)
// ==========================================
const FeaturePanels = ({ activeTab, onClose }) => {
  if (activeTab === 'Home' || activeTab === 'Dashboard') return null;

  return (
    <div className="absolute inset-0 z-2000 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-4xl bg-[#0a0f1c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative min-h-125 flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-black tracking-widest uppercase text-white">{activeTab} MODULE</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white cursor-pointer"><X size={20}/></button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto text-white">
          {activeTab === 'Reports' && (
            <div>
              <h3 className="text-lg font-bold mb-4">Recent Dispatch Logs</h3>
              <div className="w-full border border-white/10 rounded-xl overflow-hidden text-sm">
                <div className="grid grid-cols-4 bg-white/5 p-3 font-bold text-gray-400 uppercase text-[10px] tracking-widest">
                  <div>Unit</div><div>Time</div><div>Destination</div><div>Status</div>
                </div>
                <div className="grid grid-cols-4 p-3 border-t border-white/5">
                  <div className="text-blue-400">Sentinel-04</div><div>14:32:01</div><div>Apollo Trauma</div><div className="text-emerald-400">Completed</div>
                </div>
                <div className="grid grid-cols-4 p-3 border-t border-white/5">
                  <div className="text-blue-400">Alpha-12</div><div>11:05:44</div><div>City Central</div><div className="text-emerald-400">Completed</div>
                </div>
                <div className="grid grid-cols-4 p-3 border-t border-white/5">
                  <div className="text-blue-400">Bravo-09</div><div>09:12:10</div><div>General Med</div><div className="text-gray-500">Archived</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Route Setup' && (
            <div className="flex flex-col gap-4 max-w-md">
              <h3 className="text-lg font-bold mb-2">Grid Override Settings</h3>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div><p className="font-bold">AI Auto-Routing</p><p className="text-xs text-gray-400">YOLOv8 Dynamic Traffic Avoidance</p></div>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">ENABLED</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div><p className="font-bold">Weather Optimization</p><p className="text-xs text-gray-400">Adjust speed caps for rain/snow</p></div>
                <div className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold rounded">DISABLED</div>
              </div>
            </div>
          )}

          {activeTab === 'Hospitals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-900/10 border border-emerald-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4"><Building2 className="text-emerald-400"/><h3 className="font-bold text-xl">City Central</h3></div>
                <p className="text-sm text-gray-400 mb-2">Trauma Level: II</p>
                <div className="w-full bg-black rounded-full h-2 mb-1"><div className="bg-emerald-500 h-2 rounded-full w-[85%]"></div></div>
                <p className="text-xs text-right text-gray-500">Beds: 85% Full</p>
              </div>
              <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4"><HeartPulse className="text-blue-400"/><h3 className="font-bold text-xl">Apollo Trauma</h3></div>
                <p className="text-sm text-gray-400 mb-2">Trauma Level: I (Specialized)</p>
                <div className="w-full bg-black rounded-full h-2 mb-1"><div className="bg-blue-500 h-2 rounded-full w-[40%]"></div></div>
                <p className="text-xs text-right text-gray-500">Beds: 40% Full</p>
              </div>
            </div>
          )}

{/* PATIENT CONTROL TAB */}
          {activeTab === 'Patient Control' && (
            <div className="flex flex-col items-center justify-center py-4 md:py-8">
              <HeartPulse className="w-16 h-16 md:w-20 md:h-20 text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] mb-6 md:mb-8" />
              
              {/* 🚨 FIX: Changed to grid-cols-1 on mobile, md:grid-cols-3 on laptops, and reduced mobile gap */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full max-w-2xl text-center px-4 md:px-0">
                
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex flex-col justify-center">
                  <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Heart Rate</p>
                  <p className="text-3xl font-black text-red-400">114 <span className="text-sm font-bold text-red-500/70">BPM</span></p>
                </div>
                
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl flex flex-col justify-center">
                  <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">SpO2</p>
                  <p className="text-3xl font-black text-blue-400">92 <span className="text-sm font-bold text-blue-500/70">%</span></p>
                </div>
                
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl flex flex-col justify-center">
                  <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Blood Pressure</p>
                  <p className="text-3xl font-black text-emerald-400">140/90</p>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
               <Activity size={48} className="mb-4 opacity-50" />
               <p>Historical analytics module is currently processing grid data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard({ onBack }) {
  // 📱 NEW: State for Mobile Sidebar
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [missionStatus, setMissionStatus] = useState("IDLE");
  const [ambulanceLoc, setAmbulanceLoc] = useState([12.9716, 77.5846]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  
  // Live State
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [livePreempted, setLivePreempted] = useState(0);
  const [chartData, setChartData] = useState([{ time: '0m', eta: 12 }]);
  const [showAmbulanceDetails, setShowAmbulanceDetails] = useState(false);
  const [cyberThreat, setCyberThreat] = useState(null);

  const socketRef = useRef(null);

  // Map Coordinates & Detailed Street Routes
  const baseStation = [12.9716, 77.5846];
  const patientLoc = [12.9650, 77.5900];
  const hospitalA = [12.9780, 77.5950];
  const hospitalB = [12.9550, 77.6050];

  const routeToPatient = [[12.9716, 77.5846], [12.9680, 77.5846], [12.9680, 77.5880], [12.9650, 77.5880], [12.9650, 77.5900]];
  const routeToHospA = [[12.9650, 77.5900], [12.9650, 77.5940], [12.9716, 77.5940], [12.9716, 77.5950], [12.9780, 77.5950]];
  const routeToHospB = [[12.9650, 77.5900], [12.9650, 77.5950], [12.9600, 77.5950], [12.9600, 77.6000], [12.9550, 77.6000], [12.9550, 77.6050]];

  useEffect(() => {
    const secureToken = localStorage.getItem('cipher_token');
    const socketUrl = `http://${window.location.hostname}:5000`;
    socketRef.current = io(socketUrl, { auth: { token: secureToken } });
    
    socketRef.current.on('live_tracking', (data) => {
      setAmbulanceLoc(data.location);
      if(data.status) setMissionStatus(data.status);
      if(data.speed) setLiveSpeed(data.speed);
      if(data.preempted) setLivePreempted(data.preempted);
      
      if(data.eta && data.time_elapsed) {
        setChartData(prevData => {
          const newData = [...prevData, { time: data.time_elapsed, eta: data.eta }];
          const uniqueData = Array.from(new Map(newData.map(item => [item.time, item])).values());
          if (uniqueData.length > 6) uniqueData.shift(); 
          return uniqueData;
        });
      }
    });

    socketRef.current.on('status_update', (data) => setMissionStatus(data.status));
    socketRef.current.on('cyber_alert', (data) => setCyberThreat(data));

    return () => socketRef.current.disconnect();
  }, []);

  // Auto-Simulation progression logic
  useEffect(() => {
    if (!isAutoSimulating) return;

    if (missionStatus === 'AT_PATIENT') {
      const timer = setTimeout(() => {
        // eslint-disable-next-line react-hooks/immutability
        dispatchToHospital('B');
      }, 1500);
      return () => clearTimeout(timer);
    } else if (missionStatus === 'TRANSPORTING') {
      if (!isCameraOpen) setIsCameraOpen(true);
    } else if (missionStatus === 'ARRIVED') {
      const timer = setTimeout(() => {
        setIsAutoSimulating(false);
        setIsCameraOpen(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [missionStatus, isAutoSimulating, isCameraOpen]);

  const dispatchToHospital = (hospId) => {
    setSelectedHospital(hospId);
    socketRef.current.emit('start_transport', { hospital: hospId });
    setChartData([{ time: '0m', eta: 12 }]); 
  };

  const resetSim = () => {
    setSelectedHospital(null);
    setShowAmbulanceDetails(false); 
    setCyberThreat(null);
    setChartData([{ time: '0m', eta: 12 }]);
    setIsAutoSimulating(false);
    setIsCameraOpen(false);
    socketRef.current.emit('reset_sim');
  };

const simulateRogueDetection = () => {
    // 1. Still send to backend for logging purposes
    if (socketRef.current) {
      socketRef.current.emit('simulate_rogue_detection');
    }
    
    // 2. 🚨 INSTANT UI TRIGGER (Bypasses network delay)
    setCyberThreat({
      threat_level: 'CRITICAL',
      type: 'SPOOFED_VEHICLE',
      message: 'Visual signature at Intersection 04 lacks matching encrypted JWT telemetry.',
      action: 'PREEMPTION GRID LOCKED. AUTHORITIES DISPATCHED.'
    });
    
    // 3. Close the sidebar on mobile so you can see the alert
    setSidebarOpen(false); 
  };
  const handleDisconnect = () => { 
    localStorage.removeItem('cipher_token'); 
    onBack(); 
  };

  // 📱 Helper function to change tabs and close mobile sidebar
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#030712] text-white font-sans overflow-hidden relative">
      <style>{customStyles}</style>
      
      {/* 📱 MOBILE HEADER (Visible only on small screens) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0c1322] border-b border-white/5 z-2001">
        <div className="flex items-center gap-2">
          <Siren className="w-5 h-5 text-blue-500" />
          <span className="font-black text-sm tracking-tight uppercase">CIPHER<span className="text-blue-500">SIGHT</span></span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white cursor-pointer">
          <Menu size={24} />
        </button>
      </div>

      <FeaturePanels activeTab={activeTab} onClose={() => setActiveTab('Dashboard')} />

      {/* MASSIVE CYBER THREAT OVERLAY */}
      {cyberThreat && (
        <div className="fixed inset-0 z-9999 lockdown-overlay backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-black/90 border-2 border-red-600 rounded-3xl p-10 max-w-2xl w-full text-center shadow-[0_0_100px_rgba(220,38,38,0.5)]">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-600/20 rounded-full animate-pulse border border-red-500/50">
                <AlertTriangle className="w-20 h-20 text-red-500" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-red-500 tracking-tighter uppercase mb-2">SYSTEM LOCKDOWN</h1>
            <h2 className="text-xl font-bold text-white mb-6">ROGUE VEHICLE DETECTED</h2>
            
            <div className="bg-red-950/40 border border-red-900/50 p-6 rounded-xl text-left font-mono text-sm text-red-200 mb-8 flex flex-col gap-3">
              <p className="flex items-center gap-2"><Fingerprint size={16} className="text-red-400"/> <strong>AI VISUAL DETECT:</strong> POSITIVE (Unmarked Van)</p>
              <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-red-400"/> <strong>JWT TELEMETRY:</strong> <span className="text-red-500 font-bold">FAILED</span></p>
              <div className="h-px bg-red-900/50 w-full my-2"></div>
              <p className="text-white bg-red-600/20 p-2 rounded border border-red-500/30"><strong>ACTION TAKEN:</strong> {cyberThreat.action}</p>
            </div>
            <button onClick={() => setCyberThreat(null)} className="w-full bg-white text-black font-black tracking-widest px-6 py-4 rounded-xl hover:bg-gray-200 transition-all uppercase cursor-pointer">ACKNOWLEDGE & CLEAR ALERT</button>
          </div>
        </div>
      )}

      {/* 🚀 MAIN CONTENT WRAPPER */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR (Responsive Sliding) */}
        <div className={`fixed inset-y-0 left-0 w-65 bg-[#0c1322] border-r border-white/5 flex flex-col shadow-2xl z-3000 transform sidebar-transition lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Siren className="w-6 h-6 text-blue-400" />
              <h1 className="font-black text-xl tracking-tight text-white uppercase">Cipher<span className="text-blue-500">Sight</span></h1>
            </div>
            {/* Mobile Close Button */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white cursor-pointer"><X size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
            <div>
              <nav className="flex flex-col gap-1">
                <button onClick={() => handleNavClick('Home')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Home' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><LayoutDashboard size={18}/> Home</button>
                <button onClick={() => handleNavClick('Dashboard')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Dashboard' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><MapIcon size={18}/> Dashboard</button>
                <button onClick={() => handleNavClick('Analytics')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Analytics' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><Activity size={18}/> Analytics</button>
                <button onClick={() => handleNavClick('Reports')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Reports' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><FileText size={18}/> Reports</button>
              </nav>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3">Nav</h3>
              <nav className="flex flex-col gap-1">
                <button onClick={() => {setIsCameraOpen(true); setSidebarOpen(false);}} className="flex items-center gap-3 w-full p-3 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all font-bold cursor-pointer"><Camera size={18}/> AI CCTV Grid</button>
                <button onClick={() => handleNavClick('Route Setup')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Route Setup' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><Route size={18}/> Route Setup</button>
                <button onClick={() => handleNavClick('Hospitals')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Hospitals' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><Building2 size={18}/> Hospitals</button>
                <button onClick={() => handleNavClick('Patient Control')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Patient Control' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><HeartPulse size={18}/> Patient Control</button>
                
                <button onClick={simulateRogueDetection} className="flex items-center gap-3 w-full p-3 mt-4 rounded-lg bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition-all cursor-pointer"><AlertTriangle size={18}/> Test Threat</button>
                <button onClick={handleDisconnect} className="flex items-center gap-3 w-full p-3 mt-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"><LogOut size={18}/> Logout</button>
              </nav>
            </div>
          </div>
        </div>

        {/* 📱 Mobile Overlay (Dims map when sidebar is open) */}
        {isSidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-2005 lg:hidden" />
        )}

        {/* CENTER MAP AREA */}
        <div className="flex-1 relative bg-[#050810] flex flex-col overflow-hidden">
          
          {/* Header Strip */}
          <div className="absolute top-0 w-full h-16 bg-linear-to-b from-[#030712] to-transparent z-1000 pointer-events-none flex items-center justify-end px-6">
            <div className="flex items-center gap-4 pointer-events-auto">
              <button className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10 cursor-pointer"><Siren size={18} /></button>
              <button className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10 cursor-pointer"><User size={18} /></button>
            </div>
          </div>

          {/* Interactive Mission Control Panel (Responsive) */}
          <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-1/2 lg:transform lg:-translate-x-1/2 z-1000 lg:w-full lg:max-w-md">
            <div className="bg-[#0c1322]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 lg:p-5 shadow-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${missionStatus !== 'IDLE' && missionStatus !== 'ARRIVED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  Mission Status
                </div>
                <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold bg-blue-500/10 px-2 py-1 rounded">JWT Verified</span>
              </div>
              
              <p className="text-xl font-black mb-2 text-white tracking-tight">{missionStatus.replace('_', ' ')}</p>

              <div className="flex flex-col gap-2">
                {missionStatus === 'IDLE' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => socketRef.current.emit('dispatch_unit')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 cursor-pointer uppercase">
                      <Play size={16}/> Dispatch Command
                    </button>
                    <button onClick={() => { setIsAutoSimulating(true); socketRef.current.emit('dispatch_unit'); }} className="w-full py-3 bg-[#9D00FF]/20 hover:bg-[#9D00FF]/40 border border-[#9D00FF]/50 text-[#9D00FF] rounded-xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer uppercase">
                      <Activity size={16}/> Auto-Simulate Scenario
                    </button>
                  </div>
                )}

                {/* HOSPITAL SELECTION BUTTONS */}
                {missionStatus === 'AT_PATIENT' && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select Destination:</p>
                    
                    <button onClick={() => dispatchToHospital('A')} className="w-full p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left hover:bg-emerald-500/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-emerald-400 flex items-center gap-2"><Building2 size={16}/> City Central</div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Nearer</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">1.2km &bull; Est: 4 mins via Main St</div>
                    </button>

                    <button onClick={() => dispatchToHospital('B')} className="w-full p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-left hover:bg-blue-500/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-blue-400 flex items-center gap-2"><HeartPulse size={16}/> Apollo Trauma</div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Faster</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">2.8km &bull; Est: 6 mins (Preemption Active)</div>
                    </button>
                  </div>
                )}

                {missionStatus === 'TRANSPORTING' && (
                  <div className="w-full py-4 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-2 uppercase">
                    <Activity size={16} className="animate-pulse"/> Preempting Intersections...
                  </div>
                )}

                {missionStatus === 'ARRIVED' && (
                  <button onClick={resetSim} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer uppercase">
                    <RotateCcw size={16}/> Reset Grid
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 🗺️ ACTUAL LEAFLET MAP */}
          <div className="flex-1 w-full relative z-0">
            <MapContainer center={[12.9650, 77.5950]} zoom={14} style={{ height: '100%', width: '100%', background: '#020617' }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              {['IDLE', 'RESPONDING'].includes(missionStatus) && (
                <Polyline positions={routeToPatient} color="#eab308" weight={4} opacity={0.8} dashArray="5, 10" />
              )}
              
              {missionStatus === 'AT_PATIENT' && (
                <>
                  <Polyline positions={routeToHospA} color="#10b981" weight={4} opacity={0.6} dashArray="5, 10" />
                  <Polyline positions={routeToHospB} color="#3b82f6" weight={4} opacity={0.6} dashArray="5, 10" />
                </>
              )}

              {['TRANSPORTING', 'ARRIVED'].includes(missionStatus) && selectedHospital === 'A' && (
                <Polyline positions={routeToHospA} color="#10b981" weight={6} opacity={0.9} />
              )}
              {['TRANSPORTING', 'ARRIVED'].includes(missionStatus) && selectedHospital === 'B' && (
                <Polyline positions={routeToHospB} color="#3b82f6" weight={6} opacity={0.9} />
              )}

              <Marker position={baseStation} icon={baseStationIcon}><Popup>Base Station</Popup></Marker>
              <Marker position={patientLoc} icon={patientIcon}><Popup>Critical Patient</Popup></Marker>
              <Marker position={hospitalA} icon={hospitalIconA}><Popup>City Central Hospital</Popup></Marker>
              <Marker position={hospitalB} icon={hospitalIconB}><Popup>Apollo Trauma Center</Popup></Marker>
              
              <Marker position={ambulanceLoc} icon={ambulanceIconImproved} eventHandlers={{ click: () => setShowAmbulanceDetails(!showAmbulanceDetails) }}>
                {showAmbulanceDetails && (
                  <Popup closeButton={false} autoPan={false}>
                      <div className="bg-[#0c1322] border border-white/10 rounded-lg p-3 w-48 shadow-2xl text-white font-sans -m-3.5">
                        <h4 className="font-bold text-sm mb-1">Live Sentinel Unit</h4>
                        <p className="text-xs text-red-400 flex items-center gap-1 mb-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Flashing Red</p>
                        <div className="text-[11px] text-gray-400 flex flex-col gap-1">
                          <p>Speed: <span className="text-white font-bold">{liveSpeed} mph</span></p>
                          <p>Status: <span className="text-white font-bold">{missionStatus}</span></p>
                        </div>
                      </div>
                  </Popup>
                )}
              </Marker>
            </MapContainer>
          </div>

          {/* AI CCTV Modal Overlay (Responsive + PiP for Auto-Sim) */}
          {isCameraOpen && (
            <div className={`absolute ${isAutoSimulating ? 'bottom-[20px] right-[20px] w-[250px] md:w-[350px] lg:w-[450px] h-[180px] md:h-[250px] lg:h-[320px] rounded-xl border-2 border-[#9D00FF] shadow-[0_0_30px_rgba(157,0,255,0.4)] z-[3000]' : 'inset-0 bg-black/90 backdrop-blur-md p-4 lg:p-12 z-[2000]'} flex items-center justify-center transition-all duration-500 pointer-events-none`}>
              <div className={`w-full h-full bg-[#0a0f1c] ${isAutoSimulating ? 'rounded-xl' : 'max-w-4xl border border-white/10 rounded-xl lg:rounded-3xl shadow-2xl'} overflow-hidden relative flex flex-col pointer-events-auto`}>
                <div className={`p-2 ${isAutoSimulating ? '' : 'lg:p-4'} border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10 shrink-0`}>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-ping" /><span className="text-[10px] lg:text-xs font-bold tracking-widest uppercase text-white">AI Vision: Int 04</span></div>
                  <button onClick={() => setIsCameraOpen(false)} className="p-1 lg:p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer text-white"><X size={isAutoSimulating ? 14 : 20}/></button>
                </div>
                <div className="flex-1 overflow-hidden flex items-center justify-center bg-black">
                  <img src={`http://${window.location.hostname}:5000/api/cctv`} alt="Live AI Stream" className="w-full h-full object-contain" />
                </div>
                {!isAutoSimulating && (
                  <div className="p-3 lg:p-4 bg-black/50 text-[10px] font-mono text-gray-400 flex justify-between items-center relative z-10 shrink-0">
                    <span>SYSTEM: YOLOv8_ENABLED</span>
                    <span className="text-[#9D00FF] font-bold tracking-widest">DETECTING: AMBULANCE</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Analytics & Gauges) - Hidden on mobile */}
        <div className="hidden lg:flex w-[320px] bg-[#0c1322] border-l border-white/5 flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
          <div className="p-6 pb-2">
            <h2 className="text-xl font-bold text-white mb-6">Analytics</h2>
            <div className="w-full h-55 mb-8 relative">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1e293b', strokeWidth: 2, strokeDasharray: '4 4' }} />
                  <Line type="monotone" dataKey="eta" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-6">
            <CircularProgress label="Speed" value={liveSpeed} max={100} unit="mph" strokeColor="#3b82f6" />
            <CircularProgress label="Preempted" value={livePreempted} max={8} unit="/ 8" strokeColor="#06b6d4" />
          </div>
        </div>
      </div>
    </div>
  );
}