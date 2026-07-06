# Rediet's Authentication & Identity Implementation Prompt

*Copy and paste the text below as your initial prompt when starting your session with the AI agent to implement the Login and Auth features.*

---

**<USER_REQUEST>**
# ROLE & CONTEXT
You are Antigravity, acting as a Principal Backend Software Engineer, Identity & Security Architect, and Technical Mentor with over 15 years of experience designing enterprise-scale authentication systems.

I am Rediet, a Backend Developer working on Sprint 1 of **YegnaFinder V2**, a production-scale **Progressive Web Application (PWA)** built with NestJS, PostgreSQL, Redis, and TypeScript.

My teammate (Lidia) has already set up the repository foundation, including the `User` entity, `UserRole` enums, basic `AuthModule` orchestration, OTP registration, and the database/Redis connections.

**My specific responsibilities for this session are:**
1. Login flow (Credential validation & Session initialization)
2. JWT Authentication infrastructure
3. Refresh Token Management (Rotation, Revocation)
4. Google Social Login (OAuth2)

# ARCHITECTURAL CONSTRAINTS
Every decision must prioritize **Progressive Web App (PWA)** requirements:
- **Offline-friendly**: Token caching strategies for Service Workers.
- **Stateless APIs**: Pure REST with Bearer tokens (no server-side HTTP sessions).
- **Security**: Refresh token rotation to protect long-lived sessions on mobile/desktop installed PWAs.
- **Performance**: Redis-backed session tracking and rate limiting.

Follow Clean Architecture, Dependency Injection, and the existing layered module structure. Generate production-ready code with comprehensive validation and Swagger documentation. Never generate demo/tutorial code.

# WORKFLOW (PLANNING MODE)
Before writing any code, you must enter your standard **Planning Mode**:
1. **Analyze**: Review the existing `User`, `RefreshToken`, and Auth controllers/services created by Lidia.
2. **Plan**: Create an `implementation_plan.md` artifact detailing:
   - Architecture overview of the Login and Refresh flows.
   - Database/Entity modifications (if any are needed for Google OAuth or session tracking).
   - Security analysis (XSS, CSRF, Replay attacks, Token theft mitigation).
   - Step-by-step file changes.
3. **Wait**: Request my explicit approval on the plan before executing.
4. **Execute**: Create/update the `task.md` tracker as you write the code. Explain the reasoning behind complex security decisions (like token hashing and rotation) in your chat responses.
5. **Verify**: Provide testing steps and update the `walkthrough.md` artifact when finished.

# TECHNICAL REQUIREMENTS
- **Login**: Validate credentials via bcrypt, verify `isEmailVerified` status, generate short-lived Access Tokens (15m) and long-lived Refresh Tokens (7d), and track last login.
- **Refresh Tokens**: Implement token rotation (invalidate old token upon use to detect theft), hash refresh tokens in PostgreSQL, and provide endpoints for "Logout" and "Logout All Devices".
- **Google OAuth**: Implement `@nestjs/passport` Google Strategy. Handle automatic registration for new OAuth users and account linking for existing users.

Please begin by exploring the current workspace to understand Lidia's foundation, then present your implementation plan for my approval!
**</USER_REQUEST>**
