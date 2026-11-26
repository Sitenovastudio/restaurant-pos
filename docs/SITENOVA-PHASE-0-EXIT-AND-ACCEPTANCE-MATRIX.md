# SiteNova Cloud Migration — Phase 0 Exit and Acceptance Matrix

**Source repository:** `Sitenovastudio/restaurant-pos`  
**Working branch:** `sitenova/phase-0-customization`  
**Source snapshot:** `d155cb378af2d4acaf1fd9e087b2657680e8c78e`  
**Phase:** 0 — discovery, baseline and parity design  
**Status:** Documentation baseline completed; implementation gates remain open.

## 1. Phase 0 exit summary

The repository has been inventoried sufficiently to begin a controlled Firebase Emulator implementation spike, but not to declare full product parity or production readiness.

| Workstream | Evidence | Exit state |
|---|---|---|
| Migration architecture | `SITENOVA-FIREBASE-VANILLA-MIGRATION-PLAN.md` | Documented |
| Existing routes and backend surface | `SITENOVA-FRONTEND-API-INTEGRATION-INVENTORY.md` | Inventoried |
| Firestore source model mapping | `SITENOVA-FIRESTORE-DATA-MAPPING-WORKLIST.md` and mapping draft fixture | Drafted; verify every relation during implementation |
| POS transaction semantics | `SITENOVA-FIRESTORE-POS-TRANSACTION-DESIGN.md` | Designed; emulator proof pending |
| Role/permission baseline | `packages/types/src/permissions.ts` and `roles.ts` | Source captured |
| Scheduler/background jobs | Service-level scan recorded below | Key jobs identified; full provider audit remains required |
| Golden fixtures / acceptance scenarios | POS design and existing backend specs | Baseline identified; port to emulator pending |
| Firebase Emulator project | No Firebase project scaffold or emulator test run evidenced in this snapshot | Not started |
| Production data migration | No export/import rehearsal evidenced | Not started |

## 2. Existing permission baseline

The source of truth is `packages/types/src/permissions.ts`. It defines **48 permission keys** across Sales, Orders, Tables, Menu, Inventory, Reports, Admin, Kitchen, Reservations, CRM, Staff, Delivery, Accounting and Marketing/Operations. The list must be imported or explicitly represented in the new role model; do not replace it with a coarse Owner/Admin/Cashier-only check.

Important semantics to preserve:
- Custom roles can receive individually configurable permission keys.
- `permissionSatisfied` supports implied permissions.
- Explicit deny entries prefixed with `!` override both direct and implied grants.
- `menu.manage` implies `menu.view`; `tables.manage` implies `tables.view`.
- `accounting.manage` implies expense submit/approve and petty cash permissions.
- `inventory.manage` implies production and journal permissions; `journal.manage` implies production permissions.
- Owner and Administrator default to all currently defined permissions; other roles have distinct default bundles.
- New permissions are synchronized/backfilled by `PermissionsSyncService`; existing administrator-edited role grants must not be silently overwritten.

**Required security invariant:** every callable Function must derive authenticated user, tenant and branch context from verified identity/membership data; a client-supplied `restaurantId`, `branchId`, role or permission list is never authoritative.

## 3. Background jobs and scheduled behaviour found

| Source | Existing cadence | Observed responsibility | Cloud migration requirement |
|---|---|---|---|
| `ReportSchedulesService.tick` | Every 10 minutes | Finds active schedules, evaluates branch-local time/frequency and sends report email; stores last-sent/error state | Cloud Scheduler or scheduled Function; branch timezone, duplicate suppression, send-now parity and failure state |
| `BackupService.checkSchedule` | Hourly | Compares elapsed time against last VERIFIED full-instance backup and triggers a scheduled backup | Replace host filesystem/Postgres dump assumptions with tenant-aware export, object storage, verification and restore test |
| `WebhooksService.tick` | Every 10 seconds | Claims due pending deliveries and attempts signed outbound webhook delivery | Durable queue/outbox, claim lease, retry schedule, attempt cap, timeout and endpoint revalidation |
| `WebhooksService.cleanup` | Daily at 03:00 | Removes aged webhook delivery history | Retention policy and scheduled cleanup with audit/retention constraints |
| `VerifactuService.tick` | Every minute | Claims pending tax-compliance submission chains and retries submissions | Strict ordered chain processing, issuer/environment locking, retry state and immutable audit |
| `SyncService.runOnce` | Every 30 seconds in process | Pull/push peer changes with retries; PostgreSQL trigger-backed change log | Explicitly decide if peer sync survives; do not port SQL triggers or timer blindly |

Additional lifecycle work:
- `PermissionsSyncService.onModuleInit` seeds missing permissions and default roles; migration becomes a controlled schema/seed deployment, not a user-facing recurring job.
- `SyncService.onModuleInit` installs PostgreSQL sync triggers and starts the interval outside test mode; this mechanism is PostgreSQL-specific and requires redesign or retirement.
- `BackupService` is currently full-instance in scope, not tenant-isolated. Cloud SaaS must define export/restore boundaries before any customer-facing backup release.
- `VerifactuService` uses branch/restaurant checks, encrypted certificate material, per-issuer/environment serialization and retry state. This is compliance-critical; require jurisdictional review before cloud cutover.

This is the set of recurring jobs explicitly located during the targeted scan. A final pre-release code scan is still required to catch dynamically registered jobs, external scheduled triggers and deployment-level cron definitions.

## 4. Integration and external capability decision matrix

| Existing capability | Cloud target | Mandatory control / open item |
|---|---|---|
| Cashfree / Razorpay / Stripe | Callable Functions + provider webhooks | Secrets in Secret Manager; verify signatures; idempotency; reconcile asynchronous outcomes |
| Outbound webhooks | Durable outbox + worker Function | HMAC signature, SSRF/egress allowlist, bounded retries, delivery log |
| Email / scheduled reports | Email provider from Functions | Secret credentials, recipient validation, retry and branch timezone |
| AWS S3 backups/uploads | Firebase Storage or managed object storage | Migration of objects, signed access, retention, backup/restore semantics |
| USB ESC/POS / cash drawer | Local print bridge or supported browser printing | Secure device pairing; cloud Function cannot access local USB/LAN devices |
| Socket.IO events | Firestore listeners and/or Functions-triggered event fanout | Match branch room and per-user notification boundaries |
| Push notifications | FCM | Token lifecycle, permission targeting and opt-out |
| NFC | Browser/device capability + trusted server validation | Opaque token rotation/revocation and access logging |
| AI / MCP | Callable backend service or separately hosted service | Tool allowlist, tenant scoping, rate limits, secret isolation and audit |
| External integration hub / API keys | Cloud Functions / API gateway | Rotate credentials; scope keys to tenant/branch and exact actions |
| CSV/XLSX/PDF/ZIP export | Server-side Function or client-side export for safe small data | Enforce export permission, bounded datasets and audit |
| Backup/restore | Dedicated admin workflow | Tenant isolation, encryption, integrity checks, restore rehearsal |
| Verifactu / AEAT | Dedicated compliance service | Preserve chain ordering, signing material and jurisdictional validation |
| Peer sync | Decision required | Decide retire vs keep an edge sync protocol; Firebase cache is not a replacement for this service |

## 5. Feature parity acceptance matrix

The acceptance matrix must use the current feature status in `FEATURE-CHECKLIST.md`, not simply the existence of a route. "Partial" and "Planned" must remain explicit until the product owner approves scope changes.

| Domain | Source acceptance evidence | Cloud acceptance gate |
|---|---|---|
| Login / signup / PIN / 2FA | Auth controller, auth specs, session and role logic | Auth flows, session revocation, MFA and tenant membership tests |
| Branch / restaurant setup | Restaurant and branch services/models | Cross-tenant and cross-branch isolation tests |
| Menu / modifiers / combos | Menu module, Prisma relations and UI routes | CRUD, pricing, availability, image access and branch scope |
| Tables / floors / reservations / waitlist | Tables, reservations, waitlist modules | Concurrent table reservation/status and token tests |
| POS / orders / bills / refunds | OrdersService, pricing and checkout tests | Golden fixture parity, concurrency, idempotency and refund reconciliation |
| KOT / KDS / display / paging | KDS, display, paging and realtime gateway | Listener scope, event ordering and reconnect behaviour |
| Stock / recipes / FIFO / purchase / waste / production | Inventory and stock journal services/specs | Ledger reconciliation, FIFO and concurrent stock mutation tests |
| Customers / loyalty / gift cards | Customer/gift-card modules and order integration | Balance/points atomicity, duplicate operation and privacy tests |
| Accounting / petty cash / expenses | Accounting controllers/services/specs | Balanced ledger and approval permission tests |
| Attendance / HR / payroll | Attendance and HR modules | Role scope, date/timezone and payroll calculation tests |
| Delivery / rider | Delivery and rider modules | Assignment authorization, status transitions and public tracking |
| Reports / exports / scheduled reports | Reports service and schedule service | Aggregate parity, pagination, timezone, export permission and schedule dedupe |
| Marketing / ratings / referrals | Corresponding modules | Tenant-scoped audience, opt-in, permissions and public submission abuse controls |
| Payments / gateways / refunds | Gateway adapters and gateway payment service | Signature verification, provider idempotency and reconciliation |
| Public bill / QR menu / kiosk | Public controllers and route tokens | Token expiry, rate limit, price recomputation and unauthenticated data minimization |
| Backup / restore / import | Backup and import services | Tenant boundary, encryption, verified backup and restore drill |
| Webhooks / integrations / API keys | Webhook and integration services | SSRF protection, HMAC, secret rotation, scoped keys and retries |
| Devices / printing / NFC / push | Devices, USB printer, NFC and push services | Physical-device proof and secure registration |
| Verifactu / compliance | Verifactu service, chain verification and export | Chain integrity, ordered submission, certificate security and legal sign-off |
| Licensing / subscription | Existing signed licence and enforcement guard | Server-side subscription enforcement, grace/read-only semantics and no data deletion |
| AI / MCP | AI and MCP controllers/services | Tool authorization, tenant isolation and audit |

## 6. Required emulator test gates before any pilot

1. **Identity and tenancy:** anonymous, disabled, revoked, cross-restaurant and cross-branch access attempts must fail.
2. **Permission semantics:** every one of the 48 permission keys, implied permissions and explicit deny precedence.
3. **POS golden tests:** compare old PostgreSQL result and new Function result for tax, discounts, tips, rounding, bill lock, partial/final payment, cash change, refund and receipt snapshots.
4. **Concurrency:** duplicate checkout, simultaneous checkout on last stock, duplicate webhook, concurrent refund, stock transfer and table reservation races.
5. **Ledger:** FIFO batch consumption, adjustment, production, waste, return/reversal and stocktake reconciliation.
6. **Public tokens:** expired/revoked QR/kiosk/bill tokens, brute-force throttling and no tenant enumeration.
7. **Jobs:** retry, crash/restart, duplicate invocation, lock expiry, timezone boundary and dead-letter/manual replay.
8. **Payment providers:** valid/invalid signature, duplicate/out-of-order webhook, provider timeout and reconciliation after ambiguous network result.
9. **Exports and backup:** permission checks, tenant boundary, archive integrity, restore into isolated test project and data-count reconciliation.
10. **Realtime:** user notification targeting, branch isolation, reconnect and stale authorization revocation.
11. **Device bridge:** pairing/authentication, LAN-only access, printer unavailable and print retry; physical hardware testing required.
12. **Data migration:** source/target row counts, monetary totals, order/payment/refund totals, inventory balances, file checksums and audit continuity.

## 7. Implementation entry criteria

Before implementing the Firebase Emulator foundation:
- Choose/create the Firebase project and decide region(s) for Firestore, Functions and Storage.
- Confirm whether peer sync remains in scope.
- Confirm whether cloud checkout may stop when internet is unavailable. The selected architecture is cloud-first; Firestore offline cache does not provide an authoritative multi-terminal offline checkout system.
- Choose the local printing bridge approach and supported operating systems/printers.
- Decide backup/export tenant boundary and retention policy.
- Confirm email provider and payment gateway credentials will be configured through secret management (never paste private keys into chat or commit them).
- Confirm country/jurisdiction and Verifactu requirements for the actual deployment.
- Create emulator-only seed data from synthetic fixtures; do not use production personal data.

## 8. Phase 0 conclusion

**Phase 0 documentation exit: achieved.**  
**Phase 0 implementation exit: not achieved and not claimed.**

The repository is ready for the next controlled workstream: create the parallel vanilla frontend and Firebase Functions/Emulator scaffold, implement identity/tenant/permission foundations first, and prove them with automated emulator tests. Do not begin bulk page conversion until the security and POS transaction spikes pass.

## 9. Scope and safety boundary

This document is a source-based engineering plan. It does not create Firebase resources, migrate production data, modify existing Next.js/NestJS/PostgreSQL runtime code, prove feature parity, or certify legal/tax compliance.

All work remains on `sitenova/phase-0-customization`. Keep `master` unchanged. Do not merge or open a pull request unless explicitly requested.
