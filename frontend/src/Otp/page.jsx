import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Notification from "../components/Notification";
import "./Page.css";

const OtpVerification = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const email = localStorage.getItem("verificationEmail");
      
      const response = await fetch("http://localhost:8000/api/v1/users/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear stored email
        localStorage.removeItem("verificationEmail");
        
        // Navigate to login page
        navigate("/");
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);

    try {
      const email = localStorage.getItem("verificationEmail");
      
      const response = await fetch("http://localhost:8000/api/v1/users/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setNotification({ type: 'success', text: 'Code resent successfully!' });
      } else {
        setError("Failed to resend code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-page">
      <div className="stars"></div>

      <Notification notification={notification} onDismiss={() => setNotification(null)} />

      {/* Back button */}
      <Link to="/signup" className="back-button">
        ← Back
      </Link>

      <div className="otp-card">
        <div className="logo-circle">S</div>
        
        <h1 className="otp-title">Verify Your Account</h1>
        <p className="otp-subtitle">Enter the 6-digit code sent to your email</p>

        {error && <div className="error-message">{error}</div>}

        <form className="otp-form" onSubmit={handleVerify}>
          <label className="otp-label">Enter OTP Code</label>
          
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-box"
              />
            ))}
          </div>

          <button
            type="submit"
            className="verify-btn"
            disabled={loading || otp.join("").length !== 6}
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        <div className="resend-section">
          <p className="resend-text">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              className="resend-link"
              disabled={loading}
            >
              Resend Code
            </button>
          </p>
        </div>

        <div className="trouble-section">
          <p className="trouble-text">
            Having trouble?{" "}
            <Link to="/signup" className="trouble-link">
              Try another email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;