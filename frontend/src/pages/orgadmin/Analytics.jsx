import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#1d4ed8', '#0f766e', '#7c3aed', '#f59e0b', '#22c55e', '#ef4444', '#0ea5e9', '#ec4899'];
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  const s = data?.stats || {};
  const monthly = (data?.monthlyTrend || []).map(m => ({ name: MONTHS[m._id.month], count: m.count }));
  const byStatus = (data?.byStatus || []).map(s => ({ name: s._id, value: s.count }));
  const byCategory = (data?.byCategory || []).slice(0, 8).map(c => ({ name: c._id || 'Other', count: c.count }));
  const byPriority = (data?.byPriority || []).map(p => ({ name: p._id, value: p.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📈 Analytics</h1>
        <p className="text-base-content/50 text-sm mt-1">Insights and trends from your organization's grievance reports.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: s.totalReports ?? 0, icon: '📋', color: 'text-primary' },
          { label: 'Resolution Rate', value: `${s.resolutionRate ?? 0}%`, icon: '✅', color: 'text-success' },
          { label: 'Avg Risk Score', value: s.avgRedFlagScore ?? 0, icon: '⚡', color: s.avgRedFlagScore > 60 ? 'text-error' : 'text-warning' },
          { label: 'Open Cases', value: s.openReports ?? 0, icon: '🔵', color: 'text-info' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="text-2xl">{c.icon}</div>
            <div className={`text-3xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-base-content/50">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      {monthly.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm mb-4">📅 Monthly Report Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2} dot={{ fill: '#1d4ed8', r: 4 }} name="Reports" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By category bar */}
        {byCategory.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-sm mb-4">📊 Reports by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} width={110} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Reports">
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By status pie */}
        {byStatus.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-sm mb-4">🔄 Reports by Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By priority */}
        {byPriority.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-sm mb-4">🚨 Reports by Priority</h3>
            <div className="space-y-3">
              {byPriority.map((p, i) => {
                const total = byPriority.reduce((a, b) => a + b.value, 0);
                const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
                const color = p.name === 'Critical' ? 'bg-error' : p.name === 'High' ? 'bg-warning' : p.name === 'Medium' ? 'bg-info' : 'bg-success';
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-base-content/50">{p.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-3">
                      <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary table */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm mb-4">📋 Case Summary</h3>
          <div className="space-y-2">
            {[
              ['Total Submitted', s.totalReports ?? 0],
              ['Resolved Successfully', s.resolvedReports ?? 0],
              ['Currently Open', s.openReports ?? 0],
              ['Flagged Urgent', s.urgentReports ?? 0],
              ['Active Staff', s.staffCount ?? 0],
              ['Compliance Policies', s.policyCount ?? 0],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-base-300 last:border-0">
                <span className="text-sm text-black">{label}</span>
                <span className="font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
