# Task Tracker — Auth Features

## PR 1: Login (`feature/login` → `develop`)

- [x] Create `task.md` tracker
- [x] Create `LoginDto` with validation + Swagger
- [x] Update `AuthResponseDto` with `@ApiProperty` decorators
- [x] Create `SessionCacheService` (Redis session cache + login rate limiting)
- [x] Extend `TokenService` with `issueTokenPair()` + Redis session caching
- [x] Add `UsersService.updateLastLogin()`
- [x] Implement `AuthService.login()` with credential + verification checks
- [x] Add `POST /auth/login` endpoint with Swagger docs
- [x] Register `SessionCacheService` in `AuthModule`
- [ ] Verify build passes
- [ ] Create PR into `develop`

## PR 2: JWT Auth (`feature/jwt-auth` → `develop`)

- [ ] Pending — after PR 1 merge

## PR 3: Refresh Token (`feature/refresh-token` → `develop`)

- [ ] Pending — after PR 2 merge

## PR 4: Google Social Login (`feature/social-login` → `develop`)

- [ ] Pending — after PR 3 merge
