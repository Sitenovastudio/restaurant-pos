# SiteNova Restaurant ERP — Vanilla JavaScript + Firebase Cloud Migration Plan

**Target branch:** `sitenova/phase-0-customization`  
**Migration decision:** Cloud deployment; vanilla HTML/CSS/JavaScript ES modules; Firebase backend; migrate the full currently implemented ERP surface.  
**Status:** Architecture and migration plan only. No Firebase project has been provisioned and no production feature has been converted by this document.

## 1. Executive decision

Migrate the existing Next.js/React + NestJS + Prisma/PostgreSQL + Socket.IO application to:

- **Frontend:** static HTML, CSS and browser-native JavaScript ES modules (no React, Next.js, JSX, TypeScript runtime, or UI framework in the target frontend).
- **Hosting:** Firebase Hosting for the static application and public routes.
- **Identity:** Firebase Authentication.
- **Primary database:** Cloud Firestore.
- **File storage:** Cloud Storage for Firebase.
- **Trusted server logic:** Cloud Functions for Firebase (Node.js/TypeScript is acceptable for backend functions; the vanilla JavaScript requirement applies to the browser frontend).
- **Realtime:** Firestore listeners; Realtime Database only if a proven presence/connection feature needs it.
- **Security:** Firestore/Storage Security Rules, App Check where supported, server-side authorization in callable/HTTP Functions, and audited privileged actions.
- **Operations:** Firebase Emulator Suite, automated tests, CI deployment, usage monitoring and budget alerts.

This is a cloud-first target. It does not promise that every POS action remains writable while a terminal has no internet connection. Firestore web offline persistence can serve cached data and queue supported writes, but its client transactions fail offline and same-document conflicts use last-write-wins. Therefore cash-sale finalization, shared stock allocation, refunds, tender reconciliation, and other money/stock-critical commands must be online-authoritative through trusted Functions. A later local-first mode would need a separate local transaction authority and explicit reconciliation architecture.

## 2. Existing repository baseline

The current branch is not a small HTML application. It is a substantial monorepo with:

- `apps/web`: Next.js 16 / React 19 / Tailwind frontend, route groups and reusable components.
- `apps/backend`: NestJS 11 API, Prisma ORM and PostgreSQL.
- Socket.IO realtime gateway.
- Shared workspace package `packages/types`.
- Existing Docker Compose deployment and PostgreSQL persistence.
- Existing authentication using an httpOnly JWT session cookie, PIN login, role/permission checks, audit logging and branch access checks.

The repository has 30+ backend domain modules and many dashboard/public routes. The current schema is relational and includes Restaurant → Branch tenancy, orders, order items, menu, modifiers, recipes, stock movements, procurement, users, roles, permissions, reservations, waitlist, payments, refunds, accounting/operations-related data and other domains.

The repository's `FEATURE-CHECKLIST.md` is an implementation-status inventory dated 2026-08-14. It distinguishes shipped, partial and planned work. This migration must preserve the behaviour that exists today; it must not silently promote a planned feature to “already implemented.” Planned items remain planned unless separately scoped and built. Before feature freeze, refresh this checklist against the exact migration baseline commit.

### Main feature surfaces to carry forward

1. Authentication, signup, login, PIN staff switching, session/security settings, users, roles, permissions and audit trail.
2. Restaurant setup, branch selection, branch access, settings, branding, tax configuration and feature flags.
3. POS, cart, menu/category search, modifiers, combos, order creation/edit/cancel/merge/transfer, discounts, tax, tips, payments, refunds and receipts.
4. Tables, floors, layout, table status, reservations, waitlist, QR tokens and table sessions.
5. KDS, kitchen stations, ticket routing, ticket state, timers, priority and sound notifications.
6. Menu, ingredients, recipes, costing, stock deduction, batches, expiry, waste, stock counts and inventory reports.
7. Suppliers, purchase requests, quotations, purchase orders, goods receipt, vendor invoices and supplier payments.
8. Customers, customer history, loyalty and referral/CRM functions that are actually implemented.
9. Dashboard, reporting endpoints, accounting/operations/attendance/HR/delivery/marketing modules to the extent implemented in the branch.
10. Kiosk, customer display, public QR/menu/bill pages, digital bill share, downloads, imports, NFC, ratings, webhooks and integrations to the extent implemented.
11. Hardware workflows: browser print, kitchen tickets, network printer support and direct USB printing. Hardware capabilities need device-specific verification and may require a local print bridge because Firebase cloud functions cannot access a restaurant's USB port or private LAN printer directly.
12. Existing subscription/licensing work: signed Ed25519 licence envelope, installation identity and seven-day grace/read-only policy design. This must be adapted to cloud tenancy and Firebase trusted functions, not copied as local filesystem storage.

## 3. Target architecture

```text
Browser (vanilla HTML/CSS/ES modules)
  ├── Firebase Auth SDK
  ├── Firestore Web SDK (read/listen, limited offline cache)
  ├── Firebase Storage SDK (authorised uploads)
  └── HTTPS/callable Function commands
          |
Firebase Hosting
          |
Cloud Functions (trusted business commands)
  ├── Authentication claims / tenant membership validation
  ├── POS order finalisation and price/tax calculation
  ├── Stock ledger + recipe deduction
  ├── Payment/refund state transitions
  ├── KOT/table/reservation commands
  ├── Integrations, webhooks and scheduled jobs
  ├── Subscription and licence issuance/renewal
  └── Reports/export/backup orchestration
          |
Cloud Firestore + Cloud Storage
          |
Optional integrations: payment provider, email/SMS/WhatsApp, printer bridge
```

### Frontend structure proposal

Create a new target app under `apps/vanilla-web/` to avoid mixing the new implementation with the current Next.js source during migration.

```text
apps/vanilla-web/
  index.html
  login.html
  pos.html
  kds.html
  tables.html
  inventory.html
  reports.html
  settings.html
  public/
  assets/
    css/
      tokens.css
      base.css
      layout.css
      components.css
      print.css
    js/
      app.js
      firebase/
        firebase-config.js
        auth.js
        firestore.js
        storage.js
      core/
        router.js
        permissions.js
        state.js
        errors.js
        formatters.js
      services/
        orders.service.js
        menu.service.js
        tables.service.js
        inventory.service.js
        customers.service.js
        reports.service.js
        licensing.service.js
      features/
        pos/
        kds/
        tables/
        inventory/
        menu/
        customers/
        reservations/
        procurement/
        accounting/
        settings/
      components/
      workers/
  manifest.webmanifest
  service-worker.js
```

Use native modules and explicit imports. Avoid one giant script, inline event handlers, duplicated Firebase initialization, or business rules embedded only in UI pages. Build reusable modules for formatting, validation, permissions, command calls and error handling.

### Backend structure proposal

```text
functions/
  src/
    index.js
    shared/
      auth.js
      tenant-access.js
      permissions.js
      validation.js
      idempotency.js
      audit.js
      pricing.js
    domains/
      orders/
      inventory/
      menu/
      tables/
      kds/
      reservations/
      customers/
      procurement/
      payments/
      reports/
      integrations/
      licensing/
    triggers/
    scheduled/
  test/
firestore.rules
firestore.indexes.json
storage.rules
firebase.json
.firebaserc.example
```

Use TypeScript or JavaScript in Cloud Functions. The browser frontend remains vanilla JavaScript.

## 4. Firestore tenancy and data model

Use tenant-scoped top-level collections, with restaurant and branch identifiers in every business document. Proposed initial shape:

- `restaurants/{restaurantId}`
- `restaurants/{restaurantId}/branches/{branchId}`
- `restaurants/{restaurantId}/members/{uid}`
- `restaurants/{restaurantId}/roles/{roleId}`
- `restaurants/{restaurantId}/auditLogs/{auditId}`
- `restaurants/{restaurantId}/menuItems/{itemId}`
- `restaurants/{restaurantId}/categories/{categoryId}`
- `restaurants/{restaurantId}/modifierGroups/{groupId}`
- `restaurants/{restaurantId}/orders/{orderId}`
- `restaurants/{restaurantId}/orders/{orderId}/items/{itemId}`
- `restaurants/{restaurantId}/payments/{paymentId}`
- `restaurants/{restaurantId}/refunds/{refundId}`
- `restaurants/{restaurantId}/stockMovements/{movementId}`
- `restaurants/{restaurantId}/ingredients/{ingredientId}`
- `restaurants/{restaurantId}/recipes/{recipeId}`
- `restaurants/{restaurantId}/tables/{tableId}`
- `restaurants/{restaurantId}/floors/{floorId}`
- `restaurants/{restaurantId}/kots/{kotId}`
- `restaurants/{restaurantId}/reservations/{reservationId}`
- `restaurants/{restaurantId}/waitlist/{entryId}`
- `restaurants/{restaurantId}/customers/{customerId}`
- `restaurants/{restaurantId}/suppliers/{supplierId}`
- `restaurants/{restaurantId}/purchaseOrders/{purchaseOrderId}`
- `restaurants/{restaurantId}/settings/{settingsId}`

The exact collection/document split is a design task, not a mechanical Prisma-model-to-document copy. Keep large histories in subcollections or append-only collections. Store immutable snapshots on completed orders (item name, modifiers, tax/discount/tip calculation, unit price and tender details) so historical receipts do not change when the live menu changes.

Include `restaurantId`, `branchId`, `createdAt`, `updatedAt`, `createdBy`, `schemaVersion` and relevant idempotency keys as appropriate. Use server timestamps for authoritative events. Avoid storing unbounded arrays or embedding all orders in a restaurant document.

## 5. Business invariants that must not change

- Tenant and branch isolation must be enforced server-side and in Security Rules.
- Browser-supplied prices, discounts, taxes, totals, payment status and stock quantities are never trusted.
- Critical commands execute through trusted Cloud Functions with validation, permissions, idempotency and audit records.
- Completed orders, payments, refunds and stock movements are immutable ledger events; corrections are compensating events, not silent overwrites.
- Finalising an order and consuming stock must be atomic where feasible, with explicit retry/idempotency semantics.
- Do not mark an online payment as paid until a verified payment-provider callback confirms it.
- Keep the current India GST/tax behaviour, inclusive/exclusive tax modes, rounding discipline and receipt snapshots.
- PIN switching must not become a way to bypass staff permissions or tenant boundaries.
- Preserve public token expiry/revocation rules for QR, kiosk and bill-share pages.
- No secrets, service-account credentials or payment private keys in browser JavaScript or the public Hosting bundle.
- No production Firestore rules with broad `allow read, write: if true`.

## 6. Offline and consistency decision for cloud deployment

Cloud-first means the server is the authoritative source. Firestore web persistence can cache documents actively used by the client and queue supported writes, but it is not a substitute for a local transactional server.

For this cloud target:

- Cache menu, configuration and permitted read views.
- Display an explicit offline banner and last-sync time.
- Permit local cart editing and draft preparation while offline.
- Do not show a final bill as cloud-committed/paid while offline.
- Do not perform authoritative stock reservation, payment capture, refund or order finalisation while offline.
- Queue only commands that are safe to retry and contain stable unique IDs; reconcile them through trusted Functions when connectivity returns.
- Avoid relying on Firestore's last-write-wins behaviour for orders, table sessions, stock, cash or payment state.
- Use transactions for online concurrency control; transaction operations require connectivity.
- Keep the existing local-LAN/offline deployment as a separate fallback during migration until the cloud product passes acceptance tests.

If the commercial requirement changes to fully functional offline checkout across multiple terminals, stop and design a local authority (for example, a branch-local server/database plus cloud sync). Do not market Firestore web cache as equivalent to the existing LAN server.

## 7. Authentication, RBAC and security migration

1. Create Firebase Auth accounts and a restaurant membership document for each user.
2. Migrate roles and individual permission keys from existing role/permission data.
3. Use custom claims only for small stable identity facts; keep detailed role permissions and branch grants in tenant membership documents.
4. Validate user, restaurant, branch, role and permission inside every trusted Function.
5. Enforce read restrictions and safe client writes in Firestore Rules; critical business collections should be server-write-only.
6. Protect file uploads with Storage Rules tied to restaurant membership and path tenancy.
7. Add App Check, rate limits, abuse controls, audit logs and alerting.
8. Implement password reset, staff PIN switch, 2FA policy, session revocation and account deactivation equivalents.
9. Test cross-tenant reads/writes, stale role claims, revoked staff and direct REST/SDK calls—not only UI controls.

Admin SDK in Cloud Functions bypasses Firestore Security Rules. Therefore Function code itself must perform tenant and permission checks.

## 8. Subscription and licensing migration

Adapt the existing subscription specification and Phase A work as follows:

- Central collections: `customers`, `plans`, `subscriptions`, `invoices`, `paymentEvents`, `installations`, `licenseIssuances`, `auditEvents`.
- Keep Ed25519 private signing keys only in a managed secret/KMS boundary used by trusted functions.
- Keep public verification keys in the frontend only if needed for display verification; enforcement must be server-side.
- Automatic renewal: verified provider webhook → subscription state update → signed licence issuance → client entitlement refresh.
- Manual renewal: customer portal downloads signed licence or support-generated recovery token; import/redeem is authenticated and bound to installation/tenant.
- Seven-day grace period then read-only remains the policy unless explicitly changed.
- In a cloud-only deployment, do not trust a browser clock or a client-side licence flag. Enforce entitlement in every mutating Function using server time.
- Preserve customer data after expiry. Permit read/export/backup and licence renewal actions.
- Add offline entitlement caching only as a clearly bounded degraded mode; it cannot authorise cloud writes while the cloud is unavailable.

## 9. Data migration from PostgreSQL/Prisma

Do not connect a production Firebase project to a live database migration script and hope for the best. Use a staged, repeatable migration.

### Migration sequence

1. Freeze the source baseline commit and create a feature inventory from the current branch.
2. Produce a PostgreSQL schema/data dictionary from Prisma models, enums, relations, indexes and constraints.
3. Map every model to Firestore documents, subcollections, denormalized read models and immutable transaction snapshots.
4. Create stable IDs and an ID mapping table. Preserve original IDs where safe.
5. Export a consistent PostgreSQL snapshot including uploaded file references and audit history.
6. Transform decimal/money values to integer minor units or a documented exact representation; never use binary floating-point as the accounting source of truth.
7. Import reference data first: restaurants, branches, roles, permissions, users, settings, tax config, menu and ingredients.
8. Import operational records in dependency order: suppliers, recipes, purchase records, tables/floors, customers, reservations, orders, KOTs, payments/refunds, stock movements and audit logs.
9. Copy uploaded assets to Cloud Storage and rewrite URLs/paths in migrated documents.
10. Reconcile per-tenant and per-branch counts, totals, date ranges, payment/refund totals, inventory balances and audit history.
11. Run dual-read comparison and a controlled write-freeze/cutover rehearsal.
12. Keep the original PostgreSQL database and backups read-only until sign-off and rollback window expires.

### Required reconciliation evidence

- Row/document counts by model, restaurant and branch.
- Total sales, tax, discounts, tips, payment tenders and refunds by day.
- Open-order and table-session state.
- Ingredient on-hand quantities and stock ledger balances.
- Purchase order / GRN / supplier payable totals.
- Customer and loyalty balances.
- Audit history counts and attachment/file hashes.
- Sampled receipts and reports compared byte-for-byte or field-by-field where appropriate.

## 10. Feature-by-feature migration waves

### Wave 0 — Baseline and parity harness
- Refresh feature checklist against branch HEAD.
- Record screenshots, route list, API contracts, business rules and test fixtures.
- Add automated end-to-end tests for current critical flows.
- Define a parity matrix: source feature, source status, target route, target Function, target collection, test evidence.
- No feature removal.

### Wave 1 — Firebase foundation
- Create Firebase project(s) and environment separation (dev/staging/prod).
- Configure Hosting, Auth, Firestore, Storage, Functions, Emulator Suite and CI.
- Implement vanilla shell, router, design tokens, accessibility primitives, notifications, error handling and Firebase initialization.
- Implement tenancy, membership, permissions and audit foundations.
- Deploy deny-by-default rules and indexes.

### Wave 2 — Core restaurant configuration and catalogue
- Restaurant/branch setup, settings, tax, currency, users/roles/permissions.
- Menu, categories, modifiers, combos, ingredients, recipes, images and costing.
- Seed/import utilities and admin migration tools.

### Wave 3 — POS and transaction engine
- Product search, cart, pricing, discounts, taxes, tips, order create/edit/cancel/merge/transfer.
- Tender records, refunds and immutable bill snapshots.
- Idempotency, duplicate-submit protection, concurrent checkout tests.
- Browser receipt printing and supported printer bridge proof-of-concept.

### Wave 4 — Tables, reservations and realtime KDS
- Floors/tables/layout, sessions, QR tokens, reservations, waitlist.
- KOT generation/routing, kitchen stations, status, timers, priority and sounds.
- Firestore listeners with lifecycle cleanup and listener/read-cost controls.

### Wave 5 — Inventory and procurement
- Ingredients, recipe deduction, stock movement ledger, batches, expiry, waste, stocktake.
- Suppliers, quotations, purchase requests/orders, GRN, invoices and supplier payments.
- Transactional concurrency and reconciliation tests.

### Wave 6 — Customers and operational domains
- Customer profiles/history, loyalty/referral features that currently exist.
- Attendance, HR, delivery, operations, accounting, marketing and reports to the extent they exist in current code.
- Preserve current implemented scope; planned checklist items remain separate backlog.

### Wave 7 — Public, kiosk and integration surfaces
- QR menu/table pages, kiosk, customer display, digital bill share, public endpoints.
- Imports, downloads, webhooks, API integrations, NFC, ratings and notifications.
- Security review of public tokens and external callbacks.

### Wave 8 — Subscription, administration and commercial readiness
- Customer subscription portal, plan catalogue, hosted checkout and verified webhooks.
- Signed licence issuance, automatic/manual renewal, seven-day grace and server-side read-only policy.
- Audit, backup/export, usage controls, support diagnostics and admin portal.

### Wave 9 — Migration rehearsal, rollout and decommission
- Staging data migration and reconciliation.
- Pilot restaurants, parallel comparison, cutover and rollback drills.
- Production migration only after feature parity and security sign-off.
- Keep old PostgreSQL/NestJS deployment available until migration acceptance; remove only after rollback period and customer sign-off.

## 11. Release gates (must pass before replacing current ERP)

- All currently shipped source features have a target implementation and passing parity tests.
- All partial source features retain the same partial status or are completed under separately approved scope.
- No planned source feature is misrepresented as shipped.
- All critical checkout, tax, payment, refund and inventory concurrency tests pass.
- Cross-tenant and cross-branch security tests pass.
- Firestore/Storage rules are reviewed and deployed; no public write access.
- Payment webhooks are signature-verified and idempotent.
- Audit history and financial records reconcile to the source.
- Browser refresh, multi-tab, reconnect, stale cache and offline states are tested.
- Printer workflows are tested on actual supported devices, not only mocked listeners.
- Accessibility, performance, mobile/tablet and security checks pass.
- Backup/export and restore/recovery drills succeed.
- Firebase billing estimates, alerts, quotas, retention and regional data residency are approved.
- Rollback to the existing deployment is documented and rehearsed.

## 12. Firebase cost and operational considerations

Firebase has Spark (no-cost quotas) and Blaze (pay-as-you-go) plans. Cloud Functions require Blaze access; costs can also arise from Firestore reads/writes, Storage, network egress and related Google Cloud services. Firestore listeners can incur additional reads as documents change and after reconnects. Use budget alerts, query limits, pagination, listener lifecycle cleanup, aggregation documents and load tests. Budget alerts are notifications, not hard spending caps.

Choose the Firestore location carefully before creating production data. Confirm data residency, backup, retention and legal/compliance requirements for the restaurants and their customer data.

## 13. Licensing and source compliance

The current repository is marked AGPL-3.0-only and includes commercial licensing/trademark notices. Preserve all upstream licence and attribution notices. A commercial SaaS offering, proprietary modifications, or redistribution strategy requires a licence/legal review; this migration plan does not grant additional rights or replace legal advice.

## 14. Implementation rules for this branch

- Work only on `sitenova/phase-0-customization`; do not edit `master` or merge without explicit approval.
- Keep the current Next.js/NestJS/PostgreSQL application intact while the new vanilla/Firebase app is built alongside it.
- Do not delete existing features or schema before parity and migration are proven.
- Each wave should be independently deployable and have automated tests.
- Do not put Firebase Admin credentials, private signing keys, payment secrets or webhook secrets in browser files or Git.
- Do not claim Firebase conversion, data migration, feature parity or production readiness until the relevant tests and cutover evidence exist.

## 15. Source documents and technical references

Repository baseline:
- `ARCHITECTURE.md`
- `FEATURE-CHECKLIST.md`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/app.module.ts`
- `apps/web/package.json`
- `apps/web/next.config.ts`
- `docs/SITENOVA-SUBSCRIPTION-LICENSING.md`

Official Firebase documentation:
- Firestore web offline persistence: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Firestore transactions and batched writes: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firestore security rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firestore pricing and listener reads: https://firebase.google.com/docs/firestore/pricing
