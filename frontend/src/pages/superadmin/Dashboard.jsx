import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/global'),
      api.get('/inquiries')
    ]).then(([resStats, resInq]) => {
      setStats(resStats.data);
      setInquiries(resInq.data.inquiries || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-base-content/50 text-sm mt-1">Welcome back, {user?.name}. Here's the platform overview.</p>
        </div>
        <Link to="/superadmin/organizations" className="btn btn-primary btn-sm gap-2">
          🏢 Manage Organizations
        </Link>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Organizations', value: stats?.stats?.totalTenants ?? 0, icon: '🏢', color: 'text-primary' },
          { label: 'Active Organizations', value: stats?.stats?.activeTenants ?? 0, icon: '✅', color: 'text-success' },
          { label: 'Total Reports', value: stats?.stats?.totalReports ?? 0, icon: '📋', color: 'text-info' },
          { label: 'Total Staff', value: stats?.stats?.totalStaff ?? 0, icon: '👔', color: 'text-secondary' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl">{s.icon}</div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-base-content/50">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top organizations by reports */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 text-sm">🏆 Top Organizations by Reports</h3>
          {!stats?.reportsByTenant?.length
            ? <p className="text-xs text-base-content/40 text-center py-6">No data available</p>
            : <div className="space-y-3">
                {stats.reportsByTenant.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[rgb(29_78_216_/_0.2)] rounded-lg flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.orgName}</div>
                      <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min((t.count / (stats.reportsByTenant[0]?.count || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="badge badge-primary badge-sm">{t.count}</div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Reports by sector */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 text-sm">🏭 Reports by Sector</h3>
          {!stats?.reportsBySector?.length
            ? <p className="text-xs text-base-content/40 text-center py-6">No data available</p>
            : <div className="space-y-3">
                {stats.reportsBySector.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-secondary rounded-full" />
                      <span className="text-sm">{s._id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-base-300 rounded-full h-1.5">
                        <div className="bg-secondary h-1.5 rounded-full" style={{ width: `${Math.min((s.count / (stats.reportsBySector[0]?.count || 1)) * 100, 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold w-6 text-right">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Recent audit activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-semibold mb-4 text-sm">🕵️ Recent Admin Activity</h3>
          {!stats?.recentActivity?.length
            ? <p className="text-xs text-base-content/40 text-center py-6">No recent activity</p>
            : <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr><th>Admin</th><th>Action</th><th>Role</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.map((a, i) => (
                      <tr key={i}>
                        <td className="font-medium">{a.staffId?.name || '—'}</td>
                        <td>{a.action}</td>
                        <td><span className="badge badge-xs">{a.staffId?.role || '—'}</span></td>
                        <td className="text-base-content/50 whitespace-nowrap">{new Date(a.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {/* Onboarding Inquiries */}
        <div className="lg:col-span-1 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">🏢 Onboarding Inquiries</h3>
            <span className="badge badge-primary badge-sm">{inquiries.length}</span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {inquiries.length === 0 ? (
              <p className="text-xs text-base-content/40 text-center py-8">No new inquiries.</p>
            ) : (
              inquiries.map(iq => (
                <div key={iq._id} className="bg-base-300/40 rounded-xl p-3 border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-xs truncate max-w-[120px]">{iq.orgName}</div>
                    <span className={`badge badge-[10px] py-0 h-4 ${iq.status === 'Pending' ? 'badge-warning' : 'badge-success'}`}>{iq.status}</span>
                  </div>
                  <div className="text-[11px] text-base-content/70">{iq.contactPerson}</div>
                  <div className="text-[11px] text-primary truncate mt-1">{iq.email}</div>
                  <div className="mt-2 text-[10px] text-base-content/50 line-clamp-2 bg-black/20 p-2 rounded italic">
                    "{iq.message}"
                  </div>
                  <div className="text-[9px] text-base-content/30 mt-2 text-right">
                    {new Date(iq.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
