import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = { Open: 'badge-info', 'Under Review': 'badge-warning', 'In Investigation': 'badge-accent', Resolved: 'badge-success', Dismissed: 'badge-ghost', Escalated: 'badge-error' };

export default function ReporterDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/my').then(r => setReports(r.data.reports || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const active = reports.filter(r => !['Resolved', 'Dismissed'].includes(r.status)).length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 shield-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{ width: `${60 + i * 30}px`, height: `${60 + i * 30}px`, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.3 }} />
          ))}
        </div>
        <div className="relative">
          <div className="text-3xl mb-2">👋</div>
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.name || 'Reporter'}!</h1>
          <p className="text-white/70 text-sm mt-1">Your reports are securely encrypted and protected.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, icon: '📋', color: 'text-primary' },
          { label: 'Active Cases', value: active, icon: '🔵', color: 'text-warning' },
          { label: 'Resolved', value: resolved, icon: '✅', color: 'text-success' },
        ].map(c => (
          <div key={c.label} className="stat-card text-center items-center">
            <div className="text-2xl">{c.icon}</div>
            <div className={`text-3xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-base-content/50 text-center">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/report" className="glass-card p-6 hover:border-primary/50 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-primary/30 transition-colors">✍️</div>
          <div>
            <div className="font-semibold">File New Report</div>
            <div className="text-xs text-base-content/50">Submit anonymously with AI guidance</div>
          </div>
        </Link>
        <Link to="/track" className="glass-card p-6 hover:border-secondary/50 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-secondary/30 transition-colors">🔍</div>
          <div>
            <div className="font-semibold">Track by ID</div>
            <div className="text-xs text-base-content/50">Use tracking ID for anonymous reports</div>
          </div>
        </Link>
      </div>

      {/* My reports */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">📋 My Recent Reports</h3>
          <Link to="/reporter/my-reports" className="btn btn-ghost btn-xs">View All →</Link>
        </div>
        {loading
          ? <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>
          : reports.length === 0
            ? <div className="text-center py-8 text-base-content/40">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm mb-3">You haven't filed any reports yet.</p>
                <Link to="/report" className="btn btn-primary btn-sm">📝 File Your First Report</Link>
              </div>
            : <div className="space-y-3">
                {reports.slice(0, 4).map(r => (
                  <div key={r._id} className="bg-base-300 rounded-xl p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{r.title}</div>
                      <div className="text-xs text-base-content/40 font-mono mt-0.5">{r.trackingId}</div>
                      <div className="text-xs text-base-content/50 mt-1 line-clamp-1">{r.contentPreview}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`badge badge-xs ${STATUS_BADGE[r.status] || 'badge-ghost'}`}>{r.status}</span>
                      <span className="text-xs text-base-content/30">{r.tenantId?.orgName || 'Unknown Org'}</span>
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>

      {/* Safety reminder */}
      <div className="glass-card p-4 border-l-4 border-success">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🛡️</span>
          <div>
            <div className="font-semibold text-sm text-success">Your Identity is Protected</div>
            <div className="text-xs text-base-content/50 mt-1">
              All reports are AES-256 encrypted. No IP addresses are stored. Metadata is stripped from uploaded files. You can always report anonymously without an account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
