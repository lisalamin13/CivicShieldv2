import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = { Open: 'badge-info', 'Under Review': 'badge-warning', 'In Investigation': 'badge-accent', Resolved: 'badge-success', Dismissed: 'badge-ghost', Escalated: 'badge-error' };
const PRIORITY_BADGE = { Low: 'badge-ghost', Medium: 'badge-warning', High: 'badge-error', Critical: 'badge-error' };

export default function OrgAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  const s = data?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-base-content/50 text-sm mt-1">
            Welcome, {user?.name} · <span className="text-primary">{user?.orgName}</span>
          </p>
        </div>
        <Link to="/orgadmin/reports" className="btn btn-primary btn-sm">📋 View All Reports</Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: s.totalReports ?? 0, icon: '📋', color: 'text-info', sub: 'All time' },
          { label: 'Open Reports', value: s.openReports ?? 0, icon: '🔵', color: 'text-warning', sub: 'Needs attention' },
          { label: 'Urgent Cases', value: s.urgentReports ?? 0, icon: '🚨', color: 'text-error', sub: 'High priority' },
          { label: 'Resolution Rate', value: `${s.resolutionRate ?? 0}%`, icon: '✅', color: 'text-success', sub: `${s.resolvedReports ?? 0} resolved` },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="text-2xl">{c.icon}</div>
            <div className={`text-3xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs font-semibold">{c.label}</div>
            <div className="text-xs text-base-content/40">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Staff Members', value: s.staffCount ?? 0, icon: '👥', color: 'text-secondary' },
          { label: 'Active Policies', value: s.policyCount ?? 0, icon: '📜', color: 'text-accent' },
          { label: 'Avg Risk Score', value: s.avgRedFlagScore ?? 0, icon: '⚡', color: 'text-warning' },
          { label: 'Resolved Cases', value: s.resolvedReports ?? 0, icon: '🟢', color: 'text-success' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="text-xl">{c.icon}</div>
            <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-base-content/50">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm mb-4">📊 Reports by Category</h3>
          {!data?.byCategory?.length
            ? <p className="text-xs text-center text-base-content/40 py-6">No data yet</p>
            : <div className="space-y-2">
                {data.byCategory.slice(0, 7).map((c, i) => {
                  const max = data.byCategory[0]?.count || 1;
                  const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-xs w-32 truncate text-base-content/60">{c._id || 'Other'}</div>
                      <div className="flex-1 bg-base-300 rounded-full h-2">
                        <div className={`${colors[i % colors.length]} h-2 rounded-full transition-all`} style={{ width: `${(c.count / max) * 100}%` }} />
                      </div>
                      <div className="text-xs font-bold w-5 text-right">{c.count}</div>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        {/* By Status */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm mb-4">🔄 Reports by Status</h3>
          {!data?.byStatus?.length
            ? <p className="text-xs text-center text-base-content/40 py-6">No data yet</p>
            : <div className="grid grid-cols-2 gap-3">
                {data.byStatus.map((s, i) => (
                  <div key={i} className="bg-base-300 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-base-content">{s.count}</div>
                    <span className={`badge badge-xs mt-1 ${STATUS_BADGE[s._id] || 'badge-ghost'}`}>{s._id}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Recent reports */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">🕐 Recent Reports</h3>
          <Link to="/orgadmin/reports" className="btn btn-ghost btn-xs">View All →</Link>
        </div>
        {!data?.recentReports?.length
          ? <p className="text-xs text-center text-base-content/40 py-6">No reports submitted yet.</p>
          : <div className="overflow-x-auto">
              <table className="table table-xs">
                <thead><tr><th>Tracking ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Risk</th></tr></thead>
                <tbody>
                  {data.recentReports.map(r => (
                    <tr key={r._id} className="hover cursor-pointer" onClick={() => window.location.href = `/orgadmin/reports/${r._id}`}>
                      <td className="font-mono text-xs">{r.trackingId}</td>
                      <td className="max-w-32 truncate font-medium">{r.title}</td>
                      <td><span className="badge badge-xs badge-outline">{r.category}</span></td>
                      <td><span className={`badge badge-xs ${PRIORITY_BADGE[r.priority] || 'badge-ghost'}`}>{r.priority}</span></td>
                      <td><span className={`badge badge-xs ${STATUS_BADGE[r.status] || 'badge-ghost'}`}>{r.status}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-base-300 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${r.redFlagScore}%`, background: r.redFlagScore > 70 ? '#ef4444' : r.redFlagScore > 40 ? '#f59e0b' : '#22c55e' }} />
                          </div>
                          <span className="text-xs">{r.redFlagScore}</span>
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
  );
}
