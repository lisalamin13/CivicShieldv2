import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Unsplash: person silhouetted against bright light — courage, speaking up
const BG_IMAGE = '/rightousness.jpeg';

export default function ReportPortal() {
  const { user } = useAuth();

  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [form, setForm] = useState({ title: '', content: '', department: '', incidentDate: '', secretPhrase: '' });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    api.get('/chat/tenants').then(r => {
      setTenants(r.data.tenants || []);
      if (r.data.tenants?.length > 0) setSelectedTenant(r.data.tenants[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTenant) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const { data } = await api.post('/chat', {
        message: userMsg, tenantId: selectedTenant, history: chatHistory,
      });
      setChatHistory(h => [...h, { role: 'assistant', content: data.response }]);
    } catch {
      setChatHistory(h => [...h, { role: 'assistant', content: '⚠️ Unable to reach AI advisor. Please try again.' }]);
    } finally { setChatLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedTenant) return setError('Please select an organization.');
    if (!form.title.trim() || !form.content.trim()) return setError('Title and report content are required.');
    setSubmitting(true);
    try {
      const { data } = await api.post('/reports', { ...form, tenantId: selectedTenant });
      if (files.length > 0 && data.reportId) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        await api.post(`/reports/evidence/${data.reportId}`, fd);
      }
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  // Success screen
  if (result) return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundImage: `url('${BG_IMAGE}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <nav className="relative z-10 navbar px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-white">CivicShield</span>
        </Link>
      </nav>
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-base-200/95 backdrop-blur border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-success mb-2">Report Submitted!</h2>
          <p className="text-base-content/60 text-sm mb-6">{result.message}</p>
          <div className="bg-base-300/80 rounded-2xl p-6 mb-6">
            <p className="text-xs text-base-content/50 mb-2">Your Tracking ID</p>
            <div className="font-mono text-3xl font-black text-primary tracking-widest">{result.trackingId}</div>
            <p className="text-xs text-base-content/40 mt-2">Save this ID. You'll need it to track your report.</p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to={`/track?id=${result.trackingId}`} className="btn btn-primary btn-sm">🔍 Track Report</Link>
            <Link to="/" className="btn btn-ghost btn-sm">← Home</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-teal-900/15" />

      {/* Navbar */}
      <nav className="relative z-10 navbar px-4 py-3 border-b border-white/10 sticky top-0 backdrop-blur-md bg-black/30">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-white hidden sm:block">CivicShield</span>
        </Link>
        <div className="ml-auto flex gap-2">
          <Link to="/track" className="btn btn-ghost btn-sm text-white/70">🔍 Track</Link>
          {!user && <Link to="/login" className="btn btn-ghost btn-sm text-white/70">Sign In</Link>}
        </div>
      </nav>

      <div className="relative z-10 flex-1 max-w-5xl mx-auto w-full p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-1">📝 Report a Concern</h1>
          <p className="text-white/50 text-sm">
            Consult our AI Ethics Advisor first, then submit your report securely and anonymously.
          </p>
        </div>

        {/* Org selector */}
        <div className="bg-base-200/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-4 shadow-xl">
                <label className="label-text text-xs font-semibold mb-2 block text-[rgb(226_232_240_/_0.7)]">
            Select Organization
          </label>
          <select
            className="select select-bordered w-full bg-base-300/60"
            value={selectedTenant}
            onChange={e => setSelectedTenant(e.target.value)}
          >
            <option value="">-- Choose your organization --</option>
            {tenants.map(t => <option key={t._id} value={t._id}>{t.orgName} ({t.sectorType})</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-200/50 backdrop-blur-md border border-white/10 mb-4">
          <button className={`tab flex-1 ${activeTab === 'chat' ? 'tab-active' : 'text-white/60'}`} onClick={() => setActiveTab('chat')}>
            🤖 AI Ethics Advisor
          </button>
          <button className={`tab flex-1 ${activeTab === 'form' ? 'tab-active' : 'text-white/60'}`} onClick={() => setActiveTab('form')}>
            📋 Submit Report
          </button>
        </div>

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="bg-base-200/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col" style={{ height: '520px' }}>
            <div className="p-4 border-b border-base-300">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse inline-block" />
                AI Ethics Advisor
              </h3>
              <p className="text-xs text-base-content/40 mt-0.5">
                Ask about policies, your rights, and whether your concern is reportable.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">🤖</div>
                  <p className="text-sm text-base-content/50">Hello! I'm the CivicShield Ethics Advisor.</p>
                  <p className="text-xs text-base-content/30 mt-1">
                    Ask me about policies, your rights, or whether your concern qualifies for a formal report.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {[
                      'Is harassment reportable?',
                      'What is financial fraud?',
                      'How is my identity protected?',
                      'What happens after I report?',
                    ].map(q => (
                      <button key={q} onClick={() => setChatInput(q)} className="btn btn-xs btn-outline">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`chat ${m.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                  <div className="chat-image avatar placeholder">
                    <div className="w-8 bg-base-300 rounded-full flex items-center justify-center text-sm">
                      {m.role === 'user' ? '👤' : '🤖'}
                    </div>
                  </div>
                  <div className={`chat-bubble text-sm whitespace-pre-wrap ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat chat-start">
                  <div className="chat-bubble chat-bubble-ai">
                    <span className="loading loading-dots loading-sm" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChat} className="p-3 border-t border-base-300 flex gap-2">
              <input
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about your rights, policies, or how to report..."
                className="input input-bordered flex-1 input-sm bg-base-300/50"
                disabled={!selectedTenant || chatLoading}
              />
              <button type="submit" className="btn btn-primary btn-sm"
                disabled={!selectedTenant || chatLoading || !chatInput.trim()}>
                Send
              </button>
            </form>

            <div className="px-4 pb-3">
              <button onClick={() => setActiveTab('form')} className="btn btn-secondary btn-sm w-full">
                📋 Ready to Submit Report →
              </button>
            </div>
          </div>
        )}

        {/* FORM TAB */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit}
            className="bg-base-200/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            {error && <div className="alert alert-error text-sm py-2">{error}</div>}

            <div className="alert alert-info text-xs py-2">
              🔒 Your submission is end-to-end encrypted. No IP address or identity data is stored.
              {!user && ' You are reporting anonymously.'}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text text-xs font-semibold">Report Title *</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief title of your concern"
                className="input input-bordered w-full bg-base-300/50" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Department (optional)</span></label>
                <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. HR, Finance, CS Dept"
                  className="input input-bordered w-full bg-base-300/50" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Incident Date (optional)</span></label>
                <input type="date" value={form.incidentDate} onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))}
                  className="input input-bordered w-full bg-base-300/50" />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text text-xs font-semibold">Detailed Report *</span></label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Describe the incident in as much detail as possible. Include dates, locations, people involved (you can use initials), and any witnesses. Do NOT include your own personal details."
                className="textarea textarea-bordered w-full h-40 bg-base-300/50" required />
              <label className="label">
                <span className="label-text-alt text-base-content/30">
                  This content will be AES-256 encrypted before storage.
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Secret Phrase (for anonymous access)</span>
                <span className="label-text-alt text-xs text-base-content/40">Optional but recommended</span>
              </label>
              <input type="password" value={form.secretPhrase} onChange={e => setForm(f => ({ ...f, secretPhrase: e.target.value }))}
                placeholder="A phrase only you know — used to access report later"
                className="input input-bordered w-full bg-base-300/50" />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Evidence Files (optional, max 5 files)</span>
              </label>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mp3"
                onChange={e => setFiles(Array.from(e.target.files))}
                className="file-input file-input-bordered w-full file-input-sm bg-base-300/50" />
              <label className="label">
                <span className="label-text-alt text-base-content/30">
                  GPS/EXIF metadata is automatically stripped from all uploaded files.
                </span>
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => (
                    <span key={i} className="badge badge-outline badge-sm">{f.name}</span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting
                ? <><span className="loading loading-spinner loading-sm" /> Encrypting & Submitting...</>
                : '🔒 Submit Report Securely'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
