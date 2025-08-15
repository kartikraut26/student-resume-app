import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/');
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/assets/logo.png" alt="SkillSync" className="logo-img" />
        <span>SkillSync</span>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>

        {/* Only show these if logged in */}
        {user && (
          <>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/resume">Resume</Link></li>
          </>
        )}

        {/* Show logout only if logged in */}
        {user && (
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
