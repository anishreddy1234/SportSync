<p align="center">
  <img src="https://img.shields.io/badge/SportSync-Sports%20Venue%20Booking-4ADE80?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==" alt="SportSync"/>
</p>

<h1 align="center">SportSync</h1>

<p align="center">
  <strong>A modern MERN-stack sports venue booking platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#demo-accounts">Demo Accounts</a> •
  <a href="#attribution">Attribution</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=flat-square&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io" alt="Socket.IO"/>
  <img src="https://img.shields.io/badge/Vite-7.1-646CFF?style=flat-square&logo=vite" alt="Vite"/>
</p>

---

SportSync is a full-stack sports venue booking platform that connects players with ground owners. Users can discover venues, filter them by city, book an available time slot, and track approval, while venue admins manage incoming booking requests from their own dashboard. It's built on the MERN stack (MongoDB, Express, React, Node.js) with real-time chat over Socket.IO and media handled through Cloudinary.

## Features

- **User Authentication** – Email/password signup and login secured with JWT access and refresh tokens.
- **OTP Verification** – Email-based one-time password confirmation before a new account is activated.
- **Ground Discovery** – Browse verified sports venues across multiple cities.
- **Filtering** – Filter the grounds list by city to quickly find what's nearby.
- **Booking Workflow** – Pick a date and time slot, upload payment proof, and submit a booking request for admin approval.
- **Admin Dashboard** – Venue owners approve, reject, or cancel bookings from a dedicated dashboard with live status badges.
- **Image Uploads** – Ground photos and payment screenshots are uploaded and served via Cloudinary.
- **Reviews** – Users can rate and review grounds (up to two reviews per ground).
- **Community Chat** – Real-time chat with text, image, and video messages, powered by Socket.IO.
- **Responsive UI** – A consistent dark "Glass & Steel" interface across desktop and mobile.

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router DOM
- Socket.IO Client
- Plain CSS (custom design system, no UI framework)

**Backend**
- Node.js + Express 5
- Multer for multipart/form-data uploads

**Database**
- MongoDB with Mongoose ODM

**Authentication**
- JWT access + refresh tokens (HTTP-only cookies)
- bcrypt password hashing
- Email-based OTP verification (Nodemailer)

**Cloudinary**
- Stores ground photos, payment screenshots, and chat images/videos

**Socket.IO**
- Powers the real-time community chat (typing indicators, online users, live message delivery)

## Architecture

SportSync follows a standard MERN architecture with a clear separation between client and server:

- The **React (Vite) frontend** renders all pages and talks to the backend exclusively over a versioned REST API (`/api/v1/...`), sending the JWT access token via an HTTP-only cookie on every request.
- The **Express backend** exposes REST routes grouped by domain (users, grounds, bookings, admin, reviews, chat), each backed by a Mongoose model against **MongoDB**.
- **Authentication** is stateless on the client (JWT-based); the backend verifies the access token per request and silently refreshes it using the refresh token when it expires.
- **File uploads** (ground photos, payment screenshots, chat media) are received via Multer, then forwarded to **Cloudinary** for permanent storage — only the resulting URL is persisted in MongoDB.
- **Real-time chat** runs on a separate **Socket.IO** connection alongside the REST API, so messaging doesn't depend on HTTP polling.

## Screenshots

### Login

### Guest Home

### User Home

### Booking

### Admin Dashboard

### Chat

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local instance or Atlas)
- A Cloudinary account (for image/video uploads)
- A Gmail account (for sending OTP emails)

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd SportSync
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` — see [Environment Variables](#environment-variables) for the full list.

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` — see [Environment Variables](#environment-variables).

```bash
npm run dev
```

### 4. (Optional) Seed demo data

From the `backend/` directory:

```bash
node src/seed/seedDemoData.js
```

This populates the database with demo grounds and admin accounts — see [Demo Accounts](#demo-accounts).

### 5. Access the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Environment Variables

Never commit real secrets — the values below are placeholders to fill in yourself.

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (e.g. `8000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URL` | MongoDB connection string (local or Atlas) |
| `CORS_ORIGIN` | Allowed origin for the frontend (e.g. `http://localhost:5173`) |
| `ACCESS_TOKEN_SECRET` | Secret used to sign JWT access tokens |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime (e.g. `15m`) |
| `REFRESH_TOKEN_SECRET` | Secret used to sign JWT refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_USER` | Gmail address used to send OTP emails |
| `EMAIL_PASS` | Gmail App Password (not your regular password) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Base URL of the backend API (e.g. `http://localhost:8000`) |

## Demo Accounts

### User

No demo end-user account is pre-seeded. Create one yourself through the app's **Sign Up** flow (registration requires email OTP verification).

### Admin Accounts

Running the seed script (see [Installation](#installation)) creates six demo ground-admin accounts, one per venue:

| Username | Ground | City |
|---|---|---|
| `rohan_verma` | Elite Football Arena | Delhi |
| `karthik_reddy` | Ace Badminton Club | Bengaluru |
| `aditya_singh` | Victory Cricket Ground | Lucknow |
| `rahul_deshmukh` | Urban Turf | Mumbai |
| `sandeep_rao` | Prime Tennis Court | Hyderabad |
| `vikram_tiwari` | Champions Sports Hub | Prayagraj |

**Password for all admin accounts:** `Demo@1234`

## Project Structure

```
SportSync/
├── backend/
│   └── src/
│       ├── controllers/   # Request handlers / business logic
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express route definitions
│       ├── middlewares/    # Auth, error handling, file uploads
│       ├── sockets/        # Socket.IO chat handlers
│       ├── seed/           # Demo data seed script
│       ├── utils/          # Shared helpers (Cloudinary, API response, OTP, etc.)
│       ├── db/              # Database connection
│       └── app.js / index.js
│
├── frontend/
│   └── src/
│       ├── Login.jsx, SignUp/, Otp/, ChangePass/   # Auth flow
│       ├── GuestHome/, Homepage/                    # Ground discovery (guest / logged-in)
│       ├── GroundBooking/                           # Booking + reviews
│       ├── AdminLogin/, AdminPage/                  # Admin auth + dashboard
│       ├── AddGround/                               # Guest "list your ground" request
│       ├── Chat/                                    # Community chat
│       ├── components/                              # Shared components (layout, background)
│       └── main.jsx                                 # Routing entry point
│
└── README.md
```

## Future Improvements

- A dedicated "My Bookings" view so users can track pending/confirmed status without revisiting a ground's booking page.
- Online payment gateway integration to replace the manual payment-screenshot workflow.
- Sorting and richer filtering (price, rating, sport type) on the grounds list.
- Email or push notifications when a booking is approved or rejected.
- Automated test coverage (unit and integration tests).
- Pagination for large ground and booking lists.

## Attribution

SportSync is based on the open-source **[Playistan](https://github.com/IfBilal/Playistan-ISE)** project, originally created by **M. Bilal Tahir** ([@IfBilal](https://github.com/IfBilal)) and **Taimoor Shaukat** ([@T361](https://github.com/T361)).

It has been significantly modified and localized — a full rebrand, a UI/UX consistency pass, an Indian-market localization of cities, ground names, pricing, and demo data, and an admin-workflow overhaul — and is maintained here as an independent portfolio project. This project does not claim authorship of the original Playistan codebase; credit for that original work belongs to its original creators.
