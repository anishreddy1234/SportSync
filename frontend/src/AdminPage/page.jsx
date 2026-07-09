import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./page.css";

const STATUS_META = {
  pending: { label: "Pending", className: "status-badge--pending" },
  confirmed: { label: "Confirmed", className: "status-badge--confirmed" },
  rejected: { label: "Rejected", className: "status-badge--rejected" },
  cancelled: { label: "Cancelled", className: "status-badge--cancelled" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>;
}

// Only a real authentication failure should send the admin back to login.
const isAuthError = (status) => status === 401 || status === 498;

export default function AdminPage() {
  const navigate = useNavigate();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [groundName, setGroundName] = useState("Your Venue");
  const [groundId, setGroundId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [processingIds, setProcessingIds] = useState(() => new Set());

  useEffect(() => {
    fetchBookings();
  }, []);

  // Auto-dismiss inline notifications after a few seconds.
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const notify = (type, text) => setNotification({ type, text });

  const setProcessing = (bookingId, isProcessing) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (isProcessing) next.add(bookingId);
      else next.delete(bookingId);
      return next;
    });
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch pending bookings
      const pendingResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/pending-bookings`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!pendingResponse.ok) {
        if (isAuthError(pendingResponse.status)) {
          navigate("/adminlogin");
          return;
        }
        notify("error", "Failed to load pending bookings. Please refresh the page.");
        return;
      }

      const pendingData = await pendingResponse.json();

      // New response structure includes ground info
      const pending = pendingData.data?.bookings || pendingData.data || [];
      const groundInfo = pendingData.data?.ground;

      setPendingBookings(pending);

      // Extract ground ID from response ground info or first booking
      let currentGroundId = groundId;

      if (groundInfo) {
        currentGroundId = groundInfo._id;
        setGroundId(currentGroundId);
        setGroundName(groundInfo.name || "Your Venue");
      } else if (pending.length > 0 && pending[0].groundId) {
        currentGroundId = pending[0].groundId._id || pending[0].groundId;
        setGroundId(currentGroundId);
        if (pending[0].groundId?.name) {
          setGroundName(pending[0].groundId.name);
        }
      }

      // Fetch confirmed bookings using admin endpoint
      if (currentGroundId) {
        try {
          const confirmedResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/confirmed-bookings`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (confirmedResponse.ok) {
            const confirmedData = await confirmedResponse.json();
            const confirmed = confirmedData.data || [];
            setConfirmedBookings(confirmed);

            // Update ground name if we didn't get it from pending bookings
            if ((!groundName || groundName === "Your Venue") && confirmed.length > 0 && confirmed[0].groundId?.name) {
              setGroundName(confirmed[0].groundId.name);
            }
          } else if (isAuthError(confirmedResponse.status)) {
            navigate("/adminlogin");
            return;
          } else {
            setConfirmedBookings([]);
            notify("error", "Failed to load confirmed bookings.");
          }
        } catch (error) {
          console.error("Error fetching confirmed bookings:", error);
          // Don't fail the whole page if confirmed bookings fail
          setConfirmedBookings([]);
          notify("error", "Network error loading confirmed bookings.");
        }
      } else {
        setConfirmedBookings([]);
      }

    } catch (error) {
      console.error("Error fetching bookings:", error);
      notify("error", "Network error. Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    setProcessing(bookingId, true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/confirm-booking`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ bookingId }),
        }
      );

      if (isAuthError(response.status)) {
        navigate("/adminlogin");
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        notify("error", data.message || "Failed to confirm booking.");
        return;
      }

      // Move the booking from Pending straight to Confirmed using the
      // (already fully-populated) booking the API just returned - no refetch.
      const updatedBooking = data.data;
      setPendingBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setConfirmedBookings((prev) => [updatedBooking, ...prev]);
      notify("success", "Booking confirmed successfully.");
    } catch (error) {
      console.error("Error confirming booking:", error);
      notify("error", "Network error. Could not confirm booking.");
    } finally {
      setProcessing(bookingId, false);
    }
  };

  const requestReject = (booking) => {
    setConfirmDialog({
      title: "Reject booking?",
      message: `Are you sure you want to reject ${booking.userId?.username || "this user"}'s booking? This can't be undone.`,
      confirmLabel: "Reject Booking",
      danger: true,
      onConfirm: () => performReject(booking._id),
    });
  };

  const performReject = async (bookingId) => {
    setConfirmDialog(null);
    setProcessing(bookingId, true);
    // Flag it immediately so the card shows "Rejected" instead of silently vanishing.
    setPendingBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, _actionStatus: "rejected" } : b))
    );

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/reject-booking`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ bookingId }),
        }
      );

      if (isAuthError(response.status)) {
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        notify("error", data.message || "Failed to reject booking.");
        setPendingBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, _actionStatus: undefined } : b))
        );
        return;
      }

      notify("success", "Booking rejected.");
      // Give the "Rejected" badge a moment on screen before the card leaves the list.
      setTimeout(() => {
        setPendingBookings((prev) => prev.filter((b) => b._id !== bookingId));
      }, 700);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      notify("error", "Network error. Could not reject booking.");
      setPendingBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, _actionStatus: undefined } : b))
      );
    } finally {
      setProcessing(bookingId, false);
    }
  };

  const requestCancel = (booking) => {
    setConfirmDialog({
      title: "Cancel confirmed booking?",
      message: `Are you sure you want to cancel ${booking.userId?.username || "this user"}'s confirmed booking? This can't be undone.`,
      confirmLabel: "Cancel Booking",
      danger: true,
      onConfirm: () => performCancel(booking._id),
    });
  };

  const performCancel = async (bookingId) => {
    setConfirmDialog(null);
    setProcessing(bookingId, true);
    setConfirmedBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, _actionStatus: "cancelled" } : b))
    );

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/cancel-booking`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ bookingId }),
        }
      );

      if (isAuthError(response.status)) {
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        notify("error", data.message || "Failed to cancel booking.");
        setConfirmedBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, _actionStatus: undefined } : b))
        );
        return;
      }

      notify("success", "Booking cancelled.");
      setTimeout(() => {
        setConfirmedBookings((prev) => prev.filter((b) => b._id !== bookingId));
      }, 700);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      notify("error", "Network error. Could not cancel booking.");
      setConfirmedBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, _actionStatus: undefined } : b))
      );
    } finally {
      setProcessing(bookingId, false);
    }
  };

  const handleViewScreenshot = (screenshotUrl) => {
    setScreenshotModal(screenshotUrl);
  };

  const handleLogout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      navigate("/adminlogin");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/adminlogin");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-brand">SportSync</div>
          <h1>Admin Dashboard</h1>
          <p className="venue-name">{groundName}</p>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {notification && (
          <div className={`dashboard-notification ${notification.type}`}>
            <span>{notification.text}</span>
            <button
              className="dashboard-notification-close"
              onClick={() => setNotification(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* Pending Bookings */}
        <div className="bookings-section">
          <div className="section-header pending-header">
            <span className="status-icon">⏱</span>
            <h2>Pending Bookings ({pendingBookings.length})</h2>
          </div>

          <div className="bookings-list">
            {pendingBookings.length === 0 ? (
              <p className="no-bookings">No pending bookings</p>
            ) : (
              pendingBookings.map((booking) => {
                const isProcessing = processingIds.has(booking._id);
                const isRejected = booking._actionStatus === "rejected";
                return (
                  <div
                    key={booking._id}
                    className={`booking-card pending-card ${isRejected ? "is-removing" : ""}`}
                  >
                    <StatusBadge status={booking._actionStatus || "pending"} />
                    <div className="booking-details">
                      <div className="booking-time">
                        <div className="date">{formatDate(booking.date)}</div>
                        <div className="time">{booking.startTime} - {booking.endTime}</div>
                      </div>

                      <div className="booking-info-section">
                        <div className="info-row">
                          <span className="info-label">Name:</span>
                          <span className="info-text">{booking.userId?.username || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Email:</span>
                          <span className="info-text">{booking.userId?.email || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="booking-amount">
                        <div className="amount-label">Amount:</div>
                        <div className="amount-value">₹{booking.price}</div>
                      </div>
                    </div>

                    {!isRejected && (
                      <div className="booking-actions">
                        <button
                          className="btn-screenshot"
                          onClick={() => handleViewScreenshot(booking.screenshot)}
                          disabled={isProcessing}
                        >
                          View Screenshot
                        </button>
                        <button
                          className="btn-confirm"
                          onClick={() => handleConfirm(booking._id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Confirming..." : "Confirm"}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => requestReject(booking)}
                          disabled={isProcessing}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="bookings-section">
          <div className="section-header confirmed-header">
            <span className="status-icon">✓</span>
            <h2>Confirmed Bookings ({confirmedBookings.length})</h2>
          </div>

          <div className="bookings-list">
            {confirmedBookings.length === 0 ? (
              <p className="no-bookings">No confirmed bookings</p>
            ) : (
              confirmedBookings.map((booking) => {
                const isProcessing = processingIds.has(booking._id);
                const isCancelled = booking._actionStatus === "cancelled";
                return (
                  <div
                    key={booking._id}
                    className={`booking-card confirmed-card ${isCancelled ? "is-removing" : ""}`}
                  >
                    <StatusBadge status={booking._actionStatus || "confirmed"} />
                    <div className="booking-details">
                      <div className="booking-time">
                        <div className="date">{formatDate(booking.date)}</div>
                        <div className="time">{booking.startTime} - {booking.endTime}</div>
                      </div>

                      <div className="booking-info-section">
                        <div className="info-row">
                          <span className="info-label">Name:</span>
                          <span className="info-text">{booking.userId?.username || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Email:</span>
                          <span className="info-text">{booking.userId?.email || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="booking-amount">
                        <div className="amount-label">Amount:</div>
                        <div className="amount-value">₹{booking.price}</div>
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="booking-actions">
                        <button className="btn-confirmed" disabled>
                          ✓ Confirmed
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => requestCancel(booking)}
                          title="Cancel booking"
                          aria-label="Cancel booking"
                          disabled={isProcessing}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div className="modal-overlay" onClick={() => setScreenshotModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setScreenshotModal(null)} aria-label="Close screenshot">
              ×
            </button>
            <img src={screenshotModal} alt="Payment Screenshot" className="screenshot-image" />
          </div>
        </div>
      )}

      {/* Confirmation Modal (replaces window.confirm) */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">{confirmDialog.title}</h3>
            <p className="confirm-modal-message">{confirmDialog.message}</p>
            <div className="confirm-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button
                className={confirmDialog.danger ? "btn-modal-danger" : "btn-modal-confirm"}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
