import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reporter-register', {
        name: form.name, phone: form.phone, email: form.email, password: form.password,
      });
      login(data.token, data.user);
      navigate('/reporter');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <nav className="navbar bg-base-200/80 border-b border-base-300 px-4">
        <Link to="/" className="flex items-center gap-2"><span className="text-2xl">🛡️</span><span className="font-bold">CivicShield</span></Link>
      </nav>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📝</div>
            <h1 className="text-2xl font-bold">Create Reporter Account</h1>
            <p className="text-base-content/50 text-sm mt-1">Or <Link to="/report" className="link link-primary">report anonymously without an account</Link></p>
          </div>
          <div className="glass-card p-6">
            {error && <div className="alert alert-error mb-4 text-sm py-2">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields */}
              {[
                { name: 'name', label: 'Full Name (optional)', type: 'text', placeholder: 'Your name' },
                { name: 'phone', label: 'Phone Number *', type: 'tel', placeholder: '+91XXXXXXXXXX' },
                { name: 'email', label: 'Email (optional)', type: 'email', placeholder: 'you@example.com' },
                { name: 'password', label: 'Password *', type: 'password', placeholder: 'Min 6 characters' },
                { name: 'confirm', label: 'Confirm Password *', type: 'password', placeholder: 'Repeat password' },
              ].map(f => (
                <div key={f.name} className="form-control">
                  <label className="label"><span className="label-text text-xs">{f.label}</span></label>
                  <div className="relative">
                    <input 
                      type={f.type === 'password' ? (showPassword ? 'text' : 'password') : f.type} 
                      name={f.name} 
                      value={form[f.name]} 
                      onChange={handleChange}
                      placeholder={f.placeholder} 
                      className={`input input-bordered w-full ${f.type === 'password' ? 'pr-10' : ''}`}
                      required={f.label.includes('*')} 
                    />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-base-content/40 hover:text-primary transition-colors"
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm" /> : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-xs mt-4 text-base-content/40">
              Already have an account? <Link to="/login" className="link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
