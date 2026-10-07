# API Reference

Base URL (local): `http://localhost:8080`

All authenticated endpoints expect an `Authorization: Bearer <token>` header. Tokens are issued by `POST /api/auth/login` and expire after 5 minutes.

---

## Authentication

### POST /api/auth/login

Authenticates a user via AWS Cognito and returns an application JWT.

**Body:**

```json
{ "email": "teacher@daycare.local", "password": "..." }
```

**Response:**

```json
{
  "success": true,
  "token": "eyJ...",
  "idToken": "eyJ...",
  "accessToken": "eyJ...",
  "email": "teacher@daycare.local",
  "role": "Teacher",
  "message": "✅ Login successful"
}
```

**Auth:** None (public)
**Flow:** Uses Cognito `USER_PASSWORD_AUTH` with `SECRET_HASH`. Returns the internal application JWT (`token`) plus the Cognito `idToken` and `accessToken`.

---

### GET /api/auth/me

Returns the authenticated user's identity.

**Response:**

```json
{
  "user": { "email": "teacher@daycare.local", "role": "Teacher" },
  "message": "..."
}
```

**Auth:** JWT Bearer

---

## Attendance

### POST /api/attendance/checkin

Creates an attendance record for a child.

**Body:**

```json
{
  "child_id": 1,
  "child_name": "Aoife Byrne",
  "parent_email": "aoife.byrne@example.ie",
  "arrival_time": "09:00",
  "date": "2026-10-07"
}
```

**Response:**

```json
{ "success": true, "id": 42, "child_name": "Aoife Byrne" }
```

**Auth:** Teacher or Director
**Validation:** Rejects duplicate check-ins for the same child on the same day.

---

### PUT /api/attendance/checkout/:id

Records a departure time for an existing attendance record.

**Body:**

```json
{ "departure_time": "15:30" }
```

**Response:**

```json
{ "success": true, "id": 42, "departure_time": "15:30" }
```

**Auth:** Teacher or Director
**Validation:** Rejects if the record already has a `departure_time` set.

---

### PUT /api/attendance/:id

Updates arrival time, departure time, or date on an existing record. Any subset of the fields may be provided.

**Body (any subset):**

```json
{
  "arrival_time": "08:45",
  "departure_time": "15:15",
  "date": "2026-10-07"
}
```

**Response:**

```json
{ "success": true, "message": "...", "record": { ... } }
```

**Auth:** Teacher or Director

---

## Reports

### GET /api/attendance/report

Returns all attendance records in a date range.

**Query:** `?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Response:**

```json
{
  "success": true,
  "message": "...",
  "record": [ /* attendance rows */ ]
}
```

**Auth:** Teacher or Director

---

### GET /api/attendance/ecce-report

Returns ECCE compliance status per child for a date range. Compares total weekly hours against the 15-hour threshold.

**Query:** `?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Response:**

```json
{
  "success": true,
  "period": { "from": "2026-10-06", "to": "2026-10-10" },
  "required_hours": 15,
  "report": [
    {
      "child_name": "Aoife Byrne",
      "days": 4,
      "hours": 26.0,
      "percent_of_required": 173,
      "status": "COMPLIANT"
    }
  ]
}
```

**Status values:** `COMPLIANT` (≥ 15 h/week), `AT RISK` (10–14 h), `NON-COMPLIANT` (< 10 h)

**Auth:** Director only — Teachers receive `403`.

---

## Children

### GET /api/children

Returns all registered children.

**Response:**

```json
{
  "success": true,
  "children": [
    { "id": 1, "child_name": "Aoife Byrne", "parent_email": "aoife.byrne@example.ie" }
  ]
}
```

**Auth:** Teacher or Director

---

## Parent (public)

### GET /api/parent/status

Returns the current-day attendance record for a parent's child, identified by email.

**Query:** `?email=parent@example.ie&date=YYYY-MM-DD` (date optional; defaults to today)

**Response:**

```json
{
  "success": true,
  "email": "aoife.byrne@example.ie",
  "date": "2026-10-07",
  "records": [
    {
      "child_name": "Aoife Byrne",
      "arrival_time": "09:00",
      "departure_time": "15:30",
      "status": "Picked Up"
    }
  ]
}
```

**Auth:** None (public)
**Security note:** Accepts an email parameter without verification. Vulnerable to email enumeration. See [SECURITY.md](SECURITY.md) for the production recommendation.

---

## Health

### GET /health

Liveness and database-connectivity check.

**Response:**

```json
{ "status": "Healthy", "database": "Connected" }
```

**Auth:** None (public)

---

## Error responses

All error responses follow this shape:

```json
{ "success": false, "error": "Human-readable message" }
```

Common status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Missing or invalid request body |
| 401 | Missing or invalid JWT |
| 403 | JWT valid but role not permitted |
| 404 | Resource not found |
| 500 | Server error |

---

## Example workflow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@daycare.local","password":"..."}' | jq -r '.token')

# 2. List children
curl http://localhost:8080/api/children -H "Authorization: Bearer $TOKEN"

# 3. Check in a child
curl -X POST http://localhost:8080/api/attendance/checkin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"child_id":1,"child_name":"Aoife Byrne","arrival_time":"09:00","date":"2026-10-07"}'
```