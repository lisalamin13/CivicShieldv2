import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { publicApi } from '../api/axios';

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
  const [chatError, setChatError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (searchParams.get('id')) handleTrack(null, searchParams.get('id'));
  }, []);

  const handleTrack = async (e, id) => {
    if (e) e.preventDefault();
    const tid = (id || trackingId).trim();
    if (!tid) return setError('Enter your tracking ID.');
    setLoading(true); setError(''); setReport(null);
    try {
      const { data } = await publicApi.get(`/reports/track/${tid}`, {
        params: secretPhrase ? { secretPhrase } : {},
      });
      setReport(data.report);
      if (data.report) loadMessages(data.report.trackingId);
    } catch (err) {
      setError(err.response?.data?.error || 'Report not found. Check your tracking ID.');
    } finally { setLoading(false); }
  };

  const loadMessages = async (tid) => {
    try {
      const { data } = await publicApi.get(`/conversations/${tid}`, {
        params: secretPhrase ? { secretPhrase } : {},
      });
      setMessages(data.messages || []);
    }
    catch { setMessages([]); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !report) return;
    setSending(true);
    setChatError('');
    try {
      await publicApi.post(`/conversations/${report.trackingId}`, {
        message: newMsg,
        secretPhrase: secretPhrase || undefined
      });
      setNewMsg('');
      await loadMessages(report.trackingId);
    } catch (err) {
      setChatError(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !report) return;
    setUploadingFiles(true);
    setUploadStatus('');
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      await publicApi.post(`/reports/evidence/${report.trackingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: secretPhrase ? { secretPhrase } : {},
      });
      setUploadStatus('Evidence uploaded and metadata stripped successfully!');
      
      // Auto-send a system message indicating files have been submitted
      await publicApi.post(`/conversations/${report.trackingId}`, {
        message: `[System Update] Whistleblower has submitted ${files.length} new evidence file(s).`,
        secretPhrase: secretPhrase || undefined
      });
      await loadMessages(report.trackingId);
    } catch (err) {
      setUploadStatus('Failed to upload evidence. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const getStatusEmoji = (s) =>
    ({ Open: '🔵', 'Under Review': '🟡', 'In Investigation': '🟠', Resolved: '🟢', Dismissed: '⚫', Escalated: '🔴' }[s] || '⚪');

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
          <Link to="/report" className="text-sm font-medium text-white/70 hover:text-white transition-colors">New Report</Link>
          <Link to="/login" className="btn btn-ghost btn-sm bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full px-5">
            Sign In
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 max-w-2xl mx-auto w-full p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 shield-gradient rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl">
            🔍
          </div>
          <h1 className="text-3xl font-black text-white drop-shadow-md">Track Your Report</h1>
          <p className="text-white/60 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Enter your 16-character tracking ID to check the status of your submission.
          </p>
        </div>

        {/* Search card */}
        <form onSubmit={handleTrack}
          className="bg-slate-900/80 backdrop-blur-2xl border-t-4 border-t-primary border-x border-b border-white/10 rounded-3xl p-8 mb-8 shadow-3xl text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="relative mt-4">
              <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                Tracking ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                  🔍
                </span>
                <input
                  type="text" value={trackingId}
                  onChange={e => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="CS1A2B3C4D5E6F7G" maxLength={18}
                  className="input input-bordered font-mono text-base tracking-widest pl-10 w-full bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all rounded-xl h-12"
                  required
                />
              </div>
            </div>

            <div className="relative mt-6">
              <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                Secret Phrase (optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                  🔑
                </span>
                <input
                  type="password" value={secretPhrase}
                  onChange={e => setSecretPhrase(e.target.value)}
                  placeholder="Enter secret phrase if set during submission"
                  className="input input-bordered w-full pl-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12"
                />
              </div>
              <p className="text-[10px] text-white/40 px-1 mt-1">
                Provide this only if you configured an access phrase when submitting.
              </p>
            </div>

            {error && (
              <div className="alert alert-error bg-red-500/20 border-red-500/50 text-red-100 py-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn shield-gradient border-none btn-lg w-full rounded-xl shadow-2xl text-white font-extrabold text-sm h-12 hover:scale-[1.01] hover:shadow-primary/40 transition-all mt-4"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3 justify-center">
                  <span className="loading loading-spinner loading-sm" />
                  <span className="tracking-wider uppercase text-xs">Locating Report...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <span>🔍</span>
                  <span className="tracking-wider uppercase text-xs">TRACK REPORT STATUS</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Result */}
        {report && (
          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-slate-900/80 backdrop-blur-2xl border-t-4 border-t-primary border-x border-b border-white/10 rounded-3xl p-6 md:p-8 shadow-3xl text-white relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <h2 className="font-black text-xl text-white drop-shadow-md">{report.title}</h2>
                    <p className="text-xs text-white/40 font-mono mt-1 tracking-wider">{report.trackingId}</p>
                  </div>
                  <span className={`badge bg-slate-950/60 border-white/10 text-white font-extrabold py-3 px-4 rounded-xl flex items-center gap-1.5 shadow-sm`}>
                    {getStatusEmoji(report.status)} {report.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Organization', value: report.orgName, icon: '🏢' },
                    { label: 'Category', value: report.category, icon: '🏷️' },
                    { label: 'Priority', value: report.priority, icon: '⚠️' },
                    { label: 'Submitted', value: new Date(report.submittedAt).toLocaleDateString('en-IN'), icon: '📅' },
                    { label: 'Last Updated', value: new Date(report.updatedAt).toLocaleDateString('en-IN'), icon: '🔄' },
                  ].map(({ label, value, icon }) => value && (
                    <div key={label} className="bg-slate-950/45 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                      <div className="text-[10px] uppercase tracking-wider text-white/40 font-black flex items-center gap-1">
                        <span>{icon}</span> {label}
                      </div>
                      <div className="text-sm font-bold mt-2 text-white/90">{value}</div>
                    </div>
                  ))}
                </div>

                {report.resolutionNote && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mt-4 animate-in fade-in duration-300">
                    <p className="text-xs font-black text-teal-400 mb-1 flex items-center gap-1">
                      <span>✅</span> Resolution Note
                    </p>
                    <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">{report.resolutionNote}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-900/80 backdrop-blur-2xl border-x border-b border-t border-white/10 rounded-3xl p-6 md:p-8 shadow-3xl text-white relative overflow-hidden">
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="font-black text-sm uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                  <span>📅</span> Status Timeline
                </h3>
                <div className="relative border-l-2 border-white/10 ml-4 space-y-6">
                  {['Open', 'Under Review', 'In Investigation', 'Resolved'].map((s, i) => {
                    const statuses = ['Open', 'Under Review', 'In Investigation', 'Resolved'];
                    const currentIdx = statuses.indexOf(report.status);
                    const done = i <= currentIdx;
                    const isActive = s === report.status;
                    return (
                      <div key={s} className="relative pl-8">
                        {/* Timeline node */}
                        <div className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                          done 
                            ? 'bg-primary border-primary shadow-[0_0_8px_rgba(29,78,216,0.5)]' 
                            : 'bg-slate-950 border-white/20'
                        }`}>
                          {isActive && report.status !== 'Resolved' && <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                        </div>
                        <div>
                          <h4 className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-teal-400' : done ? 'text-white' : 'text-white/40'}`}>
                            {s}
                          </h4>
                          {isActive && (
                            <p className="text-[10px] text-white/50 mt-1">
                              Your report is currently at this stage. Keep checking here for updates.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Messaging */}
            <div className="bg-slate-900/80 backdrop-blur-2xl border-x border-b border-t border-white/10 rounded-3xl p-6 md:p-8 shadow-3xl text-white relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                    <span>💬</span> Secure Communication
                  </h3>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="btn btn-ghost btn-xs text-[10px] font-bold text-white/50 hover:text-white hover:bg-white/5 rounded-lg px-2"
                  >
                    {showChat ? 'Hide' : 'Show'} Messages
                  </button>
                </div>

                {showChat && (
                  <div className="space-y-6">
                    <div className="space-y-4 max-h-80 overflow-y-auto mb-6 pr-2">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 opacity-45">
                          <div className="text-3xl mb-2">💬</div>
                          <p className="text-xs">No secure messages yet. Send a query below.</p>
                        </div>
                      ) : (
                        messages.map((m, i) => {
                          const isStaff = m.senderType === 'Staff';
                          return (
                            <div key={i} className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}>
                              <div className="text-[9px] uppercase tracking-widest text-white/40 mb-1 px-1 flex items-center gap-1.5">
                                <span>{isStaff ? '👔 Investigator' : '🕵️ Anonymous Reporter'}</span>
                                <span>•</span>
                                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`text-xs py-2.5 px-4 rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${
                                isStaff 
                                  ? 'bg-slate-800/80 border border-white/5 text-white/90 rounded-tl-none' 
                                  : 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10'
                              }`}>
                                {m.message}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={sendMessage} className="flex flex-col gap-4">
                      <div className="relative">
                        <input
                          type="text" value={newMsg} onChange={e => { setNewMsg(e.target.value); setChatError(''); }}
                          placeholder="Type a message to the investigator..."
                          className="input input-bordered w-full h-11 pl-4 pr-20 bg-slate-950/45 border-white/10 text-xs text-white rounded-xl focus:bg-slate-950 focus:border-primary transition-all"
                          disabled={sending}
                        />
                        <button
                          type="submit"
                          className="absolute right-1.5 top-1.5 btn btn-primary btn-sm rounded-lg h-8 px-4 text-xs font-bold text-white border-none shield-gradient"
                          disabled={sending || !newMsg.trim()}
                        >
                          {sending ? <span className="loading loading-spinner loading-xs" /> : 'Send'}
                        </button>
                      </div>
                      {chatError && <p className="text-[10px] text-red-400 px-1 mt-0.5">⚠️ {chatError}</p>}

                      {/* Submit Additional Evidence */}
                      <div className="flex items-center justify-between gap-4 mt-2 bg-slate-950/30 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📎</span>
                          <div className="text-left">
                            <p className="text-[11px] font-black text-white/90 uppercase tracking-wider">Submit Additional Evidence</p>
                            <p className="text-[9px] text-white/40 mt-0.5">Metadata is automatically stripped for anonymity</p>
                          </div>
                        </div>
                        <input
                          type="file"
                          multiple
                          id="additional-evidence"
                          className="hidden"
                          onChange={handleUploadEvidence}
                          disabled={uploadingFiles}
                        />
                        <label
                          htmlFor="additional-evidence"
                          className="btn btn-xs bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 cursor-pointer text-[10px] font-bold transition-all"
                        >
                          {uploadingFiles ? 'Stripping...' : 'Choose Files'}
                        </label>
                      </div>
                      {uploadStatus && (
                        <p className={`text-[10px] py-2 px-3 rounded-xl border mt-2 ${
                          uploadStatus.toLowerCase().includes('failed')
                            ? 'bg-red-500/10 border-red-500/20 text-red-300'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-teal-400'
                        }`}>
                          {uploadStatus}
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
