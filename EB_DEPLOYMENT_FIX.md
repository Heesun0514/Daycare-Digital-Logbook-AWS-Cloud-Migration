# Elastic Beanstalk Deployment Fix

## Problem Statement
The Elastic Beanstalk environment was broken due to:
1. Incorrect backend.zip structure (files nested in subdirectory)
2. Missing .ebextensions configuration
3. Application exiting on database connection failure
4. Dockerfile interfering with EB Node.js platform

## Solution
This PR fixes the EB deployment by:

### 1. Added EB Configuration Files
- `.ebextensions/nodecommand.config` - Configure Node.js platform to run server.js
- `.ebextensions/env.config` - Define environment variables
- `.ebextensions/npm.config` - Configure npm and dependencies

### 2. Fixed Application Code
- **database.js**: No longer exits on connection failure; returns status instead
- **server.js**: Handles missing frontend directory gracefully; added /health endpoint
- **models.js**: Properly exports sequelize instance

## Deployment Instructions

### Step 1: Set Environment Variables in EB Console
Go to your EB environment → Configuration → Software:
```
DB_HOST = your-rds-endpoint.eu-west-1.rds.amazonaws.com
DB_USER = postgres
DB_PASSWORD = your-password
DB_NAME = daycare_db
DB_PORT = 5432
JWT_SECRET = your-secret-key
NODE_ENV = production
```

### Step 2: Create Correct backend.zip
```bash
cd backend
zip -r ../backend.zip \
  server.js \
  package.json \
  package-lock.json \
  models.js \
  database.js \
  auth.js \
  .ebextensions/

cd ..
# Verify: unzip -l backend.zip | head
# Should show files at root, NOT backend/ subdirectory
```

### Step 3: Delete Broken EB Environment
1. Go to AWS Elastic Beanstalk Console
2. Terminate current environment
3. Wait for termination to complete

### Step 4: Create New EB Environment
1. Create environment
2. Platform: **Node.js 22 running on 64bit Amazon Linux 2023** (NOT Docker)
3. Upload the new backend.zip
4. Wait for deployment

### Step 5: Verify Deployment
```bash
# Check health endpoint
curl https://your-eb-url.elasticbeanstalk.com/health

# Test login
curl -X POST https://your-eb-url.elasticbeanstalk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","role":"Teacher"}'

# Test attendance endpoint
curl https://your-eb-url.elasticbeanstalk.com/api/attendance/report?from=2024-01-01&to=2024-12-31
```

## Key Changes
- ✅ App no longer crashes on startup if DB is unreachable
- ✅ Graceful degradation when frontend directory doesn't exist
- ✅ Proper EB Node.js platform configuration
- ✅ Health check endpoint for monitoring
- ✅ Better error logging

## Testing Checklist
- [ ] EB environment health check passes
- [ ] `/health` endpoint returns 200
- [ ] `/api/auth/login` returns JWT token
- [ ] `/api/attendance/report` returns data or empty array
- [ ] Attendance routes work end-to-end
