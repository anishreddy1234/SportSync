import React, { useState, useEffect } from "react";
import "./page.css";

const AddGround = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState("");

  // Add/remove class on body for consistent styling
  useEffect(() => {
    document.body.classList.add("add-ground-page");
    return () => document.body.classList.remove("add-ground-page");
  }, []);

  // Validate phone number format
  const validatePhoneNumber = (number) => {
    // Indian phone number format: +91 or 0 prefix, 10 digits starting 6-9
    const cleanNumber = number.replace(/\s+/g, '');
    const inPhoneRegex = /^(\+91|91|0)?[6-9][0-9]{9}$/;
    return inPhoneRegex.test(cleanNumber);
  };

  const handleSend = () => {
    setError("");

    // Validation
    if (phoneNumber.trim() === "") {
      setError("Please enter your phone number");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number (e.g., 9876543210)");
      return;
    }

    // Show success popup
    setShowPopup(true);
    
    // Clear form
    setPhoneNumber("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {/* Animated stars background */}
      <div className="stars"></div>

      <div className="add-ground-container">
        <h1 className="add-ground-title">Add Your Ground to SportSync</h1>
        <p className="add-ground-subtitle">
          List your sports facility and reach thousands of players. Enter your phone number and our team will contact you shortly.
        </p>

        <div className="add-ground-form">
          <input
            id="phoneNumber"
            type="tel"
            placeholder="9876543210"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            className="add-ground-input"
            autoComplete="tel"
          />
          {error && <span className="error-message">{error}</span>}

          <button
            onClick={handleSend}
            className="add-ground-button"
            disabled={!phoneNumber.trim()}
          >
            Submit Request
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>Request Submitted!</h2>
            <p>
              Thank you for your interest! Our team will contact you within 24-48 hours to help you list your ground on SportSync.
            </p>
            <button onClick={closePopup} className="popup-close">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddGround;