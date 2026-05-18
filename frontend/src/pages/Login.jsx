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

  const handleVerifyLogin = async (e) => {
    e.preventDefault(); setError('');
    if (!otp) return setError('Enter the OTP.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp, password });
      login(data.token, data.user);
      redirectByRole(data.user.role);
    } catch (err) { setError(err.response?.data?.error || 'Login failed.'); }
    finally { setLoading(false); }
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

  const handleReporterLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/reporter-login', { phone: rPhone, password: rPassword });
      login(data.token, data.user);
      navigate('/reporter');
    } catch (err) { setError(err.response?.data?.error || 'Login failed.'); }
    finally { setLoading(false); }
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

          <div className="bg-base-200/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="tabs tabs-boxed bg-base-300/70 mb-6 w-full">
              <button className={`tab flex-1 ${tab === 'staff' ? 'tab-active' : 'text-base-content/60'}`}
                onClick={() => { setTab('staff'); setError(''); setOtpStep(false); }}>
                👔 Admin / Staff
              </button>
              <button className={`tab flex-1 ${tab === 'reporter' ? 'tab-active' : 'text-base-content/60'}`}
                onClick={() => { setTab('reporter'); setError(''); }}>
                📝 Reporter
              </button>
            </div>

            {error && <div className="alert alert-error mb-4 text-sm py-2">{error}</div>}
            {info  && <div className="alert alert-info mb-4 text-sm py-2">{info}</div>}

            {tab === 'staff' && !otpStep && !forgotMode && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Phone Number</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+1234567890" className="input input-bordered w-full" required />
                </div>
                <div className="form-control">
                  <div className="flex justify-between items-center py-1">
                    <label className="label-text text-xs">Password</label>
                    <button type="button" onClick={() => { setForgotMode(true); setError(''); setInfo(''); }}
                      className="text-xs text-primary hover:underline">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password" 
                      className="input input-bordered w-full pr-10" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-base-content/40 hover:text-primary transition-colors"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Send OTP →'}
                </button>
                <p className="text-xs text-center text-base-content/40">
                  A one-time password will be sent to your registered phone for 2FA.
                </p>
              </form>
            )}

            {tab === 'staff' && !otpStep && forgotMode && (
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Phone Number</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+1234567890" className="input input-bordered w-full" required />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Send Reset OTP →'}
                </button>
                <button type="button" onClick={() => { setForgotMode(false); setError(''); setInfo(''); }}
                  className="btn btn-ghost w-full btn-sm">← Back to Sign In</button>
              </form>
            )}

            {tab === 'staff' && otpStep && forgotMode && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-center text-base-content/60">Reset OTP sent to <strong>{phone}</strong></p>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Enter 6-Digit OTP</span></label>
                  <input type="text" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="input input-bordered w-full text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Enter New Password</span></label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Your new password" 
                      className="input input-bordered w-full pr-10" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-base-content/40 hover:text-primary transition-colors"
                    >
                      {showNewPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : '💾 Reset & Save Password'}
                </button>
                <button type="button" onClick={() => { setOtpStep(false); setForgotMode(false); setOtp(''); setInfo(''); }}
                  className="btn btn-ghost w-full btn-sm">← Cancel Reset</button>
              </form>
            )}

            {tab === 'staff' && otpStep && !forgotMode && (
              <form onSubmit={handleVerifyLogin} className="space-y-4">
                <p className="text-sm text-center text-base-content/60">OTP sent to <strong>{phone}</strong></p>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Enter 6-Digit OTP</span></label>
                  <input type="text" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="input input-bordered w-full text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus required />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : '✅ Verify & Sign In'}
                </button>
                <button type="button" onClick={() => { setOtpStep(false); setOtp(''); setInfo(''); }}
                  className="btn btn-ghost w-full btn-sm">← Change phone / password</button>
              </form>
            )}

            {tab === 'reporter' && (
              <form onSubmit={handleReporterLogin} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Phone Number</span></label>
                  <input type="tel" value={rPhone} onChange={e => setRPhone(e.target.value)}
                    placeholder="+1234567890" className="input input-bordered w-full" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Password</span></label>
                  <div className="relative">
                    <input 
                      type={showRPassword ? "text" : "password"} 
                      value={rPassword} 
                      onChange={e => setRPassword(e.target.value)}
                      placeholder="Your password" 
                      className="input input-bordered w-full pr-10" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowRPassword(!showRPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-base-content/40 hover:text-primary transition-colors"
                    >
                      {showRPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Sign In'}
                </button>
                <div className="divider text-xs">Don't have an account?</div>
                <Link to="/register" className="btn btn-outline w-full btn-sm">📝 Create Reporter Account</Link>
                <div className="divider text-xs">or</div>
                <Link to="/report" className="btn btn-ghost w-full btn-sm">🕵️ Report Anonymously (No Account)</Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
