# Smart AI Health Management System - Production Deployment Guide

## Production Environment Variables

Backend on Render:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
CLIENT_URL=https://<your-vercel-app>.vercel.app
SOCKET_CORS=https://<your-vercel-app>.vercel.app
GEMINI_API_KEY=<google-gemini-api-key>
GEMINI_MODEL=gemini-1.5-flash
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
```

Frontend on Vercel:

```env
REACT_APP_API_URL=https://<your-render-api>.onrender.com/api
REACT_APP_SOCKET_URL=https://<your-render-api>.onrender.com
```

## Build Commands

Backend:

```bash
npm install
npm start
```

Frontend:

```bash
npm install
npm run build
```

## Render Backend Setup

1. Create a Web Service from the backend repository/folder.
2. Set the root directory to `backend` if using a monorepo deployment.
3. Use `npm install` as the build command.
4. Use `npm start` as the start command.
5. Add the backend environment variables above.
6. Confirm `/api/health` returns `Server is running`.

## Vercel Frontend Setup

1. Import the frontend folder as the Vercel project.
2. Set the root directory to `frontend`.
3. Add `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`.
4. Deploy and confirm patient and doctor login flows.

## WebRTC Notes

- Browser camera and microphone access require HTTPS in production.
- The app uses Socket.IO for signaling and a public STUN server for peer discovery.
- For stricter enterprise reliability, add a TURN server such as Twilio, Metered, or Coturn and update `iceServers` in `VideoConsultation.jsx`.
- Keep Render backend and Vercel frontend on HTTPS origins and align `CLIENT_URL` / `SOCKET_CORS`.

## Socket.IO Notes

- Socket.IO CORS must match the deployed frontend URL.
- Existing events are preserved: `doctor-login`, `patient-login`, `join-consultation`, `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`.
- Production events added: `join-user`, `send-message`, `receive-message`, `payment-success`.

## Migration Plan

1. Deploy backend with the additive models and routes.
2. Allow Mongoose to create indexes on first connection, or run `syncIndexes()` in a controlled migration script if your cluster disables auto-indexing.
3. Add doctor payment profile data: `upiId`, `consultationFee`, and optional `qrCodeUrl`.
4. Configure Gemini and Razorpay keys only after base login/appointment/report flows pass.
5. Deploy frontend after backend health, auth, Socket.IO, and dashboard APIs are reachable.
6. Run `node backend/e2e-verification.js` against production-like staging before promoting.

## Verification Checklist

- Patient and doctor login.
- Appointment booking and MongoDB persistence.
- Doctor dashboard appointment visibility.
- Appointment acceptance notification.
- Video consultation room start/join.
- Report and prescription creation.
- Patient dashboard report/prescription visibility.
- Medical history update.
- Report and prescription PDF downloads.
- Patient search from doctor dashboard.
- Payment order, confirmation, invoice PDF, and payment notification.
