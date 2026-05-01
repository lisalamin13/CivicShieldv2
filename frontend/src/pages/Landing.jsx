import { Link } from 'react-router-dom';

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
          <Link to="/track" className="btn btn-ghost btn-sm text-white/80 hidden sm:flex">Track Report</Link>
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
      <section
        className="relative py-12 overflow-hidden"
        style={{
          backgroundImage: `url('${BG.stats}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/15" />
        <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
          {[
            ['AES-256', 'Encryption Standard'],
            ['100%', 'Identity Protected'],
            ['0', 'IP Logs Stored'],
            ['AI-Powered', 'Analytics Engine'],
          ].map(([v, l]) => (
            <div key={l} className="group">
              <div className="text-3xl font-extrabold text-white group-hover:text-primary transition-colors drop-shadow">{v}</div>
              <div className="text-xs text-white/60 mt-1">{l}</div>
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

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-base-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 shield-gradient opacity-5 rounded-2xl" />
            <div className="relative z-10">
              <div className="text-6xl mb-5"></div>
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