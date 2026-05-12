import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_BADGE = { Open: 'badge-info', 'Under Review': 'badge-warning', 'In Investigation': 'badge-accent', Resolved: 'badge-success', Dismissed: 'badge-ghost', Escalated: 'badge-error' };
const PRIORITY_BADGE = { Low: 'badge-ghost', Medium: 'badge-warning', High: 'badge-error', Urgent: 'badge-error' };
const CATEGORIES = ['', 'Harassment', 'Discrimination', 'Financial Fraud', 'Data Privacy', 'Safety Violation', 'Conflict of Interest', 'Cybersecurity', 'Professional Misconduct', 'Retaliation', 'Academic Dishonesty', 'Other'];
const STATUSES = ['', 'Open', 'Under Review', 'In Investigation', 'Resolved', 'Dismissed', 'Escalated'];
const PRIORITIES = ['', 'Low', 'Medium', 'High', 'Urgent'];

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/reports', { params });
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filters]);

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📋 Reports</h1>
          <p className="text-base-content/50 text-sm mt-1">{total} total report{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input type="text" placeholder="🔍 Search title / ID..." value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          className="input input-bordered input-sm col-span-2 sm:col-span-1" />
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="select select-bordered select-sm">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="select select-bordered select-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)} className="select select-bordered select-sm">
          {PRIORITIES.map(p => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        {loading
          ? <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-primary" /></div>
          : reports.length === 0
            ? <div className="text-center py-16 text-base-content/40">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">No reports found matching your filters.</p>
              </div>
            : <table className="table table-sm">
                <thead>
                  <tr className="bg-base-300">
                    <th>Tracking ID</th><th>Title</th><th>Category</th>
                    <th>Priority</th><th>Status</th><th>Risk Score</th>
                    <th>Date</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r._id} className="hover cursor-pointer border-b border-base-300"
                      onClick={() => navigate(`/orgadmin/reports/${r._id}`)}>
                      <td>
                        <div className="font-mono text-xs text-primary">{r.trackingId}</div>
                        {r.isUrgent && r.status !== 'Resolved' && r.status !== 'Dismissed' && (
                          <span className="badge badge-error badge-xs mt-0.5 urgent-pulse">URGENT</span>
                        )}
                      </td>
                      <td>
                        <div className="font-medium text-sm max-w-48 truncate">{r.title}</div>
                        <div className="text-xs text-base-content/40 max-w-48 truncate">{r.contentPreview}</div>
                      </td>
                      <td><span className="badge badge-xs badge-outline">{r.category}</span></td>
                      <td><span className={`badge badge-xs ${PRIORITY_BADGE[r.priority] || 'badge-ghost'}`}>{r.priority}</span></td>
                      <td><span className={`badge badge-xs ${STATUS_BADGE[r.status] || 'badge-ghost'}`}>{r.status}</span></td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="radial-progress text-xs"
                            style={{ '--value': r.redFlagScore, '--size': '2rem', '--thickness': '3px', color: r.redFlagScore > 70 ? '#ef4444' : r.redFlagScore > 40 ? '#f59e0b' : '#22c55e' }}
                            role="progressbar">{r.redFlagScore}</div>
                        </div>
                      </td>
                      <td className="text-xs text-base-content/50 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button className="btn btn-xs btn-ghost" onClick={e => { e.stopPropagation(); navigate(`/orgadmin/reports/${r._id}`); }}>
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-base-300">
            <button className="btn btn-xs btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>«</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`btn btn-xs ${n === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="btn btn-xs btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}
