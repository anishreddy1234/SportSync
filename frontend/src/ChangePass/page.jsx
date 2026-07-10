import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "./page.css";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => {
      document.body.classList.remove("login-page");
    };
  }, []);

  const handleChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/v1/users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.status === 498) {
          navigate("/");
          return;
        }
        setMessage({ type: "error", text: data.message || "Failed to change password. Please try again." });
        return;
      }

      setMessage({ type: "success", text: "Password changed successfully!" });
      setTimeout(() => navigate("/homepage"), 1200);
    } catch (error) {
      setMessage({ type: "error", text: "Unable to connect to the server. Please check your internet connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="stars"></div>

      <div className="change-password-container">
        <button
          className="back-arrow"
          onClick={() => navigate("/homepage")}
          aria-label="Go to Homepage"
        >
          ←
        </button>

        <div className="change-password-card">
          <div className="change-password-header">
            <h1>Change Password</h1>
            <p>Enter your current and new password below</p>
          </div>

          {message && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleChange} className="change-password-form">
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}