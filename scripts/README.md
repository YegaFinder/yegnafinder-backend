# Load Testing

This directory contains load testing configuration for the YegnaFinder backend API using Artillery.

## Setup

1. Install Artillery globally (optional):
   ```bash
   npm install -g artillery
   ```

2. Or use it through npx (included in the npm scripts).

## Running Load Tests

### Quick Test
```bash
npm run test:load
```

### Generate Report
```bash
npm run test:load:report
```

This will generate a detailed HTML report with metrics and graphs.

### Manual Run
```bash
npx artillery run scripts/load-test.yml
```

## Test Scenarios

The load test includes the following scenarios:

1. **Business Discovery Flow (40% weight)**
   - GET /businesses
   - GET /businesses/search?q=coffee
   - GET /businesses/nearby (with coordinates)
   - GET /businesses/:id

2. **Authentication Flow (20% weight)**
   - POST /auth/register
   - POST /auth/login

3. **Booking Flow (25% weight)**
   - Authenticated requests
   - GET /businesses
   - POST /bookings

4. **Chat Flow (10% weight)**
   - POST /messages
   - GET /messages/:businessId

5. **Payment Flow (5% weight)**
   - POST /bookings
   - POST /payments/initiate

## Test Configuration

- **Duration**: 15 minutes total (5 min ramp-up, 5 min sustained, 5 min ramp-down)
- **Peak Load**: 20 concurrent users
- **Target**: http://localhost:8000

## Metrics

Artillery will provide metrics including:

- Request rate (req/sec)
- Response times (min, max, median, p95, p99)
- Success/error rates
- Scenario completion rates

## Notes

- Ensure the backend server is running before executing load tests
- For authenticated endpoints, the test uses mock tokens (update `load-test-functions.js` for real tokens)
- Test data is generated randomly using the helper functions
- WebSocket testing is simulated via HTTP endpoints (real WebSocket load testing would require additional setup)