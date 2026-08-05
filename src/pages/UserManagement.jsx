import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, CheckCircle, XCircle, 
  Key, RefreshCw, AlertCircle, ArrowLeft, Search 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for creating new staff
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Modal states for updating password
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Extract auth token
  const getAuthToken = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.token || '';
  };

  // 1. Fetch all users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const res = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Handle creating new staff account
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const res = await fetch('/api/auth/create-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create account');
      }

      setSuccess(`Account for ${data.name || createForm.name} registered successfully!`);
      setCreateForm({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // 3. Handle toggling account status (is_active)
  const handleToggleStatus = async (userId, currentStatus) => {
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update status');
      }

      setSuccess(`User status updated to ${!currentStatus ? 'Active' : 'Deactivated'}.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // 4. Handle changing user password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword) return;

    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/users/${selectedUserForPassword._id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update password');
      }

      setSuccess(`Password for ${selectedUserForPassword.name} updated successfully!`);
      setSelectedUserForPassword(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered users for search input
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-6 gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center text-sm text-amber-500 hover:text-amber-400 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Executive Dashboard
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" /> Administrative User Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Provision staff identity profiles, grant role-based authorizations, and manage active system access.
          </p>
        </div>

        <button 
          onClick={fetchUsers} 
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Accounts
        </button>
      </div>

      {/* Notifications Bar */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Panel: Register New Staff Account */}
        <div className="xl:col-span-1 bg-slate-800/40 border border-slate-800 p-6 rounded-2xl h-fit">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <UserPlus className="w-5 h-5 text-amber-500" /> Create System Account
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Full Name</label>
              <input 
                type="text" 
                required
                placeholder="John Doe"
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="staff@besvid.com"
                value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Initial Password</label>
              <input 
                type="password" 
                required
                minLength={6}
                placeholder="••••••••"
                value={createForm.password}
                onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Role Access Level</label>
              <select 
                value={createForm.role}
                onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="user">Staff / Sales Operator</option>
                <option value="admin">Administrator (Managing Director)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-amber-500 text-slate-950 font-bold text-xs rounded-xl py-3 hover:bg-amber-400 transition shadow-lg mt-2 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Provision User Account
            </button>
          </form>
        </div>

        {/* Right Panel: Registered User Roster Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">Active System Accounts Directory</h2>
              
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search user by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading registered accounts...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No user accounts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase font-semibold">
                      <th className="py-3 px-3">User Profile</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-800/20 text-slate-200 transition">
                        {/* Name & Email */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-white text-sm">{user.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit ${
                            user.role === 'admin' 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {user.role === 'admin' ? 'Administrator' : 'Staff / Agent'}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit ${
                            user.is_active 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {user.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-3">
                          <div className="flex justify-center gap-2">
                            {/* Toggle Active Status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user._id, user.is_active)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                user.is_active 
                                  ? 'bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                  : 'bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                              title={user.is_active ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Reset Password Modal Trigger */}
                            <button
                              type="button"
                              onClick={() => setSelectedUserForPassword(user)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                              title="Reset Password"
                            >
                              <Key className="w-3 h-3" /> Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Reset Password Modal */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> Reset Password
            </h3>
            <p className="text-xs text-slate-400">
              Updating account password for <span className="text-amber-400 font-semibold">{selectedUserForPassword.name}</span> ({selectedUserForPassword.email}).
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">New Password</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedUserForPassword(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs rounded-xl font-bold transition"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}