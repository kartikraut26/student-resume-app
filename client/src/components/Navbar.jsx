import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/');
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        {/* User section with dropdown */}
        {user && (
          <li className="user-dropdown" ref={dropdownRef}>
            <div 
              className="user-trigger" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img
                src={user?.photoURL 
                  ? user.photoURL 
                  : "https://www.w3schools.com/howto/img_avatar.png"}
                onError={(e) => { e.target.src = "https://www.w3schools.com/howto/img_avatar.png"; }}
                alt={user?.displayName || "User"}
                className="navbar-user-avatar"
              />

              <span className="navbar-user-name">{user.displayName || "User"}</span>
              <span className="dropdown-arrow">{dropdownOpen ? "▲" : "▼"}</span>
            </div>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <p className="dropdown-username">{user.displayName}</p>
                <button onClick={handleLogout} className="dropdown-logout">
                  Logout
                </button>
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
