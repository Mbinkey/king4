# APEX Motors - Premium Car Dealership Platform

A production-ready, full-stack car dealership platform built with React, Tailwind CSS, and Node.js/SQLite.

## Features

- **Premium Design**: Custom orange/black luxury aesthetic with advanced animations.
- **Full Inventory Management**: Admin panel to add, edit, delete vehicles.
- **Order System**: Global order processing with status tracking.
- **Test Drive Scheduling**: Appointment management system.
- **Secure Admin Panel**: Protected routes and authentication.
- **Real Database**: SQLite backend (server-side) + IndexedDB fallback (client-side demo).

## Project Structure

- `src/`: Frontend React application
- `server/`: Backend Express + SQLite application
- `dist/`: Production build output

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (Preview)
The application is configured to run in a "Serverless/Client-Side" mode by default for immediate preview without setting up a backend process. It uses a robust IndexedDB implementation that mirrors the real backend API.

```bash
npm run dev
```

### 3. Run with Real Backend (Production)
To switch to the full Node.js backend:

1.  Start the backend server:
    ```bash
    node server/index.js
    ```
2.  Update `src/lib/database.ts` or create an API adapter to point to `http://localhost:5000/api`.
3.  Run the frontend:
    ```bash
    npm run dev
    ```

## Admin Access

- **Login URL**: `/admin`
- **Username**: `Fod@y@kings auto`
- **Password**: `7727113j`

## Deployment (Real Server)

To deploy this application so that orders are received from anywhere in the world:

1.  **Use a Node.js Hosting Provider** (e.g., Render, Railway, Heroku).
2.  **Environment Variables**:
    -   Set `VITE_USE_SERVER` to `true`.
    -   Set `JWT_SECRET` to a secure random string.
3.  **Build Command**:
    ```bash
    npm install && npm run build
    ```
4.  **Start Command**:
    ```bash
    npm start
    ```

This will launch the Node.js server which serves both the API and the React frontend.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: Node.js, Express, SQLite
- **Database**: SQLite (Server) / IndexedDB (Client Fallback)
