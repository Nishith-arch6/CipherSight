import React, { useState } from 'react';

const Register = () => {
    const [formData, setFormData] = useState({ badge: '', passkey: '' });

    const handleRegister = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) alert("Registered! Now check MySQL Workbench.");
        else alert("Registration failed.");
    };

    return (
        <form onSubmit={handleRegister}>
            {/* type="text" allows hyphens. Do NOT use type="number" */}
            <input 
                type="text" 
                placeholder="Badge ID (e.g. OP-101)" 
                value={formData.badge}
                onChange={(e) => setFormData({...formData, badge: e.target.value})} 
            />
            <input 
                type="password" 
                placeholder="Passkey" 
                value={formData.passkey}
                onChange={(e) => setFormData({...formData, passkey: e.target.value})} 
            />
            <button type="submit">Register Operator</button>
        </form>
    );
};

export default Register;