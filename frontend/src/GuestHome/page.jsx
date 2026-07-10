import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GroundCard from './GroundCard.jsx'; // Corrected import path
import Notification from '../components/Notification';
import { API_URL } from '../config';
import "./Page.css"; // Corrected import path

const WHY_SPORTSYNC = [
  {
    title: 'Secure Booking',
    description: 'Every payment is verified by the venue admin before your booking is confirmed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Verified Venues',
    description: 'Every ground is listed and managed by a verified venue owner, not an anonymous listing.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Multiple Sports',
    description: 'Football, cricket, badminton, tennis and more — all in one place.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={2} />
        <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={2} />
        <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={2} />
        <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={2} />
      </svg>
    ),
  },
  {
    title: 'Fast Approval',
    description: 'No phone calls or waiting around — get your booking confirmed quickly.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
      </svg>
    ),
  },
];

const GuestHome = () => {
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrounds();
  }, []);

  const fetchGrounds = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/grounds`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch grounds");
      }

      const data = await response.json();
      setGrounds(data.data || []);
    } catch (error) {
      console.error('Error fetching grounds:', error);
      setNotification({ type: 'error', text: 'Unable to load grounds. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeUser = () => {
    navigate('/signup');
  };

  const handleScrollToGrounds = (e) => {
    e.preventDefault();
    document.getElementById('grounds')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSelectedCity('all');
  };

  const filteredGrounds = selectedCity === 'all'
    ? grounds
    : grounds.filter(ground => ground.city.toLowerCase() === selectedCity.toLowerCase());

  if (loading) {
    return (
      <div className="homepage-loading">
        <div className="loading-spinner"></div>
        <p>Loading grounds...</p>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <Notification notification={notification} onDismiss={() => setNotification(null)} />

      {/* Header */}
      <header className="homepage-header">
        <div className="header-content">
          <h1 className="homepage-logo">SportSync</h1>
          <nav className="header-nav">
            <button className="nav-btn-user" onClick={handleBecomeUser}>
              Sign Up
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-kicker">Sports Booking, Simplified</span>
          <h2 className="hero-title">Find Your Perfect Ground</h2>
          <p className="hero-subtitle">
            Browse verified venues, check real-time availability, and lock in your slot in minutes — no phone calls required.
          </p>

          <div className="hero-cta-row">
            <button className="hero-cta-primary" onClick={handleBecomeUser}>
              Get Started Free
            </button>
            <a href="#grounds" className="hero-cta-secondary" onClick={handleScrollToGrounds}>
              Browse Grounds
            </a>
          </div>

          {/* City Filter */}
          <span className="filter-label">Or browse by city</span>
          <div className="filter-bar">
            <svg className="filter-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select
              className="city-filter"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="all">All Cities</option>
              <option value="delhi">Delhi</option>
              <option value="mumbai">Mumbai</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="lucknow">Lucknow</option>
              <option value="prayagraj">Prayagraj</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grounds Section */}
      <section className="grounds-section" id="grounds">
        <div className="grounds-container">
          <span className="section-kicker">Available Now</span>
          <h2 className="section-title">Explore Grounds</h2>
          {filteredGrounds.length > 0 && (
            <p className="grounds-count">{filteredGrounds.length} venue{filteredGrounds.length === 1 ? '' : 's'} ready to book</p>
          )}

          {filteredGrounds.length > 0 ? (
            <div className="grounds-grid">
              {filteredGrounds.map((ground) => (
                <GroundCard key={ground._id} ground={ground} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth={2} />
                  <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              {selectedCity === 'all' ? (
                <>
                  <h3>No grounds available yet</h3>
                  <p>We're onboarding new venues — check back soon.</p>
                </>
              ) : (
                <>
                  <h3>No grounds found in this city</h3>
                  <p>Try a different city, or reset filters to see everything we offer.</p>
                  <button className="reset-filters-btn" onClick={handleResetFilters}>
                    Reset Filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Why SportSync Section */}
      <section className="why-section">
        <div className="section-container">
          <span className="section-kicker">Why Us</span>
          <h2 className="section-title">Why SportSync?</h2>

          <div className="why-grid">
            {WHY_SPORTSYNC.map((item) => (
              <div className="why-card" key={item.title}>
                <div className="why-icon">{item.icon}</div>
                <h3 className="why-card-title">{item.title}</h3>
                <p className="why-card-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <p>
          &copy; 2026 SportSync. All rights reserved.
          {' '}·{' '}
          <Link to="/adminlogin" className="footer-admin-link">Admin Portal</Link>
        </p>
      </footer>
    </div>
  );
};

export default GuestHome;
