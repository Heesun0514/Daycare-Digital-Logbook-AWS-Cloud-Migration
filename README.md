
# 🧸📝 Childcare Smart Notebook - Attendance Management System


**Student Name:** Huiseon Yi 

**Student Number:**  10599161

**Module:** Advanced Programming (B8IT150)

**Lecturer:** Paul Laird

---

## 📚 Documentation
**Google Docs Link:** https://docs.google.com/document/d/1ZdpxEJkm0rWf6x-e28wwlwvCubOeQxV2J4zNFa6sdmc/edit?usp=sharing

---



## 1. Organisation Selection  

**Organisation:** Daycare Centre  

**Why I chose this organisation:**  
- I worked at a daycare centre and experienced the problem first-hand  
- Currently, teachers manually write in booklets for each child (arrival, departure, nappy, nap time, meals)  
- Teachers also write the same information in a main book (double work)  
- Parents often forget to bring the booklet back the next day  
- When inspectors visit, it's difficult to quickly check a child's attendance rate  

**The Problem:**  
- ❌ Paper-based system is inefficient  
- ❌ Teachers waste time writing duplicate information  
- ❌ Lost booklets = lost data  
- ❌ Hard to generate attendance reports for inspectors  

**The Solution:**  
- ✅ Digital tracking system  
- ✅ Parents can view online (no lost booklets)  
- ✅ Director can generate attendance reports instantly  
- ✅ Inspectors can verify if children meet minimum attendance requirements  

---

## 2. Requirements
### 2.1 Functional Requirements  

| ID | Requirement | CRUD Type | Actor |
|----|-------------|-----------|-------|
| FR1 | Teacher can record child arrival time | CREATE | Teacher |
| FR2 | Teacher can record child departure time | UPDATE | Teacher |
| FR3 | Teacher can view today's attendance list | READ | Teacher |
| FR4 | Teacher can edit incorrect arrival/departure times | UPDATE | Teacher |
| FR5 | Director can generate attendance report by date range | READ | Director |
| FR6 | Director can download/print report for inspector | READ | Director |
| FR7 | Parent can view their child's attendance status | READ | Parent |
| FR8 | System prevents duplicate check-in (validation) | Validation | System |

**CRUD Mapping:**  
- **CREATE** → Check-in (arrival time)  
- **READ** → View attendance, Generate reports, Parent view  
- **UPDATE** → Check-out (departure time), Edit times  
- **DELETE** → Not required (departure time marks the end of record)

### 2.2 Non-functional Requirements

| Category | Requirement | Why Important |
|----------|-------------|----------------|
| Architecture | API-first design with no page refresh | Smooth user experience |
| Performance | Check-in/out should take < 2 seconds | Teachers are busy with children |
| Usability | Simple swipe gestures for mobile | Teachers use phones/tablets |
| Availability | System accessible 8am-6pm (daycare hours) | Core operating hours |
| Data Persistence | Data saved even if server restarts | No lost attendance records |
| Mobile-Friendly | Works on tablets and phones | Teachers move around |
| Accuracy | Timestamps must be accurate | Legal requirement for attendance |
| Security | Parents can only see their own child | Privacy requirement |

---


### 2.3 Data Requirements

The system uses **SQLite** database with two tables: `attendance` and `children`.

#### attendance Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment record ID |
| child_name | TEXT NOT NULL | Name of the child |
| parent_email | TEXT | Auto-generated parent email |
| arrival_time | TEXT | Check-in time (HH:MM) |
| departure_time | TEXT | Check-out time (HH:MM, nullable) |
| date | TEXT NOT NULL | Attendance date (YYYY-MM-DD) |

#### children Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment record ID |
| child_name | TEXT NOT NULL UNIQUE | Name of the child (unique) |
| parent_email | TEXT NOT NULL | Auto-generated parent email |
| created_at | DATETIME | Timestamp of creation |

#### Validation Rules

| Field | Rule |
|-------|------|
| child_name | Required, cannot be empty |
| arrival_time | Required for check-in, format HH:MM |
| date | Required, format YYYY-MM-DD |
| departure_time | Optional, can only be set after arrival |


### 2.4 Actors & Use Cases

| Actor | Type | Description |
|-------|------|------|
| Teacher | Primary |Records child arrival, departure, and edits attendance times |
| Director | Primary |Generates and downloads attendance reports for inspectors |
| Parent | Primary |Views their child's attendance status |
| Inspector | Stakeholder|Reviews attendance reports (not a direct system user) |

**Use Cases Summary:**

| Use Case | Primary Actor |
|----------|----------------|
| Record Arrival | Teacher |
| Record Departure | Teacher |
| Edit Attendance Time | Teacher |
| View Today's Attendance List | Teacher |
| Generate Report | Director |
| Download Report | Director |
| View Child Status | Parent |


## 📖 Detailed Use Cases

### 1️⃣ Use Case: Record Arrival

| Element | Description |
|---------|-------------|
| Use Case Name | Record Arrival |
| Primary Actor | Teacher |
| Precondition | Child has not been checked in today |
| Postcondition | Child's arrival time is recorded in the system |

**Main Flow:**

| Step | Action |
|------|--------|
| 1 | Teacher clicks **"Attendance"** tab |
| 2 | System displays list of all children with OFF buttons (all children show as not check in). |
| 3 | Teacher swipes a child's button **left→right** |
| 4 | Button changes color to ON state(green) |
| 5 | System automatically saves current time as child's arrival time |
| 6 | Teacher can see at a glance which children have arrived |

---

### 2️⃣ Use Case: Record Departure

| Element | Description |
|---------|-------------|
| Use Case Name | Record Departure |
| Primary Actor | Teacher |
| Precondition | Child is currently checked in (ON state) |
| Postcondition | Child's departure time is recorded in the system |

**Main Flow:**

| Step | Action |
|------|--------|
| 1 | Teacher clicks **"Attendance"** tab |
| 2 | System displays list of all children with their current on/off status|
| 3 | Teacher swipes a child who is ON  **right→left** |
| 4 | The button returns to OFF state(red) |
| 5 | System automatically saves current time as the child's departure time |

**Exception Flow (No arrival record):**

| Step | Action |
|------|--------|
| 1 | Teacher tries to swipe OFF a child who is already OFF |
| 2 | Button stays OFF (nothing happens) |
| 3 | Teacher swipes **left→right**  to turn ON first |

---

### 3️⃣ Use Case : Edit Attendance Time

| Element | Description |
|---------|-------------|
| Use Case Name | Edit Attendance Time |
| Primary Actor | Teacher |
| Precondition | An attendance record exists for the child on the selected date |
| Postcondition | The arrival and/or departure time is updated in the system |


**Main Flow:**

| Step | Action |
|------|--------|
| 1 | Teacher clicks on child's **name / profile** |
| 2 | System shows arrival and departure times |
| 3 | Teacher edits time manually |
| 4 | Teacher clicks **Save** |
| 5 | System confirms update |

---

### 4️⃣ Use Case : Generate Report

| Element | Description |
|---------|-------------|
| Use Case Name | Generate Report |
| Primary Actor | Director |
| Precondition | Director is logged into the system |
| Postcondition | An attendance report is generated and displayed |

**Main Flow:**

| Step | Action |
|------|--------|
| 1 | Director selects **date range** (from – to) |
| 2 | Director selects **report type** (attendance summary, daily log) |
| 3 | System generates report based on recorded activities |
| 4 | System displays preview or ready status |

**Exception Flow (No data in range):**

| Step | Action |
|------|--------|
| 1 | If no records exist for selected date range |
| 2 | System shows: *"No records found. Please adjust date range."* |

---

### 5️⃣ Use Case : Download Report

| Element | Description |
|---------|-------------|
| Use Case Name | Download Report |
| Primary Actor | Director |
| Precondition | A report has been generated |
| Postcondition | The report is downloaded as a file (printable format) |

**Main Flow:**

| Step | Action |
|------|--------|
| 1 | After **Generate Report**, Director clicks **"Download"** |
| 2 | System exports report as **PDF** |
| 3 | System confirms download complete |

**Exception Flow (Download fails):**

| Step | Action |
|------|--------|
| 1 | If PDF generation fails |
| 2 | System shows: *"Download failed. Please try again."* |

---

### 6️⃣ Use Case:  View Child Status

| Element | Description |
|---------|-------------|
| Use Case Name | View Child Status |
| Primary Actor | Parent |
| Precondition | Parent has a valid email address registered in the system |
| Postcondition | Parent sees their child's attendance status for today |

**Main Flow:**

| Step | Action |
|------|--------|
| 1 | Parent enters their email address.  |
| 2 | System displays their child or children from the list. |
| 3 | System displays: arrival time, departure time, current status |

**Exception Flow (No record for today):**

| Step | Action |
|------|--------|
| 1 | If no attendance record exists for today |
| 2 | System shows: *"No attendance recorded for today yet."* |

---

### 7️⃣ Use Case: View Today's Attendance List

| Element | Description |
|---------|-------------|
| Use Case Name | View Today's Attendance List |
| Primary Actor | Teacher |
| Precondition | Teacher is logged into the system |
| Postcondition | Teacher sees all children and their current check-in status |

**Main Flow:**

| Step | Action |
|------|--------|
| 1 | Teacher clicks **"Attendance"** tab |
| 2 | System displays list of all children |
| 3 | For each child, system shows: name, arrival time (if checked in), current status (ON/OFF) |
| 4 | Children who have arrived appear with **green (ON)** status |
| 5 | Children not yet arrived appear with **red (OFF)** status |
| 6 | List automatically refreshes every 30 seconds |

**Exception Flow (No children enrolled):**

| Step | Action |
|------|--------|
| 1 | If no children are enrolled in the system |
| 2 | System shows: *"No children found. Please contact director."* |


## 3. CRUD Operations & API Endpoints

| Operation | Description | API Endpoint |
|-----------|-------------|--------------|
| Create | Record arrival time | `POST /api/attendance/checkin` |
| Read | View today's attendance / Generate report | `GET /api/attendance/report?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| Update | Record departure time | `PUT /api/attendance/checkout/:id` |
| Update | Edit arrival/departure | `PUT /api/attendance/:id` |
| Delete | (Not required) | N/A |

---

### API Details

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/attendance/checkin` | Check-in a child | `{ child_name, arrival_time, date }` | `{ id, child_name, parent_email, arrival_time, date, message }` |
| PUT | `/api/attendance/checkout/:id` | Check-out a child | `{ departure_time }` | `{ success, message, record }` |
| PUT | `/api/attendance/:id` | Edit attendance time | `{ arrival_time, departure_time, date }` | `{ success, message, record }` |
| GET | `/api/attendance/report?from=YYYY-MM-DD&to=YYYY-MM-DD` | Generate report | None (query params) | `{ success, message, record }` |

## 4. System Architecture

### 4.1 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend Runtime** | Node.js |
| **Backend Framework** | Express.js |
| **Database** | SQLite3 |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Testing** | Jest + Supertest |
| **CI/CD** | GitHub Actions |
| **Version Control** | Git & GitHub |
| **Container** | Docker |
| **Orchestration** | Google Cloud Run |

### 4.2 Database Choice

I used SQLite because it’s a serverless database. It’s perfect for this prototype because it ensures data integrity (like keeping child records organized) while staying lightweight. It makes the app easier to deploy and test as a proof-of-concept.


### 4.3 Project Structure

```
Daycare-Digital-Logbook/ # Root folder
│
├── .github/ # GitHub Actions folder
│ └── workflows/
│ └── ci-cd.yml # CI/CD configuration file ✅
│
├── backend/ # Backend folder
│ ├── attendance.test.js # Jest test file ✅
│ ├── database.js # SQLite connection file ✅
│ ├── package-lock.json # Dependency lock file ✅
│ ├── package.json # Project configuration file ✅
│ ├── seed-data.js # Test data seeding script ✅ 
│ └── server.js # Express server file ✅
│
├── frontend/ # Frontend folder
│ ├── app.js # JavaScript file ✅
│ └── index.html # HTML file ✅
│
├── .dockerignore # Excludes files from Docker build context ✅
├── .gitignore # Git exclude file ✅
├── Dockerfile # Docker image configuration for Cloud Run ✅
└── README.md # Project description file ✅

```

---

## 5. Testing

### 5.1 TESTING STRATEGY & TOOL SELECTION

 WHY JEST INSTEAD OF CURL COMMANDS?

 
| curl commands (manual) | Jest + Supertest (automated) |
|------------------------|------------------------------|
| ❌ Hard to read with escape characters | ✅ Clear test() blocks with descriptions |
| ❌ No syntax highlighting | ✅ VS Code test runner UI |
| ❌ Manual visual comparison | ✅ Automated expect() assertions |
| ❌ Cannot run all tests at once | ✅ One command: `npm test` |
| ❌ No CI/CD integration | ✅ GitHub Actions ready |
| ❌ No coverage reports | ✅ Shows untested lines |

  
**Assignment compliance:**
- "Unit tests" → Jest provides REAL unit tests
- "Integration test" → Supertest tests full API flow

### 5.2 Running Tests

```bash
npm install --save-dev jest supertest
npm test                 # Run all tests once
npm run test:watch      # Auto-run on file changes
npm test -- --coverage  # Show coverage report
 ```

### 5.3 Unit Test Results

#### CREATE (Check-in) Tests

| Test ID | Operation | Description | Expected | Actual | Result |
|---------|-----------|-------------|----------|--------|--------|
| TC-CI-01 | CREATE | Valid check-in with all data | 201 | 201 | ✅ PASS |
| TC-CI-02 | CREATE | Missing child_name | 400 | 400 | ✅ PASS |
| TC-CI-03 | CREATE | Missing arrival_time | 400 | 400 | ✅ PASS |
| TC-CI-04 | CREATE | Missing date | 400 | 400 | ✅ PASS |

#### UPDATE (Check-out) Tests

| Test ID | Description | Expected | Actual | Result |
|---------|-------------|----------|--------|--------|
| TC-05 | Valid check-out with departure_time | 200 | 200 | ✅ PASS |
| TC-06 | Non-existent ID | 404 | 404 | ✅ PASS |
| TC-07 | Missing departure_time field | 400 | 400 | ✅ PASS |
| TC-08 | Prevent duplicate check-out | 400 | 400 | ✅ PASS |

#### UPDATE (Edit Attendance - Dynamic) Tests

| Test ID | Description | Expected | Actual | Result |
|---------|-------------|----------|--------|--------|
| TC-09a | Update arrival_time only (departure_time NULL) | 200 | 200 | ✅ PASS |
| TC-09b | Update arrival_time only (departure_time exists) | 200 | 200 | ✅ PASS |
| TC-10 | Update departure_time only | 200 | 200 | ✅ PASS |
| TC-11 | Update date only | 200 | 200 | ✅ PASS |
| TC-12 | Update all fields at once | 200 | 200 | ✅ PASS |
| TC-13 | Empty request body (no fields) | 400 | 400 | ✅ PASS |
| TC-14 | Non-existent ID (99999) | 404 | 404 | ✅ PASS |

#### READ (Report) Tests

| Test ID | Description | Expected | Actual | Result |
|---------|-------------|----------|--------|--------|
| TC-15 | Return records within date range | 200 | 200 | ✅ PASS |
| TC-16 | Return empty array when no records | 200 | 200 | ✅ PASS |
| TC-17 | Reject missing date parameters | 400 | 400 | ✅ PASS |
  
### 5.4 Integration Test Results

Integration tests verify that multiple components work together correctly. The test simulates a complete daycare workflow from check-in to check-out.

#### Test INT-01: Complete Attendance Workflow

| Step | Operation | Expected Result | Actual | Status |
|------|-----------|-----------------|--------|--------|
| 1 | Check-in child (Emma Johnson, 09:00) | 201 Created, parent_email auto-generated | ✅ | PASS |
| 2 | Verify child in attendance report | Record found, departure_time = NULL | ✅ | PASS |
| 3 | Check-out child (17:30) | 200 OK, departure_time saved | ✅ | PASS |
| 4 | Verify departure time in report | departure_time = 17:30 | ✅ | PASS |
| 5 | Generate full date range report | 200 OK, records returned | ✅ | PASS |

#### Test INT-02: Multiple Children Same Day

| Step | Operation | Expected Result | Actual | Status |
|------|-----------|-----------------|--------|--------|
| 1 | Check-in 3 children (Alice, Bob, Charlie) | 201 each, emails auto-generated | ✅ | PASS |
| 2 | Verify all 3 in attendance report | 3 records found | ✅ | PASS |
| 3 | Check-out Alice and Charlie | 200 OK for both | ✅ | PASS |
| 4 | Verify remaining child still present | Bob has departure_time = NULL | ✅ | PASS |

#### Integration Test Execution Output

```bash
user@MacBookAir backend % npm test -- -t "INTEGRATION"

  console.log
    ✅ Step 1 Passed: Checked in. Server generated email: emma.johnson@daycare.local

  console.log
    ✅ Step 2 Passed: Child verified in report filtered by captured email

  console.log
    ✅ Step 3 Passed: Child checked out at 17:30

  console.log
    ✅ Step 4 Passed: Departure time verified in parent-filtered report

  console.log
    ✅ Step 5 Passed: Full date range report generated successfully

  console.log
    ℹ️ Step 1 & 2 (INT-02): Records verified as unique individual profiles

  console.log
    ✅ INT-02 Passed: All 3 children verified

 PASS  ./attendance.test.js
  🔄 INTEGRATION TEST - Full Attendance Workflow
    ✓ INT-01: Complete workflow (49 ms)
    ✓ INT-02: Multiple children in same day (41 ms)

Tests: 2 passed, 2 total
```

## 6. Additional Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| ⚡ **Check-in NOW** | One-click check-in with current time | No manual time selection, saves teacher time |
| ⚡ **Check-out NOW** | One-click check-out with current time | Faster checkout process |
| 📧 **Auto-generated Parent Email** | Email from child name (e.g., emma.johnson@daycare.local) | No manual email entry, consistent across days |
| 👪 **Parent View** | Parents view child status using email | Real-time attendance visibility |
| 📊 **CSV Report Download** | Export attendance report as CSV file | Easy sharing with inspectors |
| 🔄 **Auto-refresh Attendance List** | Updates after check-in/check-out/edit | Always shows current status |
| 🔐 **Duplicate Check-out Prevention** | Cannot check out same child twice | Data integrity |
| 🧪 **Integration Tests** | Full workflow testing (20 total tests) | Reliable system |
| 🚀 **CI/CD Pipeline** | GitHub Actions automated testing | Quality assurance on every push |


## 7. 🚀 Deployment

### Docker (Local)
```bash
# Build image
docker build --no-cache --platform linux/amd64 -t daycare-app .

# Run container
docker run -p 8080:8080 -e PORT=8080 daycare-app

```

### Access the Application

After starting the server (Docker), open browser and navigate to:
http://localhost:8080

## 8.Known Limitations & Future Work

**Limitations**
- No authentication (anyone with email can view child status)
- DELETE operation not implemented (not required per specification)
- Single daycare centre assumption (no multi-room support)
- No real-time push notifications


**Future Work**
- Login system for Teachers / Directors
- Multi-class / multi-room support
- Push notifications for parents upon check-in/out
- Automated daily summary emails


## 9. Attributions


- **GitHub Copilot**: [Conversation Reference](https://github.com/copilot/c/7a15ef38-e45a-44a7-a1ca-eb556f0f68e8)
- **Google Gemini**: [Conversation Reference](https://gemini.google.com/app/4442f865e0e66f75)


**For a detailed, line-by-line record of AI prompts and code changes, please refer to the full documentation:**
📄 [**Complete Project Documentation (Google Docs)**](https://docs.google.com/document/d/1ZdpxEJkm0rWf6x-e28wwlwvCubOeQxV2J4zNFa6sdmc/edit?usp=sharing)


