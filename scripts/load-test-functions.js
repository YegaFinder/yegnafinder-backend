module.exports = {
  setAuthToken,
  $randomFirstName,
  $randomLastName,
  $randomEmail,
  $randomPhoneNumber,
  $futureDate,
};

// Set a test authentication token
function setAuthToken(requestParams, context, ee, next) {
  // In a real scenario, this would be a valid JWT token
  // For load testing, you might want to use a long-lived test token
  context.vars.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkxvYWQgVGVzdCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.test-token-for-load-testing';
  return next();
}

// Generate random first name
function $randomFirstName() {
  const names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'James', 'Lisa', 'Robert', 'Maria'];
  return names[Math.floor(Math.random() * names.length)];
}

// Generate random last name
function $randomLastName() {
  const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  return names[Math.floor(Math.random() * names.length)];
}

// Generate random email
function $randomEmail() {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const username = 'loadtest' + Math.floor(Math.random() * 10000);
  return `${username}@${domain}`;
}

// Generate random Ethiopian phone number
function $randomPhoneNumber() {
  const prefixes = ['091', '092', '093', '094'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${suffix}`;
}

// Generate future date for appointments
function $futureDate() {
  const now = new Date();
  const futureTime = now.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in next 7 days
  const futureDate = new Date(futureTime);
  
  // Set to business hours (9 AM to 5 PM)
  futureDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
  
  return futureDate.toISOString();
}