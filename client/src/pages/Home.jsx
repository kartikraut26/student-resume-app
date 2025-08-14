import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, provider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="home-wrapper">
      <div className="home-card">
        <div className="home-left">
          <h1>Welcome to SkillSync</h1>
          <p>Track your academic performance and let AI build your professional resume!</p>
          <button className="google-login-btn" onClick={handleLogin}>
            Login with Google
          </button>
        </div>
        <div className="home-right">
          <img
            src="/assets/logo.png"
            alt="SkillSync logo"
            className="home-logo"
          />
        </div>
      </div>
    </div>
  );
}
