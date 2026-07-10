<div align="center">

# SportSync

**A full-stack sports venue booking platform connecting players with local ground owners.**

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose%208-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](#)

[Features](#features) •
[Tech Stack](#tech-stack) •
[Architecture](#architecture) •
[Installation](#installation) •
[Environment Variables](#environment-variables) •
[Deployment](#deployment)

</div>

---

## About

SportSync is a MERN-stack web application that lets users discover local sports venues, filter them by city, and submit time-slot booking requests with payment proof for admin approval. Venue owners manage incoming requests from their own admin dashboard, and registered users can chat with each other in a shared community channel in real time.

The project was built to practice end-to-end product development: authentication and authorization, file uploads, real-time communication, and a multi-role (user/admin) workflow, all on a single self-contained codebase.

> This project is based on the open-source **[Playistan](https://github.com/IfBilal/Playistan-ISE)** codebase and has since been substantially rebranded, restructured, and extended — see [Acknowledgments](#acknowledgments) for full attribution.

## Screenshots

> _Screenshots to be added._

| Login | Guest Home |
|---|---|
| `<screenshot placeholder — login page>` | `<screenshot placeholder — guest landing page>` |

| Venue Booking | Admin Dashboard |
|---|---|
| `<screenshot placeholder — booking flow>` | `<screenshot placeholder — admin dashboard>` |

| Community Chat |
|---|
| `<screenshot placeholder — chat page>` |

## Features

- **User Authentication** — Email/password sign-up and login secured with hashed passwords (bcrypt).
- **JWT Session Management** — Short-lived access tokens paired with refresh tokens, delivered as HTTP-only cookies and silently renewed on expiry.
- **OTP Verification** — New accounts must confirm a one-time passcode sent to their email before the account is activated.
- **Venue Browsing** — Browse verified sports grounds with photos, pricing, rules, and available time slots.
- **City Filtering** — Narrow down the venue list to a specific city.
- **Booking Workflow** — Select a date and slot, upload payment proof, and submit a booking request for admin review (pending → confirmed/rejected).
- **Admin Functionality** — A separate admin login and dashboard for venue owners to approve, reject, or cancel bookings, with live status updates.
- **Reviews** — Users can rate and review a venue (capped at two reviews per user per ground).
- **Community Chat** — Real-time chat (text, image, and video messages) shared across all users, powered by Socket.IO.
- **Responsive UI** — A consistent custom-built interface that adapts across desktop and mobile, with no external UI framework.
- **REST APIs** — A versioned, resource-oriented REST API (`/api/v1/...`) backing every frontend interaction.
- **MongoDB Atlas** — Cloud-hosted MongoDB via Mongoose, with the same setup also working against a local MongoDB instance for development.

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router DOM
- Socket.IO Client
- Plain CSS (custom design system, no UI framework)

**Backend**
- Node.js + Express 5
- Multer (multipart/form-data uploads)
- Socket.IO (real-time chat)

**Database**
- MongoDB with Mongoose ODM (MongoDB Atlas in production, local MongoDB supported for development)

**Authentication**
- JWT access + refresh tokens (HTTP-only cookies)
- bcrypt password hashing
- Email-based OTP verification (Resend)

**Media Storage**
- Cloudinary — ground photos, payment screenshots, and chat images/videos

## Architecture

SportSync follows a standard MERN client-server architecture, with a single REST API serving the frontend and a parallel Socket.IO channel dedicated to chat:

```
┌───────────────┐     REST  /api/v1/...     ┌────────────────┐     Mongoose     ┌───────────────┐
│  React (Vite) │ ────────────────────────▶ │ Express Server │ ───────────────▶ │  MongoDB Atlas│
│     SPA       │ ◀──────────────────────── │   (Node.js)    │ ◀─────────────── │   / Local DB  │
└───────────────┘                           └────────────────┘                  └───────────────┘
        │                                           │
        │        Socket.IO (real-time chat)         │
        └───────────────────────────────────────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │   Cloudinary   │
                                              │ (media storage)│
                                              └────────────────┘
```

- The **React frontend** renders all pages and talks to the backend exclusively through a versioned REST API, sending the JWT access token via an HTTP-only cookie on every request.
- The **Express backend** exposes routes grouped by domain (users, grounds, bookings, admin, reviews, chat), each backed by a Mongoose model.
- **Authentication** is stateless on the client; the backend verifies the access token per request and transparently refreshes it via the refresh token when it expires.
- **File uploads** (ground photos, payment screenshots, chat media) are received through Multer and forwarded to **Cloudinary**; only the resulting URL is persisted in MongoDB.
- **Real-time chat** runs over a dedicated **Socket.IO** connection alongside the REST API, so messaging isn't dependent on HTTP polling.

## Folder Structure

```
SportSync/
├── backend/
│   └── src/
│       ├── controllers/     # Request handlers / business logic
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express route definitions
│       ├── middlewares/      # Auth, error handling, file uploads
│       ├── sockets/          # Socket.IO chat handlers
│       ├── seed/             # Demo data seed script
│       ├── utils/            # Shared helpers (Cloudinary, API response, OTP, etc.)
│       ├── db/               # Database connection
│       └── app.js / index.js # Express app + server entry point
│
├── frontend/
│   └── src/
│       ├── Login.jsx, SignUp/, Otp/, ChangePass/   # Auth flow
│       ├── GuestHome/, Homepage/                    # Venue discovery (guest / logged-in)
│       ├── GroundBooking/                           # Booking + reviews
│       ├── AdminLogin/, AdminPage/                  # Admin auth + dashboard
│       ├── Chat/                                    # Community chat
│       ├── components/                              # Shared components (layout, notifications)
│       └── main.jsx                                 # Routing entry point
│
└── README.md
```

## Installation

### Prerequisites

- Node.js v18 or higher
- A MongoDB database (MongoDB Atlas or a local instance)
- A Cloudinary account (image/video uploads)
- A Resend account (OTP delivery emails)

### 1. Clone the repository

```bash
git clone https://github.com/anishreddy1234/SportSync.git
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
npm run seed
```

This populates the database with a set of demo grounds and matching admin accounts, useful for exploring the app without registering venues manually.

### 5. Access the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Environment Variables

Never commit real secrets — the values below are placeholders to fill in yourself. Both `backend/.env` and `frontend/.env` are already covered by `.gitignore`.

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (e.g. `8000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URL` | MongoDB connection string (Atlas or local) |
| `CORS_ORIGIN` | Allowed origin for the frontend (e.g. `http://localhost:5173`) |
| `ACCESS_TOKEN_SECRET` | Secret used to sign JWT access tokens |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime (e.g. `15m`) |
| `REFRESH_TOKEN_SECRET` | Secret used to sign JWT refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | API key used to send OTP verification emails via Resend |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Base URL of the backend API (e.g. `http://localhost:8000`) |

## Deployment

SportSync is split into two independently deployable pieces:

- **Frontend** — a static Vite build (`npm run build`), deployable to any static host. A `vercel.json` with an SPA rewrite rule is included for deploying to **Vercel**.
- **Backend** — a standard long-running Node/Express process, deployable to any Node host that supports WebSockets (e.g. **Render**, **Railway**, or a VPS), since Socket.IO requires a persistent connection rather than a serverless function.
- **Database** — intended to run against **MongoDB Atlas** in production; the same connection code works against a local MongoDB instance for development.

When deploying, remember to:
1. Set `CORS_ORIGIN` on the backend to the deployed frontend's URL.
2. Set `VITE_BACKEND_URL` on the frontend to the deployed backend's URL.
3. Set `NODE_ENV=production` so cookies are marked `secure`.

## Future Improvements

- A dedicated "My Bookings" view so users can track pending/confirmed status without revisiting a venue's booking page.
- Online payment gateway integration to replace the manual payment-screenshot workflow.
- Richer filtering and sorting (price, rating, sport type) on the venue list.
- Email or push notifications when a booking is approved or rejected.
- Automated test coverage (unit and integration tests).
- Pagination for large venue and booking lists.

## Contributing

This is primarily a personal portfolio project, but suggestions and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes with a clear message.
4. Open a pull request describing the change and why it's needed.

## Author

**Anish Reddy**
- GitHub: [@anishreddy1234](https://github.com/anishreddy1234)

## Acknowledgments

SportSync is based on the open-source **[Playistan](https://github.com/IfBilal/Playistan-ISE)** project, originally created by **M. Bilal Tahir** ([@IfBilal](https://github.com/IfBilal)) and **Taimoor Shaukat** ([@T361](https://github.com/T361)). It has since been substantially rebranded and modified — a full rebrand, a UI/UX consistency pass, an Indian-market localization of cities, venue data, and pricing, and an admin-workflow overhaul — and is maintained here as an independent portfolio project. Credit for the original codebase belongs to its original creators.
