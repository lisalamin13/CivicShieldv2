import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Background image for the portal
const BG_IMAGE = '/rightousness.jpeg';

export default function ReportPortal() {
  const { user } = useAuth();

  // State for Organization Selection
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');

  // State for AI Advisor (Floating Bubble)
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // State for Report Form
  const [form, setForm] = useState({ title: '', content: '', department: '', incidentDate: '', secretPhrase: '' });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Load organizations on mount
  useEffect(() => {
    api.get('/chat/tenants').then(r => {
      setTenants(r.data.tenants || []);
      if (r.data.tenants?.length > 0) setSelectedTenant(r.data.tenants[0]._id);
    }).catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  // AI Chat Logic
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

  // Report Submission Logic
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
      <div className="absolute inset-0 bg-black/60" />
      <nav className="relative z-10 navbar px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">🛡️</span>
          <span className="font-bold text-white text-xl tracking-tight">CivicShield</span>
        </Link>
      </nav>
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-base-200/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
          <h2 className="text-3xl font-black text-white mb-2">Report Secured</h2>
          <p className="text-base-content/60 text-sm mb-8">{result.message}</p>
          <div className="bg-base-300/60 rounded-2xl p-8 mb-8 border border-white/5">
            <p className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-3">Your Tracking ID</p>
            <div className="font-mono text-4xl font-black text-primary tracking-tighter">{result.trackingId}</div>
            <p className="text-[10px] text-base-content/30 mt-4 leading-relaxed">Save this ID in a secure place. It is the only way to track your report anonymously.</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link to={`/track?id=${result.trackingId}`} className="btn btn-primary px-8">🔍 Track Now</Link>
            <Link to="/" className="btn btn-ghost">← Home</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col relative text-white"
      style={{
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/40" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-transparent to-emerald-900/20" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Navbar */}
      <nav className="relative z-10 navbar px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/5 sticky top-0">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl transition-transform group-hover:scale-110 duration-300">🛡️</span>
          <span className="font-black text-white tracking-tighter text-xl">CivicShield</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link to="/track" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Track Report</Link>
          {!user && (
            <Link to="/login" className="btn btn-ghost btn-sm bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full px-5">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full p-6 md:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Speak Truth to Power.</h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Your identity is shielded by military-grade encryption. Submit your concern securely.
          </p>
        </div>

        {/* Org Selector */}
        <div className="glass-card p-6 mb-8 border-primary/20 bg-primary/5 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Target Organization</h3>
              <p className="text-xs text-white/40">Select the organization you are reporting about.</p>
            </div>
            <select
              className="select select-bordered w-full md:w-80 bg-slate-900/80 border-white/10 text-white focus:border-primary rounded-2xl"
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
            >
              <option value="">-- Select Organization --</option>
              {tenants.map(t => <option key={t._id} value={t._id}>{t.orgName}</option>)}
            </select>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 md:p-10 space-y-8 shadow-2xl bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10">
          {error && (
            <div className="alert alert-error bg-red-500/20 border-red-500/50 text-red-100 py-3 rounded-2xl">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="form-control">
              <label className="label"><span className="label-text text-white/70 font-bold text-xs uppercase">Report Title</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="What is the main concern?" className="input input-lg bg-white/5 border-white/10 text-white rounded-2xl" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label"><span className="label-text text-white/70 font-bold text-xs uppercase">Department</span></label>
                <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. HR, Operations" className="input bg-white/5 border-white/10 text-white rounded-2xl" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-white/70 font-bold text-xs uppercase">Incident Date</span></label>
                <input type="date" value={form.incidentDate} onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))}
                  className="input bg-white/5 border-white/10 text-white rounded-2xl" />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text text-white/70 font-bold text-xs uppercase">Detailed Evidence</span></label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Describe the incident in detail..." className="textarea textarea-bordered h-48 bg-white/5 border-white/10 text-white rounded-2xl text-base" required />
            </div>

            <div className="form-control bg-white/5 p-6 rounded-3xl border border-white/5">
              <label className="label mb-2"><span className="label-text text-white/70 font-bold text-xs uppercase">Evidence Upload</span></label>
              <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files))} className="file-input file-input-primary bg-slate-900 border-white/10 w-full" />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text text-white/70 font-bold text-xs uppercase">Secret Access Phrase</span></label>
              <input type="password" value={form.secretPhrase} onChange={e => setForm(f => ({ ...f, secretPhrase: e.target.value }))}
                placeholder="Create a phrase to access report later" className="input bg-white/5 border-white/10 text-white rounded-2xl" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full rounded-2xl shadow-lg font-black text-lg h-20" disabled={submitting}>
            {submitting ? <><span className="loading loading-spinner" /> ENCRYPTING...</> : '🔒 SUBMIT SECURE REPORT'}
          </button>
        </form>

        <footer className="mt-12 text-center text-white/20 text-xs font-mono tracking-widest">
          CIVICSHIELD SECURE REPORTING ARCHITECTURE V2.0
        </footer>
      </main>

      {/* FLOATING AI ADVISOR */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {showAdvisor && (
          <div className="w-[360px] h-[520px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold">AI Ethics Advisor</h3>
                <p className="text-[10px] opacity-70">Secured with Local LLM</p>
              </div>
              <button onClick={() => setShowAdvisor(false)} className="btn btn-circle btn-ghost btn-sm text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-10 opacity-40">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-xs">How can I help you today?</p>
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`chat ${m.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                  <div className={`chat-bubble text-xs py-2 px-3 rounded-2xl ${m.role === 'user' ? 'bg-primary' : 'bg-white/10'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="chat chat-start"><div className="chat-bubble bg-white/10 py-2 px-4"><span className="loading loading-dots loading-sm" /></div></div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="p-4 bg-black/20 border-t border-white/10 flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about policies..." className="input input-bordered flex-1 bg-white/5 border-white/10 text-xs rounded-xl" disabled={!selectedTenant || chatLoading} />
              <button type="submit" className="btn btn-primary btn-sm rounded-xl" disabled={!selectedTenant || chatLoading || !chatInput.trim()}>Send</button>
            </form>
          </div>
        )}
        <button onClick={() => setShowAdvisor(!showAdvisor)} className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all border-4 border-white/10 ${showAdvisor ? 'bg-slate-800 rotate-90' : 'bg-primary hover:scale-110'}`}>
          {showAdvisor ? '✕' : '🤖'}
        </button>
      </div>
    </div>
  );
}
