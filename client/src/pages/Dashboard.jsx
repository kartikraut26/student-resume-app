import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);


  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1>Hello, {user?.displayName}</h1>
        <p>Welcome to your dashboard. You can start building your resume and tracking your academic performance here.</p>
      </div>
    </div>
  );
}