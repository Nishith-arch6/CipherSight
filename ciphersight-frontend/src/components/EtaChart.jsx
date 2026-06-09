import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data simulating ETA decreasing over time as the ambulance moves
const data = [
  { time: '0m', eta: 12 },
  { time: '1m', eta: 10 },
  { time: '2m', eta: 8 },
  { time: '3m', eta: 6 },
  { time: '4m', eta: 4 },
];

export default function EtaChart() {
  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
          {/* Faint grid lines for the dark theme */}
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          
          {/* Axis styling */}
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickMargin={10} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          
          {/* Dark mode tooltip that appears when you hover over the chart */}
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#F3F4F6' }}
            itemStyle={{ color: '#60A5FA', fontWeight: 'bold' }}
          />
          
          {/* The actual line representing the ETA */}
          <Line 
            type="monotone" 
            dataKey="eta" 
            name="ETA (mins)"
            stroke="#3B82F6" /* Blue line */
            strokeWidth={3} 
            dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#1F2937' }} 
            activeDot={{ r: 6, fill: '#60A5FA', stroke: '#fff' }} 
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}