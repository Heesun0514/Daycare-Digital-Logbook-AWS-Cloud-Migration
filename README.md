# 🏫 Daycare Digital Logbook - AWS Cloud Migration

A professional attendance management system for daycare centers with **ECCE compliance tracking**, built with modern cloud technologies.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Technology Stack](#-technology-stack)
4. [Architecture](#-architecture)
5. [Installation & Setup](#-installation--setup)
6. [Database Schema](#-database-schema)
7. [API Endpoints](#-api-endpoints)
8. [User Roles & Access Control](#-user-roles--access-control)
9. [ECCE Compliance Tracking](#-ecce-compliance-tracking)
10. [Deployment](#-deployment)
11. [Testing](#-testing)
12. [Security & Best Practices](#-security--best-practices)
13. [Project Structure](#-project-structure)
14. [Learning Outcomes](#-learning-outcomes)

---

## 🎯 Project Overview

This project is a **cloud-based attendance and compliance tracking system** designed for Irish daycare centers receiving government **ECCE (Early Childhood Care and Education)** funding. It manages daily check-in/check-out operations and automatically calculates compliance with funding requirements.

### Key Goals

- ✅ Migrate from local SQLite to cloud-based PostgreSQL (AWS RDS)
- ✅ Implement secure AWS Cognito authentication
- ✅ Deploy frontend on CloudFront + S3
- ✅ Deploy backend on AWS Elastic Beanstalk
- ✅ Track ECCE compliance (15 hours/week minimum)
- ✅ Provide role-based access (Teacher, Director, Parent)

---

## ✨ Features

### For Teachers

- 👶 **Check-in Children** — Select child from dropdown, record arrival time
- 🚪 **Check-out Children** — Record departure time for completed sessions
- 📋 **View Daily Attendance** — See today's attendance table with status
- ✏️ **Edit Records** — Modify arrival/departure times if needed
- 📊 **Generate Reports** — Export attendance data for date ranges (CSV download)

### For Directors

- 🔍 **All Teacher Features** (check-in, check-out, reports)
- 📈 **ECCE Compliance Reports** — Track hours per child, compliance status
- 🎨 **Color-coded Status**
  - 🟢 ✅ **Compliant** (≥15 hours/week)
  - 🟡 ⚠️ **At Risk** (10–15 hours)
  - 🔴 ❌ **Non-Compliant** (<10 hours)
- 📥 **Download ECCE CSV** — Export compliance data for audits

### For Parents

- 👨‍👩‍👧 **View Child Status** — Check if child is at daycare (by parent email)
- 🔐 **Public Access** — View child status from login page without login

---

## 🛠 Technology Stack

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | Vanilla JavaScript (ES6+) |
| UI | HTML5 + CSS3 |
| Hosting | AWS CloudFront + S3 (static) |
| State | In-memory + localStorage for tokens |

### Backend

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Sequelize (Node.js ORM for databases) |
| Authentication | AWS Cognito + JWT |
| Hosting | AWS Elastic Beanstalk (EC2) |

### Database

| Component | Technology |
|-----------|-----------|
| Type | PostgreSQL (relational) |
| Hosting | AWS RDS (Relational Database Service) |
| Tables | `children`, `attendance` |
| Relationships | One-to-Many (Child → Attendance) |

### Infrastructure

| Service | Purpose |
|---------|---------|
| CloudFront | Frontend CDN distribution |
| S3 | Frontend static file storage |
| Elastic Beanstalk | Backend API compute |
| AWS Cognito | User pool / authentication |
| AWS Secrets Manager | Credential storage |

---

## 🏗 Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────────┐      ┌──────────────────────────┐    │
│   │   CloudFront CDN     │      │      AWS Cognito         │    │
│   │  (Frontend, HTTPS)   │◄─────┤    (Authentication)      │    │
│   │  d2d7c2s58id62i...   │      │   (JWT Token Issuer)     │    │
│   └──────────────────────┘      └──────────────────────────┘    │
│              ▲                                                  │
│              │                                                  │
│              │                                                  │
│              ▼                                                  │
│   ┌──────────────────────────┐                                  │
│   │   Elastic Beanstalk      │                                  │
│   │   (Backend API, Node.js) │                                  │
│   │   Port: 8080             │                                  │
│   └──────────────────────────┘                                  │
│              │                                                  │
│              ▼                                                  │
│   ┌──────────────────────────┐                                  │
│   │        AWS RDS           │                                  │
│   │      PostgreSQL          │                                  │
│   │  (children, attendance)  │                                  │
│   └──────────────────────────┘                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐
│      Local Development          │
├─────────────────────────────────┤
│ ├─ Backend:  localhost:8080     │
│ ├─ Frontend: index.html         │
│ └─ Database: RDS (remote)       │
└─────────────────────────────────┘
```

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 14+ and npm
- PostgreSQL client (`psql`)
- Git
- AWS Account (for cloud deployment)
- Cognito User Pool setup

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/Heesun0514/Daycare-Digital-Logbook-AWS-Cloud-Migration.git
cd Daycare-Digital-Logbook-AWS-Cloud-Migration/backend

# 2. Install dependencies
npm install

# 3. Create .env file with your credentials
cat > .env << EOF
# Database (AWS RDS)
DB_HOST=your-rds-endpoint.eu-west-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=daycare_db

# Cognito
COGNITO_REGION=eu-west-1
COGNITO_USER_POOL_ID=eu-west-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
COGNITO_CLIENT_SECRET=xxxxx

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=8080
NODE_ENV=development
EOF

# 4. Run the server
npm start
# 🚀 Server running on http://localhost:8080
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd ../frontend

# 2. Update API_BASE in app.js (if needed)
#    For local testing: http://localhost:8080
#    For production:    your Elastic Beanstalk URL

# 3. Open in browser
open index.html

# OR: Deploy to S3 + CloudFront
aws s3 sync . s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Database Setup

```bash
# 1. Connect to RDS
psql -h your-rds-endpoint.eu-west-1.rds.amazonaws.com -U postgres -d daycare_db

# 2. Create tables (Sequelize does this automatically)
#    Just run the backend, it will sync models

# 3. Seed test data (optional)
node backend/reset-data.js
```

---

## 🗄 Database Schema

### Children Table

```sql
CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    child_name VARCHAR(255) UNIQUE NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Example Data:**

| id | child_name | parent_email | created_at |
|----|------------|--------------|------------|
| 1 | Emma Johnson | emma.johnson@gmail.com | 2026-09-11 |
| 2 | Sofia Kelly | sofia.kelly@gmail.com | 2026-09-11 |
| 3 | Liam Murphy | liam.murphy@gmail.com | 2026-09-11 |

### Attendance Table

```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id),
    child_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255),
    arrival_time VARCHAR(5),      -- HH:MM format
    departure_time VARCHAR(5),    -- HH:MM format
    date VARCHAR(10)              -- YYYY-MM-DD format
);
```

**Example Data:**

| id | child_id | child_name | arrival_time | departure_time | date |
|----|----------|------------|--------------|----------------|------|
| 1 | 1 | Emma Johnson | 09:00 | 15:30 | 2026-09-11 |
| 2 | 1 | Emma Johnson | 09:15 | 15:45 | 2026-09-10 |

---

## 🔌 API Endpoints

### Authentication

```http
POST /api/auth/login
- Body: { email, password }
- Response: { token, idToken, accessToken, email, role }
- Auth: None (public)

GET /api/auth/me
- Response: { user, message }
- Auth: JWT Bearer Token
```

### Attendance (Check-in / Check-out)

```http
POST /api/attendance/checkin
- Body: { child_name, arrival_time, date }
- Response: { id, child_name, arrival_time, date, message }
- Auth: Required (Teacher/Director)

PUT /api/attendance/checkout/:id
- Body: { departure_time }
- Response: { success, message, record }
- Auth: Required (Teacher/Director)

PUT /api/attendance/:id
- Body: { arrival_time?, departure_time?, date? }
- Response: { success, message, record }
- Auth: Required (Teacher/Director)
```

### Reports

```http
GET /api/attendance/report
- Query: ?from=2026-09-08&to=2026-09-14
- Response: { success, message, record: [...] }
- Auth: Required (Teacher/Director)

GET /api/attendance/ecce-report
- Query: ?from=2026-09-08&to=2026-09-14
- Response: { success, period, required_hours, report: [...] }
- Auth: Required (all roles)
```

### Children Management

```http
GET /api/children
- Response: { success, children: [{ id, child_name }, ...] }
- Auth: Required (all roles)
```

### Health Check

```http
GET /health
- Response: { status, database }
- Auth: None (public)
```

---

## 👥 User Roles & Access Control

### Teacher

- ✅ Check-in children
- ✅ Check-out children
- ✅ View today's attendance
- ✅ Edit attendance records
- ✅ Generate reports (any date range)
- ❌ View ECCE compliance (director only)

### Director

- ✅ All Teacher features
- ✅ View ECCE compliance reports
- ✅ Generate ECCE compliance data
- ✅ Download ECCE CSV exports

### Parent

- ✅ View child status (by parent email)
- ❌ Requires no login
- ❌ Access is public (email-based)

---

## 📊 ECCE Compliance Tracking

### What is ECCE?

**ECCE (Early Childhood Care and Education)** is an Irish government program providing childcare funding. To qualify:

| Requirement | Duration | Hours/Week |
|-------------|----------|------------|
| Daily attendance | 3 hours/day | 15 hours/week minimum |
| Weekly schedule | 5 days/week | Mon–Fri |
| Annual target | 38 weeks/year | 570 hours/year |

### Compliance Status

**Status Calculation:**

```javascript
// For a given date range (e.g., one week)
const totalHours = sumOf(attendance records);
const requiredHours = 15;  // minimum per week

if (totalHours >= 15) {
    status = 'COMPLIANT';        // ✅ 100% eligible
} else if (totalHours >= 10) {
    status = 'AT RISK';          // ⚠️ 66–99% eligible
} else {
    status = 'NON-COMPLIANT';    // ❌ <66% eligible
}
```

### Example Report

**Period:** 2026-09-07 to 2026-09-13 (1 week)
**Required:** 15 hours/week

| Child | Days | Hours | % Complete | Status |
|-------|------|-------|------------|--------|
| Emma Johnson | 5 | 32.5 | 217% | ✅ COMPLIANT |
| Sofia Kelly | 3 | 9.0 | 60% | ⚠️ AT RISK |
| Liam Murphy | 1 | 3.0 | 20% | ❌ NON-COMPLIANT |

---

## 🚀 Deployment

### Local Development

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
open frontend/index.html

# Login with Cognito credentials
# Test with: teacher@daycare.local (Teacher role)
```

### AWS Deployment

#### Step 1: Deploy Backend (Elastic Beanstalk)

```bash
# 1. Create Elastic Beanstalk environment
eb init -p node.js-14 daycare-backend-env

# 2. Create environment
eb create daycare-backend-env --instance-type t3.micro

# 3. Deploy code
eb deploy

# 4. Check logs
eb logs
```

#### Step 2: Deploy Frontend (S3 + CloudFront)

```bash
# 1. Create S3 bucket
aws s3 mb s3://daycare-frontend-huiseon --region eu-west-1

# 2. Enable static website hosting
aws s3 website s3://daycare-frontend-huiseon \
    --index-document index.html \
    --error-document index.html

# 3. Upload files
aws s3 sync frontend/ s3://daycare-frontend-huiseon

# 4. Create CloudFront distribution
aws cloudfront create-distribution \
    --origin-domain-name daycare-frontend-huiseon.s3.eu-west-1.amazonaws.com \
    --default-root-object index.html
```

#### Step 3: Configure CORS

```javascript
// In backend/server.js, CORS is already configured
const corsOptions = {
    origin: [
        'http://localhost:8080',
        'https://d2d7c2s58id62i.cloudfront.net',
        'http://daycare-frontend-huiseon.s3-website-eu-west-1.amazonaws.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

## 🧪 Testing

### Manual Testing

#### Test 1: Teacher Check-in / Check-out

```bash
# 1. Start backend
npm start

# 2. Open frontend
open frontend/index.html

# 3. Login
Email:    teacher@daycare.local
Password: your_password
Role:     Teacher

# 4. Check-in
Select child: "Emma Johnson"
Time:         09:00
Date:         Today
Click:        ✅ Check In Now

# 5. Check-out
Record ID: 1 (from table)
Time:      15:30
Click:     🚪 Check Out Now

# 6. Verify
Attendance table shows: ✅ Departed
```

#### Test 2: ECCE Compliance (Director)

```bash
# 1. Login as Director
Email: director@daycare.local
Role:  Director

# 2. Generate ECCE Report
From:  2026-09-08
To:    2026-09-14
Click: 📋 Generate ECCE Report

# 3. Verify
- Table shows compliance status (✅/⚠️/❌)
- Download button works
```

#### Test 3: Parent View

```bash
# 1. From login page
Enter email: emma.johnson@gmail.com
Click:       🔍 View

# 2. Verify
- Shows Emma Johnson's status
- Shows arrival/departure times
- Shows "At Daycare" or "Picked Up" status
```

### Automated Testing

```bash
# Test backend health
curl http://localhost:8080/health

# Expected response:
# {"status":"✅ Healthy","database":"Connected"}

# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"password"}'

# Test children endpoint
curl http://localhost:8080/api/children \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Security & Best Practices

### Authentication

- ✅ AWS Cognito for user pool management
- ✅ JWT tokens with 5-minute expiry
- ✅ `SECRET_HASH` for Cognito authentication flow
- ✅ 5-minute auto-logout on inactivity

### Data Protection

- ✅ SSL/TLS for all API calls
- ✅ HTTPS for CloudFront distribution
- ✅ Role-based access control (RBAC)
- ✅ Password-hashed storage (Cognito)

### Environment Variables

> ⚠️ **NEVER commit `.env` files!**

```bash
# .gitignore protects these
.env          ← Database credentials
.env.local    ← Local development
```

### Token Storage

- ✅ JWT stored in `localStorage` (for UX)
- ⚠️ Note: Also kept in memory for stateless API

### CORS Configuration

- ✅ Only CloudFront, S3, and localhost allowed
- ✅ No wildcard origins (`*`)

---

## 📝 Project Structure

```text
daycare-digital-logbook/
├── backend/
│   ├── server.js           # Express app, routes
│   ├── auth.js             # Cognito + JWT logic
│   ├── models.js           # Sequelize models (Child, Attendance)
│   ├── database.js         # Database connection
│   ├── package.json        # Dependencies
│   ├── .env                # Environment variables (gitignored)
│   └── reset-data.js       # Seed script for testing
├── frontend/
│   ├── index.html          # UI with 6 sections
│   ├── app.js              # Frontend logic (800+ lines)
│   └── README_FRONTEND.md  # Frontend documentation
├── .gitignore              # Protects .env, node_modules
├── README.md               # This file
└── DEPLOYMENT.md           # AWS deployment guide
```

---

## 🎓 Learning Outcomes

This project demonstrates:

1. **Cloud Migration** — From local SQLite to AWS RDS PostgreSQL
2. **Serverless Authentication** — AWS Cognito integration
3. **Full-Stack Development** — Frontend (vanilla JS) + Backend (Node.js)
4. **Database Design** — Relationships, foreign keys, ORM (Sequelize)
5. **REST API Design** — RESTful endpoints, error handling
6. **AWS Services** — RDS, EC2, Elastic Beanstalk, CloudFront, S3
7. **Security** — JWT, CORS, environment variables, role-based access
8. **Testing** — Manual testing, curl requests, health checks
9. **DevOps** — Git, deployment, CI/CD concepts

---

## 🤝 Contributing

To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the `LICENSE` file for details.

---

## 📞 Support

For issues or questions:

- Check existing [GitHub Issues](https://github.com/Heesun0514/Daycare-Digital-Logbook-AWS-Cloud-Migration/issues)
- Review `DEPLOYMENT.md` for troubleshooting
- Contact: **heesun0514@gmail.com**

---

## 📅 Project Timeline

| Sprint | Dates | Deliverable | Status |
|--------|-------|-------------|--------|
| 1 | Aug | RDS Migration | ✅ Complete |
| 2 | Aug–Sep | Cognito Auth | ✅ Complete |
| 3 | Sep | Frontend (S3/CloudFront) | ✅ Complete |
| 4 | Sep | Backend (EB/RDS) | ⚠️ Local Testing |
| 5 | Sep | ECCE Tracking | ✅ Complete |
| Final | Sep 25 | Submission | 🎯 In Progress |

---

## ✅ Final Checklist

- [x] Backend running locally on `localhost:8080`
- [x] Frontend deployed on CloudFront
- [x] Database connected to AWS RDS
- [x] Authentication working (Cognito + JWT)
- [x] Check-in/check-out functionality
- [x] ECCE compliance reports
- [x] Role-based access control
- [x] Parent view feature
- [x] CSV export (attendance + ECCE)
- [x] Documentation complete

---

**Project Status:** 🎉 95% Complete — Ready for Submission
**Last Updated:** September 11, 2026
**Author:** Huiseon Yi
**Repository:** [Daycare-Digital-Logbook-AWS-Cloud-Migration](https://github.com/Heesun0514/Daycare-Digital-Logbook-AWS-Cloud-Migration)