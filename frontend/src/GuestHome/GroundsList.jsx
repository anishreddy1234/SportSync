import React, { useState, useEffect } from 'react';
import GroundCard from './GroundCard';
import './GroundsList.css';

const GroundsList = () => {
  const [grounds, setGrounds] = useState([]);
  const [filteredGrounds, setFilteredGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGrounds();
  }, []);

  const fetchGrounds = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/grounds`);
      if (!response.ok) throw new Error('Failed to fetch grounds');
      const data = await response.json();

      if (Array.isArray(data.data) && data.data.length > 0) {
        setGrounds(data.data);
        setFilteredGrounds(data.data);
      } else {
        setGrounds([]);
        setFilteredGrounds([]);
      }
    } catch (error) {
      console.error('Error fetching grounds:', error);
      setError('Failed to load grounds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCityFilter = async (city) => {
    setSelectedCity(city);

    if (city === 'all') {
      setFilteredGrounds(grounds);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/grounds/filter-by-city`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });

      const data = await response.json();
      setFilteredGrounds(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Filter error:', error);
      setError('Failed to filter grounds');
    }
  };

  if (loading) {
    return (
      <div className="grounds-loading">
        <div className="loading-spinner"></div>
        <p>Loading grounds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grounds-list-container">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchGrounds} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grounds-list-container">
      {/* HEADER */}
      <header className="grounds-header">
        <h1 className="guest-logo">SportSync</h1>
        <p className="guest-subtitle">Book your favorite sports ground in just a few clicks</p>
      </header>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <svg 
          className="filter-icon" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
          />
        </svg>
        <select 
          className="city-filter" 
          value={selectedCity} 
          onChange={(e) => handleCityFilter(e.target.value)}
        >
          <option value="all">All Cities</option>
          <option value="Delhi">Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Bengaluru">Bengaluru</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Lucknow">Lucknow</option>
          <option value="Prayagraj">Prayagraj</option>
        </select>
      </div>

      {/* GROUNDS GRID */}
      <section className="grounds-section">
        <div className="grounds-container">
          {filteredGrounds.length === 0 ? (
            <div className="no-results">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
              </svg>
              <h3>No grounds available right now</h3>
              <p>Check back later — new grounds will appear soon.</p>
            </div>
          ) : (
            <div className="grounds-grid">
              {filteredGrounds.map((ground) => (
                <GroundCard key={ground._id || ground.id} ground={ground} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="guest-footer">
        <p>&copy; 2026 SportSync. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default GroundsList;
