import React from "react";
import { useNavigate } from "react-router-dom";
import "./GroundCard.css";

const GroundCard = ({ ground }) => {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate("/adminlogin", {
      state: {
        groundId: ground._id,
        groundName: ground.name,
      },
    });
  };

  if (!ground) return null;

  return (
    <div className="ground-card">
      {/* Image Section */}
      <div className="ground-image-container">
        <img 
          src={ground.coverImage?.url || 'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800&q=80'} 
          alt={ground.name} 
          className="ground-image" 
        />
        <span className="availability-badge">Available</span>
      </div>

      {/* Details Section */}
      <div className="ground-details">
        <h3 className="ground-name">{ground.name}</h3>

        {Array.isArray(ground.sportTypes) && ground.sportTypes.length > 0 && (
          <div className="sport-tags">
            {ground.sportTypes.map((sport) => (
              <span key={sport} className="sport-tag">{sport}</span>
            ))}
          </div>
        )}

        <div className="ground-info">
          {/* Location */}
          <div className="info-item">
            <svg
              className="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{ground.location}</span>
          </div>

          {/* Duration */}
          <div className="info-item">
            <svg
              className="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6l4 2"
              />
            </svg>
            <span>{ground.availableHours?.slotDuration || 60} mins</span>
          </div>
        </div>

        {/* Price + Primary CTA */}
        <div className="ground-footer">
          <div className="price-section">
            <span className="price">₹{ground.basePrice}</span>
            <span className="price-label">per session</span>
          </div>
          <button className="signup-cta-btn" onClick={() => navigate('/signup')}>
            Sign Up to Book
          </button>
        </div>

        {/* Admin Login Link */}
        <button className="admin-btn-full" onClick={handleAdminLogin}>
          Own this ground? Admin Login
        </button>
      </div>
    </div>
  );
};

export default GroundCard;