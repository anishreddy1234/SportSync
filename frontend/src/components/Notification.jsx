import React, { useEffect } from 'react';
import './Notification.css';

// Shared inline notification (replaces browser alert()).
// Reused across pages so every success/error message looks and behaves the same.
export default function Notification({ notification, onDismiss }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className={`app-notification ${notification.type}`}>
      <span>{notification.text}</span>
      <button
        className="app-notification-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
