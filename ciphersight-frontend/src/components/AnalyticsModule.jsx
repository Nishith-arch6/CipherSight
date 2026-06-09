'use client';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Offline mock data
const offlineData = [
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

export default function AnalyticsModule({ onClose }) {
    const [activeMetric, setActiveMetric] = useState('responseTime');
    const [isLoading, setIsLoading] = useState(true);

    // Force the loading screen to disappear after 800ms to mimic a fast API call
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const metricConfig = {
        responseTime: {
            dataKey: 'responseTime',
            color: '#3b82f6', 
            name: 'Response Time (mins)',
            domain: [0, 20]
        },
        congestion: {
            dataKey: 'congestion',
            color: '#ef4444', 
            name: 'Grid Congestion (%)',
            domain: [0, 100]
        }
    };

    const currentConfig = metricConfig[activeMetric];

    return (
        <div style={{
            backgroundColor: '#0f172a', 
            color: '#f8fafc',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            fontFamily: 'sans-serif',
            overflow: 'hidden',
            border: '1px solid #1e293b'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #1e293b', backgroundColor: '#111827' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>
                    <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', fontWeight: 'bold' }}>ANALYTICS MODULE (OFFLINE MODE)</h3>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Conditional Rendering */}
            {isLoading ? (
                <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px', animation: 'pulse 1.5s infinite' }}>📈</div>
                    <p>Processing offline grid data...</p>
                </div>
            ) : (
                <div style={{ padding: '20px' }}>
                    
                    {/* KPI Cards Row */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <KpiCard title="Avg Response Time" value="8m 45s" trend="↓ 12% vs last week" trendColor="#10b981" />
                        <KpiCard title="AI Overrides Today" value="24" trend="System normal" trendColor="#3b82f6" />
                        <KpiCard title="Grid Congestion" value="42%" trend="Normal Capacity" trendColor="#94a3b8" />
                    </div>

                    {/* Chart Controls */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button 
                            onClick={() => setActiveMetric('responseTime')}
                            style={getBtnStyle(activeMetric === 'responseTime', '#3b82f6')}
                        >
                            Response Times (mins)
                        </button>
                        <button 
                            onClick={() => setActiveMetric('congestion')}
                            style={getBtnStyle(activeMetric === 'congestion', '#ef4444')}
                        >
                            Congestion Level (%)
                        </button>
                    </div>

                    {/* Main Recharts Area */}
                    <div style={{ height: '300px', width: '100%', backgroundColor: '#1e293b', borderRadius: '8px', padding: '15px 15px 15px 0' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={offlineData}>
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#94a3b8" fontSize={12} domain={currentConfig.domain} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '6px' }}
                                    itemStyle={{ color: currentConfig.color, fontWeight: 'bold' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey={currentConfig.dataKey} 
                                    name={currentConfig.name}
                                    stroke={currentConfig.color} 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorGradient)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Component for the KPI Cards
function KpiCard({ title, value, trend, trendColor }) {
    return (
        <div style={{ flex: 1, backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155', transition: 'all 0.3s ease' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>{title}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px', transition: 'color 0.3s' }}>{value}</div>
            <div style={{ color: trendColor, fontSize: '12px', transition: 'color 0.3s' }}>{trend}</div>
        </div>
    );
}

// Helper function for button styles
function getBtnStyle(isActive, activeColor) {
    return { padding: '8px 16px', backgroundColor: isActive ? activeColor + '20' : 'transparent', color: isActive ? activeColor : '#94a3b8', border: `1px solid ${isActive ? activeColor : '#334155'}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' };
}