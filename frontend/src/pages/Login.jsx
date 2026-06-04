import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BG_IMAGE = '/rightousness.JPEG';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState('staff');

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [rPhone, setRPhone] = useState('+91');
  const [rPassword, setRPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRPassword, setShowRPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showForceOption, setShowForceOption] = useState(false);
  const [showRForceOption, setShowRForceOption] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if (!phone || !password) return setError('Enter phone and password first.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { phone });
      setInfo(data.message);
      if (data.testOTP) setOtp(data.testOTP);
      setOtpStep(true);
    } catch (err) { setError(err.response?.data?.error || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const handleVerifyLogin = async (e, isForce = false) => {
    if (e) e.preventDefault();
    setError('');
    if (!otp) return setError('Enter the OTP.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp, password, force: isForce });
      login(data.token, data.user);
      redirectByRole(data.user.role);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
      if (err.response?.data?.showForceOption) {
        setShowForceOption(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if (!phone) return setError('Enter your registered phone number first.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { phone });
      setInfo(data.message);
      if (data.testOTP) setOtp(data.testOTP);
      setOtpStep(true);
    } catch (err) { setError(err.response?.data?.error || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if (!otp) return setError('Enter the OTP.');
    if (!newPassword) return setError('Enter your new password.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password-otp', { phone, otp, newPassword });
      setInfo(data.message);
      setForgotMode(false);
      setOtpStep(false);
      setOtp('');
      setPassword('');
      setNewPassword('');
    } catch (err) { setError(err.response?.data?.error || 'Failed to reset password.'); }
    finally { setLoading(false); }
  };

  const handleReporterLogin = async (e, isForce = false) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reporter-login', { phone: rPhone, password: rPassword, force: isForce });
      login(data.token, data.user);
      navigate('/reporter');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
      if (err.response?.data?.showForceOption) {
        setShowRForceOption(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'SuperAdmin') navigate('/superadmin');
    else if (role === 'OrgAdmin' || role === 'Investigator') navigate('/orgadmin');
    else navigate('/reporter');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-teal-900/20" />

      <nav className="relative z-10 navbar px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-white">CivicShield</span>
        </Link>
        <div className="ml-auto">
          <Link to="/report" className="btn btn-ghost btn-sm text-white/80">📝 Report Anonymously</Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 shield-gradient rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl">
              🔐
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow">Secure Sign In</h1>
            <p className="text-white/60 text-sm mt-2">Access your CivicShield dashboard</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-2xl border-t-4 border-t-primary border-x border-b border-white/10 rounded-3xl p-6 md:p-8 shadow-3xl text-white relative overflow-hidden">
            {/* Ambient Background Glow inside card */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <style>{`
              @keyframes scaleIn {
                from { transform: translateY(50%) scale(0); opacity: 0; }
                to { transform: translateY(50%) scale(1); opacity: 1; }
              }
              .animate-scale-in {
                animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              }
            `}</style>

            <h2 className="text-center text-[10px] font-black text-white/50 mb-5 tracking-widest uppercase">
              Choose Account Type
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Card 1: Admin / Staff */}
              <button
                type="button"
                onClick={() => { setTab('staff'); setError(''); setOtpStep(false); }}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ${
                  tab === 'staff' 
                    ? 'border-primary bg-primary/20 shadow-2xl scale-[1.04] ring-2 ring-primary/35' 
                    : 'border-white/5 hover:border-white/20 bg-slate-950/30 hover:bg-slate-950/50 hover:scale-[1.01]'
                }`}
              >
                {/* SVG Illustration for Admin/Staff */}
                <div className="w-20 h-20 mb-3 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="45" fill="rgb(29 78 216 / 0.25)" />
                    {/* User Collar & Suit */}
                    <path d="M 25,85 C 25,65 35,58 50,58 C 65,58 75,65 75,85 Z" fill="#1d4ed8" />
                    {/* Face / Head */}
                    <circle cx="50" cy="38" r="16" fill="#fbcfe8" />
                    {/* Suit Collar details */}
                    <path d="M 40,60 L 50,72 L 60,60" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                    {/* Tie */}
                    <path d="M 49,72 L 51,72 L 53,85 L 47,85 Z" fill="#ffffff" />
                    {/* Admin glasses */}
                    <path d="M 42,36 L 47,36 M 53,36 L 58,36" stroke="#1e293b" strokeWidth="2" fill="none" />
                    <circle cx="44" cy="36" r="3" stroke="#1e293b" strokeWidth="1.5" fill="none" />
                    <circle cx="56" cy="36" r="3" stroke="#1e293b" strokeWidth="1.5" fill="none" />
                    {/* Hair */}
                    <path d="M 33,36 C 33,22 41,18 50,18 C 59,18 67,22 67,36 C 65,26 35,26 33,36" fill="#1e293b" />
                  </svg>
                </div>
                <span className="text-[11px] font-black tracking-widest uppercase">
                  Admin / Staff
                </span>
                
                {/* Active Checkmark Badge */}
                {tab === 'staff' && (
                  <div className="absolute bottom-0 right-3 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-scale-in">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Card 2: Reporter */}
              <button
                type="button"
                onClick={() => { setTab('reporter'); setError(''); }}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ${
                  tab === 'reporter' 
                    ? 'border-teal-500 bg-teal-500/20 shadow-2xl scale-[1.04] ring-2 ring-teal-500/35' 
                    : 'border-white/5 hover:border-white/20 bg-slate-950/30 hover:bg-slate-950/50 hover:scale-[1.01]'
                }`}
              >
                {/* SVG Illustration for Reporter */}
                <div className="w-20 h-20 mb-3 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="45" fill="rgb(13 148 136 / 0.25)" />
                    {/* User Shoulders */}
                    <path d="M 25,85 C 25,65 35,58 50,58 C 65,58 75,65 75,85 Z" fill="#0d9488" />
                    {/* Head */}
                    <circle cx="50" cy="38" r="16" fill="#fed7aa" />
                    {/* Hair */}
                    <path d="M 33,34 C 33,22 41,18 50,18 C 59,18 67,22 67,34 C 65,24 35,24 33,34" fill="#b45309" />
                    {/* Pen & Document overlay */}
                    <rect x="58" y="55" width="16" height="22" rx="2" fill="#ffffff" stroke="#0d9488" strokeWidth="1.5" />
                    <line x1="62" y1="60" x2="70" y2="60" stroke="#0d9488" strokeWidth="1.5" />
                    <line x1="62" y1="66" x2="70" y2="66" stroke="#0d9488" strokeWidth="1.5" />
                    <path d="M 72,52 L 78,58 L 68,68 L 62,62 Z" fill="#f59e0b" />
                  </svg>
                </div>
                <span className="text-[11px] font-black tracking-widest uppercase">
                  Reporter
                </span>
                
                {/* Active Checkmark Badge */}
                {tab === 'reporter' && (
                  <div className="absolute bottom-0 right-3 bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-scale-in">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>

            <div className="text-center mb-8 py-2 border-b border-white/10">
              <p className="text-sm font-extrabold text-white/90">
                {tab === 'staff' ? '👋 Hello Admin / Staff!' : '👋 Hello Reporter!'}
              </p>
              <p className="text-xs text-white/50 mt-1">
                Please fill out the form below to get started
              </p>
            </div>

            {error && (
              <div className="alert alert-error mb-4 text-xs py-2 bg-red-500/20 border-red-500/50 text-red-200 flex flex-col items-start gap-2">
                <span>{error}</span>
                {tab === 'staff' && showForceOption && (
                  <button
                    type="button"
                    onClick={() => handleVerifyLogin(null, true)}
                    className="btn btn-xs btn-warning mt-1 hover:scale-[1.02] transition-all"
                  >
                    ⚠️ Force Logout & Sign In
                  </button>
                )}
                {tab === 'reporter' && showRForceOption && (
                  <button
                    type="button"
                    onClick={() => handleReporterLogin(null, true)}
                    className="btn btn-xs btn-warning mt-1 hover:scale-[1.02] transition-all"
                  >
                    ⚠️ Force Logout & Sign In
                  </button>
                )}
              </div>
            )}
            {info  && <div className="alert alert-info mb-4 text-xs py-2 bg-blue-500/20 border-blue-500/50 text-blue-200">{info}</div>}

            {tab === 'staff' && !otpStep && !forgotMode && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      📞
                    </span>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1234567890" 
                      className="input input-bordered w-full pl-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12" 
                      required 
                    />
                  </div>
                </div>

                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      🔒
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="input input-bordered w-full pl-10 pr-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-white/40 hover:text-primary transition-colors"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button 
                      type="button" 
                      onClick={() => { setForgotMode(true); setError(''); setInfo(''); }}
                      className="text-[11px] text-primary hover:underline font-bold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn shield-gradient border-none text-white w-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] transition-all h-12 rounded-xl" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Send OTP →'}
                </button>
                <p className="text-[11px] text-center text-white/40 leading-relaxed">
                  A one-time password will be sent to your registered phone for 2FA verification.
                </p>
              </form>
            )}

            {tab === 'staff' && !otpStep && forgotMode && (
              <form onSubmit={handleSendForgotOtp} className="space-y-6">
                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      📞
                    </span>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1234567890" 
                      className="input input-bordered w-full pl-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12" 
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn shield-gradient border-none text-white w-full shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all h-12 rounded-xl" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Send Reset OTP →'}
                </button>
                <button type="button" onClick={() => { setForgotMode(false); setError(''); setInfo(''); }}
                  className="btn btn-ghost w-full btn-sm text-xs mt-2 text-white/60 hover:text-white">← Back to Sign In</button>
              </form>
            )}

            {tab === 'staff' && otpStep && forgotMode && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <p className="text-xs text-center text-white/60">Reset OTP sent to <strong>{phone}</strong></p>
                
                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Enter 6-Digit OTP
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      🔑
                    </span>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" 
                      maxLength={6}
                      className="input input-bordered w-full pl-10 text-center text-2xl tracking-[0.5em] font-mono bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all rounded-xl h-12"
                      autoFocus 
                      required 
                    />
                  </div>
                </div>

                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Enter New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      🔒
                    </span>
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="input input-bordered w-full pl-10 pr-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-white/40 hover:text-primary transition-colors"
                    >
                      {showNewPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn shield-gradient border-none text-white w-full shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all h-12 rounded-xl" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : '💾 Reset & Save Password'}
                </button>
                <button type="button" onClick={() => { setOtpStep(false); setForgotMode(false); setOtp(''); setInfo(''); }}
                  className="btn btn-ghost w-full btn-sm text-xs mt-2 text-white/60 hover:text-white">← Cancel Reset</button>
              </form>
            )}

            {tab === 'staff' && otpStep && !forgotMode && (
              <form onSubmit={handleVerifyLogin} className="space-y-6">
                <p className="text-xs text-center text-white/60">OTP sent to <strong>{phone}</strong></p>
                
                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Enter 6-Digit OTP
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      🔑
                    </span>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" 
                      maxLength={6}
                      className="input input-bordered w-full pl-10 text-center text-2xl tracking-[0.5em] font-mono bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all rounded-xl h-12"
                      autoFocus 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn shield-gradient border-none text-white w-full shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all h-12 rounded-xl" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : '✅ Verify & Sign In'}
                </button>
                <button type="button" onClick={() => { setOtpStep(false); setOtp(''); setInfo(''); }}
                  className="btn btn-ghost w-full btn-sm text-xs mt-2 text-white/60 hover:text-white">← Change phone / password</button>
              </form>
            )}

            {tab === 'reporter' && (
              <form onSubmit={handleReporterLogin} className="space-y-6">
                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      📞
                    </span>
                    <input 
                      type="tel" 
                      value={rPhone} 
                      onChange={e => setRPhone(e.target.value)}
                      placeholder="+1234567890" 
                      className="input input-bordered w-full pl-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12" 
                      required 
                    />
                  </div>
                </div>

                <div className="relative mt-4">
                  <label className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider rounded-md shadow-md z-10">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm">
                      🔒
                    </span>
                    <input 
                      type={showRPassword ? "text" : "password"} 
                      value={rPassword} 
                      onChange={e => setRPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="input input-bordered w-full pl-10 pr-10 bg-slate-950/40 border-white/10 text-white focus:bg-slate-950/80 focus:border-primary transition-all text-sm rounded-xl h-12" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowRPassword(!showRPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-white/40 hover:text-primary transition-colors"
                    >
                      {showRPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn shield-gradient border-none text-white w-full shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all h-12 rounded-xl" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Sign In'}
                </button>
                
                <div className="flex items-center gap-3 my-5">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Don't have an account?</span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>

                <Link to="/register" className="btn btn-outline border-white/10 hover:border-primary hover:bg-primary/20 text-white w-full btn-sm text-xs rounded-xl h-10 transition-all">
                  📝 Create Reporter Account
                </Link>

                <div className="flex items-center gap-3 my-5">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">or</span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>

                <Link to="/report" className="btn btn-ghost text-primary hover:underline hover:bg-primary/10 w-full btn-sm text-xs rounded-xl h-10 transition-all">
                  🕵️ Report Anonymously (No Account)
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
