# Security

## Authentication

The system uses **AWS Cognito** as the user store and **JWT** as the session format.

- **Cognito user pool** — `eu-west-1_h8W0npweg`
- **Groups** — `Teacher`, `Director`
- **Login flow** — frontend sends email + password to `POST /api/auth/login`. Backend calls Cognito `InitiateAuth` with `USER_PASSWORD_AUTH` and `SECRET_HASH`, receives Cognito tokens, then issues an application JWT.
- **JWT expiry** — 5 minutes
- **Auto-logout** — frontend clears tokens after 5 minutes of inactivity
- **Password storage** — handled by Cognito; no plaintext or hashed passwords in the application database

## Authorization

Role-based access control is enforced **on the backend**, not the frontend. A frontend cannot bypass it by editing JavaScript.

| Endpoint | Teacher | Director | Anonymous |
|----------|---------|----------|-----------|
| `POST /api/auth/login` | ✅ | ✅ | ✅ |
| `GET /api/auth/me` | ✅ | ✅ | ❌ |
| `GET /api/children` | ✅ | ✅ | ❌ |
| `POST /api/attendance/checkin` | ✅ | ✅ | ❌ |
| `PUT /api/attendance/checkout/:id` | ✅ | ✅ | ❌ |
| `PUT /api/attendance/:id` | ✅ | ✅ | ❌ |
| `GET /api/attendance/report` | ✅ | ✅ | ❌ |
| `GET /api/attendance/ecce-report` | ❌ | ✅ | ❌ |
| `GET /api/parent/status` | ✅ | ✅ | ✅ |
| `GET /health` | ✅ | ✅ | ✅ |

Teachers hitting Director-only endpoints receive `403`.

## Data protection

| Item | State |
|------|-------|
| Transport (frontend ↔ backend) | HTTPS via CloudFront |
| Transport (backend ↔ RDS) | TLS (`sslmode: require` in Sequelize) |
| Transport (backend ↔ Cognito) | HTTPS |
| Data at rest (RDS) | Encrypted (AWS-managed KMS key) |
| Data at rest (S3) | Encrypted (SSE-S3 default) |
| Secrets | Environment variables on the backend; `.env` is gitignored |

## CORS

Allowed origins:

- `https://d2d7c2s58id62i.cloudfront.net`
- `http://localhost:8080` (development only)

No wildcard origins. The backend rejects requests from any other origin.

## Rate limiting

**Not currently implemented.** Adding a rate limiter (e.g. `express-rate-limit`) to the parent endpoint would prevent email enumeration. See "Known gaps" below.

## Input validation

- All request bodies are validated before database operations.
- Sequelize uses prepared statements for all queries, which prevents SQL injection.
- `email` and `date` query parameters on the parent endpoint are validated for format before use.

## Known gaps

These are documented trade-offs, not oversights. Each has a production recommendation.

### 1. Parent endpoint accepts unverified email

**Risk:** Anyone who knows a parent's email can view that child's attendance for the current day. Vulnerable to email enumeration.

**Production fix:** Send a one-time code to the parent's email (via SES), require the code before returning records, and issue a short-lived JWT for subsequent requests.

**Current state:** Documented on the login page and in `docs/API.md`.

### 2. RDS is publicly accessible

**Risk:** The database has a public endpoint. A security group restricts inbound on port 5432, but a misconfiguration would expose the DB.

**Production fix:** Place RDS in a private subnet and use a VPC connector (App Runner) or a NAT gateway (ECS). This adds ~$15–30/month, which is not justified for a portfolio project.

**Current state:** Security group allows `0.0.0.0/0` on port 5432. Documented in `README.md` and `docs/DEPLOYMENT.md`.

### 3. JWT stored in localStorage

**Risk:** `localStorage` is readable by JavaScript. A successful XSS would expose the token before its 5-minute expiry.

**Production fix:** Use HttpOnly cookies with the `SameSite=Strict` and `Secure` flags. This requires CSRF protection on state-changing endpoints.

**Current state:** 5-minute expiry limits but does not eliminate exposure.

### 4. Secrets in environment variables

**Risk:** `DB_PASSWORD`, `COGNITO_CLIENT_SECRET`, and `JWT_SECRET` are set as plaintext env vars. Anyone with access to the ECS/App Runner configuration can read them.

**Production fix:** Store in AWS Secrets Manager and reference at runtime. Adds ~$0.40/secret/month.

**Current state:** `.env` is gitignored; secrets are not committed. For a portfolio, this is acceptable.

### 5. No rate limiting on login

**Risk:** A brute-force attack on `POST /api/auth/login` is not slowed by the backend. Cognito does have internal protections, but the application layer has none.

**Production fix:** Add `express-rate-limit` on the login route, keyed by IP and email, with a `Retry-After` header on 429.

### 6. No WAF or DDoS protection

**Risk:** CloudFront provides some baseline protection, but no AWS WAF rules are configured.

**Production fix:** Attach AWS WAF to the CloudFront distribution with managed rule groups for common attacks.

## Incident response

For a portfolio project, there is no on-call rotation or formal incident response process. If credentials are ever exposed:

1. Rotate the RDS master password (`aws rds modify-db-instance --master-user-password`)
2. Rotate the Cognito app client secret
3. Rotate the JWT signing secret
4. Redeploy the backend with new environment variables

## Summary

The current design is **appropriate for a demonstration and portfolio project**. It is **not production-grade**, and the gaps above list the specific changes needed to bring it closer. Each gap is a deliberate trade-off between cost, complexity, and the size of the project, and is documented rather than hidden.