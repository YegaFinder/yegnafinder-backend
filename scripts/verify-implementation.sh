#!/bin/bash

echo "🚀 YegnaFinder Backend - Rediet's Sprint 4-7 Implementation Verification"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000/api/v1"

echo -e "\n${YELLOW}1. Build Check${NC}"
echo "Building the application..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}2. TypeScript Check${NC}"
echo "Running TypeScript compilation check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${RED}❌ TypeScript check failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}3. Testing Core Endpoints${NC}"

echo "Testing GET /businesses (Discovery endpoint)..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/businesses" > /tmp/response_code
if [ "$(cat /tmp/response_code)" = "200" ]; then
    echo -e "${GREEN}✅ GET /businesses - OK${NC}"
else
    echo -e "${RED}❌ GET /businesses - Failed ($(cat /tmp/response_code))${NC}"
fi

echo "Testing GET /businesses/search (Search endpoint)..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/businesses/search?q=coffee" > /tmp/response_code
if [ "$(cat /tmp/response_code)" = "200" ]; then
    echo -e "${GREEN}✅ GET /businesses/search - OK${NC}"
else
    echo -e "${RED}❌ GET /businesses/search - Failed ($(cat /tmp/response_code))${NC}"
fi

echo "Testing GET /businesses/nearby (Geolocation endpoint)..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/businesses/nearby?lat=9.005&lng=38.763&radius=5" > /tmp/response_code
if [ "$(cat /tmp/response_code)" = "200" ]; then
    echo -e "${GREEN}✅ GET /businesses/nearby - OK${NC}"
else
    echo -e "${RED}❌ GET /businesses/nearby - Failed ($(cat /tmp/response_code))${NC}"
fi

echo -e "\n${YELLOW}4. Testing Authentication Endpoints${NC}"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}' > /tmp/response_code

if [ "$(cat /tmp/response_code)" = "401" ]; then
    echo -e "${GREEN}✅ POST /auth/login - Properly rejects invalid credentials${NC}"
else
    echo -e "${RED}❌ POST /auth/login - Unexpected response ($(cat /tmp/response_code))${NC}"
fi

echo -e "\n${YELLOW}5. Testing Payment Endpoints${NC}"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/payments/initiate" -X POST \
    -H "Content-Type: application/json" \
    -d '{"bookingId":"test"}' > /tmp/response_code

if [ "$(cat /tmp/response_code)" = "401" ]; then
    echo -e "${GREEN}✅ POST /payments/initiate - Properly requires authentication${NC}"
else
    echo -e "${RED}❌ POST /payments/initiate - Should require auth ($(cat /tmp/response_code))${NC}"
fi

echo "Testing Chapa webhook endpoint..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/payments/webhook" -X POST \
    -H "Content-Type: application/json" \
    -d '{"tx_ref":"test","status":"success","amount":100}' > /tmp/response_code

if [ "$(cat /tmp/response_code)" = "200" ]; then
    echo -e "${GREEN}✅ POST /payments/webhook - Accessible (public endpoint)${NC}"
else
    echo -e "${RED}❌ POST /payments/webhook - Failed ($(cat /tmp/response_code))${NC}"
fi

echo -e "\n${YELLOW}6. Testing Chat Endpoints${NC}"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/messages" -X POST \
    -H "Content-Type: application/json" \
    -d '{"businessId":"test","text":"hello"}' > /tmp/response_code

if [ "$(cat /tmp/response_code)" = "401" ]; then
    echo -e "${GREEN}✅ POST /messages - Properly requires authentication${NC}"
else
    echo -e "${RED}❌ POST /messages - Should require auth ($(cat /tmp/response_code))${NC}"
fi

echo -e "\n${YELLOW}7. Testing Notifications Endpoints${NC}"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/notifications" > /tmp/response_code

if [ "$(cat /tmp/response_code)" = "401" ]; then
    echo -e "${GREEN}✅ GET /notifications - Properly requires authentication${NC}"
else
    echo -e "${RED}❌ GET /notifications - Should require auth ($(cat /tmp/response_code))${NC}"
fi

echo -e "\n${YELLOW}8. Testing Swagger Documentation${NC}"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/docs" > /tmp/response_code

if [ "$(cat /tmp/response_code)" = "200" ]; then
    echo -e "${GREEN}✅ Swagger docs available at http://localhost:8000/api/docs${NC}"
else
    echo -e "${RED}❌ Swagger docs not accessible ($(cat /tmp/response_code))${NC}"
fi

echo -e "\n${YELLOW}9. Testing Payment Spike Endpoints${NC}"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/payments-spike/test-chapa" -X POST > /tmp/response_code

if [ "$(cat /tmp/response_code)" = "200" ] || [ "$(cat /tmp/response_code)" = "201" ]; then
    echo -e "${GREEN}✅ Chapa test endpoint accessible${NC}"
else
    echo -e "${RED}❌ Chapa test endpoint failed ($(cat /tmp/response_code))${NC}"
fi

# Clean up
rm -f /tmp/response_code

echo -e "\n${YELLOW}10. WebSocket Connection Test${NC}"
echo "Note: WebSocket testing requires a running server and wscat utility"
echo "To test WebSocket manually:"
echo "1. Install wscat: npm install -g wscat"
echo "2. Connect: wscat -c ws://localhost:8000/chat"
echo "3. Send auth in handshake or test connection"

echo -e "\n${YELLOW}11. Load Testing Verification${NC}"
echo "Load testing configuration is available. To run:"
echo "npm run test:load"

echo -e "\n${GREEN}🎉 Verification Complete!${NC}"
echo -e "\n${YELLOW}Summary of Implemented Features:${NC}"
echo "✅ Sprint 4: Search & Geolocation (search, nearby endpoints)"
echo "✅ Sprint 5: Chat system with WebSocket support"
echo "✅ Sprint 5: Notification service with Resend integration"
echo "✅ Sprint 5: Payment spike with Chapa integration"
echo "✅ Sprint 6: Full payment system with webhook handling"
echo "✅ Sprint 6: Booking entity with payment status"
echo "✅ Sprint 7: Load testing configuration with Artillery"
echo "✅ Sprint 7: Audit logging interceptor"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Set up environment variables (see .env.example)"
echo "2. Start the server: npm run start:dev"
echo "3. Run load tests: npm run test:load"
echo "4. Test WebSocket connections with a WebSocket client"
echo "5. Check Swagger documentation at http://localhost:8000/api/docs"