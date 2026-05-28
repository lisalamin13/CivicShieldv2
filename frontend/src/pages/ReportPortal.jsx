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
    }).catch(() => { });
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
        const uploadUrl = `/reports/evidence/${data.reportId}?trackingId=${data.trackingId}` +
          (form.secretPhrase ? `&secretPhrase=${encodeURIComponent(form.secretPhrase)}` : '');
        await api.post(uploadUrl, fd);
      }
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const getDeptPlaceholder = () => {
    const activeTenant = tenants.find(t => t._id === selectedTenant);
    if (!activeTenant) return "e.g. Finance, HR, IT";
    const isAcademic = activeTenant.sectorType?.toLowerCase() === 'academic' ||
      /university|college|school|academy/i.test(activeTenant.orgName);
    if (isAcademic) {
      return "e.g. Dept. of Computer Application, Engineering, Commerce";
    }
    return "e.g. Finance, HR, IT";
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
            Your identity is fully protected under end-to-end encryption. Submit your concern securely.
          </p>
        </div>

        {/* Org Selector */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border-t-4 border-t-primary border-x border-b border-white/10 rounded-3xl p-6 mb-8 shadow-3xl text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                🏢 Target Organization
              </h3>
              <p className="text-xs text-white/50 mt-1">Select the organization you are reporting about.</p>
            </div>
            <div className="relative w-full md:w-80">
              <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                Choose Organization
              </label>
              <select
                className="select select-bordered w-full h-12 pl-4 pr-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl"
                value={selectedTenant}
                onChange={e => setSelectedTenant(e.target.value)}
              >
                <option value="" className="bg-slate-900 text-white">-- Select Organization --</option>
                {tenants.map(t => (
                  <option key={t._id} value={t._id} className="bg-slate-900 text-white">
                    {t.orgName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border-t-4 border-t-primary border-x border-b border-white/10 rounded-3xl overflow-hidden shadow-3xl text-white relative">
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Security Header */}
          <div className="bg-primary/20 border-b border-white/10 p-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#1d4ed8]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Secure Channel Active</span>
            </div>
            <div className="text-[10px] text-white/40 font-mono">AES-256 ENCRYPTED</div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6 relative z-10">
            {error && (
              <div className="alert alert-error bg-red-500/20 border-red-500/50 text-red-100 py-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Report Title */}
              <div className="relative mt-4">
                <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                  Report Title
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                    📝
                  </span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Summarize the core issue..."
                    className="input input-bordered w-full pl-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12"
                    required
                  />
                </div>
              </div>

              {/* Department & Incident Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Department
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      🏢
                    </span>
                    <input
                      type="text"
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      placeholder={getDeptPlaceholder()}
                      className="input input-bordered w-full pl-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Incident Date
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      📅
                    </span>
                    <input
                      type="date"
                      value={form.incidentDate}
                      onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))}
                      className="input input-bordered w-full pl-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="relative mt-4">
                <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                  Detailed Narrative
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm">
                    💬
                  </span>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Provide a thorough narrative account of what happened..."
                    className="textarea textarea-bordered w-full pl-10 pt-3 h-40 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Evidence Upload */}
              <div className="relative bg-slate-950/30 p-6 rounded-xl border border-white/5 group hover:bg-slate-950/50 transition-all">
                <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                  Evidence Upload (Optional)
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={e => setFiles(Array.from(e.target.files))}
                    className="file-input file-input-bordered file-input-primary w-full bg-slate-950 border-white/10 rounded-xl h-12"
                  />
                  {files.length > 0 && (
                    <p className="text-[10px] text-primary font-bold px-1">📎 {files.length} file(s) selected</p>
                  )}
                </div>
              </div>

              {/* Secret Phrase */}
              <div className="relative mt-4">
                <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                  Secret Access Phrase
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                    🔑
                  </span>
                  <input
                    type="password"
                    value={form.secretPhrase}
                    onChange={e => setForm(f => ({ ...f, secretPhrase: e.target.value }))}
                    placeholder="Create a phrase to view this report status later"
                    className="input input-bordered w-full pl-10 pr-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12"
                  />
                </div>
                <p className="text-[10px] text-white/40 px-1 mt-1">
                  Optional: Extra layer of protection for anonymous tracking.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn shield-gradient border-none btn-lg w-full rounded-xl shadow-2xl text-white font-extrabold text-sm h-14 hover:scale-[1.01] hover:shadow-primary/40 transition-all"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-3 justify-center">
                  <span className="loading loading-spinner" />
                  <span className="tracking-wider uppercase text-xs">Encrypting & Routing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <span>🔒</span>
                  <span className="tracking-wider uppercase text-xs">SUBMIT SECURE REPORT</span>
                </div>
              )}
            </button>
          </form>
        </div>

        <footer className="mt-12 text-center text-white/20 text-xs font-mono tracking-widest">
          CIVICSHIELD SECURE REPORTING PORTAL
        </footer>
      </main>

      {/* FLOATING AI ADVISOR */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end text-white">
        {showAdvisor && (
          <div className="w-[360px] h-[520px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5">
            <div className="p-5 bg-gradient-to-r from-primary to-indigo-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm">AI Ethics Advisor</h3>
                <p className="text-[10px] opacity-70 font-mono">Secured with Local LLM</p>
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
                  <div className={`chat-bubble text-xs py-2.5 px-3.5 rounded-2xl ${m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-800/80 border border-white/5 text-white/90'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="chat chat-start"><div className="chat-bubble bg-slate-800/50 border border-white/5 py-2.5 px-4 text-white/60"><span className="loading loading-dots loading-sm" /></div></div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="p-4 bg-slate-950/40 border-t border-white/10 flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Something..." className="input input-bordered flex-1 bg-slate-950/60 border-white/10 text-xs rounded-xl h-10 text-white focus:border-primary focus:bg-slate-950" disabled={!selectedTenant || chatLoading} />
              <button type="submit" className="btn btn-primary btn-sm rounded-xl h-10" disabled={!selectedTenant || chatLoading || !chatInput.trim()}>Send</button>
            </form>
          </div>
        )}
        <button onClick={() => setShowAdvisor(!showAdvisor)} className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all border-4 border-white/10 ${showAdvisor ? 'bg-slate-800 rotate-90 text-white' : 'bg-primary hover:scale-110 text-white shadow-primary/20'}`}>
          {showAdvisor ? '✕' : '🤖'}
        </button>
      </div>
    </div>
  );
}
