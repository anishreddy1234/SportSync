import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "./page.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Store admin token/status if needed
        if (data.token) {
          localStorage.setItem("adminToken", data.token);
        }
        navigate("/adminpage");
      } else {
        setError(data.message || "Unable to sign in. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check your internet connection and try again.");
      console.error("Admin Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="stars"></div>

      <div className="admin-login-container">
          
          <div className="admin-login-header">
            <h1 className="admin-login-logo">SportSync</h1>
            <p className="admin-badge">Admin Login — Access your ground's dashboard</p>
          </div>

          {error && <div className="message error">{error}</div>}

          <form className="admin-login-form" onSubmit={handleLogin}>
            
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Enter your username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={loading || !formData.username || !formData.password}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
      </div>
    </div>
  );
};

export default AdminLogin;