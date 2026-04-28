import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

// Unsplash: compass / navigation — finding your way, transparency, direction
const BG_IMAGE = '/rightousness.JPEG';

const STATUS_COLOR = {
  'Open': 'badge-info', 'Under Review': 'badge-warning',
  'In Investigation': 'badge-accent', 'Resolved': 'badge-success',
  'Dismissed': 'badge-ghost', 'Escalated': 'badge-error',
};

export default function TrackReport() {
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
  const [secretPhrase, setSecretPhrase] = useState('');
  const [report, setReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (searchParams.get('id')) handleTrack(null, searchParams.get('id'));
  }, []);

  const handleTrack = async (e, id) => {
    if (e) e.preventDefault();
    const tid = (id || trackingId).trim();
    if (!tid) return setError('Enter your tracking ID.');
    setLoading(true); setError(''); setReport(null);
    try {
      const { data } = await api.get(`/reports/track/${tid}`, {
        params: secretPhrase ? { secretPhrase } : {},
      });
      setReport(data.report);
      if (data.report) loadMessages(data.report.trackingId);
    } catch (err) {
      setError(err.response?.data?.error || 'Report not found. Check your tracking ID.');
    } finally { setLoading(false); }
  };

  const loadMessages = async (tid) => {
    try { const { data } = await api.get(`/conversations/${tid}`); setMessages(data.messages || []); }
    catch { setMessages([]); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !report) return;
    setSending(true);
    try {
      await api.post(`/conversations/${report.trackingId}`, { message: newMsg });
      setNewMsg('');
      await loadMessages(report.trackingId);
    } catch { } finally { setSending(false); }
  };

  const getStatusEmoji = (s) =>
    ({ Open: '🔵', 'Under Review': '🟡', 'In Investigation': '🟠', Resolved: '🟢', Dismissed: '⚫', Escalated: '🔴' }[s] || '⚪');

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-black/50" />

      {/* Navbar */}
      <nav className="relative z-10 navbar px-4 py-3 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-white hidden sm:block">CivicShield</span>
        </Link>
        <div className="ml-auto flex gap-2">
          <Link to="/report" className="btn btn-secondary btn-sm">📝 New Report</Link>
          <Link to="/login" className="btn btn-ghost btn-sm text-white/70">Login</Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 max-w-2xl mx-auto w-full p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 shield-gradient rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl">
            🔍
          </div>
          <h1 className="text-3xl font-bold text-white">Track Your Report</h1>
          <p className="text-white/50 text-sm mt-2">
            Enter your 16-character tracking ID to check the status of your submission.
          </p>
        </div>

        {/* Search card */}
        <form onSubmit={handleTrack}
          className="bg-base-200/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 space-y-4 shadow-2xl">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold text-base-content/70">Tracking ID</span>
            </label>
            <input
              type="text" value={trackingId}
              onChange={e => setTrackingId(e.target.value.toUpperCase())}
              placeholder="CS1A2B3C4D5E6F7G" maxLength={18}
              className="input input-bordered font-mono text-lg tracking-widest text-center w-full bg-base-300/50"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs text-base-content/60">Secret Phrase (optional)</span>
              <span className="label-text-alt text-xs text-base-content/30">If you set one at submission</span>
            </label>
            <input
              type="password" value={secretPhrase}
              onChange={e => setSecretPhrase(e.target.value)}
              placeholder="Your secret phrase"
              className="input input-bordered input-sm w-full bg-base-300/50"
            />
          </div>
          {error && <div className="alert alert-error text-sm py-2">{error}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : '🔍 Track Report'}
          </button>
        </form>

        {/* Result */}
        {report && (
          <div className="space-y-4">
            {/* Status card */}
            <div className="bg-base-200/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="font-bold text-lg text-white">{report.title}</h2>
                  <p className="text-xs text-white/40 font-mono mt-1">{report.trackingId}</p>
                </div>
                <span className={`badge ${STATUS_COLOR[report.status] || 'badge-ghost'} badge-lg`}>
                  {getStatusEmoji(report.status)} {report.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Organization', value: report.orgName },
                  { label: 'Category', value: report.category },
                  { label: 'Priority', value: report.priority },
                  { label: 'Submitted', value: new Date(report.submittedAt).toLocaleDateString('en-IN') },
                  { label: 'Last Updated', value: new Date(report.updatedAt).toLocaleDateString('en-IN') },
                ].map(({ label, value }) => value && (
                  <div key={label} className="bg-base-300/60 rounded-xl p-3">
                    <div className="text-xs text-base-content/40">{label}</div>
                    <div className="text-sm font-semibold mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              {report.aiSummary && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-primary mb-1">🤖 AI Summary</p>
                  <p className="text-sm text-base-content/70">{report.aiSummary}</p>
                </div>
              )}

              {report.resolutionNote && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-success mb-1">✅ Resolution Note</p>
                  <p className="text-sm text-base-content/70">{report.resolutionNote}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-base-200/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="font-semibold text-sm mb-4">📅 Status Timeline</h3>
              <ul className="steps steps-vertical">
                {['Open', 'Under Review', 'In Investigation', 'Resolved'].map((s, i) => {
                  const statuses = ['Open', 'Under Review', 'In Investigation', 'Resolved'];
                  const currentIdx = statuses.indexOf(report.status);
                  const done = i <= currentIdx;
                  return (
                    <li key={s} className={`step text-xs text-left ${done ? 'step-primary' : ''}`}>
                      {s}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Messaging */}
            <div className="bg-base-200/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">💬 Secure Communication</h3>
                <button onClick={() => setShowChat(!showChat)} className="btn btn-ghost btn-xs">
                  {showChat ? 'Hide' : 'Show'} Messages
                </button>
              </div>
              {showChat && (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                    {messages.length === 0
                      ? <p className="text-xs text-base-content/40 text-center py-4">
                          No messages yet. Send one below.
                        </p>
                      : messages.map((m, i) => (
                          <div key={i} className={`chat ${m.senderType === 'Staff' ? 'chat-start' : 'chat-end'}`}>
                            <div className="chat-header text-xs opacity-50">
                              {m.senderType === 'Staff' ? `👔 ${m.senderId?.name || 'Investigator'}` : '🕵️ You'}
                              · {new Date(m.createdAt).toLocaleTimeString()}
                            </div>
                            <div className="chat-bubble text-sm">{m.message}</div>
                          </div>
                        ))
                    }
                  </div>
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                      placeholder="Type a message to the investigator..."
                      className="input input-bordered flex-1 input-sm bg-base-300/50"
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>Send</button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}