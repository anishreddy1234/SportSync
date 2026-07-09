import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Notification from '../components/Notification';
import ConfirmDialog from '../components/ConfirmDialog';
import './page.css';

const Chat = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [messageType, setMessageType] = useState('text');
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');

    if (!userStr) {
      // User not logged in, go back
      navigate('/');
      return;
    }
    
    let user;
    try {
      user = JSON.parse(userStr);
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to parse user:', err);
      navigate('/');
      return;
    }

    // Get accessToken from response data stored during login
    const accessToken = localStorage.getItem('accessToken');

    // Connect to socket with credentials (cookies will be sent automatically)
    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      transports: ['polling', 'websocket'], // Try polling first (more reliable for cookies)
      withCredentials: true, // This sends cookies automatically
      auth: {
        token: accessToken // Also send token via auth object as backup
      }
    });

    newSocket.on('connect', () => {
      newSocket.emit('users:online');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      // Only redirect on definitive auth errors, not connection issues
      if (error.message === 'Authentication token required' ||
          error.message === 'Invalid token' ||
          error.message === 'Token expired' ||
          error.message === 'User not found') {
        setNotification({ type: 'error', text: 'Session expired. Please login again.' });
        setTimeout(() => navigate('/'), 1500);
      }
      // For other errors (like network issues), don't redirect - socket will retry
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [navigate]);

  // Fetch chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/history?page=1&limit=100`,
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data.messages || []);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchHistory();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on('message:deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socket.on('user:typing', ({ username }) => {
      setTypingUsers(prev => [...new Set([...prev, username])]);
    });

    socket.on('user:stopped-typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u !== userId));
    });

    socket.on('users:online-list', ({ users, count }) => {
      setOnlineUsers(users);
    });

    socket.on('error', ({ message }) => {
      setNotification({ type: 'error', text: message });
    });

    return () => {
      socket.off('message:new');
      socket.off('message:deleted');
      socket.off('user:typing');
      socket.off('user:stopped-typing');
      socket.off('users:online-list');
      socket.off('error');
    };
  }, [socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!socket) return;

    // Validate - only text messages are sent via this function
    if (!inputMessage.trim()) return;

    // Store the input element before clearing
    const inputElement = e?.target?.querySelector('.message-input');

    try {
      // Stop typing indicator
      socket.emit('typing:stop');
      setIsTyping(false);

      // Send text message via REST API
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/send-text`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: inputMessage.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      // Reset input and keep focus
      setInputMessage('');
      
      // Keep focus on input to prevent scroll
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus();
          inputElement.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        }, 0);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setNotification({ type: 'error', text: 'Failed to send message: ' + error.message });
    }
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    if (!socket) return;

    // Start typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start');
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop');
    }, 2000);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (e.g., max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Image size must be less than 10MB' });
      return;
    }

    // Get the message input to maintain focus
    const messageInput = document.querySelector('.message-input');

    setUploadingMedia(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Send image directly - this uploads AND creates the message
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/send-image`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Image upload failed');
      }

      // Image sent successfully - message will appear via socket.on('message:new')
      await response.json();

      // Reset the file input and restore focus
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }

      // Keep focus on message input to prevent scroll
      if (messageInput) {
        setTimeout(() => {
          messageInput.focus();
          messageInput.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        }, 0);
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      setNotification({ type: 'error', text: 'Failed to upload image: ' + error.message });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (e.g., max 50MB for videos)
    if (file.size > 50 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Video size must be less than 50MB' });
      return;
    }

    // Get the message input to maintain focus
    const messageInput = document.querySelector('.message-input');

    setUploadingMedia(true);

    try {
      const formData = new FormData();
      formData.append('video', file);

      // Send video directly - this uploads AND creates the message
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/send-video`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Video upload failed');
      }

      // Video sent successfully - message will appear via socket.on('message:new')
      await response.json();

      // Reset the file input and restore focus
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }

      // Keep focus on message input to prevent scroll
      if (messageInput) {
        setTimeout(() => {
          messageInput.focus();
          messageInput.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        }, 0);
      }

    } catch (error) {
      console.error('Error uploading video:', error);
      setNotification({ type: 'error', text: 'Failed to upload video: ' + error.message });
    } finally {
      setUploadingMedia(false);
    }
  };

  const requestDeleteMessage = (messageId) => {
    setConfirmDialog({
      title: 'Delete message?',
      message: 'This message will be deleted for everyone. This can\'t be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => performDeleteMessage(messageId),
    });
  };

  const performDeleteMessage = async (messageId) => {
    setConfirmDialog(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/message/${messageId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Delete failed');
    } catch (error) {
      console.error('Error deleting message:', error);
      setNotification({ type: 'error', text: 'Failed to delete message' });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const cancelMediaPreview = () => {
    setMediaPreview(null);
    setMessageType('text');
  };

  // Show loading while user is being fetched
  if (!currentUser) {
    return (
      <div className="chat-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#737373' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Notification notification={notification} onDismiss={() => setNotification(null)} />
      <ConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} />

      {/* Header */}
      <header className="chat-header">
        <button className="back-btn" onClick={() => navigate('/homepage')} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="chat-header-info">
          <h1>Community</h1>
          <p className="online-count">
            <span className="pulse-dot"></span>
            {onlineUsers.length} members active
          </p>
        </div>

        <button className="online-users-btn" onClick={() => socket?.emit('users:online')} aria-label="Refresh online users">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      </header>

      {/* Messages Area */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="no-messages">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2>No messages yet</h2>
            <p>Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${currentUser && msg.sender?._id === currentUser._id ? 'message-own' : 'message-other'}`}
            >
              <div className="message-avatar">
                {msg.sender?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              
              <div className="message-content">
                <div className="message-header">
                  <span className="message-username">{msg.sender?.username || 'Unknown'}</span>
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>

                {msg.messageType === 'text' && (
                  <p className="message-text">{msg.content}</p>
                )}

                {msg.messageType === 'image' && (
                  <div className="message-media">
                    <img src={msg.mediaUrl} alt="Shared" />
                    {msg.content && <p className="message-text">{msg.content}</p>}
                  </div>
                )}

                {msg.messageType === 'video' && (
                  <div className="message-media">
                    <video controls src={msg.mediaUrl} />
                    {msg.content && <p className="message-text">{msg.content}</p>}
                  </div>
                )}

                {currentUser && msg.sender?._id === currentUser._id && (
                  <button
                    className="delete-btn"
                    onClick={() => requestDeleteMessage(msg._id)}
                    aria-label="Delete message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span>{typingUsers.join(', ')} {typingUsers.length > 1 ? 'are typing...' : 'is typing...'}</span>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div className="media-preview">
          <button className="cancel-media" onClick={cancelMediaPreview} aria-label="Cancel attachment">×</button>
          {mediaPreview.type === 'image' ? (
            <img src={mediaPreview.mediaUrl} alt="Preview" />
          ) : (
            <video src={mediaPreview.mediaUrl} controls />
          )}
        </div>
      )}

      {/* Input Area */}
      <form className="input-area" onSubmit={handleSendMessage}>
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoSelect}
          accept="video/*"
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="attach-btn"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingMedia}
          title="Upload Image"
          aria-label="Upload image"
        >
          {uploadingMedia ? (
            <div className="mini-spinner"></div>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
            </svg>
          )}
        </button>

        <button
          type="button"
          className="video-btn"
          onClick={() => videoInputRef.current?.click()}
          disabled={uploadingMedia}
          title="Upload Video"
          aria-label="Upload video"
        >
          {uploadingMedia ? (
            <div className="mini-spinner"></div>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"/>
              <rect x="3" y="6" width="12" height="12" rx="2"/>
            </svg>
          )}
        </button>

        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={handleTyping}
          disabled={uploadingMedia}
        />

        <button type="submit" className="send-btn" disabled={uploadingMedia || (!inputMessage.trim() && !mediaPreview)} aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;