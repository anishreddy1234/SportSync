import React from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-subtitle">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <button className="notfound-btn" onClick={() => navigate('/')}>
          Return Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
