/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';
import { X, Terminal, ShieldAlert, ShieldCheck, Fingerprint } from 'lucide-react';

export default function SystemLogs({ onClose }) {
  // Sample logs for visual impact
  const logs = [
    { time: '14:32:01', type: 'INFO', msg: 'System initialized. Awaiting commands.', icon: <Terminal size={14}/> },
    { time: '14:32:15', type: 'AUTH', msg: 'Incoming connection attempt detected on Port 5000.', icon: <Fingerprint size={14}/> },
    { time: '14:32:16', type: 'SUCCESS', msg: 'JWT Signature Verified. Access granted to OP-108.', icon: <ShieldCheck size={14} className="text-emerald-400"/> },
    { time: '14:35:02', type: 'VISION', msg: 'YOLOv8 instance started. Model: ambulance_model.pt loaded.', icon: <Terminal size={14}/> },
    { time: '14:41:22', type: 'ALERT', msg: 'Mismatch detected! Visual signature lacks JWT token.', icon: <ShieldAlert size={14} className="text-red-400"/> },
    { time: '14:41:22', type: 'CRITICAL', msg: 'PREEMPTION GRID LOCKED. Threat isolated.', icon: <ShieldAlert size={14} className="text-red-500"/> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute inset-0 z-100 flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl p-6"
    >
      <div className="w-full max-w-4xl bg-[#050505] border border-gray-800 rounded-2xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex justify-between items-center p-4 bg-[#111] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-gray-400" />
            <h2 className="text-sm font-bold tracking-widest text-gray-300 uppercase font-mono">System.Logs</h2>
          </div>
          <button onClick={onClose} className="p-1.5 bg-gray-800 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-all cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Terminal Window */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs sm:text-sm bg-black text-gray-300 flex flex-col gap-3">
          <p className="text-gray-500 mb-4">CipherSight OS v2.4.1 -- Secure Logging Engine</p>
          
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-4 hover:bg-gray-900/50 p-1.5 rounded transition-colors">
              <span className="text-gray-600 shrink-0">[{log.time}]</span>
              <span className="shrink-0 pt-1">{log.icon}</span>
              <span className={`shrink-0 w-20 font-bold ${
                log.type === 'SUCCESS' ? 'text-emerald-400' :
                log.type === 'CRITICAL' ? 'text-red-500' :
                log.type === 'ALERT' ? 'text-amber-400' :
                log.type === 'AUTH' ? 'text-blue-400' : 'text-gray-400'
              }`}>
                [{log.type}]
              </span>
              <span className="text-gray-300 wrap-break-word">{log.msg}</span>
            </div>
          ))}
          
          {/* Blinking cursor effect */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-emerald-500 font-bold">{'>'}</span>
            <div className="w-2 h-4 bg-gray-400 animate-pulse"></div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}