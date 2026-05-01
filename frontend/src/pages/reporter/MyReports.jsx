import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_BADGE = { Open: 'badge-info', 'Under Review': 'badge-warning', 'In Investigation': 'badge-accent', Resolved: 'badge-success', Dismissed: 'badge-ghost', Escalated: 'badge-error' };
const STATUS_ICON = { Open: '🔵', 'Under Review': '🟡', 'In Investigation': '🟠', Resolved: '🟢', Dismissed: '⚫', Escalated: '🔴' };

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    api.get('/reports/my').then(r => setReports(r.data.reports || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (r) => {
    if (expanded === r._id) { setExpanded(null); return; }
    setExpanded(r._id);
    if (!messages[r._id]) {
      try {
        const { data } = await api.get(`/conversations/${r.trackingId}`);
        setMessages(m => ({ ...m, [r._id]: data.messages || [] }));
      } catch { setMessages(m => ({ ...m, [r._id]: [] })); }
    }
  };

  const sendMessage = async (r) => {
    if (!newMsg.trim()) return;
    setSendingMsg(true);
    try {
      await api.post(`/conversations/${r.trackingId}`, { message: newMsg });
      setNewMsg('');
      const { data } = await api.get(`/conversations/${r.trackingId}`);
      setMessages(m => ({ ...m, [r._id]: data.messages || [] }));
    } catch { }
    finally { setSendingMsg(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📋 My Reports</h1>
          <p className="text-base-content/50 text-sm mt-1">{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</p>
        </div>
        <Link to="/report" className="btn btn-primary btn-sm">✍️ New Report</Link>
      </div>

      {loading
        ? <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-primary" /></div>
        : reports.length === 0
          ? <div className="glass-card p-16 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="font-semibold mb-2">No reports yet</h3>
              <p className="text-base-content/40 text-sm mb-6">Reports you submit while logged in will appear here.</p>
              <Link to="/report" className="btn btn-primary">📝 File a Report</Link>
            </div>
          : <div className="space-y-4">
              {reports.map(r => (
                <div key={r._id} className="glass-card overflow-hidden">
                  {/* Report header */}
                  <div className="p-5 cursor-pointer hover:bg-base-300/30 transition-colors" onClick={() => toggleExpand(r)}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`badge badge-sm ${STATUS_BADGE[r.status] || 'badge-ghost'}`}>
                            {STATUS_ICON[r.status]} {r.status}
                          </span>
                          <span className="badge badge-xs badge-outline">{r.category}</span>
                          {r.isUrgent && <span className="badge badge-xs badge-error">🚨 Urgent</span>}
                        </div>
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-xs text-base-content/40 mt-0.5">
                          <span className="font-mono">{r.trackingId}</span>
                          {r.tenantId?.orgName && <span className="ml-2">· {r.tenantId.orgName}</span>}
                          <span className="ml-2">· {new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="text-base-content/40 text-xs flex-shrink-0">
                        {expanded === r._id ? '▲ Collapse' : '▼ Expand'}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expanded === r._id && (
                    <div className="border-t border-base-300 p-5 space-y-4">
                      {/* Summary & status */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {r.aiSummary && (
                          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                            <div className="text-xs font-semibold text-primary mb-1">🤖 AI Summary</div>
                      <div className="text-xs text-[rgb(226_232_240_/_0.7)]">{r.aiSummary}</div>
                          </div>
                        )}
                        {r.resolutionNote && (
                          <div className="bg-success/10 border border-success/20 rounded-xl p-3">
                            <div className="text-xs font-semibold text-success mb-1">✅ Resolution</div>
                      <div className="text-xs text-[rgb(226_232_240_/_0.7)]">{r.resolutionNote}</div>
                          </div>
                        )}
                      </div>

                      {/* Report preview */}
                      <div className="bg-base-300 rounded-xl p-3">
                        <div className="text-xs text-base-content/40 mb-1">Report Preview</div>
                  <div className="text-sm text-[rgb(226_232_240_/_0.7)]">{r.contentPreview}</div>
                      </div>

                      {/* Track link */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/track?id=${r.trackingId}`} className="btn btn-xs btn-outline">🔍 Full Tracking View</Link>
                        <code className="text-xs bg-base-300 px-2 py-1 rounded font-mono text-primary">{r.trackingId}</code>
                      </div>

                      {/* Messages */}
                      <div>
                        <div className="text-xs font-semibold mb-2">💬 Messages ({(messages[r._id] || []).length})</div>
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                          {!(messages[r._id]?.length)
                            ? <p className="text-xs text-base-content/40 text-center py-3">No messages yet. Send a message to the investigator below.</p>
                            : (messages[r._id] || []).map((m, i) => (
                                <div key={i} className={`chat ${m.senderType !== 'Staff' ? 'chat-end' : 'chat-start'}`}>
                                  <div className="chat-header text-xs opacity-40">
                                    {m.senderType === 'Staff' ? `👔 ${m.senderId?.name || 'Investigator'}` : '🕵️ You'}
                                  </div>
                                  <div className="chat-bubble text-xs">{m.message}</div>
                                </div>
                              ))
                          }
                        </div>
                        <div className="flex gap-2">
                          <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                            placeholder="Send a message..." className="input input-bordered flex-1 input-xs"
                            onKeyDown={e => e.key === 'Enter' && sendMessage(r)} />
                          <button onClick={() => sendMessage(r)} disabled={sendingMsg || !newMsg.trim()}
                            className="btn btn-xs btn-primary">
                            {sendingMsg ? <span className="loading loading-spinner loading-xs" /> : 'Send'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
      }
    </div>
  );
}
