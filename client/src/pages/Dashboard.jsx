import React from "react";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="performance-dashboard">

      {/* Title */}
      <h1 className="page-title">Performance Dashboard</h1>
      <p className="page-subtitle">
        Track your academic progress and personal development
      </p>

      {/* Cards */}
      <div className="stat-cards">
        <div className="card">Current GPA <br /> <span className="placeholder">—</span></div>
        <div className="card">Achievements <br /> <span className="placeholder">—</span></div>
        <div className="card">Skills Improved <br /> <span className="placeholder">—</span></div>
        <div className="card">Goals Completed <br /> <span className="placeholder">—</span></div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <span className="active">Performance</span>
        <span>Skills</span>
        <span>Achievements</span>
        <span>Goals</span>
      </div>

      {/* Chart Placeholder */}
      <div className="chart-placeholder">
        📊 Chart under construction
      </div>

      {/* Recent Activity Placeholder */}
      <div className="activity-placeholder">
        🛠 Recent activity section coming soon...
      </div>
    </div>
  );
}