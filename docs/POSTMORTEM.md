# Post-Mortem: Elastic Beanstalk → RDS Timeout

## Summary

During Sprint 4, deploying the backend to AWS Elastic Beanstalk failed with:

```
Error: connect ETIMEDOUT 172.31.17.127:5432
```

The EB EC2 instance could not reach the RDS PostgreSQL instance. This document records the diagnosis, the options evaluated, and the resolution.

## Timeline

| Time | Event |
|------|-------|
| Sprint 4, Day 1 | Backend prepared for EB deployment |
| Sprint 4, Day 1 | `.ebextensions/nodejs.config` created, EB environment launched |
| Sprint 4, Day 1 | Health check fails — `ETIMEDOUT` on port 5432 |
| Sprint 4, Day 2 | Diagnosed: EB instance cannot reach RDS |
| Sprint 4, Day 2 | Verified same VPC / SG configuration via AWS CLI |
| Sprint 4, Day 3 | Evaluated four remediation paths |
| Sprint 4, Day 3 | Chose Option C: local backend + CloudFront frontend |

## Diagnosis

I checked, in order:

1. **Is the database running?** — Yes (`available`).
2. **Are the credentials correct?** — Yes (verified via `psql` from a local machine against RDS).
3. **Can I reach the database from the EB instance?** — No. The connection **timed out** rather than being refused, which points to a network or firewall issue rather than an authentication problem.
4. **Are they in the same VPC?** — Checked via CLI.
5. **Are security groups allowing traffic?** — Checked the RDS SG inbound rules.

### What each check ruled out

| Check | Result | Conclusion |
|-------|--------|------------|
| DB running | Available | Not the cause |
| Credentials | Work locally | Not the cause |
| TCP reachability from EB | Timed out | Network/SG issue |
| Same VPC | [verify] | [same or different] |
| RDS SG inbound on 5432 | [verify] | [present or missing] |

## Root cause

The EB instance could not reach RDS on port 5432.

The most likely cause is one of:

- **Same VPC, missing security group rule** — the RDS security group did not allow the EB instance's security group on port 5432. AWS security groups are explicit allow-lists; being "close" in the console does not imply access.
- **Different VPCs, no peering** — EB launched in the default VPC, RDS in a custom VPC. Without a peering connection or transit gateway, there is no route between them.

**Note:** The exact root cause was not confirmed via CloudTrail before the EB environment was decommissioned. Rather than speculate, this document records the diagnosis process and the decision that followed. A future version of this project would include `aws cloudtrail lookup-events` output as evidence.

## Options evaluated

| Option | Cost | Time | Complexity | Decision |
|--------|------|------|------------|----------|
| A: Recreate EB in RDS subnet | $0 | 1 hour | Medium | Risky |
| B: Add load balancer for HTTPS | $16–20/mo | 2 hours | High | Too expensive |
| C: Local backend + CloudFront frontend | $0.70/mo | 0 hours | Low | ✅ Chosen |
| D: Lambda + API Gateway | $1–5/mo | 4 hours | Very High | Over-engineered |

### Why Option C was chosen

- **Cost:** RDS only at ~$0.70/month. Option B would add $16–20/month.
- **Time:** Zero additional setup. Focused on the final report.
- **Validation:** The system was already fully functional locally with the production RDS instance.

## Resolution

Rather than reconfiguring the VPC, I containerized the backend and targeted a deployment service that could be brought up on demand. This preserved the option to deploy without the cost of a permanently running load balancer.

**Post-submission (October 2026):**

- Backend containerized with Docker
- Image published to Amazon ECR
- Container verified working against RDS end-to-end
- Ready to deploy to ECS Express Mode (App Runner stopped accepting new customers in April 2026)

## What I would do differently

1. **Create RDS and compute in the same VPC from the start.** This eliminates a whole class of cross-VPC misconfiguration.
2. **Define security groups in Terraform before deploying anything.** Manual SG edits are easy to miss and hard to audit.
3. **Test network connectivity (`nc -zv <rds-host> 5432`) before writing application code.** A five-second test would have caught this in Sprint 1 instead of Sprint 4.
4. **Capture CloudTrail output before decommissioning the failed environment.** Root cause verification is worth the five minutes it takes.

## What this taught me

- **AWS security is explicit.** Being in the same account, region, or VPC does not imply access. Every path must be granted.
- **Network issues masquerade as application errors.** When a connection times out (not refuses), check the network first.
- **Failure documentation is valuable.** The EB options table became the most useful part of the final report for explaining the deployment decision.
- **Recognizing the same pattern twice is a skill.** When the same `ETIMEDOUT` pattern appeared later during App Runner experimentation, I recognized it immediately.