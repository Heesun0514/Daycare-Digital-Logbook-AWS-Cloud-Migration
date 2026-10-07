# Architecture

## Overview

The system has three runtime layers: a static frontend served from CloudFront + S3, a containerized Node.js backend, and a PostgreSQL database on RDS. Authentication is handled by AWS Cognito.

## Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐         ┌─────────────────────────┐       │
│   │  CloudFront CDN  │◄────────┤     AWS Cognito         │       │
│   │  + S3 (frontend) │         │   (JWT issuer, RBAC)    │       │
│   └──────────────────┘         └─────────────────────────┘       │
│            ▲                              ▲                      │
│            │ HTTPS                        │ HTTPS                │
│            ▼                              │                      │
│   ┌──────────────────────────────────────┴────────┐              │
│   │   Backend container (Docker image on ECR)     │              │
│   │   • Verified locally against RDS              │              │
│   │   • Deployable to ECS Express Mode            │              │
│   └───────────────────────────────────────────────┘              │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────────────┐                                    │
│   │     RDS PostgreSQL      │                                    │
│   │  children, attendance   │                                    │
│   └─────────────────────────┘                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data flow

1. **Static assets** — the frontend is uploaded to S3 and served globally through CloudFront over HTTPS.
2. **Login** — the frontend sends the user's email and password to `POST /api/auth/login`. The backend calls Cognito's `InitiateAuth` (with `SECRET_HASH`), receives Cognito tokens, then issues an application-level JWT.
3. **Authenticated requests** — the frontend attaches `Authorization: Bearer <jwt>` to every protected call. The backend verifies the JWT and enforces role-based access before querying RDS.
4. **Database queries** — Sequelize maps model calls to SQL against RDS PostgreSQL. The database runs in a VPC, publicly accessible with tight security group restrictions (see `SECURITY.md`).

## Technology choices

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vanilla JS | No build step, no framework overhead for a small UI |
| Backend | Node.js 18 + Express 4 | Well-documented, stable, works with all major ORMs |
| ORM | Sequelize 6 | Schema migrations, model definitions, prepared statements |
| Auth | AWS Cognito | Managed user store, password hashing, extensible to MFA |
| Database | RDS PostgreSQL 15 | Free Tier eligible, production-grade, SQL familiarity |
| Container | Docker → ECR | Reproducible builds, required by ECS / App Runner |
| CDN | CloudFront + S3 | Global edge, HTTPS, cheap for static assets |
| CI | GitHub Actions | Free for public repos, runs Jest tests on every push |

## Project structure

```
daycare-digital-logbook/
├── backend/
│   ├── server.js                  # Express app, all routes
│   ├── auth.js                    # Cognito + JWT logic
│   ├── models.js                  # Sequelize models (Child, Attendance)
│   ├── database.js                # DB connection + SSL config
│   ├── seed-25-children.js        # Demo data: 25 children
│   ├── seed-week-attendance.js    # Demo data: 84 attendance records
│   ├── delete-all-children.js     # Wipe script
│   ├── migrate-to-rds.js          # Historical SQLite → RDS migration
│   └── tests/
│       └── attendance.test.js     # 17 Jest tests
├── frontend/
│   ├── index.html                 # UI (login, table, edit, ECCE)
│   └── app.js                     # Frontend logic
├── docs/
│   ├── API.md                     # Endpoint reference
│   ├── ARCHITECTURE.md            # This file
│   ├── DEPLOYMENT.md              # Setup, options, post-sprint work
│   ├── POSTMORTEM.md              # EB debugging story
│   ├── SECURITY.md                # Auth, CORS, known gaps
│   ├── TESTING.md                 # Test strategy and results
│   └── screenshots/               # Dashboard, CI, billing images
├── Dockerfile                     # Container build
├── README.md
└── LICENSE
```

## Deployment targets

| Environment | Status | Notes |
|-------------|--------|-------|
| Local | ✅ Active | `node server.js`, connects to RDS |
| Docker | ✅ Verified | `docker run --env-file backend/.env` |
| ECR | ✅ Published | `daycare-backend:latest` |
| ECS Express Mode | ⏸ Ready | Deployable; not enabled to avoid recurring cost |
| Elastic Beanstalk | ❌ Decommissioned | VPC timeout — see `POSTMORTEM.md` |
| App Runner | ❌ Discontinued | AWS stopped accepting new customers April 2026 |

## Security boundaries

- **Public internet** — CloudFront distribution only.
- **Authenticated API** — Node.js backend, JWT-verified.
- **Private data** — RDS PostgreSQL, accessible only from allowed IPs on port 5432.

See `SECURITY.md` for known gaps and production recommendations.