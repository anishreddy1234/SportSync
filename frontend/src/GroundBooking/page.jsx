import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import Notification from '../components/Notification';
import { API_URL } from '../config';
import './page.css';

const BookingPage = () => {
  const location = useLocation();
  const { groundId } = useParams();
  const navigate = useNavigate();
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  const [ground, setGround] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]); // State to store booked times
  const [slotResetNotice, setSlotResetNotice] = useState(false);
  const [notification, setNotification] = useState(null);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReviewCount, setUserReviewCount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Generate dates dynamically: today + next 7 days
  const generateDates = (numDays = 7) => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < numDays; i++) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() + i);
      const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({ date: dateStr, day: dayName });
    }
    return dates;
  };

  const availableDates = generateDates(7);

  // --- SLOT AVAILABILITY LOGIC ---
  const fetchBookedSlots = async (date) => {
    if (!date || !groundId) return;

    try {
      // Calls your backend route to get pending AND confirmed bookings for this ground/date
      const url = `${API_URL}/api/v1/bookings/${groundId}/${date}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to fetch booked slots');
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        // Map the bookings to just the time slot string (e.g., "10:00 - 11:00")
        // This now includes both pending and confirmed bookings
        const slots = data.data.map(b => `${b.startTime} - ${b.endTime}`);
        setBookedSlots(slots);
      } else {
         setBookedSlots([]);
      }
    } catch (err) {
      console.error('Error fetching booked slots:', err);
      setBookedSlots([]);
    }
  };

  const isBooked = (slot) => bookedSlots.includes(slot);

  // Re-fetch booked slots whenever the selected date changes
  useEffect(() => {
    if (selectedDate && groundId) {
      fetchBookedSlots(selectedDate);
    }
    // Let the user know (instead of silently clearing) if changing the date
    // is about to reset a slot they had already picked.
    if (selectedSlot) {
      setSlotResetNotice(true);
    }
    setSelectedSlot(''); // Clear slot selection when date changes
  }, [selectedDate, groundId]);

  // --- GROUND DATA FETCH ---
  useEffect(() => {
    if (!ground && groundId) fetchGround();
    if (groundId) {
      fetchReviews();
      fetchUserReviewCount();
    }
  }, [groundId, ground]);

  const fetchGround = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/grounds/${groundId}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setGround(data.data);
      } else {
        setNotification({ type: 'error', text: 'Unable to load this ground. Please refresh the page.' });
      }
    } catch (err) {
      console.error('Failed to fetch ground:', err);
      setNotification({ type: 'error', text: 'Unable to load this ground. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's review count from backend
  const fetchUserReviewCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/reviews/user-count/${groundId}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setUserReviewCount(data.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch user review count:', err);
      setUserReviewCount(0);
    }
  };

  // Fetch reviews for the ground
  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/reviews/${groundId}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setReviews(data.data.reviews || []);
        setAverageRating(data.data.averageRating || 0);
        setTotalReviews(data.data.totalReviews || 0);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  // Submit a review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewRating || !reviewComment.trim()) {
      setNotification({ type: 'error', text: 'Please provide both rating and comment' });
      return;
    }

    try {
      setReviewLoading(true);
      const res = await fetch(`${API_URL}/api/v1/reviews/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          groundId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setNotification({ type: 'success', text: 'Review submitted successfully!' });
        setReviewRating(0);
        setReviewComment('');
        setShowReviewForm(false);
        await fetchReviews(); // Refresh reviews
        await fetchUserReviewCount(); // Update user's review count
      } else {
        // If backend says limit reached, update the count and close form
        if (data.message && data.message.includes('2 reviews')) {
          await fetchUserReviewCount(); // Update count from backend
          setShowReviewForm(false);
        }
        setNotification({ type: 'error', text: data.message || 'Failed to submit review. Please try again.' });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setNotification({ type: 'error', text: 'Failed to submit review. Please try again.' });
    } finally {
      setReviewLoading(false);
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="booking-container">Loading ground details...</div>;
  if (!ground) return <div className="booking-container">No ground selected.</div>;

  // Generate 1-hour slots dynamically
  const generateSlots = (start, end) => {
    const slots = [];
    let [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    while (startHour < endHour || (startHour === endHour && startMin < endMin)) {
      const nextHour = startHour + 1;
      const slot = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')} - ${nextHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      slots.push(slot);
      startHour = nextHour;
    }
    return slots;
  };

  const availableSlots = generateSlots(ground.availableHours.start, ground.availableHours.end);

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !paymentScreenshot) {
      setBookingMessage({ type: 'error', text: 'Select date, slot, and upload screenshot.' });
      return;
    }

    if (isBooked(selectedSlot)) {
       setBookingMessage({ type: 'error', text: 'This slot is already booked. Choose another.' });
       return;
    }

    const [startTime, endTime] = selectedSlot.split(' - ');
    const formData = new FormData();
    formData.append('groundId', ground._id);
    formData.append('date', selectedDate);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('paymentScreenshot', paymentScreenshot);

    try {
      setBookingLoading(true);
      setBookingMessage(null);

      const res = await fetch(`${API_URL}/api/v1/bookings/book`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      const data = await res.json();

      if(res.status === 498 || res.status === 401){
        navigate('/'); // Redirect to login on auth failure (Login is mounted at "/")
        return;
      }

      if (res.ok) {
        setBookingMessage({ type: 'success', text: 'Booking request sent! Awaiting admin confirmation.' });
        // After successful booking, refetch the booked slots to disable the one just booked
        fetchBookedSlots(selectedDate);
      } else {
        setBookingMessage({ type: 'error', text: data.message || 'Failed to create booking. Please try again.' });
      }
    } catch (err) {
      console.error('Booking error:', err);
      setBookingMessage({ type: 'error', text: 'Unable to connect to the server. Please check your internet connection and try again.' });
    } finally {
      setBookingLoading(false);
    }
  };

  // What the user still needs to do before Book Now becomes available
  const missingRequirements = [];
  if (!selectedDate) missingRequirements.push('select a date');
  if (!selectedSlot) missingRequirements.push('choose a slot');
  if (!paymentScreenshot) missingRequirements.push('upload a payment screenshot');

  return (
    <div className="booking-container">
      <Notification notification={notification} onDismiss={() => setNotification(null)} />

      <div className="booking-card">
        {/* Header */}
        <div className="header">
          <button className="back-button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
          <h1 className="logo">{ground.name}</h1>
        </div>

        {/* Venue Info */}
        <div className="venue-info">
          <div className="venue-details">
            <h2 className="venue-name">{ground.name}</h2>
            <p className="venue-description">{ground.description || 'No description provided.'}</p>
            <div className="venue-meta">
              <div className="meta-item">City: {ground.city}</div>
              <div className="meta-item">Owner: {ground.owner?.username || 'Unknown'}</div>
              <div className="meta-item">Contact: {ground.owner?.phoneNumber || 'N/A'}</div>
              <div className="meta-item">Location: {ground.location}</div>
              <div className="meta-item">Price: ₹{ground.basePrice}</div>
            </div>
            {ground.rules && (
              <div className="rules-section">
                <h3 className="section-title">Rules</h3>
                <p>{ground.rules}</p>
              </div>
            )}
          </div>

          {/* Image Gallery with Swiper */}
          <div className="image-gallery">
            {/* Main Image Swiper */}
            <Swiper
              modules={[Navigation, Pagination, Thumbs]}
              navigation
              pagination={{ clickable: true }}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              className="main-swiper"
              spaceBetween={0}
              slidesPerView={1}
            >
              <SwiperSlide>
                <img
                  src={ground.coverImage?.url || 'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800&q=80'}
                  alt={ground.name}
                />
              </SwiperSlide>
              {Array.isArray(ground.photos) && ground.photos.map((photo, idx) => (
                <SwiperSlide key={idx}>
                  <img src={photo.url} alt={`${ground.name} - ${idx + 1}`} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Thumbnail Swiper */}
            {Array.isArray(ground.photos) && ground.photos.length > 0 && (
              <Swiper
                modules={[Thumbs]}
                onSwiper={setThumbsSwiper}
                watchSlidesProgress
                slidesPerView={4}
                spaceBetween={8}
                className="thumbs-swiper"
              >
                <SwiperSlide>
                  <img
                    src={ground.coverImage?.url || 'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800&q=80'}
                    alt={`${ground.name} thumb`}
                  />
                </SwiperSlide>
                {ground.photos.map((photo, idx) => (
                  <SwiperSlide key={idx}>
                    <img src={photo.url} alt={`${ground.name} thumb ${idx + 1}`} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div className="date-section">
          <h3 className="section-title">Select Date</h3>
          <div className="date-grid">
            {availableDates.map((d, idx) => (
              <div
                key={idx}
                className={`date-card ${selectedDate === d.date ? 'selected' : ''}`}
                onClick={() => {
                  if (selectedDate !== d.date) {
                    setSelectedDate(d.date);
                  }
                }}
              >
                <div className="date-day">{d.day}</div>
                <div className="date-number">{d.date.split('-')[2]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Selection */}
        <div className="slots-section">
          <h3 className="section-title">Available Slots</h3>
          {slotResetNotice && (
            <p className="slot-reset-hint">
              Your slot selection was reset because you changed the date — please choose a slot again.
            </p>
          )}
          <div className="slots-grid">
            {availableSlots.map((slot, idx) => {
              const booked = isBooked(slot);
              return (
                <div
                  key={idx}
                  // Apply 'booked' class if slot is taken
                  className={`slot-card ${selectedSlot === slot ? 'selected' : ''} ${booked ? 'booked' : ''}`}
                  onClick={() => {
                    if (booked) return; // Prevent clicking if booked
                    setSelectedSlot(slot);
                    setSlotResetNotice(false);
                  }}
                >
                  {booked ? <span className="booked-text">BOOKED</span> : slot}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload Payment Screenshot */}
        <div className="upload-section">
          <h3 className="section-title">Upload Payment Screenshot</h3>

          <div className="payment-note">
            <p>
              <strong>Demo booking flow:</strong> upload any image as your payment screenshot to continue.
              In a production application, this step would be replaced with an online payment gateway or the venue's own payment instructions.
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            className="upload-input"
            id="paymentScreenshot"
            onChange={(e) => setPaymentScreenshot(e.target.files[0])}
          />
          <label htmlFor="paymentScreenshot" className="upload-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.9V12c0-.9.7-1.6 1.6-1.6h12.8c.9 0 1.6.7 1.6 1.6v2.9M12 20.8V15M9 18h6M16 10l-4-4-4 4"/></svg>
            {paymentScreenshot ? paymentScreenshot.name : 'Choose File'}
          </label>
          {paymentScreenshot && (
            <div className="upload-preview">
              <img
                src={URL.createObjectURL(paymentScreenshot)}
                alt="Preview"
                className="preview-image"
              />
            </div>
          )}
        </div>
        
        {/* Booking Button & Message */}
        <div className="booking-action">
          {bookingMessage && (
             <div className={`message ${bookingMessage.type}`}>
               {bookingMessage.text}
             </div>
          )}
          <button
            className="book-button"
            onClick={handleBooking}
            // Disable if loading, no date/slot selected, or no screenshot uploaded
            disabled={bookingLoading || !selectedSlot || !selectedDate || !paymentScreenshot}
          >
            {bookingLoading ? 'Processing Request...' : 'Book Now'}
          </button>
          {!bookingLoading && missingRequirements.length > 0 && (
            <p className="booking-requirements-hint">
              Still need to {missingRequirements.join(', ')}.
            </p>
          )}
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h3 className="section-title">Reviews ({totalReviews})</h3>
            {averageRating > 0 && (
              <div className="average-rating">
                {renderStars(Math.round(averageRating))}
                <span className="rating-text">{averageRating} stars</span>
              </div>
            )}
          </div>

          <button
            className="add-review-btn"
            onClick={() => {
              if (userReviewCount < 2) {
                setShowReviewForm(!showReviewForm);
              } else {
                setNotification({ type: 'error', text: `You have already submitted ${userReviewCount} reviews. Maximum is 2.` });
              }
            }}
            disabled={userReviewCount >= 2}
          >
            {userReviewCount >= 2
              ? `Review limit reached (${userReviewCount}/2)`
              : (showReviewForm ? 'Cancel' : 'Add Review')
            }
          </button>

          {showReviewForm && userReviewCount < 2 && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label>Rating:</label>
                {renderStars(reviewRating, true, setReviewRating)}
              </div>
              <div className="form-group">
                <label>Your Review:</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write your review..."
                  rows="4"
                  maxLength="500"
                  required
                />
                <small>{reviewComment.length}/500</small>
              </div>
              <button 
                type="submit" 
                className="submit-review-btn"
                disabled={reviewLoading || !reviewRating || !reviewComment.trim()}
              >
                {reviewLoading ? 'Loading...' : 'Submit Review'}
              </button>
              <p className="review-limit-text">Maximum 2 reviews per user</p>
            </form>
          )}

          <div className="reviews-list">
            {reviews.length === 0 ? (
              <div className="no-reviews">
                <p>No reviews yet</p>
                <p className="text-muted">Be the first to review!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.userId?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="reviewer-name">{review.userId?.username || 'Anonymous'}</div>
                        <div className="review-date">
                          {new Date(review.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;