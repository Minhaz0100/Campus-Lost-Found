# Campus Lost & Found

![Campus Lost & Found](https://img.shields.io/badge/Campus%20Lost%20%26%20Found-full--stack%20platform-0f766e?style=for-the-badge)
![MERN](https://img.shields.io/badge/Stack-MERN%20%2B%20Vite%20%2B%20Tailwind-111827?style=for-the-badge)
![Status](https://img.shields.io/badge/Project-Active-success?style=for-the-badge)

Campus Lost & Found is a full-stack campus recovery platform built to help students report lost or found items, discover matches on an interactive map, verify claims securely, and chat in real time with other users.

The app combines a React frontend, an Express/MongoDB backend, AI-assisted matching, QR-based item verification, notifications, and admin moderation into one cohesive workflow.

**🚀 [Live Demo](https://campus-lost-and-found-phi.vercel.app)**

## Highlights

- Report lost or found items with photos, location, and item details.
- Search and filter posts by category, keyword, status, and location.
- Use AI to suggest likely matches between lost and found items.
- Verify claims with custom questions and proof submission.
- Chat directly with other users about an item.
- Manage reports, approvals, and moderation from an admin dashboard.
- Track reputation, badges, and leaderboard activity.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Leaflet
- Backend: Node.js, Express, MongoDB, Mongoose, Socket.io
- Auth: JWT, bcrypt
- Media and AI: Multer, Cloudinary, Sharp, Tesseract, QR code generation
- Notifications: In-app notifications, email, Firebase push support

## Project Structure

```text
.
├── backend/      # Express API, models, middleware, services, tests
├── frontend/     # React + Vite app, pages, components, context, services
├── package.json  # Root scripts for running both apps together
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- MongoDB, or let the app fall back to its in-memory development database when supported

### Install Dependencies

```bash
npm run install:all
```

### Run the App in Development

```bash
npm run dev
```

This starts:

- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Start the Backend in Production Mode

```bash
npm start
```

## Environment Variables

Create a `.env` file inside `backend/` and configure the values you need:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@campus.edu
ADMIN_PASSWORD=***********
```

Optional integrations:

- SMTP settings for email delivery
- Cloudinary credentials for image hosting
- Firebase service account values for push notifications

For the frontend, you can set `VITE_API_URL` in `frontend/.env` if your API is hosted elsewhere.

## Key Features

### Item Reporting

Students can submit lost or found posts with descriptions, category tags, images, and location information.

### AI Match Suggestions

The backend scores item similarity using shared keywords, image features, perceptual hashes, and serial or barcode matches to surface strong candidate matches.

### Claim Verification

Claimants can submit proof, answer verification questions, and pass review by the item owner or an admin.

### Real-Time Chat

Each item has a dedicated chat flow powered by Socket.io so users can coordinate a handoff quickly.

### Admin Tools

Admins can approve items, review reports, manage claims, and moderate users from a dedicated dashboard.

## Development Notes

- The frontend uses Vite and proxies API requests to the backend during development.
- The backend serves the production build from `frontend/dist` when deployed.
- If MongoDB is unavailable in local development, the app can fall back to an in-memory database depending on your configuration.

## License

No license file is currently included. Add one if you plan to publish or distribute the project.

## Project Snapshot

If you want more implementation detail, see [project.md](project.md).
