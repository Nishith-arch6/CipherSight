'use client'; 
import React, { useState, useEffect, useRef } from 'react';

export default function TrafficControlPanel() {
    // Initial state before the backend responds
    const [signals, setSignals] = useState({"A": "red", "B": "red", "C": "red"});
    const [status, setStatus] = useState("normal");
    const videoRef = useRef(null);

    // 1. Poll the Flask backend for the current traffic light state
    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/signals');
                const data = await res.json();
                setSignals(data.signals);
                setStatus(data.status);
            } catch (err) {
                console.error("Backend offline or unreachable:", err);
            }
        };

        const interval = setInterval(fetchSignals, 1000); // Check every second
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    // 2. Handle the webcam rendering for Signal A when it turns green
    useEffect(() => {
        if (signals["A"] === "green") {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => console.error("Camera access denied:", err));
        } else {
            // Turn off the camera if the light is no longer green
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [signals]);

    // 3. Send the override command to the backend
    const triggerAmbulance = async () => {
        try {
            await fetch('http://localhost:5000/api/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signal_id: "A" })
            });
        } catch (err) {
            console.error("Failed to trigger override", err);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>🚦 CipherSight Control Panel</h2>
            
            {/* Control Panel */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'inline-block' }}>
                <button 
                    onClick={triggerAmbulance}
                    style={{ background: '#e74c3c', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                >
                    🚑 Simulate Ambulance at Signal A
                </button>
                <span style={{ marginLeft: '15px', fontWeight: 'bold', color: status === 'emergency' ? '#e74c3c' : '#333' }}>
                    Status: {status === 'emergency' ? '🚨 EMERGENCY OVERRIDE' : 'Normal Operation'}
                </span>
            </div>

            {/* Signal Display */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {Object.entries(signals).map(([sigId, color]) => (
                    <div key={sigId} style={{
                        width: '150px', height: '150px', borderRadius: '15px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: color === 'yellow' ? '#333' : '#fff', fontWeight: 'bold', fontSize: '24px', transition: 'background 0.3s',
                        backgroundColor: color === 'red' ? '#ff4d4d' : color === 'green' ? '#2ecc71' : '#f1c40f',
                        border: `4px solid ${color === 'red' ? '#b30000' : color === 'green' ? '#27ae60' : '#f39c12'}`
                    }}>
                        {sigId}
                        {color === 'green' && sigId === 'A' && (
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100px', height: '75px', marginTop: '10px', borderRadius: '5px', background: '#000', border: '2px solid white' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}