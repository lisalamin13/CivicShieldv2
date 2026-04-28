import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Organizations() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({ orgName: '', sectorType: 'Academic', contactEmail: '', contactPhone: '', address: '', subscriptionPlan: 'free' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', password: '', role: 'OrgAdmin', department: '' });
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/tenants'); setTenants(r.data.tenants || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadStaff = async (tid) => {
    try { const r = await api.get(`/tenants/${tid}/staff`); setStaff(r.data.staff || []); }
    catch { setStaff([]); }
  };

  const handleSelect = (t) => {
    setSelected(t);
    loadStaff(t._id);
    setShowAddStaff(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setFormError('');
    setActionLoading('create');
    try {
      await api.post('/tenants', form);
      setShowCreate(false);
      setForm({ orgName: '', sectorType: 'Academic', contactEmail: '', contactPhone: '', address: '', subscriptionPlan: 'free' });
      load();
      showSuccess('Organization created successfully.');
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to create organization.'); }
    finally { setActionLoading(''); }
  };

  const handleSuspend = async (id) => {
    setActionLoading('suspend-' + id);
    try {
      const { data } = await api.patch(`/tenants/${id}/suspend`);
      load();
      if (selected?._id === id) setSelected(null);
      showSuccess(data.message || 'Organization status updated.');
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
    finally { setActionLoading(''); }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault(); setFormError('');
    setActionLoading('staff');
    try {
      await api.post(`/tenants/${selected._id}/staff`, staffForm);
      setShowAddStaff(false);
      setStaffForm({ name: '', email: '', phone: '', password: '', role: 'OrgAdmin', department: '' });
      loadStaff(selected._id);
      showSuccess('Staff member added successfully.');
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to add staff.'); }
    finally { setActionLoading(''); }
  };

  // Delete staff
  const openDeleteModal = (s) => { setDeleteTarget(s); setDeleteError(''); };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const { data } = await api.delete(`/staff/${deleteTarget._id}`);
      setDeleteTarget(null);
      loadStaff(selected._id);
      showSuccess(data.message || 'Staff member deleted.');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete staff member.');
    } finally { setDeleting(false); }
  };

  // Toggle staff active/inactive
  const handleToggleStaff = async (s) => {
    try {
      const { data } = await api.patch(`/staff/${s._id}/toggle`);
      loadStaff(selected._id);
      showSuccess(`${s.name} has been ${data.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const filtered = tenants.filter(t =>
    t.orgName.toLowerCase().includes(search.toLowerCase()) ||
    t.organizationId.toLowerCase().includes(search.toLowerCase())
  );

  const SECTOR_BADGE = { Academic: 'badge-info', Corporate: 'badge-secondary', Government: 'badge-warning', Technology: 'badge-accent', NGO: 'badge-success', Healthcare: 'badge-error', Other: 'badge-ghost' };
  const ROLE_BADGE = { SuperAdmin: 'badge-error', OrgAdmin: 'badge-primary', Investigator: 'badge-secondary' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🏢 Organizations</h1>
          <p className="text-base-content/50 text-sm mt-1">Manage all tenant organizations on the platform.</p>
        </div>
        <button onClick={() => { setShowCreate(true); setFormError(''); }} className="btn btn-primary btn-sm">
          + New Organization
        </button>
      </div>

      {/* Success banner */}
      {successMsg && <div className="alert alert-success text-sm py-2">{successMsg}</div>}

      {/* Search */}
      <div className="form-control max-w-sm">
        <input type="text" placeholder="Search organizations..." value={search}
          onChange={e => setSearch(e.target.value)} className="input input-bordered input-sm" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Org list */}
        <div className="lg:col-span-1 space-y-3">
          {loading
            ? <div className="flex justify-center py-12"><span className="loading loading-spinner text-primary" /></div>
            : filtered.length === 0
              ? <div className="glass-card p-8 text-center text-base-content/40 text-sm">No organizations found.</div>
              : filtered.map(t => (
                  <div key={t._id}
                    onClick={() => handleSelect(t)}
                    className={`glass-card p-4 cursor-pointer transition-all hover:border-primary/40 ${selected?._id === t._id ? 'border-primary bg-primary/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{t.orgName}</div>
                        <div className="text-xs text-base-content/40 font-mono mt-0.5">{t.organizationId}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`badge badge-xs ${SECTOR_BADGE[t.sectorType] || 'badge-ghost'}`}>{t.sectorType}</span>
                        {t.isSuspended && <span className="badge badge-xs badge-error">Suspended</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-base-content/40">
                      <span>📋 {t.reportCount || 0} reports</span>
                      <span>👥 {t.staffCount || 0} staff</span>
                      <span className="badge badge-xs badge-ghost">{t.subscriptionPlan}</span>
                    </div>
                  </div>
                ))
          }
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="glass-card p-12 text-center text-base-content/40">
              <div className="text-4xl mb-3">🏢</div>
              <p className="text-sm">Select an organization to view details and manage staff.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Org info */}
              <div className="glass-card p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selected.orgName}</h2>
                    <div className="text-xs text-base-content/40 font-mono">{selected.organizationId}</div>
                  </div>
                  <button
                    onClick={() => handleSuspend(selected._id)}
                    disabled={!!actionLoading || selected.isDefault}
                    title={selected.isDefault ? 'Cannot suspend the default tenant' : ''}
                    className={`btn btn-sm ${selected.isSuspended ? 'btn-success' : 'btn-error'} btn-outline`}>
                    {actionLoading.startsWith('suspend')
                      ? <span className="loading loading-spinner loading-xs" />
                      : selected.isSuspended ? '✅ Reactivate' : '🚫 Suspend'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    ['Sector', selected.sectorType],
                    ['Plan', selected.subscriptionPlan],
                    ['Reports', selected.reportCount || 0],
                    ['Staff', staff.length],
                    ['Email', selected.contactEmail || '—'],
                    ['Phone', selected.contactPhone || '—'],
                    ['Joined', new Date(selected.onboardingDate).toLocaleDateString('en-IN')],
                    ['Status', selected.isSuspended ? '🔴 Suspended' : '🟢 Active'],
                    ['Default', selected.isDefault ? 'Yes (CivicShield)' : 'No'],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-base-300 rounded-lg p-2">
                      <div className="text-base-content/40">{k}</div>
                      <div className="font-semibold mt-0.5 truncate">{String(v)}</div>
                    </div>
                  ))}
                </div>
                {selected.address && <p className="text-xs text-base-content/40 mt-3">📍 {selected.address}</p>}
              </div>

              {/* Staff panel */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">👥 Staff Members ({staff.length})</h3>
                  <button
                    onClick={() => { setShowAddStaff(!showAddStaff); setFormError(''); }}
                    className="btn btn-xs btn-primary"
                  >
                    {showAddStaff ? '✕ Cancel' : '+ Add Staff'}
                  </button>
                </div>

                {/* Add staff form */}
                {showAddStaff && (
                  <form onSubmit={handleAddStaff} className="bg-base-300 rounded-xl p-4 mb-4 space-y-3">
                    {formError && <div className="alert alert-error text-xs py-2">{formError}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. Jane Doe' },
                        { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@org.com' },
                        { name: 'phone', label: 'Phone (with code)', type: 'tel', placeholder: '+919100000005' },
                        { name: 'password', label: 'Temp Password', type: 'password', placeholder: 'Min 6 chars' },
                        { name: 'department', label: 'Department', type: 'text', placeholder: 'HR, Finance…' },
                      ].map(f => (
                        <div key={f.name} className="form-control">
                          <label className="label py-1"><span className="label-text text-xs">{f.label}</span></label>
                          <input type={f.type} value={staffForm[f.name]}
                            onChange={e => setStaffForm(s => ({ ...s, [f.name]: e.target.value }))}
                            placeholder={f.placeholder} className="input input-bordered input-xs w-full" required />
                        </div>
                      ))}
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs">Role</span></label>
                        <select value={staffForm.role}
                          onChange={e => setStaffForm(s => ({ ...s, role: e.target.value }))}
                          className="select select-bordered select-xs w-full">
                          <option value="OrgAdmin">OrgAdmin</option>
                          <option value="Investigator">Investigator</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-xs w-full" disabled={actionLoading === 'staff'}>
                      {actionLoading === 'staff' ? <span className="loading loading-spinner loading-xs" /> : 'Add Staff Member'}
                    </button>
                  </form>
                )}

                {/* Staff table */}
                {staff.length === 0
                  ? <p className="text-xs text-base-content/40 text-center py-4">No staff members yet.</p>
                  : <div className="overflow-x-auto">
                      <table className="table table-xs">
                        <thead>
                          <tr>
                            <th>Name</th><th>Role</th><th>Dept</th><th>Status</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.map(s => (
                            <tr key={s._id}>
                              <td>
                                <div className="font-medium">{s.name}</div>
                                <div className="text-base-content/40 text-xs">{s.email}</div>
                              </td>
                              <td>
                                <span className={`badge badge-xs ${ROLE_BADGE[s.role] || 'badge-ghost'}`}>
                                  {s.role}
                                </span>
                              </td>
                              <td className="text-base-content/60">{s.department || '—'}</td>
                              <td>
                                <span className={`badge badge-xs ${s.isActive ? 'badge-success' : 'badge-error'}`}>
                                  {s.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleToggleStaff(s)}
                                    className={`btn btn-xs ${s.isActive ? 'btn-warning' : 'btn-success'} btn-outline`}
                                    title={s.isActive ? 'Deactivate' : 'Activate'}
                                  >
                                    {s.isActive ? '⏸' : '▶'}
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(s)}
                                    className="btn btn-xs btn-error btn-outline"
                                    title="Permanently delete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create org modal */}
      {showCreate && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg bg-base-200">
            <h3 className="font-bold text-lg mb-4">🏢 Create New Organization</h3>
            {formError && <div className="alert alert-error text-sm mb-3 py-2">{formError}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-control sm:col-span-2">
                  <label className="label py-1"><span className="label-text text-xs">Organization Name *</span></label>
                  <input type="text" value={form.orgName}
                    onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))}
                    placeholder="Assam Don Bosco University"
                    className="input input-bordered input-sm w-full" required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs">Sector *</span></label>
                  <select value={form.sectorType}
                    onChange={e => setForm(f => ({ ...f, sectorType: e.target.value }))}
                    className="select select-bordered select-sm w-full">
                    {['Academic', 'Corporate', 'Government', 'NGO', 'Healthcare', 'Technology', 'Other'].map(s =>
                      <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs">Subscription Plan</span></label>
                  <select value={form.subscriptionPlan}
                    onChange={e => setForm(f => ({ ...f, subscriptionPlan: e.target.value }))}
                    className="select select-bordered select-sm w-full">
                    {['free', 'basic', 'premium'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {[
                  ['contactEmail', 'Contact Email', 'email', 'admin@org.com'],
                  ['contactPhone', 'Contact Phone', 'tel', '+91...'],
                  ['address', 'Address', 'text', 'City, State'],
                ].map(([n, l, t, p]) => (
                  <div key={n} className="form-control">
                    <label className="label py-1"><span className="label-text text-xs">{l}</span></label>
                    <input type={t} value={form[n]}
                      onChange={e => setForm(f => ({ ...f, [n]: e.target.value }))}
                      placeholder={p} className="input input-bordered input-sm w-full" />
                  </div>
                ))}
              </div>
              <div className="modal-action">
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading === 'create'}>
                  {actionLoading === 'create' ? <span className="loading loading-spinner loading-xs" /> : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreate(false)} />
        </div>
      )}

      {/* ── DELETE STAFF CONFIRMATION MODAL ── */}
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
                ⚠️ This is <strong>permanent and cannot be undone.</strong> The account will be removed immediately.
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
                onClick={handleDeleteStaff}
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
