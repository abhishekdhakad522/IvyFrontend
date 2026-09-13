import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo-area">
        <span className="logo-text">Ivy.homes</span>
        <span className="nav-links">Buy</span>
        <span className="nav-links">Rent</span>
        <span className="nav-links">Projects</span>
        <span className="nav-links">Saved</span>
        <span className="nav-links">Insights</span>
      </div>
    </nav>
  );
};

export default Navbar;
