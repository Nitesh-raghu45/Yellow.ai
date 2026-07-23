import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">🤖</div>
          AgentForge
        </Link>

        <div className="navbar-actions">
          <div className="navbar-user">
            <div className="navbar-user-avatar">{getInitials(user?.name || 'U')}</div>
            <span>{user?.name}</span>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout} title="Logout">
            ⏻
          </button>
        </div>
      </div>
    </nav>
  );
}
