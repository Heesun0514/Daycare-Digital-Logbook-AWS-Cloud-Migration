
# 🧸📝 Childcare Smart Notebook - Attendance Management System


**Student Name:** Huiseon Yi 

**Student Number:**  10599161

**Module:** Advanced Programming (B8IT150)

**Lecturer:** Paul Laird

---

## 📚 Documentation
**Google Docs Link:** https://docs.google.com/document/d/1ZdpxEJkm0rWf6x-e28wwlwvCubOeQxV2J4zNFa6sdmc/edit?usp=sharing

---



# ☁️ Daycare Digital Logbook - AWS Cloud Migration

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RDS-blue)](https://aws.amazon.com/rds/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-orange)](https://aws.amazon.com/)

## 📖 Project Overview

This project is the cloud-native evolution of the **Daycare Digital Logbook**, originally developed as a local SQLite-based application. The core objective is to **migrate the system to AWS**, enhancing its **security**, **reliability**, and **scalability** while maintaining the simple, touch-friendly interface for childcare staff.

The new architecture leverages managed AWS services to create a secure, stateless, and cost-effective solution suitable for small to medium-sized childcare centres in Ireland.

## 🎯 Project Status (Sprint 1 Complete ✅)

| Sprint | Objective | Status |
| :--- | :--- | :--- |
| **Sprint 1** | **Database Migration** | **✅ COMPLETE** |
| Sprint 2 | AWS Cognito Authentication | 🟡 In Progress |
| Sprint 3 | Frontend & Hosting (S3 + CloudFront) | ⏳ Planned |
| Sprint 4 | Backend Deployment (Elastic Beanstalk) | ⏳ Planned |
| Sprint 5 | Final Polish & Report | ⏳ Planned |

**Sprint 1 Summary:**
*   **Migrated** data from local SQLite to **Amazon RDS for PostgreSQL**.
*   **Verified** data integrity with successful migration of `attendances` (3 rows) and `children` (11 rows) tables.
*   **Secured** database access via VPC security groups.
*   **Documented** the migration process and challenges.

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

## 🛠️ Technologies Used

*   **Backend:** Node.js, Express.js
*   **Database:** PostgreSQL (RDS), SQLite (Original)
*   **ORM:** Sequelize
*   **Testing:** Jest, Supertest
*   **Cloud:** AWS (RDS, Cognito, S3, CloudFront, Elastic Beanstalk)
*   **Version Control:** Git, GitHub

## 🚀 How to Run (After Sprint 2 Completion)

*(Instructions will be updated as the project progresses.)*

## 📄 Licence

This project is for educational purposes as part of the Higher Diploma in Science in Computing at Dublin Business School.
