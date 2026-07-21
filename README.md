
# 🧸📝 Daycare Digital Logbook - AWS Cloud Migration 


**Student Name:** Huiseon Yi 

**Student Number:**  10599161

**Higher Diploma in computer Science:** Software Development 

**Supervisor:** Harnaik Dhoot

---

## 📚 Documentation
**Google Docs Link:** https://docs.google.com/document/d/19N3AIsvplOWWvVshCZJkzFaBl8UuSajtO1DKnRRWybs/edit?tab=t.0

---



# ☁️ Daycare Digital Logbook - AWS Cloud Migration

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RDS-blue)](https://aws.amazon.com/rds/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-orange)](https://aws.amazon.com/)
[![CI/CD](https://github.com/Heesun0514/Daycare-Digital-Logbook-AWS-Cloud-Migration/actions/workflows/test-rds-migration.yml/badge.svg)](https://github.com/Heesun0514/Daycare-Digital-Logbook-AWS-Cloud-Migration/actions/workflows/test-rds-migration.yml)

## 📖 Project Overview

This project is the cloud-native evolution of the **Daycare Digital Logbook**, originally developed as a local SQLite-based application. The core objective is to **migrate the system to AWS**, enhancing its **security**, **reliability**, and **scalability** while maintaining the simple, touch-friendly interface for childcare staff.

The new architecture leverages managed AWS services to create a secure, stateless, and cost-effective solution suitable for small to medium-sized childcare centres in Ireland.

## 📚 Relationship to Original Project

**This is an evolution of the [original Daycare Digital Logbook](https://github.com/Heesun0514/Daycare-Digital-Logbook) project.**

The original project proved the concept using SQLite and Node.js deployed to Google Cloud Run. This AWS migration improves on that foundation by adding enterprise-grade security, reliability, and compliance features.

### Migration Journey Comparison

| Aspect | Original (SQLite + GCP) | AWS Migration |
|--------|---|---|
| **Database** | SQLite (local file) | PostgreSQL RDS (managed) |
| **Hosting** | Google Cloud Run | AWS Elastic Beanstalk |
| **Authentication** | None (public access) | AWS Cognito with role-based access |
| **Frontend** | Static HTML on same server | S3 + CloudFront (CDN) |
| **Data Protection** | File-based | Encrypted at rest + TLS in transit |
| **Scalability** | Single server | Stateless, auto-scaling architecture |
| **Cost** | Free tier | ~€25-35/month after free tier |

### Why This Migration?

✅ **Eliminates data loss risk** - Managed backups and multi-AZ failover  
✅ **Adds secure authentication** - Teachers and Directors have separate logins  
✅ **Better compliance** - GDPR-ready with encryption and audit trails  
✅ **Production-ready** - Scales to multiple daycare centres  
✅ **Reduces operational overhead** - No manual server management  

---

## 🎯 Project Status (Sprint 1 Complete ✅)

| Sprint | Objective | Status |
| :--- | :--- | :--- |
| Sprint 1 | Database Migration | ✅ COMPLETE |
| Sprint 2 | AWS Cognito Authentication | ✅ COMPLETE |
| Sprint 3 | Frontend & Hosting (S3 + CloudFront) | ⏳ Planned |
| Sprint 4 | Backend Deployment (Elastic Beanstalk) | ⏳ Planned |
| Sprint 5 | Final Polish & Report | ⏳ Planned |

**Sprint 1 Summary:**
*   **Migrated** data from local SQLite to **Amazon RDS for PostgreSQL**.
*   **Verified** data integrity with successful migration of `attendances` (3 rows) and `children` (11 rows) tables.
*   **Secured** database access via VPC security groups.
*   **Documented** the migration process and challenges.
*   **Automated** testing with GitHub Actions CI/CD pipeline.

**Sprint 2 Summary:**
*   **Set up** AWS Cognito User Pool for secure authentication.
*   **Created** "Teacher" and "Director" user groups for role-based access.
*   **Implemented** stateless JWT authentication with 5-minute token expiry.
*   **Added** login endpoint (`/api/auth/login`) and protected routes.
*   **Tested** authentication flow with `curl` commands.
*   **Verified** role-based access control is working.


## 🏗️ Target Cloud Architecture

The new system is designed with the following AWS services:

*   **Database:** Amazon RDS for PostgreSQL (Secure, managed, and scalable)
*   **Authentication:** AWS Cognito (For secure Teacher/Director login and role-based access)
*   **Frontend Hosting:** Amazon S3 + CloudFront (For fast, global content delivery)
*   **Backend Hosting:** AWS Elastic Beanstalk (For simplified Node.js application deployment)

*[A high-level architecture diagram would be excellent here in a future update.]*

## 🗄️ Migration Evidence (Sprint 1)

The database migration was completed successfully. Below is the verification output from the migration script.

**Terminal Output:**

```bash
🚀 Starting migration from SQLite to PostgreSQL...
📡 Target: daycare-database...:5432
🔄 Connecting to PostgreSQL...
✅ Connected to PostgreSQL successfully!
📤 Exporting data from SQLite...
✅ Exported 3 rows from attendance
✅ Exported 11 rows from children
✅ SQLite data exported to CSV successfully!
📥 Importing data to PostgreSQL...
✅ PostgreSQL tables created.
✅ Imported 3 rows into attendances
✅ Imported 11 rows into children
📊 Data verification:
Attendance: 3 rows
Children: 11 rows
✅ Migration completed successfully!
```
![Figure 1: Successful Migration Terminal Output](Figure 1_Migration success output.png)
Figure 1: Terminal output showing successful database migration with 3 attendance records and 11 children records.

RDS Instance Status:
The PostgreSQL database is now running on AWS RDS in the Ireland (eu-west-1) region.

![Figure 2: AWS RDS Instance is Available](Figure 2_RDS "Available" status .png)
Figure 2: AWS RDS instance showing "Available" status in the Ireland region.

Automated Testing:
The migration is automatically tested on every push to the main branch using GitHub Actions.

![Figure 5: GitHub Actions Workflow Success](Figure 5_GitHub Actions workflow success.png)
Figure 5: GitHub Actions workflow showing successful automated migration tests.


**GitHub Actions Automated Tests:** ✅ PASSING  
All migration tests pass automatically on every push to main branch.



## 🔐 Authentication Evidence (Sprint 2)

The JWT authentication system was tested successfully. Below is the verification output showing the complete authentication flow.

**Terminal Output:**
```bash
# Login to get JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","role":"Teacher"}' \
  | jq -r '.token')

# Access protected route with token
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
{"user":{"email":"teacher@test.com","role":"Teacher","exp":1784619015,"iat":1784618715},"message":"Authenticated successfully"}


## 🛠️ Technologies Used

*   **Backend:** Node.js, Express.js
*   **Database:** PostgreSQL (RDS), SQLite (Original)
*   **ORM:** Sequelize
*   **Testing:** Jest, Supertest
*   **Cloud:** AWS (RDS, Cognito, S3, CloudFront, Elastic Beanstalk)
*   **CI/CD:** GitHub Actions
*   **Version Control:** Git, GitHub

## 🚀 How to Run (After Sprint 2 Completion)

*(Instructions will be updated as the project progresses.)*

## 📄 Licence

This project is for educational purposes as part of the Higher Diploma in Science in Computing at Dublin Business School.

---

## 📖 References

- **Original Project Repository:** https://github.com/Heesun0514/Daycare-Digital-Logbook
- **AWS Documentation:** https://docs.aws.amazon.com/
- **Sequelize ORM:** https://sequelize.org/

