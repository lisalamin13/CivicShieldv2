import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const features = [
  { icon: '🔒', title: 'Absolute Anonymity', desc: 'AES-256 encryption + metadata stripping. Zero IP logging. Your identity is mathematically protected.' },
  { icon: '🤖', title: 'AI Ethics Advisor', desc: 'Consult our AI chatbot to understand policies and structure your report before submitting.' },
  { icon: '📊', title: 'Smart Analytics', desc: 'AI-powered report analysis, urgency scoring, and pattern detection for administrators.' },
  { icon: '🏢', title: 'Multi-Tenant SaaS', desc: 'One platform serving universities, corporates, and government bodies with isolated data.' },
  { icon: '📡', title: 'Secure Communication', desc: 'Two-way encrypted messaging between reporters and investigators — no identity revealed.' },
  { icon: '⚡', title: 'Real-Time Tracking', desc: 'Track your report status with a unique 16-character ID. No account needed.' },
];

const steps = [
  { num: '01', title: 'Consult AI Advisor', desc: 'Chat with our AI Ethics Advisor to understand if your concern is a reportable violation.' },
  { num: '02', title: 'Submit Anonymously', desc: 'File your report. Your metadata is stripped and content is encrypted before storage.' },
  { num: '03', title: 'Get Tracking ID', desc: 'Receive a unique 16-character ID. Use it to monitor progress and communicate safely.' },
  { num: '04', title: 'Resolution', desc: 'Admins investigate, update status, and communicate findings — all without knowing who you are.' },
];

const BG = {
  hero: '/rightousness.jpeg',
  stats: '/rightousness.jpeg',
  howItWorks: '/rightousness.jpeg',
};

export default function Landing() {
  // Onboarding Inquiry states
  const [inquiryForm, setInquiryForm] = useState({ orgName: '', contactPerson: '', email: '', message: '' });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState('');

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSubmittingInquiry(true);
    try {
      await api.post('/inquiries', inquiryForm);
      setInquirySuccess('Your onboarding request has been sent to our Super Admin.');
      setInquiryForm({ orgName: '', contactPerson: '', email: '', message: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send inquiry.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">

      {/* ── NAVBAR ── */}
      <nav className="navbar bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="navbar-start">
          <div className="flex items-center gap-2 ml-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-lg hidden sm:block text-white">CivicShield</span>
          </div>
        </div>
        <div className="navbar-end gap-2 mr-2">
          <Link to="/track" className="btn btn-info btn-sm text-white hidden sm:flex">Track Report</Link>
          <Link to="/login" state={{ tab: 'reporter' }} className="btn btn-accent btn-sm text-white hidden sm:flex">Reporter Login</Link>
          <Link to="/report" className="btn btn-secondary btn-sm">File Report</Link>
          <Link to="/login" className="btn btn-primary btn-sm">Admin Login</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('${BG.hero}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Light overlay — image visible but text stays readable */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-teal-900/15" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-24">
          <div className="inline-flex items-center bg-white/15 backdrop-blur border border-white/25 rounded-md px-6 py-3 mb-8">
            <span className="text-base text-white/90 font-medium">AI-Powered Whistleblower Protection Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 uppercase drop-shadow-lg text-white">
            SPEAK UP. STAY SAFE.
          </h1>

          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
            CivicShield provides a mathematically anonymous, AI-guided grievance reporting platform
            for organizations. Your identity is protected by design — not just by policy.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <Link to="/report" className="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/30">
              File Anonymous Report
            </Link>
            <Link to="/track" className="btn btn-outline btn-lg gap-2 border-white/40 text-white hover:bg-white/15">
              🔍 Track My Report
            </Link>
          </div>

          <p className="text-xs text-white/40">
            No account required · No personal data collected · End-to-end encrypted
          </p>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 animate-bounce">
            <span className="text-xs">Scroll</span>
            <div className="w-0.5 h-6 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative py-16 border-y border-black/5 bg-white/70 backdrop-blur-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          {[
            { v: 'AES-256', l: 'Encryption Standard' },
            { v: '100%', l: 'Identity Protected' },
            { v: '0', l: 'IP Logs Stored' },
            { v: 'AI-Powered', l: 'Analytics Engine' },
          ].map((s) => (
            <div key={s.l} className="group p-6 text-center">
              <div className="text-3xl font-black text-black transition-all group-hover:text-primary">
                {s.v}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-black/60 mt-2 font-bold group-hover:text-black">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4 bg-base-100 relative overflow-hidden">
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge badge-primary badge-outline mb-4 px-4 py-3">Platform Features</div>
            <h2 className="text-4xl font-bold mb-4">Built for Trust. Designed for Safety.</h2>
            <p className="text-base-content/50 max-w-xl mx-auto">
              Every feature is engineered around one principle — the whistleblower must always be safe.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title}
                className="glass-card p-6 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="font-semibold text-base-content mb-2">{f.title}</h3>
                <p className="text-sm text-base-content/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className="relative py-24 px-4 overflow-hidden"
        style={{
          backgroundImage: `url('${BG.howItWorks}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Lighter overlay so the background shows through nicely */}
        <div className="absolute inset-0 bg-black/48" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black/30" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge badge-outline border-white/30 text-white/70 mb-4 px-4 py-3">Process</div>
            <h2 className="text-4xl font-bold text-white drop-shadow mb-4">How It Works</h2>
            <p className="text-white/60">From concern to resolution — safely and anonymously.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(s => (
              <div key={s.num} className="text-center group">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg group-hover:scale-110 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0f766e)' }}
                >
                  {s.num}
                </div>
                <h3 className="font-semibold text-white text-sm mb-2 drop-shadow">{s.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER WITH US ── */}
      <section id="partner" className="py-24 px-4 bg-base-200/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="badge badge-primary mb-4">For Organizations</div>
              <h2 className="text-4xl font-bold mb-6">Bring CivicShield to your Workplace</h2>
              <p className="text-base-content/60 mb-8 leading-relaxed">
                Join the network of transparent organizations. Our platform integrates seamlessly into your existing ERP or as a standalone secure portal.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Custom Policies', desc: 'Implement your unique code of conduct.' },
                  { title: 'AI Ethics Advisor', desc: 'Give your employees a 24/7 legal guide.' },
                  { title: 'Full Audit Trail', desc: 'Maintain compliance with a secure log.' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px]">✓</div>
                    <div>
                      <div className="text-sm font-bold">{item.title}</div>
                      <div className="text-xs text-base-content/50">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-8 bg-base-100/50">
              {inquirySuccess ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📩</div>
                  <h3 className="text-xl font-bold mb-2">Request Sent!</h3>
                  <p className="text-sm text-base-content/50 mb-6">{inquirySuccess}</p>
                  <button onClick={() => setInquirySuccess('')} className="btn btn-sm btn-outline">Send another request</button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label py-1 font-bold text-[10px] uppercase text-base-content/40">Organization</label>
                      <input type="text" placeholder="Company Name" className="input input-bordered input-sm" required
                        value={inquiryForm.orgName} onChange={e => setInquiryForm({...inquiryForm, orgName: e.target.value})} />
                    </div>
                    <div className="form-control">
                      <label className="label py-1 font-bold text-[10px] uppercase text-base-content/40">Contact Person</label>
                      <input type="text" placeholder="Your Name" className="input input-bordered input-sm" required
                        value={inquiryForm.contactPerson} onChange={e => setInquiryForm({...inquiryForm, contactPerson: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label py-1 font-bold text-[10px] uppercase text-base-content/40">Work Email</label>
                    <input type="email" placeholder="email@company.com" className="input input-bordered input-sm" required
                      value={inquiryForm.email} onChange={e => setInquiryForm({...inquiryForm, email: e.target.value})} />
                  </div>
                  <div className="form-control">
                    <label className="label py-1 font-bold text-[10px] uppercase text-base-content/40">Message</label>
                    <textarea placeholder="Tell us about your organization..." className="textarea textarea-bordered textarea-sm h-24" required
                      value={inquiryForm.message} onChange={e => setInquiryForm({...inquiryForm, message: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm w-full" disabled={submittingInquiry}>
                    {submittingInquiry ? <span className="loading loading-spinner loading-xs" /> : 'Get Started'}
                  </button>
                  <div className="text-center mt-4">
                    <span className="text-[10px] text-base-content/30">Or contact directly at </span>
                    <a href="mailto:superadmin@civicshield.org" className="text-[10px] text-primary hover:underline">superadmin@civicshield.org</a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-base-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 shield-gradient opacity-5 rounded-2xl" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Ready to Report Safely?</h2>
              <p className="text-base-content/50 text-sm mb-8 max-w-md mx-auto">
                Your safety is our architecture. Not an afterthought.
                Every byte encrypted. Every identity protected.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/report" className="btn btn-primary btn-lg shadow-lg shadow-primary/20">
                  Submit Anonymous Report
                </Link>
                <Link to="/login" className="btn btn-ghost btn-lg">Admin Access →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-base-200 border-t border-base-300 py-10 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-base">CivicShield</span>
        </div>
        <p className="text-xs text-base-content/30">AI-Powered Secure Anonymous Reporting & Compliance Platform</p>
        <p className="text-xs text-base-content/20 mt-1">
          Built with Maximum Security for absolute whistleblower protection
        </p>
      </footer>
    </div>
  );
}