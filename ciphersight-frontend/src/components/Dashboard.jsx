/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Siren, Map as MapIcon, Camera, X, Play, RotateCcw, Activity, ShieldCheck, User, LogOut, Info, AlertTriangle, Fingerprint, LayoutDashboard, Route, Building2, FileText, HeartPulse, Menu } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
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
  
  /* 📱 MOBILE & DESKTOP SIDEBAR TRANSITION */
  .sidebar-transition { transition: transform 0.3s ease-in-out, margin-left 0.3s ease-in-out; }
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
const hospitalIconC = new L.divIcon({ className: 'custom-h-c', html: `<div style="background: #f59e0b; width: 30px; height: 30px; border-radius: 5px; color: white; display:flex; align-items:center; justify-content:center; font-weight:bold; border: 2px solid white; box-shadow: 0 0 15px #f59e0b;">H</div>` });
const hospitalIconD = new L.divIcon({ className: 'custom-h-d', html: `<div style="background: #a855f7; width: 30px; height: 30px; border-radius: 5px; color: white; display:flex; align-items:center; justify-content:center; font-weight:bold; border: 2px solid white; box-shadow: 0 0 15px #a855f7;">H</div>` });


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
// 📊 OFFLINE ANALYTICS DATA & HELPERS
// ==========================================
const offlineAnalyticsData = [
  { time: "00:00", responseTime: 6.5, congestion: 10 },
  { time: "04:00", responseTime: 6.0, congestion: 5 },
  { time: "08:00", responseTime: 14.2, congestion: 85 },
  { time: "10:00", responseTime: 9.5, congestion: 50 },
  { time: "12:00", responseTime: 8.5, congestion: 40 },
  { time: "16:00", responseTime: 10.1, congestion: 65 },
  { time: "18:00", responseTime: 15.5, congestion: 90 },
  { time: "20:00", responseTime: 9.0, congestion: 45 },
  { time: "23:00", responseTime: 7.2, congestion: 20 }
];

const analyticsMetricConfig = {
  responseTime: { dataKey: 'responseTime', color: '#3b82f6', name: 'Response Time (mins)', domain: [0, 20] },
  congestion: { dataKey: 'congestion', color: '#ef4444', name: 'Grid Congestion (%)', domain: [0, 100] }
};

const AnalyticsKpiCard = ({ title, value, trend, trendColor }) => (
  <div className="flex-1 bg-[#111827] px-4 py-3 rounded-lg border border-white/5 min-w-0">
    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</div>
    <div className="text-xl font-black leading-tight">{value}</div>
    <div className="text-[11px] font-semibold mt-0.5" style={{ color: trendColor }}>{trend}</div>
  </div>
);

const getMetricBtnStyle = (isActive, activeColor) => ({
  padding: '8px 16px', backgroundColor: isActive ? activeColor + '20' : 'transparent',
  color: isActive ? activeColor : '#94a3b8', border: `1px solid ${isActive ? activeColor : '#334155'}`,
  borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s'
});

// ==========================================
// 🚀 FEATURE PANELS (Sidebar Content)
// ==========================================
const FeaturePanels = ({ activeTab, onClose }) => {
  const [analyticsMetric, setAnalyticsMetric] = useState('responseTime');
  const metricCfg = analyticsMetricConfig[analyticsMetric];

  const handleDownloadCSV = () => {
    const headers = 'Time,Response Time (mins),Congestion (%)\n';
    const rows = offlineAnalyticsData.map(d => `${d.time},${d.responseTime},${d.congestion}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CipherSight_Analytics_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const rows = offlineAnalyticsData.map(d => {
      const status = d.congestion > 70 ? 'HIGH' : d.congestion > 40 ? 'MODERATE' : 'LOW';
      const statusColor = d.congestion > 70 ? '#ef4444' : d.congestion > 40 ? '#f59e0b' : '#10b981';
      return `<tr><td>${d.time}</td><td>${d.responseTime}</td><td>${d.congestion}%</td><td style="color:${statusColor};font-weight:bold">${status}</td></tr>`;
    }).join('');
    const reportHTML = `<!DOCTYPE html><html><head><title>CipherSight Analytics Report</title>
<style>body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:900px;margin:0 auto}
h1{color:#0f172a;border-bottom:3px solid #3b82f6;padding-bottom:10px;font-size:24px}
.meta{color:#64748b;margin-bottom:30px;font-size:13px}
.kpi-row{display:flex;gap:20px;margin-bottom:30px}
.kpi{flex:1;background:#f1f5f9;padding:20px;border-radius:8px;border-left:4px solid #3b82f6}
.kpi-title{color:#64748b;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.kpi-value{font-size:28px;font-weight:800;color:#0f172a}
.kpi-trend{font-size:11px;margin-top:4px}
table{width:100%;border-collapse:collapse;margin-top:20px}
th{background:#0f172a;color:white;padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}
td{padding:12px 16px;border-bottom:1px solid #e2e8f0}
tr:nth-child(even){background:#f8fafc}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;text-align:center}
@media print{body{padding:20px}}</style></head><body>
<h1>CipherSight Analytics Report</h1>
<p class="meta">Generated: ${new Date().toLocaleString()} &bull; Mode: Offline Analysis &bull; System: CipherSight Preemption Grid</p>
<div class="kpi-row">
<div class="kpi"><div class="kpi-title">Avg Response Time</div><div class="kpi-value">8m 45s</div><div class="kpi-trend" style="color:#10b981">&#8595; 12% vs last week</div></div>
<div class="kpi"><div class="kpi-title">AI Overrides Today</div><div class="kpi-value">24</div><div class="kpi-trend" style="color:#3b82f6">System normal</div></div>
<div class="kpi"><div class="kpi-title">Grid Congestion</div><div class="kpi-value">42%</div><div class="kpi-trend" style="color:#94a3b8">Normal Capacity</div></div>
</div>
<h2>Historical Grid Data</h2>
<table><thead><tr><th>Time</th><th>Response Time (mins)</th><th>Congestion (%)</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer">CipherSight Urban Traffic Preemption Grid &mdash; Confidential Report</div>
</body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (activeTab === 'Home' || activeTab === 'Dashboard') return null;

  return (
    <div className="absolute inset-0 z-2000 bg-black/80 backdrop-blur-md flex items-center justify-center pt-8 pb-3 px-3 md:pt-10 md:pb-6 md:px-6">
      <div className={`w-full ${activeTab === 'Analytics' || activeTab === 'Reports' ? 'max-w-6xl' : 'max-w-4xl'} bg-[#0a0f1c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200 transition-all`}>
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-black tracking-widest uppercase text-white">{activeTab} MODULE</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white cursor-pointer"><X size={20}/></button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto text-white">
          {activeTab === 'Reports' && (
            <div className="pb-4">
              {/* DISPATCH LOGS */}
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Recent Dispatch Logs</h3>
              <div className="w-full border border-white/10 rounded-lg overflow-hidden text-sm mb-4">
                <div className="grid grid-cols-5 bg-white/5 px-3 py-1.5 font-bold text-gray-500 uppercase text-[8px] tracking-widest">
                  <div>Unit</div><div>Time</div><div>Destination</div><div>Response</div><div>Status</div>
                </div>
                {[
                  { unit: 'Sentinel-04', time: '14:32:01', dest: 'Apollo Trauma', resp: '6m 12s', status: 'Completed', color: 'text-emerald-400' },
                  { unit: 'Alpha-12', time: '11:05:44', dest: 'City Central', resp: '8m 45s', status: 'Completed', color: 'text-emerald-400' },
                  { unit: 'Bravo-09', time: '09:12:10', dest: 'General Med', resp: '12m 03s', status: 'Archived', color: 'text-gray-500' },
                  { unit: 'Delta-07', time: '07:48:22', dest: 'Apollo Trauma', resp: '5m 30s', status: 'Completed', color: 'text-emerald-400' },
                  { unit: 'Echo-15', time: '03:15:09', dest: 'City Central', resp: '14m 18s', status: 'Delayed', color: 'text-amber-400' },
                ].map((log, i) => (
                  <div key={i} className="grid grid-cols-5 px-3 py-1.5 border-t border-white/5 text-[11px] hover:bg-white/[0.02] transition-colors">
                    <div className="text-blue-400 font-bold">{log.unit}</div>
                    <div className="text-gray-400 font-mono">{log.time}</div>
                    <div>{log.dest}</div>
                    <div className="text-gray-300">{log.resp}</div>
                    <div className={`font-bold ${log.color}`}>{log.status}</div>
                  </div>
                ))}
              </div>

              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Hospital Resource Availability</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {[
                  {
                    name: 'City Central Hospital', type: 'Trauma II', icon: 'building',
                    accent: 'emerald', status: 'Operational',
                    resources: [
                      { label: 'ICU Beds', avail: 3, total: 20 },
                      { label: 'Ventilators', avail: 5, total: 15 },
                      { label: 'Blood Bank (units)', avail: 42, total: 50 },
                      { label: 'Operating Rooms', avail: 1, total: 6 },
                      { label: 'Ambulances', avail: 4, total: 8 },
                      { label: 'Staff On Duty', avail: 34, total: 45 },
                    ]
                  },
                  {
                    name: 'Apollo Trauma Center', type: 'Trauma I', icon: 'heart',
                    accent: 'blue', status: 'Operational',
                    resources: [
                      { label: 'ICU Beds', avail: 12, total: 30 },
                      { label: 'Ventilators', avail: 8, total: 20 },
                      { label: 'Blood Bank (units)', avail: 38, total: 60 },
                      { label: 'Operating Rooms', avail: 4, total: 10 },
                      { label: 'Ambulances', avail: 7, total: 12 },
                      { label: 'Staff On Duty', avail: 56, total: 70 },
                    ]
                  },
                  {
                    name: 'General Medical Center', type: 'Trauma III', icon: 'building',
                    accent: 'amber', status: 'High Load',
                    resources: [
                      { label: 'ICU Beds', avail: 2, total: 12 },
                      { label: 'Ventilators', avail: 3, total: 10 },
                      { label: 'Blood Bank (units)', avail: 18, total: 30 },
                      { label: 'Operating Rooms', avail: 1, total: 4 },
                      { label: 'Ambulances', avail: 2, total: 5 },
                      { label: 'Staff On Duty', avail: 22, total: 30 },
                    ]
                  },
                  {
                    name: "St. Mary's Care Hospital", type: 'General', icon: 'heart',
                    accent: 'purple', status: 'Operational',
                    resources: [
                      { label: 'ICU Beds', avail: 8, total: 15 },
                      { label: 'Ventilators', avail: 6, total: 8 },
                      { label: 'Blood Bank (units)', avail: 25, total: 35 },
                      { label: 'Operating Rooms', avail: 3, total: 5 },
                      { label: 'Ambulances', avail: 3, total: 6 },
                      { label: 'Staff On Duty', avail: 28, total: 35 },
                    ]
                  },
                ].map((hosp, hi) => {
                  const colors = {
                    emerald: { border: 'border-emerald-500/20', headerBg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
                    blue: { border: 'border-blue-500/20', headerBg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400' },
                    amber: { border: 'border-amber-500/20', headerBg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
                    purple: { border: 'border-purple-500/20', headerBg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
                  }[hosp.accent];
                  return (
                    <div key={hi} className={`bg-[#111827] rounded-lg ${colors.border} border overflow-hidden`}>
                      <div className={`flex items-center justify-between px-3 py-2 ${colors.headerBg} border-b ${colors.border}`}>
                        <div className="flex items-center gap-1.5">
                          {hosp.icon === 'building' ? <Building2 size={12} className={colors.text} /> : <HeartPulse size={12} className={colors.text} />}
                          <h4 className="font-black text-[11px]">{hosp.name}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[7px] font-bold uppercase tracking-widest ${colors.badge} px-1.5 py-0.5 rounded`}>{hosp.type}</span>
                          <span className={`text-[7px] font-bold uppercase tracking-widest ${hosp.status === 'High Load' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'} px-1.5 py-0.5 rounded`}>{hosp.status}</span>
                        </div>
                      </div>
                      <div className="px-3 py-2 flex flex-col gap-1.5">
                        {hosp.resources.map((res, ri) => {
                          const usedPct = Math.round(((res.total - res.avail) / res.total) * 100);
                          const barColor = usedPct > 75 ? 'bg-red-500' : usedPct > 50 ? 'bg-amber-500' : 'bg-emerald-500';
                          const numColor = usedPct > 75 ? 'text-red-400' : usedPct > 50 ? 'text-amber-400' : 'text-emerald-400';
                          return (
                            <div key={ri} className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider w-28 shrink-0 truncate">{res.label}</span>
                              <div className="flex-1 bg-black/30 rounded-full h-1">
                                <div className={`${barColor} h-1 rounded-full transition-all`} style={{ width: `${usedPct}%` }} />
                              </div>
                              <span className={`text-[10px] font-black ${numColor} w-11 text-right shrink-0`}>{res.avail}<span className="text-gray-600">/{res.total}</span></span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
              <div className="bg-amber-900/10 border border-amber-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4"><Building2 className="text-amber-400"/><h3 className="font-bold text-xl">General Medical</h3></div>
                <p className="text-sm text-gray-400 mb-2">Trauma Level: III</p>
                <div className="w-full bg-black rounded-full h-2 mb-1"><div className="bg-amber-500 h-2 rounded-full w-[83%]"></div></div>
                <p className="text-xs text-right text-gray-500">Beds: 83% Full</p>
              </div>
              <div className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4"><HeartPulse className="text-purple-400"/><h3 className="font-bold text-xl">St. Mary's</h3></div>
                <p className="text-sm text-gray-400 mb-2">Trauma Level: General</p>
                <div className="w-full bg-black rounded-full h-2 mb-1"><div className="bg-purple-500 h-2 rounded-full w-[47%]"></div></div>
                <p className="text-xs text-right text-gray-500">Beds: 47% Full</p>
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
            <div className="-mt-2">
              {/* Top Row: KPI Cards + Download Buttons */}
              <div className="flex flex-col md:flex-row md:items-start gap-3 mb-4">
                <div className="flex flex-1 gap-2 min-w-0">
                  <AnalyticsKpiCard title="Avg Response" value="8m 45s" trend="↓ 12%" trendColor="#10b981" />
                  <AnalyticsKpiCard title="AI Overrides" value="24" trend="Normal" trendColor="#3b82f6" />
                  <AnalyticsKpiCard title="Congestion" value="42%" trend="Nominal" trendColor="#94a3b8" />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleDownloadCSV} className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold text-xs hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5">
                    📥 CSV
                  </button>
                  <button onClick={handleDownloadPDF} className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg font-bold text-xs hover:bg-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5">
                    📄 PDF
                  </button>
                </div>
              </div>

              {/* Chart Controls */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  <button onClick={() => setAnalyticsMetric('responseTime')} style={getMetricBtnStyle(analyticsMetric === 'responseTime', '#3b82f6')}>Response Times</button>
                  <button onClick={() => setAnalyticsMetric('congestion')} style={getMetricBtnStyle(analyticsMetric === 'congestion', '#ef4444')}>Congestion</button>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/15 px-2.5 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-amber-400 text-[9px] font-bold uppercase tracking-widest">Offline</span>
                </div>
              </div>

              {/* 2-Column: Chart + Table */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Chart — takes 3 columns */}
                <div className="lg:col-span-3 bg-[#111827] rounded-xl p-3 border border-white/5" style={{ height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={offlineAnalyticsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={metricCfg.color} stopOpacity={0.35}/>
                          <stop offset="95%" stopColor={metricCfg.color} stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} domain={metricCfg.domain} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ color: metricCfg.color, fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey={metricCfg.dataKey} name={metricCfg.name} stroke={metricCfg.color} strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsGradient)" dot={{ r: 3, fill: metricCfg.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: metricCfg.color, stroke: '#0f172a', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Table — takes 2 columns */}
                <div className="lg:col-span-2 bg-[#111827] rounded-xl border border-white/5 overflow-hidden flex flex-col" style={{ height: '320px' }}>
                  <div className="grid grid-cols-3 bg-white/5 px-3 py-2 font-bold text-gray-500 uppercase text-[9px] tracking-widest shrink-0">
                    <div>Time</div><div className="text-center">Resp.</div><div className="text-right">Cong.</div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {offlineAnalyticsData.map((d, i) => (
                      <div key={i} className="grid grid-cols-3 px-3 py-2 border-t border-white/[0.03] text-xs hover:bg-white/[0.02] transition-colors">
                        <div className="text-gray-400 font-mono">{d.time}</div>
                        <div className="text-blue-400 font-bold text-center">{d.responseTime}m</div>
                        <div className={`font-bold text-right ${d.congestion > 70 ? 'text-red-400' : d.congestion > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{d.congestion}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard({ onBack }) {
  // 📱 NEW: State for Mobile Sidebar
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [missionStatus, setMissionStatus] = useState("IDLE");
  const [ambulanceLoc, setAmbulanceLoc] = useState([12.9742, 77.5855]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [cctvError, setCctvError] = useState(false);
  const [useLocalSim, setUseLocalSim] = useState(false);
  
  // Live State
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [livePreempted, setLivePreempted] = useState(0);
  const [chartData, setChartData] = useState([{ time: '0m', eta: 12 }]);
  const [showAmbulanceDetails, setShowAmbulanceDetails] = useState(false);
  const [cyberThreat, setCyberThreat] = useState(null);

  const socketRef = useRef(null);
  const localSimIntervalRef = useRef(null);

  // Map Coordinates & Detailed Street Routes (Bangalore roads)
  const baseStation = [12.9742, 77.5855];   // KG Road / Nrupathunga Rd junction
  const patientLoc  = [12.9660, 77.5910];   // Near Mission Rd / KR Rd
  const hospitalA   = [12.9770, 77.5960];   // City Central - near Cubbon Park
  const hospitalB   = [12.9580, 77.6020];   // Apollo Trauma - Richmond Circle area
  const hospitalC   = [12.9635, 77.5760];   // General Medical - near SJP Rd / JC Rd
  const hospitalD   = [12.9810, 77.5810];   // St. Mary's - near Sheshadri Rd

  // Base → Patient: KG Rd south → turn east on Kasturba Rd → south to Mission Rd
  const routeToPatient = [
    [12.9742, 77.5855], [12.9735, 77.5855], [12.9728, 77.5856], [12.9720, 77.5857],
    [12.9712, 77.5858], [12.9705, 77.5860], [12.9700, 77.5865], [12.9695, 77.5870],
    [12.9690, 77.5878], [12.9685, 77.5885], [12.9680, 77.5890], [12.9675, 77.5895],
    [12.9670, 77.5900], [12.9665, 77.5905], [12.9660, 77.5910],
  ];

  // Patient → City Central (A): North along Kasturba Rd → east on Cubbon Rd
  const routeToHospA = [
    [12.9660, 77.5910], [12.9665, 77.5912], [12.9670, 77.5915], [12.9678, 77.5918],
    [12.9685, 77.5920], [12.9692, 77.5922], [12.9700, 77.5925], [12.9708, 77.5928],
    [12.9715, 77.5930], [12.9722, 77.5933], [12.9730, 77.5936], [12.9738, 77.5940],
    [12.9745, 77.5943], [12.9752, 77.5947], [12.9758, 77.5950], [12.9765, 77.5955],
    [12.9770, 77.5960],
  ];

  // Patient → Apollo Trauma (B): South on KR Rd → east on Richmond Rd
  const routeToHospB = [
    [12.9660, 77.5910], [12.9655, 77.5915], [12.9650, 77.5920], [12.9645, 77.5925],
    [12.9640, 77.5930], [12.9635, 77.5935], [12.9630, 77.5940], [12.9625, 77.5948],
    [12.9620, 77.5955], [12.9615, 77.5962], [12.9610, 77.5970], [12.9605, 77.5978],
    [12.9600, 77.5985], [12.9595, 77.5992], [12.9590, 77.6000], [12.9585, 77.6010],
    [12.9580, 77.6020],
  ];

  // Patient → General Medical (C): West on Mission Rd → south on JC Rd
  const routeToHospC = [
    [12.9660, 77.5910], [12.9660, 77.5902], [12.9658, 77.5895], [12.9656, 77.5888],
    [12.9654, 77.5880], [12.9652, 77.5872], [12.9650, 77.5865], [12.9648, 77.5858],
    [12.9646, 77.5850], [12.9644, 77.5842], [12.9643, 77.5835], [12.9642, 77.5828],
    [12.9640, 77.5820], [12.9639, 77.5810], [12.9638, 77.5800], [12.9637, 77.5790],
    [12.9636, 77.5780], [12.9635, 77.5770], [12.9635, 77.5760],
  ];

  // Patient → St. Mary's (D): North via Kasturba Rd → west on Nrupathunga → north on Sheshadri Rd
  const routeToHospD = [
    [12.9660, 77.5910], [12.9668, 77.5908], [12.9675, 77.5905], [12.9682, 77.5900],
    [12.9690, 77.5895], [12.9698, 77.5888], [12.9705, 77.5880], [12.9712, 77.5872],
    [12.9720, 77.5865], [12.9728, 77.5858], [12.9735, 77.5855], [12.9742, 77.5852],
    [12.9750, 77.5848], [12.9758, 77.5845], [12.9765, 77.5840], [12.9772, 77.5835],
    [12.9780, 77.5830], [12.9788, 77.5825], [12.9795, 77.5820], [12.9802, 77.5815],
    [12.9810, 77.5810],
  ];

  const stopLocalSim = () => {
    if (localSimIntervalRef.current) {
      clearInterval(localSimIntervalRef.current);
      localSimIntervalRef.current = null;
    }
  };

  const startLocalSimulation = (type, hospId = null) => {
    stopLocalSim();
    let step = 0;
    
    if (type === 'dispatch') {
      setMissionStatus('RESPONDING');
      const route = routeToPatient;
      localSimIntervalRef.current = setInterval(() => {
        step++;
        if (step >= route.length) {
          setMissionStatus('AT_PATIENT');
          setLiveSpeed(0);
          stopLocalSim();
          return;
        }
        setAmbulanceLoc(route[step]);
        setLiveSpeed(Math.floor(Math.random() * 20) + 25);
        setLivePreempted(step * 2);
        
        setChartData(prev => {
          const timeLabel = `${step * 2}m`;
          const etaVal = Math.max(1, 5 - step);
          const newData = [...prev, { time: timeLabel, eta: etaVal }];
          return Array.from(new Map(newData.map(item => [item.time, item])).values());
        });
      }, 1500);
    } else if (type === 'transport') {
      setMissionStatus('TRANSPORTING');
      const routeMap = { A: routeToHospA, B: routeToHospB, C: routeToHospC, D: routeToHospD };
      const route = routeMap[hospId] || routeToHospA;
      localSimIntervalRef.current = setInterval(() => {
        step++;
        if (step >= route.length) {
          setMissionStatus('ARRIVED');
          setLiveSpeed(0);
          stopLocalSim();
          return;
        }
        setAmbulanceLoc(route[step]);
        setLiveSpeed(Math.floor(Math.random() * 20) + 25);
        setLivePreempted(10 + step * 2);
        
        setChartData(prev => {
          const timeLabel = `${10 + step * 2}m`;
          const etaVal = Math.max(0, route.length - step);
          const newData = [...prev, { time: timeLabel, eta: etaVal }];
          return Array.from(new Map(newData.map(item => [item.time, item])).values());
        });
      }, 1500);
    }
  };

  useEffect(() => {
    const secureToken = localStorage.getItem('cipher_token');
    const socketUrl = `http://${window.location.hostname}:5000`;
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      setUseLocalSim(true);
      setCctvError(true);
    }

    socketRef.current = io(socketUrl, { 
      auth: { token: secureToken },
      reconnectionAttempts: 1,
      timeout: 2000
    });
    
    socketRef.current.on('connect', () => {
      setUseLocalSim(false);
      setCctvError(false);
    });

    socketRef.current.on('connect_error', () => {
      setUseLocalSim(true);
      setCctvError(true);
    });

    socketRef.current.on('live_tracking', (data) => {
      setAmbulanceLoc(data.location);
      if(data.status) setMissionStatus(data.status);
      if(data.speed) setLiveSpeed(data.speed);
      if(data.preempted) setLivePreempted(data.preempted);
      
      if(data.eta !== undefined && data.time_elapsed !== undefined) {
        setChartData(prevData => {
          const newData = [...prevData, { time: data.time_elapsed, eta: data.eta }];
          return Array.from(new Map(newData.map(item => [item.time, item])).values());
        });
      }
    });

    socketRef.current.on('status_update', (data) => setMissionStatus(data.status));
    socketRef.current.on('cyber_alert', (data) => setCyberThreat(data));

    return () => {
      socketRef.current.disconnect();
      stopLocalSim();
    };
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

  const triggerDispatchUnit = (auto = false) => {
    if (auto) {
      setIsAutoSimulating(true);
    }
    if (useLocalSim || !socketRef.current || !socketRef.current.connected) {
      startLocalSimulation('dispatch');
    } else {
      socketRef.current.emit('dispatch_unit');
    }
  };

  const dispatchToHospital = (hospId) => {
    setSelectedHospital(hospId);
    setChartData([{ time: '0m', eta: 12 }]); 
    if (useLocalSim || !socketRef.current || !socketRef.current.connected) {
      startLocalSimulation('transport', hospId);
    } else {
      socketRef.current.emit('start_transport', { hospital: hospId });
    }
  };

  const resetSim = () => {
    setSelectedHospital(null);
    setShowAmbulanceDetails(false); 
    setCyberThreat(null);
    setChartData([{ time: '0m', eta: 12 }]);
    setIsAutoSimulating(false);
    setIsCameraOpen(false);
    stopLocalSim();
    setAmbulanceLoc([12.9742, 77.5855]);
    setMissionStatus("IDLE");
    setLiveSpeed(0);
    setLivePreempted(0);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('reset_sim');
    }
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
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#030712] text-white font-sans overflow-hidden relative">
      <style>{customStyles}</style>
      
      {/* UNIVERSAL HEADER with hamburger toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c1322] border-b border-white/5 z-2001">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
            <Menu size={20} />
          </button>
          <Siren className="w-5 h-5 text-blue-500" />
          <span className="font-black text-sm tracking-tight uppercase">CIPHER<span className="text-blue-500">SIGHT</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:block">Operator Console</span>
          <button className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10 cursor-pointer"><User size={16} /></button>
        </div>
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
        
        {/* LEFT SIDEBAR (Inline on desktop, overlay on mobile) */}
        <div className={`fixed lg:relative inset-y-0 left-0 w-[260px] bg-[#0c1322] border-r border-white/5 flex flex-col shadow-2xl lg:shadow-none z-3000 lg:z-10 transform sidebar-transition ${isSidebarOpen ? 'translate-x-0 lg:translate-x-0 lg:ml-0' : '-translate-x-full lg:translate-x-0 lg:-ml-[260px]'}`}>
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Siren className="w-6 h-6 text-blue-400" />
              <h1 className="font-black text-xl tracking-tight text-white uppercase">Cipher<span className="text-blue-500">Sight</span></h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-all"><X size={20}/></button>
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
                <button onClick={() => {setIsCameraOpen(true); if (window.innerWidth < 1024) setSidebarOpen(false);}} className="flex items-center gap-3 w-full p-3 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all font-bold cursor-pointer"><Camera size={18}/> AI CCTV Grid</button>
                <button onClick={() => handleNavClick('Route Setup')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Route Setup' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><Route size={18}/> Route Setup</button>
                <button onClick={() => handleNavClick('Hospitals')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Hospitals' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><Building2 size={18}/> Hospitals</button>
                <button onClick={() => handleNavClick('Patient Control')} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all font-bold ${activeTab === 'Patient Control' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'} cursor-pointer`}><HeartPulse size={18}/> Patient Control</button>
                
                <button onClick={simulateRogueDetection} className="flex items-center gap-3 w-full p-3 mt-4 rounded-lg bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition-all cursor-pointer"><AlertTriangle size={18}/> Test Threat</button>
                <button onClick={handleDisconnect} className="flex items-center gap-3 w-full p-3 mt-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"><LogOut size={18}/> Logout</button>
              </nav>
            </div>
          </div>
        </div>

        {/* Overlay backdrop (mobile only) */}
        {isSidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-2005 lg:hidden" />
        )}

        {/* CENTER MAP AREA */}
        <div className="flex-1 relative bg-[#050810] flex flex-col overflow-hidden">
          
          {/* Header Strip */}
          <div className="absolute top-0 w-full h-12 bg-linear-to-b from-[#030712] to-transparent z-1000 pointer-events-none" />

          {/* Interactive Mission Control Panel (Compact, bottom-left) */}
          <div className="absolute bottom-2 left-2 right-2 lg:bottom-3 lg:left-3 lg:right-auto z-1000 lg:w-full lg:max-w-xs">
            <div className="bg-[#0c1322]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-gray-400 text-[9px] font-bold uppercase tracking-widest">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${missionStatus !== 'IDLE' && missionStatus !== 'ARRIVED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  Mission Status
                </div>
                <span className="text-[8px] text-blue-400 uppercase tracking-widest font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">JWT Verified</span>
              </div>
              
              <p className="text-base font-black text-white tracking-tight">{missionStatus.replace('_', ' ')}</p>

              <div className="flex flex-col gap-1.5">
                {missionStatus === 'IDLE' && (
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => triggerDispatchUnit(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black text-[10px] tracking-widest transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 cursor-pointer uppercase">
                      <Play size={13}/> Dispatch Command
                    </button>
                    <button onClick={() => triggerDispatchUnit(true)} className="w-full py-2 bg-[#9D00FF]/20 hover:bg-[#9D00FF]/40 border border-[#9D00FF]/50 text-[#9D00FF] rounded-lg font-black text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer uppercase">
                      <Activity size={13}/> Auto-Simulate
                    </button>
                  </div>
                )}

                {/* HOSPITAL SELECTION BUTTONS */}
                {missionStatus === 'AT_PATIENT' && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Select Destination:</p>
                    
                    <button onClick={() => dispatchToHospital('A')} className="w-full p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-left hover:bg-emerald-500/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs"><Building2 size={12}/> City Central</div>
                        <span className="text-[7px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Nearer</span>
                      </div>
                      <div className="text-[8px] text-gray-400 mt-0.5">1.2km • ICU: 3/20 • Est: 4 mins</div>
                    </button>

                    <button onClick={() => dispatchToHospital('B')} className="w-full p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left hover:bg-blue-500/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-blue-400 flex items-center gap-1.5 text-xs"><HeartPulse size={12}/> Apollo Trauma</div>
                        <span className="text-[7px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Faster</span>
                      </div>
                      <div className="text-[8px] text-gray-400 mt-0.5">2.8km • ICU: 12/30 • Est: 6 mins</div>
                    </button>

                    <button onClick={() => dispatchToHospital('C')} className="w-full p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left hover:bg-amber-500/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-amber-400 flex items-center gap-1.5 text-xs"><Building2 size={12}/> General Medical</div>
                        <span className="text-[7px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-bold uppercase tracking-wider">High Load</span>
                      </div>
                      <div className="text-[8px] text-gray-400 mt-0.5">1.8km • ICU: 2/12 • Est: 5 mins</div>
                    </button>

                    <button onClick={() => dispatchToHospital('D')} className="w-full p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-left hover:bg-purple-500/20 transition-all cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-purple-400 flex items-center gap-1.5 text-xs"><HeartPulse size={12}/> St. Mary's</div>
                        <span className="text-[7px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Available</span>
                      </div>
                      <div className="text-[8px] text-gray-400 mt-0.5">2.1km • ICU: 8/15 • Est: 5 mins</div>
                    </button>
                  </div>
                )}

                {missionStatus === 'TRANSPORTING' && (
                  <div className="w-full py-2.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg font-black text-[10px] tracking-widest flex items-center justify-center gap-2 uppercase">
                    <Activity size={13} className="animate-pulse"/> Preempting Intersections...
                  </div>
                )}

                {missionStatus === 'ARRIVED' && (
                  <button onClick={resetSim} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer uppercase">
                    <RotateCcw size={13}/> Reset Grid
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 🗺️ ACTUAL LEAFLET MAP */}
          <div className="flex-1 w-full relative z-0">
            <MapContainer center={[12.9710, 77.5890]} zoom={14} style={{ height: '100%', width: '100%', background: '#f2efe9' }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
              
              {missionStatus === 'IDLE' && (
                <Polyline positions={routeToPatient} color="#eab308" weight={4} opacity={0.5} dashArray="8, 12" />
              )}
              {missionStatus === 'RESPONDING' && (
                <Polyline positions={routeToPatient} color="#eab308" weight={5} opacity={0.9} />
              )}
              
              {missionStatus === 'AT_PATIENT' && (
                <>
                  <Polyline positions={routeToHospA} color="#10b981" weight={4} opacity={0.6} dashArray="5, 10" />
                  <Polyline positions={routeToHospB} color="#3b82f6" weight={4} opacity={0.6} dashArray="5, 10" />
                  <Polyline positions={routeToHospC} color="#f59e0b" weight={4} opacity={0.6} dashArray="5, 10" />
                  <Polyline positions={routeToHospD} color="#a855f7" weight={4} opacity={0.6} dashArray="5, 10" />
                </>
              )}

              {['TRANSPORTING', 'ARRIVED'].includes(missionStatus) && selectedHospital === 'A' && (
                <Polyline positions={routeToHospA} color="#10b981" weight={6} opacity={0.9} />
              )}
              {['TRANSPORTING', 'ARRIVED'].includes(missionStatus) && selectedHospital === 'B' && (
                <Polyline positions={routeToHospB} color="#3b82f6" weight={6} opacity={0.9} />
              )}
              {['TRANSPORTING', 'ARRIVED'].includes(missionStatus) && selectedHospital === 'C' && (
                <Polyline positions={routeToHospC} color="#f59e0b" weight={6} opacity={0.9} />
              )}
              {['TRANSPORTING', 'ARRIVED'].includes(missionStatus) && selectedHospital === 'D' && (
                <Polyline positions={routeToHospD} color="#a855f7" weight={6} opacity={0.9} />
              )}

              <Marker position={baseStation} icon={baseStationIcon}><Popup>Base Station</Popup></Marker>
              <Marker position={patientLoc} icon={patientIcon}><Popup>Critical Patient</Popup></Marker>
              <Marker position={hospitalA} icon={hospitalIconA}><Popup>City Central Hospital</Popup></Marker>
              <Marker position={hospitalB} icon={hospitalIconB}><Popup>Apollo Trauma Center</Popup></Marker>
              <Marker position={hospitalC} icon={hospitalIconC}><Popup>General Medical Center</Popup></Marker>
              <Marker position={hospitalD} icon={hospitalIconD}><Popup>St. Mary's Care Hospital</Popup></Marker>
              
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
                  {cctvError ? (
                    <div className="relative w-full h-full">
                      <video
                        src="/traffic.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute border-2 border-red-500 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-500" style={{ top: '35%', left: '42%', width: '120px', height: '90px' }}>
                          Ambulance: 98%
                        </div>
                        <div className="absolute border-2 border-emerald-400 bg-emerald-400/5 px-2 py-0.5 text-[9px] font-bold text-emerald-400" style={{ top: '50%', left: '15%', width: '80px', height: '60px' }}>
                          Car: 92%
                        </div>
                        <div className="absolute border-2 border-emerald-400 bg-emerald-400/5 px-2 py-0.5 text-[9px] font-bold text-emerald-400" style={{ top: '25%', left: '70%', width: '70px', height: '50px' }}>
                          Car: 87%
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-[9px] text-emerald-400 font-mono rounded">
                          [DEMO] YOLOv8 AI Grid Vision Active
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={`http://${window.location.hostname}:5000/api/cctv`} 
                      alt="Live AI Stream" 
                      className="w-full h-full object-contain" 
                      onError={() => setCctvError(true)}
                    />
                  )}
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

            {/* Hospital Resource Summary */}
            <div className="bg-[#0a0f1c] rounded-2xl border border-white/5 p-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Nearby Hospitals</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { name: 'City Central', icu: [3,20], vent: [5,15], amb: [4,8], accent: 'emerald', status: 'OK' },
                  { name: 'Apollo Trauma', icu: [12,30], vent: [8,20], amb: [7,12], accent: 'blue', status: 'OK' },
                  { name: 'General Medical', icu: [2,12], vent: [3,10], amb: [2,5], accent: 'amber', status: 'LOAD' },
                  { name: "St. Mary's", icu: [8,15], vent: [6,8], amb: [3,6], accent: 'purple', status: 'OK' },
                ].map((h, i) => {
                  const accentMap = { emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5', amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5', purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5' };
                  const cls = accentMap[h.accent];
                  const icuPct = Math.round(((h.icu[1]-h.icu[0])/h.icu[1])*100);
                  const icuColor = icuPct > 75 ? 'text-red-400' : icuPct > 50 ? 'text-amber-400' : 'text-emerald-400';
                  return (
                    <div key={i} className={`border ${cls.split(' ')[1]} ${cls.split(' ')[2]} rounded-lg p-2.5`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[11px] font-black ${cls.split(' ')[0]}`}>{h.name}</span>
                        <span className={`text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${h.status === 'LOAD' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{h.status === 'LOAD' ? 'High Load' : 'Online'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="text-center">
                          <div className={`text-[13px] font-black ${icuColor}`}>{h.icu[0]}<span className="text-gray-600 text-[10px]">/{h.icu[1]}</span></div>
                          <div className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">ICU</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[13px] font-black text-blue-400">{h.vent[0]}<span className="text-gray-600 text-[10px]">/{h.vent[1]}</span></div>
                          <div className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">Vents</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[13px] font-black text-cyan-400">{h.amb[0]}<span className="text-gray-600 text-[10px]">/{h.amb[1]}</span></div>
                          <div className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">Ambu</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}