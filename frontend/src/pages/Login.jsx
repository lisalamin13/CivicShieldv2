import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BG_IMAGE = '/rightousness.JPEG';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('staff');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [testOtp, setTestOtp] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rPassword, setRPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if (!phone || !password) return setError('Enter phone and password first.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { phone });
      setInfo(data.message);
      if (data.testOTP) setTestOtp(data.testOTP);
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
      {/* Light overlay — shows image, keeps card readable */}
      <div className="absolute inset-0 bg-black/42" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/25 to-teal-900/20" />

      {/* Navbar */}
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

          {/* Card — solid enough to read, translucent to show bg */}
          <div className="bg-base-200/88 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-2xl">

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
            {testOtp && (
              <div className="alert alert-warning mb-4 text-sm py-2">
                🧪 <strong>Test Mode OTP: {testOtp}</strong>
              </div>
            )}

            {/* Staff — step 1 */}
            {tab === 'staff' && !otpStep && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Phone Number (with country code)</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+919100000001" className="input input-bordered w-full" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Password</span></label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Your password" className="input input-bordered w-full" required />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Send OTP →'}
                </button>
                <p className="text-xs text-center text-base-content/40">
                  A one-time password will be sent to your registered phone for 2FA.
                </p>
              </form>
            )}

            {/* Staff — step 2 */}
            {tab === 'staff' && otpStep && (
              <form onSubmit={handleVerifyLogin} className="space-y-4">
                <p className="text-sm text-center text-base-content/60">OTP sent to <strong>{phone}</strong></p>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Enter 6-Digit OTP</span></label>
                  <input type="text" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456" maxLength={6}
                    className="input input-bordered w-full text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus required />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : '✅ Verify & Sign In'}
                </button>
                <button type="button" onClick={() => { setOtpStep(false); setOtp(''); setTestOtp(''); setInfo(''); }}
                  className="btn btn-ghost w-full btn-sm">← Change phone / password</button>
              </form>
            )}

            {/* Reporter */}
            {tab === 'reporter' && (
              <form onSubmit={handleReporterLogin} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Phone Number</span></label>
                  <input type="tel" value={rPhone} onChange={e => setRPhone(e.target.value)}
                    placeholder="+919200000001" className="input input-bordered w-full" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Password</span></label>
                  <input type="password" value={rPassword} onChange={e => setRPassword(e.target.value)}
                    placeholder="Your password" className="input input-bordered w-full" required />
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

          {/* Demo credentials */}
          <div className="mt-4 bg-base-200/75 backdrop-blur border border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-base-content/50 mb-2">🧪 Demo Credentials</p>
            <div className="space-y-1 text-xs text-base-content/40 font-mono">
              <div>SuperAdmin: <span className="text-base-content/70">+919100000001 / Super@1234 / OTP: 123456</span></div>
              <div>OrgAdmin:   <span className="text-base-content/70">+919100000002 / Admin@1234 / OTP: 123456</span></div>
              <div>Reporter:   <span className="text-base-content/70">+919200000001 / Report@1234</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}