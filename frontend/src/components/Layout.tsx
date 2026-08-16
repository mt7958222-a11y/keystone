import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE: Record<string, { to: string; label: string }[]> = {
  DISPATCHER: [
    { to: '/board', label: 'Work Order Board' },
    { to: '/customers', label: 'Customers & Sites' },
  ],
  MANAGER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/board', label: 'Work Order Board' },
    { to: '/customers', label: 'Customers & Sites' },
  ],
  TECHNICIAN: [{ to: '/my-jobs', label: 'My Jobs' }],
  CUSTOMER: [{ to: '/portal', label: 'My Requests' }],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const links = NAV_BY_ROLE[user.role] ?? [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark" />
          <div>
            <div className="name">KEYSTONE</div>
            <div className="sub">Meridian FM</div>
          </div>
        </div>

        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">{user.name}</div>
          <div className="sidebar-role">{user.role}</div>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
