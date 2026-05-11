import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SUPER_NAV = [
  { to: '/superadmin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/superadmin/organizations', label: 'Organizations', icon: '🏢' },
  { to: '/superadmin/analytics', label: 'Global Analytics', icon: '📈' },
];
const ORG_NAV = [
  { to: '/orgadmin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/orgadmin/reports', label: 'Reports', icon: '📋' },
  { to: '/orgadmin/policies', label: 'Policies', icon: '📜' },
  { to: '/orgadmin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/orgadmin/staff', label: 'Staff', icon: '👥' },
];
const REPORTER_NAV = [
  { to: '/reporter', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/reporter/my-reports', label: 'My Reports', icon: '📋' },
  { to: '/report', label: 'File New Report', icon: '✍️' },
  { to: '/track', label: 'Track Report', icon: '🔍' },
];

const ROLE_BADGE = {
  SuperAdmin: 'badge-error',
  OrgAdmin: 'badge-primary',
  Investigator: 'badge-secondary',
  Reporter: 'badge-ghost',
};

export default function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  let navItems =
    user?.role === 'SuperAdmin' ? [...SUPER_NAV] :
    (user?.role === 'OrgAdmin' || user?.role === 'Investigator') ? [...ORG_NAV] :
    [...REPORTER_NAV];

  // Role-based filtering: Investigators cannot manage staff
  if (user?.role === 'Investigator') {
    navItems = navItems.filter(item => item.label !== 'Staff');
  }

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex flex-col h-full bg-base-200 border-r border-base-300 w-64">

      {/* Logo */}
      <div className="p-5 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shield-gradient rounded-xl flex items-center justify-center text-xl">
            🛡️
          </div>
          <div>
            <div className="font-bold text-base-content text-sm">CivicShield</div>
            <div className="text-xs text-base-content/50">Secure Reporting</div>
          </div>
          {mobile && (
            <button onClick={onClose} className="ml-auto btn btn-ghost btn-xs">✕</button>
          )}
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-9 overflow-hidden">
              {user?.profileImage ? (
                <img 
                  src={`http://localhost:5001${user.profileImage}`} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm">{user?.name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{user?.name || 'Anonymous'}</div>
            <span className={`badge badge-xs mt-0.5 ${ROLE_BADGE[user?.role] || 'badge-ghost'}`}>
              {user?.role || 'Reporter'}
            </span>
          </div>
        </div>
        {user?.orgName && (
          <div className="text-xs text-base-content/40 mt-2 truncate">🏢 {user.orgName}</div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={mobile ? onClose : undefined}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-base-300 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link text-xs${isActive ? ' active' : ''}`}
          onClick={mobile ? onClose : undefined}
        >
          <span>🏠</span>
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link text-xs${isActive ? ' active' : ''}`}
          onClick={mobile ? onClose : undefined}
        >
          <span>👤</span>
          <span>My Profile</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="nav-link w-full text-left text-error hover:bg-error/10"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}