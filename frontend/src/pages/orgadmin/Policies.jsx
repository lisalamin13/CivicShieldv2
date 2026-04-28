import { useEffect, useState } from 'react';
import api from '../../api/axios';

const CATEGORIES = ['Harassment & Discrimination', 'Financial Integrity', 'Data Privacy', 'Workplace Safety', 'Conflict of Interest', 'Whistleblower Protection', 'IT & Cybersecurity', 'Professional Integrity', 'General Conduct', 'Other'];
const CAT_ICON = { 'Harassment & Discrimination': '🚫', 'Financial Integrity': '💰', 'Data Privacy': '🔒', 'Workplace Safety': '⛑️', 'Conflict of Interest': '⚖️', 'Whistleblower Protection': '🛡️', 'IT & Cybersecurity': '💻', 'Professional Integrity': '🎓', 'General Conduct': '📋', 'Other': '📄' };

const BLANK = { title: '', category: CATEGORIES[0], policyText: '', shortDescription: '' };

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/policies'); setPolicies(data.policies || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLANK); setEditing(false); setSelected(null); setShowForm(true); setError(''); };

  const openEdit = (p) => {
    setForm({ title: p.title, category: p.category, policyText: p.policyText, shortDescription: p.shortDescription || '' });
    setEditing(true); setSelected(p); setShowForm(true); setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    if (!form.title.trim() || !form.policyText.trim()) return setError('Title and policy text are required.');
    setSaving(true);
    try {
      if (editing && selected) {
        await api.patch(`/policies/${selected._id}`, form);
      } else {
        await api.post('/policies', form);
      }
      setShowForm(false);
      load();
    } catch (err) { setError(err.response?.data?.error || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this policy? It will no longer be used by the AI advisor.')) return;
    setDeleting(id);
    try { await api.delete(`/policies/${id}`); load(); if (selected?._id === id) setSelected(null); }
    catch { }
    finally { setDeleting(''); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📜 Compliance Policies</h1>
          <p className="text-base-content/50 text-sm mt-1">These policies are used by the AI Ethics Advisor to guide reporters.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ Add Policy</button>
      </div>

      <div className="alert alert-info text-xs py-2">
        🤖 <strong>AI-Connected:</strong> All active policies here are automatically fed to the AI Ethics Advisor chatbot to provide organization-specific guidance to whistleblowers.
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Policy list */}
        <div className="space-y-3">
          {loading
            ? <div className="flex justify-center py-12"><span className="loading loading-spinner text-primary" /></div>
            : policies.length === 0
              ? <div className="glass-card p-12 text-center text-base-content/40">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">No policies yet. Add your first compliance policy.</p>
                </div>
              : policies.map(p => (
                  <div key={p._id}
                    onClick={() => setSelected(selected?._id === p._id ? null : p)}
                    className={`glass-card p-4 cursor-pointer hover:border-primary/40 transition-all ${selected?._id === p._id ? 'border-primary bg-primary/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0">{CAT_ICON[p.category] || '📄'}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">{p.title}</div>
                          <span className="badge badge-xs badge-outline mt-1">{p.category}</span>
                          {p.shortDescription && (
                            <p className="text-xs text-base-content/50 mt-1 line-clamp-2">{p.shortDescription}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); openEdit(p); }} className="btn btn-xs btn-ghost">✏️</button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(p._id); }} disabled={deleting === p._id} className="btn btn-xs btn-ghost text-error">
                          {deleting === p._id ? <span className="loading loading-spinner loading-xs" /> : '🗑️'}
                        </button>
                      </div>
                    </div>
                    {typeof p.legalAlignmentScore === 'number' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-base-300 rounded-full h-1">
                          <div className="bg-success h-1 rounded-full" style={{ width: `${p.legalAlignmentScore}%` }} />
                        </div>
                        <span className="text-xs text-base-content/40">Legal Score: {p.legalAlignmentScore}</span>
                      </div>
                    )}
                  </div>
                ))
          }
        </div>

        {/* Policy viewer / form */}
        <div>
          {showForm ? (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-sm mb-4">{editing ? '✏️ Edit Policy' : '➕ New Policy'}</h3>
              {error && <div className="alert alert-error text-sm mb-3 py-2">{error}</div>}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-semibold">Policy Title *</span></label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Anti-Harassment Policy" className="input input-bordered input-sm w-full" required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-semibold">Category *</span></label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="select select-bordered select-sm w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs">Short Description (AI uses this for quick context)</span></label>
                  <input type="text" value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                    placeholder="One-sentence summary of this policy" className="input input-bordered input-sm w-full" />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-semibold">Full Policy Text *</span></label>
                  <textarea value={form.policyText} onChange={e => setForm(f => ({ ...f, policyText: e.target.value }))}
                    placeholder="Write the full policy text here. Be specific — the AI will use this to answer reporter queries..."
                    className="textarea textarea-bordered w-full text-sm" rows={10} required />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary btn-sm flex-1">
                    {saving ? <span className="loading loading-spinner loading-xs" /> : editing ? 'Update Policy' : 'Create Policy'}
                  </button>
                </div>
              </form>
            </div>
          ) : selected ? (
            <div className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-2xl">{CAT_ICON[selected.category] || '📄'}</span>
                  <h3 className="font-bold text-base mt-1">{selected.title}</h3>
                  <span className="badge badge-sm badge-outline mt-1">{selected.category}</span>
                </div>
                <button onClick={() => openEdit(selected)} className="btn btn-xs btn-outline">✏️ Edit</button>
              </div>
              {selected.shortDescription && (
                <p className="text-sm text-primary/80 italic mb-4 border-l-2 border-primary pl-3">{selected.shortDescription}</p>
              )}
              <div className="bg-base-300 rounded-xl p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs text-base-content/70 font-sans leading-relaxed">{selected.policyText}</pre>
              </div>
              <p className="text-xs text-base-content/30 mt-3">
                Last updated: {new Date(selected.updatedAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-base-content/40">
              <div className="text-4xl mb-3">📜</div>
              <p className="text-sm">Select a policy to preview or click <strong>+ Add Policy</strong> to create one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
