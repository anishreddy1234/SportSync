import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "./Page.css";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store email for OTP verification
        localStorage.setItem("verificationEmail", formData.email);

        // Navigate to OTP verification page
        navigate("/otp");
      } else {
        setError(data.message || "Unable to create your account. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check your internet connection and try again.");
      console.error("Sign up error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div className="signup-page">
      <div className="stars"></div>

      <div className="signup-card">
        <h1 className="signup-title">SportSync</h1>
        <p className="signup-subtitle">Create Account</p>

        {error && <div className="error-message">{error}</div>}

        <form className="signup-form" onSubmit={handleSignUp}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Loading..." : "Sign Up"}
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <a href="#" onClick={handleBackToLogin}>
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;