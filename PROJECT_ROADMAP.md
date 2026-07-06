# YegnaFinder V2: SRS & Sprint 1 Alignment Report

## 1. Executive Summary: Does the project currently fulfill the SRS?

**Short Answer:** *Partially.* The project has successfully laid a highly robust, production-ready foundation for **Phase 1 (Sprint 1)**, but it has not yet *completed* all Sprint 1 requirements, nor the broader SRS architectural requirements (like Docker/K8s deployment, Social Login, and full PWA frontend setup).

### ✅ What is Fully Achieved (Aligned with SRS & CEO Chat)
- **Backend Tech Stack**: NestJS, TypeScript, PostgreSQL, and Redis are correctly set up.
- **Roles (RBAC)**: `Customer`, `Merchant`, `Moderator`, `Admin` are implemented in `UserRole`.
- **JWT & Refresh Tokens**: Implemented securely with Redis caching, rate limiting, and hash-based token rotation (perfect for PWA stateless security).
- **Core Auth Endpoints**: Register, Login, Verify OTP, Forgot/Reset Password, Logout, and Logout-All are fully functional.
- **PWA Backend Readiness**: The API is fully stateless, uses Bearer tokens, and handles CORS for the frontend origin.

### ❌ What is Missing from Sprint 1 & Core Architecture
1. **Social Login (Google OAuth)**: Required by Sprint 1 but not yet implemented.
2. **Actual OTP Delivery**: OTPs are generated but currently only logged to the console (needs SMS/Email integration).
3. **PWA Frontend Setup**: The Next.js frontend needs a manifest, service workers, and offline storage (via `next-pwa` or Serwist) to meet the CEO's "PWA app is must be noticed" requirement.
4. **DevOps / Deployment**: Dockerfile, `docker-compose.yml`, Kubernetes manifests, and GitHub Actions are missing.
5. **Missing Integrations**: Elasticsearch (Search), Socket.io (Realtime), AWS S3 (Storage), and Firebase (Notifications) are not yet integrated.

---

## 2. Step-by-Step Guide to Fulfill Sprint 1 & PWA Requirements

Below is the exact roadmap to complete the remaining Sprint 1 requirements and make the app a true PWA.

### Phase A: Complete Backend Auth (Sprint 1)

**Step 1: Implement Google Social Login**
1. Install Passport Google Strategy: `npm install @nestjs/passport passport-google-oauth20`
2. Create `GoogleStrategy` in the `AuthModule`.
3. Add a new `POST /auth/google` endpoint that accepts a Google token from the frontend, verifies it, and either registers a new user or logs in an existing one.
4. Update `User` entity to support `googleId` (nullable).

**Step 2: Implement Real OTP Delivery (Email/SMS)**
1. Install an email module (e.g., `@nestjs-modules/mailer` with Nodemailer) or an SMS gateway SDK (like Twilio, or an Ethiopian provider for SMS).
2. Update the `OtpService` to actually dispatch the code to the user's email/phone instead of just generating it.

**Step 3: Dockerize the Backend**
1. Create a `Dockerfile` for the NestJS app (multi-stage build for production).
2. Create a `docker-compose.yml` that spins up PostgreSQL, Redis, and the NestJS app together.
3. Add a basic `.github/workflows/backend-ci.yml` for automated testing.

---

### Phase B: Frontend PWA Transformation

The CEO emphasized the PWA nature of the platform. The Next.js frontend must be upgraded to act like a native app.

**Step 1: Configure Next.js as a PWA**
1. Install next-pwa: `npm install @ducanh2912/next-pwa`
2. Wrap your `next.config.ts` with the PWA configuration:
   ```typescript
   const withPWA = require("@ducanh2912/next-pwa").default({
     dest: "public",
     disable: process.env.NODE_ENV === "development",
     register: true,
     skipWaiting: true,
   });
   module.exports = withPWA({ /* your next config */ });
   ```

**Step 2: Create PWA Manifest & Assets**
1. Generate app icons (192x192, 512x512) and place them in `public/icons/`.
2. Create a `manifest.json` in the `public/` directory defining the app name, theme color (`#0B5C8E` per UI docs), and standalone display mode.
3. Link the manifest in the Next.js root layout.

**Step 3: Implement Offline Fallbacks & Caching**
1. Use a tool like React Query (`@tanstack/react-query`) with persist plugins, or Zustand's persist (which is already used for Auth) to cache API responses.
2. If a user loses internet, they should still see cached business listings and their profile, with a "You are offline" banner.

**Step 4: Prompt to Install (A2HS)**
1. Create a custom "Add to Home Screen" banner or modal that appears when users browse the web app on Chrome/Safari mobile, fulfilling the PWA objective.

---

### Phase C: Infrastructure & Remaining Services Setup

Once Sprint 1 is 100% complete, you will need to lay the ground for Sprint 2 (Discovery & Marketplace).

1. **Storage (AWS S3)**: Install `aws-sdk` or `@aws-sdk/client-s3` in NestJS to handle business logo and user avatar uploads.
2. **Search (Elasticsearch)**: Set up an Elasticsearch Docker container. Sync the PostgreSQL `Businesses` table to an Elasticsearch index for the "AI Smart Search" requirement.
3. **Real-time (Socket.io)**: Install `@nestjs/platform-socket.io` for chat and live booking notifications.
4. **Notifications (Firebase FCM)**: Integrate `firebase-admin` to send push notifications to the PWA service worker and mobile apps.

---

## 3. Recommended Immediate Action

To strictly finish **Sprint 1** right now, you should:
1. Ask me to implement **Google Social Login** on the backend.
2. Ask me to create the **Docker and docker-compose** setup for the backend.
3. Switch over to the frontend repository and ask me to configure the **Next.js PWA setup (Manifest + Service Worker)**.
