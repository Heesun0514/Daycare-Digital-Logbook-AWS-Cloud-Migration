# Testing

## Strategy

Testing uses two layers:

1. **Automated** — Jest + Supertest integration tests that exercise the Express API end-to-end against a temporary PostgreSQL service.
2. **Manual** — scripted flows for the teacher, director, and parent views, run against the live RDS instance.

Automated tests are run in GitHub Actions on every push to `main`.

---

## Automated tests

### Run locally

```bash
cd backend
npm install
npm test
```

### With coverage report

```bash
npm run test:coverage
```

Coverage output is written to `backend/coverage/` and printed to the terminal.

### Current state

- **17 tests passing**
- **Statement coverage:** 55.15% (weakest file: `auth.js`)

The tests are grouped into four areas:

| Suite | Focus |
|-------|-------|
| CREATE | Check-in with valid and invalid payloads |
| UPDATE | Check-out, edit, duplicate prevention |
| READ | Report by date range |
| AUTH | Role-based access (Teacher vs Director) |

### Coverage gaps

`auth.js` has the lowest coverage because the Cognito integration depends on external calls that are not mocked. A production-grade version would mock the `@aws-sdk/client-cognito-identity-provider` client to unit test the token-exchange flow without hitting Cognito.

---

## Continuous integration

**Workflow:** `.github/workflows/ci.yml`

On every push to `main` (and every pull request), the workflow:

1. Checks out the repository
2. Installs Node.js 20
3. Starts a PostgreSQL service container
4. Installs backend dependencies (`npm ci`)
5. Runs `npm test`

The badge on the README links to the workflow runs.

---

## Manual test flows

These are the scripts I ran against the live RDS instance to verify end-to-end behavior. They assume the backend is running on `localhost:8080` and the frontend is open at the CloudFront URL.

### Teacher flow

1. Open the frontend, log in as `teacher@daycare.local`.
2. Find "Aoife Byrne" in the table.
3. Set arrival time to `09:00`, click **➕ Check In Now**.
4. Verify: row updates to 🟢 Present; both Check In and Check Out buttons change state.
5. Click **🚪 Check Out Now** on the same row.
6. Verify: row updates to 🔴 Departed; both buttons disabled.
7. Click **✏️ Edit** on any row with an attendance record.
8. Verify: edit form scrolls into view, pre-filled with current values.
9. Change a value, click **💾 Save Changes**.
10. Verify: table refreshes, updated value visible.

### Director flow

1. Log out, log in as `director@daycare.local`.
2. Scroll to **Section 3 — ECCE Compliance Report**.
3. Set date range to this week (Mon–Fri), click **📋 Generate ECCE Report**.
4. Verify:
   - 25 rows appear with colour-coded status badges
   - Distribution is roughly 16 COMPLIANT, 5 AT RISK, 4 NON-COMPLIANT
   - The exact counts depend on the seeded week
5. Click the **Download** button.
6. Verify: a CSV file is downloaded containing the same rows.

### Parent flow

1. Log out.
2. From the login page (no login required), enter `aoife.byrne@example.ie`.
3. Click **🔍 View**.
4. Verify: the child's current-day status is displayed, including arrival and departure times.
5. Verify: status reads "At Daycare" or "Picked Up" as appropriate.

---

## API smoke tests

Quick checks with `curl` when the backend is running locally:

```bash
# Health
curl http://localhost:8080/health
# → {"status":"Healthy","database":"Connected"}

# Login (returns a token)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@daycare.local","password":"..."}'

# Children (requires token)
TOKEN="<paste from login>"
curl http://localhost:8080/api/children \
  -H "Authorization: Bearer $TOKEN"

# ECCE report (Director token required)
curl "http://localhost:8080/api/attendance/ecce-report?from=2026-10-06&to=2026-10-10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## What is not covered

- **Cognito flows** — token exchange and SECRET_HASH generation are not unit-tested because they require live Cognito calls. Manual login checks cover this path.
- **CloudFront distribution** — no automated check that the deployed frontend matches the repo. Frontend changes are verified by manual test after S3 upload.
- **Performance** — no load testing. For a portfolio project, the traffic pattern (25 children, ~10 concurrent teachers) does not warrant it.