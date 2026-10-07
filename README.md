# 🏫 Daycare Digital Logbook — AWS Cloud Migration

A cloud-based attendance and ECCE compliance system for Irish daycare
centres, built with Node.js, PostgreSQL (RDS), Cognito, S3, and CloudFront.

🎥 **[Watch the 5-minute demo](LINK)** — full walkthrough of the app,
the AWS console, and the deployment debugging story.

📄 [API docs](docs/API.md) · 🏗 [Architecture](docs/ARCHITECTURE.md) ·
🔧 [Deployment decisions](docs/DEPLOYMENT.md) · 🐛 [Post-mortem](docs/POSTMORTEM.md)

> **Hosting note:** The frontend is deployed to S3 + CloudFront. The backend
> is containerized (image published to Amazon ECR) and validated against RDS
> locally. Continuous hosting on ECS Express Mode is not enabled because the
> monthly cost (~$20–30) is not justified for a portfolio project. The demo
> video shows the full system working against RDS.

---

## 🎯 What This Is

Tracks daily attendance for 25 children at a daycare centre and generates
ECCE compliance reports (Irish government funding requires ≥ 15 hours/week).

**Stack:**

| Layer | Tech |
|-------|------|
| Frontend | Vanilla JS on S3 + CloudFront |
| Backend | Node.js 18, Express, Sequelize |
| Database | PostgreSQL 15 on RDS (eu-west-1) |
| Auth | AWS Cognito with Teacher/Director roles |
| Container | Docker → ECR |
| CI | GitHub Actions + Jest |

## ⭐ Highlights

- Migrated 11 children + 3 attendance records from SQLite → RDS without data loss
- Seeded 25 children + 84 records to demonstrate the ECCE report with realistic variation
- Cognito + JWT with role-based access control (Teacher, Director, Parent)
- 17 Jest/Supertest tests running in GitHub Actions CI
- Containerized backend; image published to Amazon ECR
- Tracked AWS costs: ~$24.48 over 3 months

## 🏗 Architecture

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

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full data-flow description.

## 🚀 Running Locally

```bash
git clone https://github.com/Heesun0514/Daycare-Digital-Logbook-AWS-Cloud-Migration
cd Daycare-Digital-Logbook-AWS-Cloud-Migration/backend
npm install
# Create .env with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, COGNITO_*, JWT_SECRET
node server.js
```

Health check: `curl http://localhost:8080/health`

For Docker and cloud deployment: see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 🐛 The Debugging Story

My first deployment attempt used Elastic Beanstalk. The app started but
couldn't reach RDS — `ETIMEDOUT` on port 5432. I diagnosed it by checking
VPC configuration, security groups, and subnet routing, evaluated four
remediation paths, and chose to containerize the backend instead of
reconfiguring the VPC.

Full write-up: [docs/POSTMORTEM.md](docs/POSTMORTEM.md).

## 📁 Documentation

| Doc | What's in it |
|-----|-------------|
| [docs/API.md](docs/API.md) | Every endpoint, request/response |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full diagram, data flow |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Setup, EB options table, post-sprint work |
| [docs/POSTMORTEM.md](docs/POSTMORTEM.md) | EB debugging story |
| [docs/TESTING.md](docs/TESTING.md) | Jest tests, coverage, CI |
| [docs/SECURITY.md](docs/SECURITY.md) | Auth, CORS, known gaps |

## 📄 License

MIT — see [LICENSE](LICENSE).









