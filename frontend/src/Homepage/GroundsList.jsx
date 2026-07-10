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
    } catch (err) {
      console.error('Error fetching grounds:', err);
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
    } catch (err) {
      console.error('Filter error:', err);
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
        <p style={{ textAlign: 'center', color: '#f87171', marginBottom: '16px' }}>{error}</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={fetchGrounds} style={{
            padding: '12px 24px',
            borderRadius: '8px',
            background: '#4ADE80',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700
          }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grounds-list-container">
      {/* HEADER */}
      <header className="grounds-header">
        <h1>SportSync</h1>
        <p>Book your favorite sports ground in just a few clicks</p>
      </header>

      {/* FILTER BAR */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', gap: '12px' }}>
        <select 
          value={selectedCity} 
          onChange={(e) => handleCityFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #4ADE80',
            fontWeight: 600,
            cursor: 'pointer'
          }}
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
      {filteredGrounds.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b' }}>
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
  );
};

export default GroundsList;
