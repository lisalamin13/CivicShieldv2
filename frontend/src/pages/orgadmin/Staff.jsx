import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'Investigator', department: '' });

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // staff object to delete
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/staff'); setStaff(data.staff || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      await api.post(`/tenants/${user.tenantId}/staff`, form);
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', password: '', role: 'Investigator', department: '' });
      load();
      showSuccess('Staff member added successfully.');
    } catch (err) { setError(err.response?.data?.error || 'Failed to add staff.'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (s) => {
    try {
      const { data } = await api.patch(`/staff/${s._id}/toggle`);
      showSuccess(`${s.name} has been ${data.isActive ? 'activated' : 'deactivated'}.`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const openDeleteModal = (s) => {
    setDeleteTarget(s);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const { data } = await api.delete(`/staff/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
      showSuccess(data.message || 'Staff member deleted.');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete staff member.');
    } finally { setDeleting(false); }
  };

  const ROLE_BADGE = { SuperAdmin: 'badge-error', OrgAdmin: 'badge-primary', Investigator: 'badge-secondary' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">👥 Staff Management</h1>
          <p className="text-base-content/50 text-sm mt-1">
            {staff.length} staff member{staff.length !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="btn btn-primary btn-sm"
        >
          {showForm ? '✕ Cancel' : '+ Add Staff'}
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="alert alert-success text-sm py-2">{successMsg}</div>
      )}

      {/* Add staff form */}
      {showForm && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm mb-4">➕ Add New Staff Member</h3>
          {error && <div className="alert alert-error text-sm mb-3 py-2">{error}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'name', label: 'Full Name *', type: 'text', placeholder: 'Dr. Jane Doe' },
              { name: 'email', label: 'Email *', type: 'email', placeholder: 'jane@org.com' },
              { name: 'phone', label: 'Phone (with code) *', type: 'tel', placeholder: '+919100000005' },
              { name: 'password', label: 'Temporary Password *', type: 'password', placeholder: 'Min 6 characters' },
              { name: 'department', label: 'Department', type: 'text', placeholder: 'HR, Finance, IT…' },
            ].map(f => (
              <div key={f.name} className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">{f.label}</span>
                </label>
                <input
                  type={f.type}
                  value={form[f.name]}
                  onChange={e => setForm(s => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="input input-bordered input-sm w-full"
                  required={f.label.includes('*')}
                />
              </div>
            ))}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">Role *</span>
              </label>
              <select
                value={form.role}
                onChange={e => setForm(s => ({ ...s, role: e.target.value }))}
                className="select select-bordered select-sm"
              >
                <option value="OrgAdmin">OrgAdmin</option>
                <option value="Investigator">Investigator</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm w-full">
                {saving ? <span className="loading loading-spinner loading-xs" /> : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff cards */}
      {loading
        ? <div className="flex justify-center py-12">
            <span className="loading loading-spinner text-primary" />
          </div>
        : staff.length === 0
          ? <div className="glass-card p-12 text-center text-base-content/40">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-sm">No staff members yet. Add your first one above.</p>
            </div>
          : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map(s => (
                <div key={s._id} className="glass-card p-5">
                  {/* Avatar + badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-10 text-sm">
                        <span>{s.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`badge badge-xs ${ROLE_BADGE[s.role] || 'badge-ghost'}`}>
                        {s.role}
                      </span>
                      <span className={`badge badge-xs ${s.isActive ? 'badge-success' : 'badge-error'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mb-4">
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-base-content/50 mt-0.5">{s.email}</div>
                    <div className="text-xs text-base-content/40">{s.phone}</div>
                    {s.department && (
                      <div className="text-xs text-base-content/40 mt-1">🏢 {s.department}</div>
                    )}
                    {s.lastLogin && (
                      <div className="text-xs text-base-content/30 mt-1">
                        Last login: {new Date(s.lastLogin).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(s)}
                      disabled={s._id === user?.id}
                      className={`btn btn-xs flex-1 ${s.isActive ? 'btn-warning btn-outline' : 'btn-success btn-outline'}`}
                      title={s._id === user?.id ? 'Cannot modify your own account' : ''}
                    >
                      {s.isActive ? '⏸ Deactivate' : '▶ Activate'}
                    </button>
                    <button
                      onClick={() => openDeleteModal(s)}
                      disabled={s._id === user?.id}
                      className="btn btn-xs btn-error btn-outline"
                      title={s._id === user?.id ? 'Cannot delete your own account' : 'Permanently delete'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
      }

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-w-sm">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="font-bold text-lg">Delete Staff Member?</h3>
              <p className="text-base-content/60 text-sm mt-2">
                You are about to permanently delete:
              </p>
              <div className="bg-base-300 rounded-xl p-3 mt-3 text-left">
                <div className="font-semibold">{deleteTarget.name}</div>
                <div className="text-xs text-base-content/50">{deleteTarget.email}</div>
                <div className="text-xs text-base-content/50">{deleteTarget.phone}</div>
                <span className={`badge badge-xs mt-1 ${ROLE_BADGE[deleteTarget.role] || 'badge-ghost'}`}>
                  {deleteTarget.role}
                </span>
              </div>
              <div className="alert alert-error text-xs py-2 mt-3 text-left">
                ⚠️ This action is <strong>permanent and cannot be undone.</strong> The staff member will lose all access immediately.
              </div>
            </div>

            {deleteError && (
              <div className="alert alert-error text-xs py-2 mb-3">{deleteError}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn btn-ghost flex-1 btn-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-error flex-1 btn-sm"
                disabled={deleting}
              >
                {deleting
                  ? <span className="loading loading-spinner loading-xs" />
                  : '🗑️ Yes, Delete'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)} />
        </div>
      )}
    </div>
  );
}
