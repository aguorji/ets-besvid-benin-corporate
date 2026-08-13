import React, { useState, useEffect } from 'react';
import { Loader2, Ship, Plus, X, CheckCircle, AlertCircle, Edit, Save } from 'lucide-react';
import apiClient from '../api/client';

/**
 * Consignments Component
 * Manages the admin consignment entry registry, allowing users to view,
 * create, and modify shipment manifests with backend synchronization via Axios.
 */
export default function Consignments() {
  // State management for consignment records, loading status, and error alerts
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State controls for displaying the form drawer and tracking edit mode
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form input field states for creating or updating a consignment
  const [formData, setFormData] = useState({
    consignment_ref: '',
    type: 'direct_container',
    total_landing_cost: '',
    notes: ''
  });
  
  // Submission loading state and response message feedback
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  /**
   * Asynchronously fetches all consignment records from the backend API.
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/consignments');
      setConsignments(response.data);
    } catch (err) {
      console.error("Failed to fetch consignments from API:", err);
      setError("Failed to sync consignment data with backend.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial data fetch when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Handles changes to form input fields and updates form state dynamically.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Populates the form with existing data to prepare for editing a selected consignment.
   */
  const startModification = (item) => {
    setEditingId(item._id);
    setFormData({
      consignment_ref: item.consignment_ref || '',
      type: item.type || 'direct_container',
      total_landing_cost: item.total_landing_cost || '',
      notes: item.notes || ''
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Resets form values, clears editing targets, and closes the form section.
   */
  const resetFormState = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ consignment_ref: '', type: 'direct_container', total_landing_cost: '', notes: '' });
    setFormMessage({ type: '', text: '' });
  };

  /**
   * Handles form submission for creating a new consignment or updating an existing one.
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormMessage({ type: '', text: '' });

    const payload = {
      consignment_ref: formData.consignment_ref.trim(),
      type: formData.type,
      total_landing_cost: Number(formData.total_landing_cost) || 0,
      notes: formData.notes.trim()
    };

    try {
      let response;
      if (editingId) {
        // Send PUT request if editing an existing record
        response = await apiClient.put(`/consignments/${editingId}`, payload);
      } else {
        // Send POST request if creating a new record
        response = await apiClient.post('/consignments', payload);
      }

      setFormMessage({
        type: 'success',
        text: editingId ? 'Manifest records updated successfully.' : 'New manifest profile committed.'
      });
      
      if (!editingId) {
        setFormData({ consignment_ref: '', type: 'direct_container', total_landing_cost: '', notes: '' });
      }
      fetchData();
    } catch (err) {
      console.error("Failed to save consignment to backend:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Transaction submission rejected.';
      setFormMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900 pb-16">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white py-10 border-b-2 border-amber-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif tracking-tight">Consignment Entry Registry</h1>
            <p className="text-slate-400 text-xs mt-1">Landed entry logistics tracking and manifest reconciliation profiles</p>
          </div>
          <button
            type="button"
            onClick={() => { if (showAddForm) resetFormState(); else setShowAddForm(true); }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded transition shadow-md cursor-pointer"
          >
            {showAddForm ? 'Close Editor' : 'Log New Arrival'}
          </button>
        </div>
      </header>

      {/* Intake / Modification Panel Form Section */}
      {showAddForm && (
        <section className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-white border-l-4 border-amber-500 rounded shadow-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
              <Ship size={16} className="text-amber-500" /> 
              {editingId ? 'Modify Active Manifest Data' : 'Shipment Manifest Entry'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Consignment Ref</label>
                  <input
                    type="text"
                    name="consignment_ref"
                    required
                    placeholder="e.g., CB/04-2026"
                    value={formData.consignment_ref}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Consignment Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-slate-200 rounded px-2 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-900"
                  >
                    <option value="direct_container">Direct Container</option>
                    <option value="giant_bale">Giant Bale (Sorting Run)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Landing Cost</label>
                  <input
                    type="number"
                    name="total_landing_cost"
                    required
                    placeholder="Landed costs value"
                    value={formData.total_landing_cost}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Manifest Context / Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Vessel parameters, cargo location, routing logs..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-slate-900 text-amber-500 hover:bg-slate-800 font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded transition flex items-center gap-2 cursor-pointer"
                >
                  {submitLoading ? <Loader2 className="animate-spin" size={14} /> : editingId ? <Save size={14} /> : null}
                  {editingId ? 'Save Modifications' : 'Commit Arrival Entry'}
                </button>
              </div>
            </form>

            {formMessage.text && (
              <div className={`mt-4 p-3 rounded text-xs font-medium flex items-center gap-2 ${
                formMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {formMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {formMessage.text}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Primary Data Grid Display Section */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin text-amber-500 mb-2" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Hydrating Active Logbooks...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded text-center text-xs font-medium">
            {error}
          </div>
        ) : consignments.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 text-xs font-medium rounded">
            No active container manifests logged in records.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider border-b border-amber-500">
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Landed Cost</th>
                  <th className="py-3.5 px-4">Date Filed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {consignments.map((item) => (
                  <tr key={item._id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">{item.consignment_ref || 'N/A'}</td>
                    <td className="py-4 px-4 text-[10px] uppercase font-bold tracking-wider">
                      <span className={`px-2 py-0.5 rounded ${
                        item.type === 'direct_container' ? 'bg-indigo-50 text-indigo-700' : 'bg-fuchsia-50 text-fuchsia-700'
                      }`}>
                        {(item.type || 'N/A').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-950">
                      {item.total_landing_cost ? Number(item.total_landing_cost).toLocaleString() : '0'}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 uppercase text-[10px] font-bold">
                      <span className={item.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>
                        ● {item.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => startModification(item)}
                        className="bg-slate-100 text-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Edit size={10} /> Modify Manifest
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}