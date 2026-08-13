// src/components/CreateStaffModal.jsx
import React, { useState } from 'react';
import apiClient from '../api/client';

export default function CreateStaffModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    try {
      const response = await apiClient.post('/auth/create-staff', formData);
      setMsg(response.data.message || 'Staff created successfully!');
      setFormData({ name: '', email: '', password: '', role: 'staff' });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create staff account.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-slate-100">
        <h2 className="text-xl font-bold mb-4 text-white">Create New Staff Login</h2>
        
        {msg && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{msg}</div>}
        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Temporary Password</label>
            <input 
              type="password" 
              required 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Access Role Level</label>
            <select 
              value={formData.role} 
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
            >
              <option value="staff">Staff (Terminal Access Only)</option>
              <option value="admin">Admin (Full Dashboard Access)</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-750 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 cursor-pointer">Register Staff</button>
          </div>
        </form>
      </div>
    </div>
  );
}