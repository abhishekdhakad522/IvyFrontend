import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const isActive = (path) => {
    if (path === '/buy' && location.pathname === '/') return 'active';
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="logo-area">
        <Link to="/" className="logo-text">Ivy.homes</Link>
        <Link to="/buy" className={`nav-links ${isActive('/buy')}`}>Buy</Link>
        <Link to="/rent" className={`nav-links ${isActive('/rent')}`}>Rent</Link>
        <Link to="/projects" className={`nav-links ${isActive('/projects')}`}>Projects</Link>
        <Link to="/saved" className={`nav-links ${isActive('/saved')}`}>Saved</Link>
        <Link to="/insights" className={`nav-links ${isActive('/insights')}`}>Insights</Link>
      </div>
      
      <div className="user-area">
        {user && <span className="user-email">{user.name?.split(' ')[0] || user.email}</span>}
        <button className="logout-btn" onClick={logout}>→ Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
