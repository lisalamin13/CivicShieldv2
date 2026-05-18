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
  const [uploading, setUploading] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});

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

  const handleUploadEvidence = async (e, r) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(u => ({ ...u, [r._id]: true }));
    setUploadStatus(u => ({ ...u, [r._id]: '' }));
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      await api.post(`/reports/evidence/${r.trackingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus(u => ({ ...u, [r._id]: 'Evidence uploaded and metadata stripped!' }));
      
      // Auto-send system chat message
      await api.post(`/conversations/${r.trackingId}`, {
        message: `[System Update] Reporter has submitted ${files.length} new evidence file(s).`,
      });
      
      const { data } = await api.get(`/conversations/${r.trackingId}`);
      setMessages(m => ({ ...m, [r._id]: data.messages || [] }));
    } catch {
      setUploadStatus(u => ({ ...u, [r._id]: 'Failed to upload evidence.' }));
    } finally {
      setUploading(u => ({ ...u, [r._id]: false }));
    }
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
                      {r.resolutionNote && (
                        <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                          <div className="text-xs font-semibold text-success mb-1">✅ Resolution Note</div>
                          <div className="text-sm text-base-content/70">{r.resolutionNote}</div>
                        </div>
                      )}

                      {/* Report preview */}
                      <div className="bg-base-300 rounded-xl p-3">
                        <div className="text-xs text-base-content/40 mb-1">Report Preview</div>
                  <div className="text-sm text-base-content/70">{r.contentPreview}</div>
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
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                              placeholder="Send a message..." className="input input-bordered flex-1 input-xs"
                              onKeyDown={e => e.key === 'Enter' && sendMessage(r)} />
                            <button onClick={() => sendMessage(r)} disabled={sendingMsg || !newMsg.trim()}
                              className="btn btn-xs btn-primary">
                              {sendingMsg ? <span className="loading loading-spinner loading-xs" /> : 'Send'}
                            </button>
                          </div>

                          {/* Submit Additional Evidence */}
                          <div className="flex items-center justify-between gap-3 mt-1.5 bg-base-300/40 p-2.5 rounded-xl border border-base-300">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm">📎</span>
                              <div className="text-left min-w-0">
                                <p className="text-[10px] font-semibold truncate text-base-content/95">Submit Additional Evidence</p>
                                <p className="text-[8px] text-base-content/40">Metadata is automatically stripped for anonymity</p>
                              </div>
                            </div>
                            <input
                              type="file"
                              multiple
                              id={`additional-evidence-${r._id}`}
                              className="hidden"
                              onChange={(e) => handleUploadEvidence(e, r)}
                              disabled={uploading[r._id]}
                            />
                            <label
                              htmlFor={`additional-evidence-${r._id}`}
                              className="btn btn-xs btn-outline border-base-content/20 text-base-content/80 hover:bg-base-content/10 cursor-pointer"
                            >
                              {uploading[r._id] ? 'Stripping...' : 'Choose Files'}
                            </label>
                          </div>
                          {uploadStatus[r._id] && (
                            <p className="text-[9px] text-success bg-success/10 py-1 px-2.5 rounded border border-success/20 mt-1">
                              {uploadStatus[r._id]}
                            </p>
                          )}
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
