/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';
import { X, Activity, Server, Zap, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';

export default function GridStatus({ onClose }) {
  // Sample data to make it look realistic for the expo
  const nodes = [
    { id: 'INT-01 (Main St)', status: 'online', traffic: 'High', ai: 'Active' },
    { id: 'INT-02 (2nd Ave)', status: 'online', traffic: 'Medium', ai: 'Active' },
    { id: 'INT-03 (Bypass)', status: 'warning', traffic: 'Congested', ai: 'Calibrating' },
    { id: 'INT-04 (Hospital)', status: 'online', traffic: 'Low', ai: 'Active' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 50 }} 
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute inset-0 z-100 flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl p-6"
    >
      <div className="w-full max-w-5xl bg-[#0a0f1c] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#9D00FF]" />
            <h2 className="text-xl font-black tracking-widest text-white uppercase">Live Grid Status</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-8 text-white">
          
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center text-center">
              <Server className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Core Server</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">ONLINE</p>
            </div>
            <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center text-center">
              <Zap className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Network Latency</p>
              <p className="text-2xl font-black text-blue-400 mt-1">12 ms</p>
            </div>
            <div className="p-6 bg-[#9D00FF]/10 border border-[#9D00FF]/30 rounded-2xl flex flex-col items-center justify-center text-center">
              <Cpu className="w-8 h-8 text-[#9D00FF] mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Inference</p>
              <p className="text-2xl font-black text-[#9D00FF] mt-1">99.8%</p>
            </div>
          </div>

          {/* Node List */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Edge Node Health</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nodes.map((node, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">{node.id}</h4>
                    <p className="text-xs text-gray-400 font-mono">Traffic: {node.traffic} | Vision: {node.ai}</p>
                  </div>
                  {node.status === 'online' ? (
                    <CheckCircle className="text-emerald-500 w-6 h-6" />
                  ) : (
                    <AlertTriangle className="text-amber-500 w-6 h-6 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}