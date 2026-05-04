import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, login } = useAuth();
  const token = localStorage.getItem('cs_token');

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/update-profile', {
        name: form.name,
        email: form.email,
        department: form.department,
      });
      setSuccess('Profile updated successfully!');
      // Update stored user data
      const updatedUser = { ...user, ...data.user };
      login(token, updatedUser);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassError(''); setPassSuccess('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPassError('New passwords do not match.');
    }
    if (passwords.newPassword.length < 6) {
      return setPassError('New password must be at least 6 characters.');
    }
    setSavingPass(true);
    try {
      await api.patch('/auth/update-profile', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPassSuccess('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSavingPass(false);
    }
  };

  const ROLE_COLOR = {
    SuperAdmin: 'badge-error',
    OrgAdmin: 'badge-primary',
    Investigator: 'badge-secondary',
    Reporter: 'badge-ghost',
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">👤 My Profile</h1>
        <p className="text-base-content/50 text-sm mt-1">
          Update your personal information and password.
        </p>
      </div>

      {/* Avatar + role card */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="avatar placeholder">
          <div className="bg-primary text-primary-content rounded-full w-16 text-2xl">
            <span>{user?.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
        </div>
        <div>
          <div className="font-bold text-lg">{user?.name || '—'}</div>
          <div className="text-sm text-base-content/50">{user?.phone}</div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className={`badge badge-sm ${ROLE_COLOR[user?.role] || 'badge-ghost'}`}>
              {user?.role}
            </span>
            {user?.orgName && (
              <span className="badge badge-sm badge-outline">🏢 {user.orgName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile info form */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-sm mb-4">✏️ Edit Profile Information</h2>

        {error && <div className="alert alert-error text-sm py-2 mb-4">{error}</div>}
        {success && <div className="alert alert-success text-sm py-2 mb-4">{success}</div>}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold">Full Name</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your full name"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold">Email Address</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className="input input-bordered w-full"
            />
          </div>

          {/* Department — only for staff */}
          {user?.role !== 'Reporter' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs font-semibold">Department</span>
              </label>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. HR, Finance, IT"
                className="input input-bordered w-full"
              />
            </div>
          )}

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Phone Number</span>
                <span className="label-text-alt text-xs text-base-content/30">Cannot be changed</span>
              </label>
              <input
                type="text"
                value={user?.phone || '—'}
                className="input input-bordered w-full opacity-50 cursor-not-allowed"
                disabled
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Role</span>
                <span className="label-text-alt text-xs text-base-content/30">Cannot be changed</span>
              </label>
              <input
                type="text"
                value={user?.role || '—'}
                className="input input-bordered w-full opacity-50 cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving}
          >
            {saving
              ? <span className="loading loading-spinner loading-sm" />
              : '💾 Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change password form */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-sm mb-1">🔑 Change Password</h2>
        <p className="text-xs text-base-content/40 mb-4">
          You must enter your current password to set a new one.
        </p>

        {passError && <div className="alert alert-error text-sm py-2 mb-4">{passError}</div>}
        {passSuccess && <div className="alert alert-success text-sm py-2 mb-4">{passSuccess}</div>}

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold">Current Password</span>
            </label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="Your current password"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold">New Password</span>
            </label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min 6 characters"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold">Confirm New Password</span>
            </label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repeat new password"
              className="input input-bordered w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-warning w-full"
            disabled={savingPass}
          >
            {savingPass
              ? <span className="loading loading-spinner loading-sm" />
              : '🔑 Update Password'}
          </button>
        </form>
      </div>


    </div>
  );
}