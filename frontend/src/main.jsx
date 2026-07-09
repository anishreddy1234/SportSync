import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Master Layout with Persistent Background
import Layout from './components/Layout.jsx';

// Auth Pages
import Login from './Login.jsx';
import SignUp from './SignUp/page.jsx';
import OtpVerification from './Otp/page.jsx';
import ChangePass from './ChangePass/page.jsx';
import AdminLogin from './AdminLogin/page.jsx';

// Guest Pages
import GuestHome from './GuestHome/page.jsx';

// Logged-in Homepage
import Homepage from './Homepage/page.jsx';

// Ground Booking
import GroundBooking from './GroundBooking/page.jsx';

// Admin & Management Pages
import AdminPage from './AdminPage/page.jsx';
import AddGround from './AddGround/page.jsx';

// Chat Page
import Chat from './Chat/page.jsx';

// 404 Not Found
import NotFound from './NotFound/page.jsx';

const Main = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Default Login Route */}
          <Route path="/" element={<Login />} />

          {/* Auth Routes */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/otp" element={<OtpVerification />} />
          <Route path="/changepass" element={<ChangePass />} />
          <Route path="/adminlogin" element={<AdminLogin />} />

          {/* Guest Landing Page */}
          <Route path="/guesthome" element={<GuestHome />} />

          {/* Logged-in Homepage */}
          <Route path="/homepage" element={<Homepage />} />

          {/* Ground Booking Page */}
          <Route path="/groundbooking/:groundId" element={<GroundBooking />} />

          {/* Admin Dashboard Route */}
          <Route path="/adminpage" element={<AdminPage />} />

          {/* Add Ground Request Page */}
          <Route path="/addground" element={<AddGround />} />

          {/* Chat Page */}
          <Route path="/chat" element={<Chat />} />

          {/* 404 - Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')).render(<Main />);