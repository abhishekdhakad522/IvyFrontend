import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Lock } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('demo1@ivy.homes');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Failed to login. Please check credentials.');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <Navbar />

      <div className="login-content-wrapper">
        <div className="login-card">
          
          {/* Left Side */}
          <div className="login-left">
            <div className="icon-wrapper">
              <KeyRound size={28} color="#ffffff" strokeWidth={1.5} />
            </div>
            
            <p className="reference-text">REFERENCE ACCESS</p>
            
            <h1 className="login-heading">
              Keep your shortlist<br/>close.
            </h1>
            
            <p className="login-description">
              This UI uses a local demo session. It survives page refreshes and remains available until you sign out.
            </p>
          </div>

          {/* Right Side */}
          <div className="login-right">
            <h2 className="welcome-text">Welcome back</h2>
            <p className="subtitle-text">The demo credentials are filled in for you.</p>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message">{error}</div>}
              
              <Input
                label="Email"
                id="email"
                type="email"
                placeholder="demo1@ivy.homes"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                id="password"
                type="password"
                placeholder='[PASSWORD]'  
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button 
                type="submit" 
                className="login-btn"
                isLoading={loading}
              >
                Login
              </Button>
            </form>
          </div>

        </div>
      </div>
      
      {/* Footer Area */}
      <footer className="login-footer">
        <span>Ivy.homes - Hyderabad sample inventory</span>
        <span>Prices in INR • Areas in sqft</span>
      </footer>
    </div>
  );
};

export default Login;
