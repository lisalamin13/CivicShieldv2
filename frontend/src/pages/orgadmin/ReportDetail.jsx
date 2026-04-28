import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const STATUSES = ['Open', 'Under Review', 'In Investigation', 'Resolved', 'Dismissed', 'Escalated'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_BADGE = { Open: 'badge-info', 'Under Review': 'badge-warning', 'In Investigation': 'badge-accent', Resolved: 'badge-success', Dismissed: 'badge-ghost', Escalated: 'badge-error' };

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/${id}`);
      setReport(data.report);
      setEvidence(data.evidence || []);
      setStatus(data.report.status);
      setPriority(data.report.priority);
      setResolutionNote(data.report.resolutionNote || '');
      loadMessages(data.report.trackingId);
    } catch (e) { setError(e.response?.data?.error || 'Failed to load report.'); }
    finally { setLoading(false); }
  };

  const loadMessages = async (tid) => {
    try { const { data } = await api.get(`/conversations/${tid}`); setMessages(data.messages || []); }
    catch { setMessages([]); }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await api.patch(`/reports/${id}/status`, { status, priority, resolutionNote });
      await load();
    } catch (e) { setError(e.response?.data?.error || 'Update failed.'); }
    finally { setUpdating(false); }
  };

  const handleSendMsg = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSendingMsg(true);
    try {
      await api.post(`/conversations/${report.trackingId}`, { message: newMsg });
      setNewMsg('');
      await loadMessages(report.trackingId);
    } catch { }
    finally { setSendingMsg(false); }
  };

  const riskColor = (score) => score > 70 ? 'text-error' : score > 40 ? 'text-warning' : 'text-success';
  const riskLabel = (score) => score > 70 ? 'HIGH RISK' : score > 40 ? 'MEDIUM' : 'LOW';

  if (loading) return <div className="flex items-center justify-center h-64"><span className="loading loading-spinner loading-lg text-primary" /></div>;
  if (error) return <div className="alert alert-error">{error}<button onClick={() => navigate(-1)} className="btn btn-sm btn-ghost ml-auto">← Back</button></div>;
  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-xs mb-2">← Back to Reports</button>
          <h1 className="text-xl font-bold">{report.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <code className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">{report.trackingId}</code>
            <span className={`badge badge-sm ${STATUS_BADGE[report.status] || 'badge-ghost'}`}>{report.status}</span>
            {report.isUrgent && <span className="badge badge-sm badge-error urgent-pulse">🚨 URGENT</span>}
            <span className="text-xs text-base-content/40">Submitted {new Date(report.createdAt).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className={`text-center glass-card px-4 py-3`}>
          <div className={`text-3xl font-black ${riskColor(report.redFlagScore)}`}>{report.redFlagScore}</div>
          <div className={`text-xs font-bold ${riskColor(report.redFlagScore)}`}>{riskLabel(report.redFlagScore)}</div>
          <div className="text-xs text-base-content/40">AI Risk Score</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 border border-base-300">
        {[['details', '📄 Details'], ['content', '📝 Report Content'], ['messages', `💬 Messages (${messages.length})`], ['evidence', `📎 Evidence (${evidence.length})`]].map(([k, l]) => (
          <button key={k} className={`tab flex-1 text-xs sm:text-sm ${activeTab === k ? 'tab-active' : ''}`} onClick={() => setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {/* DETAILS TAB */}
      {activeTab === 'details' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Info grid */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-sm mb-4">📋 Report Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['Category', report.category], ['Priority', report.priority],
                  ['Department', report.department || '—'], ['Anonymous', report.isAnonymous ? 'Yes' : 'No'],
                  ['Evidence Files', report.evidenceCount || 0],
                  ['Incident Date', report.incidentDate ? new Date(report.incidentDate).toLocaleDateString('en-IN') : '—'],
                  ['AI Processed', report.aiProcessed ? '✅ Yes' : '⏳ Pending'],
                  ['Keywords', report.keywords?.join(', ') || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-base-300 rounded-lg p-3">
                    <div className="text-xs text-base-content/40">{k}</div>
                    <div className="text-sm font-medium mt-0.5">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            {report.aiSummary && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">🤖 AI Executive Summary</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">{report.aiSummary}</p>
                {report.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {report.keywords.map(kw => <span key={kw} className="badge badge-xs badge-outline">{kw}</span>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status update panel */}
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-sm mb-4">⚙️ Update Case Status</h3>
              <div className="space-y-3">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs">Status</span></label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="select select-bordered select-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs">Priority</span></label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="select select-bordered select-sm">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {(status === 'Resolved' || status === 'Dismissed') && (
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs">Resolution Note</span></label>
                    <textarea value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                      className="textarea textarea-bordered textarea-sm" rows={3}
                      placeholder="Describe the resolution or reason for dismissal..." />
                  </div>
                )}
                <button onClick={handleUpdateStatus} disabled={updating} className="btn btn-primary btn-sm w-full">
                  {updating ? <span className="loading loading-spinner loading-xs" /> : '💾 Save Changes'}
                </button>
              </div>
            </div>

            {report.resolvedAt && (
              <div className="glass-card p-4">
                <p className="text-xs text-base-content/40">Resolved on</p>
                <p className="text-sm font-semibold">{new Date(report.resolvedAt).toLocaleDateString('en-IN')}</p>
                {report.resolutionNote && <p className="text-xs text-base-content/60 mt-2 italic">"{report.resolutionNote}"</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === 'content' && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-sm">📝 Decrypted Report Content</h3>
            <span className="badge badge-xs badge-success">🔓 Decrypted for authorized review</span>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <pre className="whitespace-pre-wrap text-sm text-base-content/80 leading-relaxed font-sans">
              {report.decryptedContent}
            </pre>
          </div>
          <p className="text-xs text-base-content/30 mt-3">⚠️ This content is stored encrypted. Viewing is logged in the audit trail.</p>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm mb-4">💬 Secure Communication with Reporter</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4 p-2">
            {messages.length === 0
              ? <p className="text-xs text-center text-base-content/40 py-8">No messages yet. Start the conversation below.</p>
              : messages.map((m, i) => (
                  <div key={i} className={`chat ${m.senderType === 'Staff' ? 'chat-end' : 'chat-start'}`}>
                    <div className="chat-header text-xs opacity-50">
                      {m.senderType === 'Staff' ? `👔 ${m.senderId?.name || 'You'}` : '🕵️ Reporter'} · {new Date(m.createdAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}
                    </div>
                    <div className={`chat-bubble text-sm ${m.senderType === 'Staff' ? '' : 'chat-bubble-ai'}`}>{m.message}</div>
                    {m.aiDraftedResponse && m.senderType !== 'Staff' && (
                      <div className="chat-footer">
                        <div className="mt-1 bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs">
                          <span className="text-primary font-semibold">🤖 AI Draft Reply: </span>
                          <span className="text-base-content/60">{m.aiDraftedResponse}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            }
          </div>
          <form onSubmit={handleSendMsg} className="flex gap-2 border-t border-base-300 pt-4">
            <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
              placeholder="Send a secure message to the reporter..." className="input input-bordered flex-1 input-sm" />
            <button type="submit" disabled={sendingMsg || !newMsg.trim()} className="btn btn-primary btn-sm">
              {sendingMsg ? <span className="loading loading-spinner loading-xs" /> : 'Send'}
            </button>
          </form>
        </div>
      )}

      {/* EVIDENCE TAB */}
      {activeTab === 'evidence' && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm mb-4">📎 Evidence Files ({evidence.length})</h3>
          {evidence.length === 0
            ? <p className="text-xs text-center text-base-content/40 py-8">No evidence files attached to this report.</p>
            : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {evidence.map((ev, i) => (
                  <div key={i} className="bg-base-300 rounded-xl p-4">
                    <div className="text-2xl mb-2">
                      {ev.mimetype?.startsWith('image/') ? '🖼️' : ev.mimetype?.includes('pdf') ? '📄' : ev.mimetype?.startsWith('video/') ? '🎥' : '📎'}
                    </div>
                    <div className="text-sm font-medium truncate">{ev.originalName}</div>
                    <div className="text-xs text-base-content/40 mt-1">{(ev.size / 1024).toFixed(1)} KB</div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <span className={`badge badge-xs ${ev.virusScanStatus === 'Clean' ? 'badge-success' : ev.virusScanStatus === 'Infected' ? 'badge-error' : 'badge-warning'}`}>
                        {ev.virusScanStatus}
                      </span>
                      {ev.metadataStripped && <span className="badge badge-xs badge-info">Metadata Stripped</span>}
                    </div>
                    <a href={`/uploads/${ev.storedName}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline mt-3 w-full">
                      View File
                    </a>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  );
}
