import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, provider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { motion } from 'framer-motion';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="home-container">
      <motion.div 
        className="home-left"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {!user ? (
          <>
            <h1 className="home-title">
              Welcome to <span className="highlight">SkillSync</span>
            </h1>
            <p className="home-subtitle">
              Track your academic performance & let AI craft your perfect resume.
            </p>
            <motion.button
              className="google-login-btn"
              onClick={handleLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🚀 Login with Google
            </motion.button>
          </>
        ) : (
          <>
            <h1 className="home-title">Hello, {user.displayName} 👋</h1>
            <p className="home-subtitle">
              Ready to create your AI-powered resume and showcase your achievements?
            </p>
            <motion.button
              className="explore-btn"
              onClick={() => navigate('/profile')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Dashboard ➡️
            </motion.button>
          </>
        )}
      </motion.div>

      <motion.div 
        className="home-right"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <img
          src="/assets/logo.png"
          alt="SkillSync logo"
          className="home-illustration"
        />
      </motion.div>
    </div>
  );
}
