'use client';
import React, { useState } from 'react';

export default function AdminDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('registry');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

    // --- STATE: OPERATOR REGISTRY ---
    const [operators, setOperators] = useState([
        { badge: 'ADMIN-X', role: 'System Administrator', status: 'ACTIVE', lastActive: 'Just now' },
        { badge: 'CMD-001', role: 'Dispatch Commander', status: 'ACTIVE', lastActive: '12 mins ago' },
        { badge: 'CMD-042', role: 'Dispatch Commander', status: 'OFFLINE', lastActive: '2 hrs ago' },
        { badge: 'OP-108', role: 'Grid Operator', status: 'ACTIVE', lastActive: '45 mins ago' },
        { badge: 'EM-911', role: 'Emergency Response Unit', status: 'OFFLINE', lastActive: 'Yesterday' }
    ]);

    const handleRevoke = (targetBadge) => {
        if (targetBadge.includes('ADMIN')) return;
        setOperators(prev => prev.map(op => op.badge === targetBadge ? { ...op, status: 'REVOKED' } : op));
    };

    // --- STATE: GLOBAL INFRASTRUCTURE ---
    const [nodes, setNodes] = useState([
        { id: 'SYS-CORE-01', name: 'CipherSight Main Engine', status: 'ONLINE', latency: '12ms', load: '24%' },
        { id: 'AI-CCTV-N', name: 'Northern Grid AI Processing', status: 'ONLINE', latency: '45ms', load: '68%' },
        { id: 'TRAFFIC-DB', name: 'Historical Telemetry Database', status: 'ONLINE', latency: '18ms', load: '12%' },
        { id: 'AI-CCTV-S', name: 'Southern Grid AI Processing', status: 'DEGRADED', latency: '340ms', load: '98%' }, 
    ]);

    const handleRebootNode = (nodeId) => {
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'REBOOTING...', latency: '--', load: '--' } : n));
        setTimeout(() => {
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'ONLINE', latency: '22ms', load: '15%' } : n));
        }, 2000);
    };

    // --- STATE: SECURITY LOGS (Mock Data) ---
    const [logs, setLogs] = useState([
        { id: 101, time: '10:44:12', event: 'JWT_ISSUED', details: 'Token generated for ADMIN-X', ip: '10.101.54.36', level: 'INFO' },
        { id: 102, time: '10:40:05', event: 'AUTH_FAILED', details: 'Invalid passkey attempt for ADMIN-X', ip: '10.101.54.36', level: 'CRITICAL' },
        { id: 103, time: '10:15:33', event: 'OVERRIDE_EXEC', details: 'Traffic preemption forced by CMD-001', ip: '192.168.1.110', level: 'WARNING' },
        { id: 104, time: '09:05:00', event: 'NODE_DISCONNECT', details: 'Lost connection to AI-CCTV-S', ip: 'INTERNAL', level: 'CRITICAL' },
        { id: 105, time: '08:30:12', event: 'SYSTEM_BOOT', cast: 'CipherSight Core Initialized', ip: 'LOCALHOST', level: 'INFO' },
    ]);

    const clearLogs = () => setLogs([]);

    const getNavItemStyle = (tabName) => ({
        padding: '15px 20px',
        margin: '10px 15px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        color: activeTab === tabName ? '#ef4444' : '#94a3b8',
        backgroundColor: activeTab === tabName ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
        border: activeTab === tabName ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
        fontWeight: activeTab === tabName ? 'bold' : 'normal',
        transition: 'all 0.2s ease',
        fontSize: '15px',
        letterSpacing: '1px'
    });

    return (
        // FIXED: Changed minHeight to height and added overflow: 'hidden'
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#09050a', fontFamily: 'monospace', overflow: 'hidden' }}>
            
            <style>{`
                .sidebar { width: 280px; background-color: #050205; border-right: 1px solid #1f0a0f; display: flex; flex-direction: column; transition: transform 0.3s ease; z-index: 1000; }
                .mobile-header { display: none; }
                .mobile-overlay { display: none; }
                
                .term-scroll::-webkit-scrollbar { width: 8px; }
                .term-scroll::-webkit-scrollbar-track { background: #050205; }
                .term-scroll::-webkit-scrollbar-thumb { background: #1f0a0f; border-radius: 4px; }
                .term-scroll::-webkit-scrollbar-thumb:hover { background: #ef4444; }

                @media (max-width: 768px) {
                    .sidebar { position: fixed; top: 0; left: 0; height: 100%; transform: translateX(-100%); }
                    .sidebar.open { transform: translateX(0); }
                    .mobile-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background-color: #050205; border-bottom: 1px solid #1f0a0f; width: 100%; z-index: 900; box-sizing: border-box; }
                    .mobile-overlay.open { display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); z-index: 950; }
                    .main-wrapper { flex-direction: column !important; }
                    .op-card, .node-card { flex-direction: column; align-items: flex-start !important; gap: 15px; }
                    .op-actions, .node-actions { width: 100%; justify-content: space-between; }
                    .log-table th, .log-table td { font-size: 11px; padding: 8px 5px !important; }
                    .hide-mobile { display: none; }
                }
            `}</style>

            <div className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* LEFT SIDEBAR */}
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '28px', color: '#ef4444' }}>🛡️</div>
                    <div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '22px', letterSpacing: '1px' }}>ROOT<span style={{color: '#ef4444'}}>ACCESS</span></h2>
                        <div style={{ color: '#ef4444', fontSize: '10px', letterSpacing: '2px', marginTop: '4px' }}>CIPHERSIGHT MASTER CONTROL</div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px' }}>
                    <div style={getNavItemStyle('registry')} onClick={() => { setActiveTab('registry'); setIsSidebarOpen(false); }}>👨‍💻 Operator Registry</div>
                    <div style={getNavItemStyle('infrastructure')} onClick={() => { setActiveTab('infrastructure'); setIsSidebarOpen(false); }}>🗄️ Global Infrastructure</div>
                    <div style={getNavItemStyle('logs')} onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }}>🔒 Security & JWT Logs</div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid #1f0a0f' }}>
                    <div onClick={onLogout} style={{ color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', fontWeight: 'bold' }}>
                        🚪 TERMINATE SESSION
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                
                <div className="mobile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '20px', color: '#ef4444' }}>🛡️</div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '16px' }}>ROOT<span style={{color: '#ef4444'}}>ACCESS</span></h2>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '28px', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}>☰</button>
                </div>

                {/* TAB CONTENT (This is the only part that scrolls now) */}
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto', color: '#f8fafc', boxSizing: 'border-box' }}>
                    
                    {activeTab === 'registry' && (
                        <div style={{ maxWidth: '800px' }}>
                            <h1 style={{ fontSize: '28px', letterSpacing: '2px', marginBottom: '20px' }}>OPERATOR ACCESS REGISTRY</h1>
                            <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '40px' }}>Manage active system administrators, dispatch commanders, and standard grid operators. Revoke JWT tokens or elevate privileges from this console.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {operators.map((op, index) => {
                                    const isRoot = op.badge.includes('ADMIN');
                                    const isRevoked = op.status === 'REVOKED';
                                    let statusColor = op.status === 'ACTIVE' ? '#10b981' : (op.status === 'REVOKED' ? '#ef4444' : '#475569');

                                    return (
                                        <div key={index} className="op-card" style={{
                                            backgroundColor: isRevoked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.03)',
                                            border: isRevoked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(239, 68, 68, 0.15)',
                                            padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isRevoked ? 0.6 : 1, transition: 'all 0.3s ease'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: isRevoked ? '#ef4444' : '#f8fafc', textDecoration: isRevoked ? 'line-through' : 'none', letterSpacing: '1px' }}>{op.badge}</span>
                                                    {isRoot && <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ROOT</span>}
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '13px' }}>{op.role}</div>
                                                <div style={{ color: '#475569', fontSize: '11px', marginTop: '5px' }}>Last active: {op.lastActive}</div>
                                            </div>

                                            <div className="op-actions" style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}></div>
                                                    <span style={{ color: statusColor, fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{op.status}</span>
                                                </div>
                                                <button onClick={() => handleRevoke(op.badge)} disabled={isRoot || isRevoked} style={{ background: isRevoked ? '#450a0a' : 'transparent', border: isRoot || isRevoked ? '1px solid #475569' : '1px solid #ef4444', color: isRoot ? '#475569' : isRevoked ? '#fca5a5' : '#ef4444', padding: '8px 16px', borderRadius: '4px', cursor: isRoot || isRevoked ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>
                                                    {isRevoked ? 'REVOKED' : 'REVOKE'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'infrastructure' && (
                        <div style={{ maxWidth: '900px' }}>
                            <h1 style={{ fontSize: '28px', letterSpacing: '2px', marginBottom: '20px' }}>GLOBAL INFRASTRUCTURE</h1>
                            <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '40px' }}>Live monitoring of CipherSight backend systems, AI vision processors, and database synchronization.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {nodes.map((node, index) => {
                                    const isDegraded = node.status === 'DEGRADED';
                                    const isRebooting = node.status === 'REBOOTING...';
                                    let statusColor = node.status === 'ONLINE' ? '#3b82f6' : (isDegraded ? '#eab308' : '#a855f7'); 

                                    return (
                                        <div key={index} className="node-card" style={{
                                            backgroundColor: isDegraded ? 'rgba(234, 179, 8, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                                            border: `1px solid ${isDegraded ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                            padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                    <span style={{ fontSize: '18px', color: '#f8fafc' }}>{node.id}</span>
                                                    {isDegraded && <span style={{ backgroundColor: '#eab308', color: '#000', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>WARNING</span>}
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '13px' }}>{node.name}</div>
                                                <div style={{ color: '#475569', fontSize: '12px', marginTop: '8px', display: 'flex', gap: '15px' }}>
                                                    <span>Latency: <strong style={{ color: '#f8fafc' }}>{node.latency}</strong></span>
                                                    <span>Load: <strong style={{ color: '#f8fafc' }}>{node.load}</strong></span>
                                                </div>
                                            </div>

                                            <div className="node-actions" style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}`, animation: isRebooting ? 'pulse 1s infinite' : 'none' }}></div>
                                                    <span style={{ color: statusColor, fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{node.status}</span>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => handleRebootNode(node.id)}
                                                    disabled={isRebooting}
                                                    style={{ 
                                                        background: 'transparent', border: `1px solid ${isRebooting ? '#475569' : '#f8fafc'}`, 
                                                        color: isRebooting ? '#475569' : '#f8fafc', padding: '8px 16px', borderRadius: '4px', 
                                                        cursor: isRebooting ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' 
                                                    }}
                                                >
                                                    {isRebooting ? 'WAIT' : 'REBOOT'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div style={{ maxWidth: '1000px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h1 style={{ fontSize: '28px', letterSpacing: '2px', margin: '0 0 10px 0' }}>SECURITY & JWT LOGS</h1>
                                    <p style={{ color: '#94a3b8', margin: 0 }}>Live stream of authentication attempts and critical system alerts.</p>
                                </div>
                                <button onClick={clearLogs} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CLEAR LOGS</button>
                            </div>

                            <div className="term-scroll" style={{ flex: 1, backgroundColor: '#050205', border: '1px solid #1f0a0f', borderRadius: '8px', padding: '20px', overflowY: 'auto', minHeight: '400px' }}>
                                {logs.length === 0 ? (
                                    <div style={{ color: '#475569', textAlign: 'center', marginTop: '50px' }}>No active logs. System secure.</div>
                                ) : (
                                    <table className="log-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ color: '#475569', borderBottom: '1px solid #1f0a0f' }}>
                                                <th style={{ padding: '10px' }}>TIMESTAMP</th>
                                                <th style={{ padding: '10px' }}>LEVEL</th>
                                                <th style={{ padding: '10px' }}>EVENT TYPE</th>
                                                <th style={{ padding: '10px' }} className="hide-mobile">IP ADDRESS</th>
                                                <th style={{ padding: '10px' }}>DETAILS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map((log) => {
                                                let levelColor = log.level === 'INFO' ? '#3b82f6' : (log.level === 'WARNING' ? '#eab308' : '#ef4444');
                                                return (
                                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(31, 10, 15, 0.5)', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                        <td style={{ padding: '12px 10px', color: '#94a3b8' }}>{log.time}</td>
                                                        <td style={{ padding: '12px 10px', color: levelColor, fontWeight: 'bold' }}>[{log.level}]</td>
                                                        <td style={{ padding: '12px 10px', color: '#f8fafc' }}>{log.event}</td>
                                                        <td style={{ padding: '12px 10px', color: '#64748b' }} className="hide-mobile">{log.ip}</td>
                                                        <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{log.details || log.cast}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div style={{ height: '80px' }}></div>
                </div>
            </div>
        </div>
    );
}