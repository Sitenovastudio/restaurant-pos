# SiteNova Phase 0 — Frontend Routes, Backend Surface and Integration Inventory

**Repository:** `Sitenovastudio/restaurant-pos`  
**Branch:** `sitenova/phase-0-customization`  
**Source commit inspected:** `0ebb033579e5c21c2bc72ac9d7f3ebedbaf17c2c`  
**Status:** Inventory snapshot; no source application changes.  
**Important:** Route/file presence is not proof that every feature is complete. The feature-status reference is `FEATURE-CHECKLIST.md`, last cross-referenced in that file as of 2026-08-14; revalidate its labels against current implementation and tests before parity sign-off.

## 1. Snapshot counts

| Inventory | Count | Basis |
|---|---:|---|
| Next.js page/route files | 72 | `apps/web/app/**/(page.tsx or route.ts)` |
| Backend feature modules under modules | 33 | `apps/backend/src/modules/**` |
| Backend controller files | 58 | All `*.controller.ts` under backend source |
| Backend automated spec files | 77 | `apps/backend/src/**/*.spec.ts` |
| Source tree files | 1,482 | Recursive Git tree at source commit |

The module count excludes cross-cutting modules outside `apps/backend/src/modules` (auth, audit, backup, devices, integrations, licensing, notifications, payment gateways, realtime, roles, sync, system, etc.). Those are listed separately below.

## 2. Frontend route inventory

The route file paths below are source-grounded. Dynamic segments are retained. Parenthesized route groups are Next.js layout groups, not URL segments.

- `apps/web/app/(dashboard)/accounting/page.tsx`
- `apps/web/app/(dashboard)/ask/page.tsx`
- `apps/web/app/(dashboard)/attendance/page.tsx`
- `apps/web/app/(dashboard)/customers/[id]/page.tsx`
- `apps/web/app/(dashboard)/customers/dues/page.tsx`
- `apps/web/app/(dashboard)/customers/page.tsx`
- `apps/web/app/(dashboard)/dashboard/page.tsx`
- `apps/web/app/(dashboard)/delivery/page.tsx`
- `apps/web/app/(dashboard)/inventory/areas/page.tsx`
- `apps/web/app/(dashboard)/inventory/journal/page.tsx`
- `apps/web/app/(dashboard)/inventory/manufacturing-reports/page.tsx`
- `apps/web/app/(dashboard)/inventory/page.tsx`
- `apps/web/app/(dashboard)/inventory/procurement/page.tsx`
- `apps/web/app/(dashboard)/inventory/production/page.tsx`
- `apps/web/app/(dashboard)/inventory/purchase-orders/[id]/page.tsx`
- `apps/web/app/(dashboard)/inventory/purchase-orders/page.tsx`
- `apps/web/app/(dashboard)/inventory/recipes/page.tsx`
- `apps/web/app/(dashboard)/inventory/shopping-list/page.tsx`
- `apps/web/app/(dashboard)/inventory/stock-report/page.tsx`
- `apps/web/app/(dashboard)/inventory/stock-take/page.tsx`
- `apps/web/app/(dashboard)/inventory/suppliers/page.tsx`
- `apps/web/app/(dashboard)/inventory/transfers/page.tsx`
- `apps/web/app/(dashboard)/inventory/waste/page.tsx`
- `apps/web/app/(dashboard)/inventory/yield-analysis/page.tsx`
- `apps/web/app/(dashboard)/kds/page.tsx`
- `apps/web/app/(dashboard)/marketing/page.tsx`
- `apps/web/app/(dashboard)/menu/page.tsx`
- `apps/web/app/(dashboard)/my-deliveries/page.tsx`
- `apps/web/app/(dashboard)/operations/page.tsx`
- `apps/web/app/(dashboard)/orders/page.tsx`
- `apps/web/app/(dashboard)/pos/page.tsx`
- `apps/web/app/(dashboard)/ratings/page.tsx`
- `apps/web/app/(dashboard)/reports/page.tsx`
- `apps/web/app/(dashboard)/reservations/page.tsx`
- `apps/web/app/(dashboard)/settings/api-keys/page.tsx`
- `apps/web/app/(dashboard)/settings/audit-log/page.tsx`
- `apps/web/app/(dashboard)/settings/backup/page.tsx`
- `apps/web/app/(dashboard)/settings/buzzers/page.tsx`
- `apps/web/app/(dashboard)/settings/customer-screen/page.tsx`
- `apps/web/app/(dashboard)/settings/devices/page.tsx`
- `apps/web/app/(dashboard)/settings/integrations/page.tsx`
- `apps/web/app/(dashboard)/settings/page.tsx`
- `apps/web/app/(dashboard)/settings/payment-gateways/page.tsx`
- `apps/web/app/(dashboard)/settings/roles/page.tsx`
- `apps/web/app/(dashboard)/settings/security/page.tsx`
- `apps/web/app/(dashboard)/settings/staff/page.tsx`
- `apps/web/app/(dashboard)/settings/sync/page.tsx`
- `apps/web/app/(dashboard)/settings/updates/page.tsx`
- `apps/web/app/(dashboard)/settings/verifactu/page.tsx`
- `apps/web/app/(dashboard)/settings/webhooks/page.tsx`
- `apps/web/app/(dashboard)/simulator/page.tsx`
- `apps/web/app/(dashboard)/tables/cards/page.tsx`
- `apps/web/app/(dashboard)/tables/live/page.tsx`
- `apps/web/app/(dashboard)/tables/nfc/page.tsx`
- `apps/web/app/(dashboard)/tables/page.tsx`
- `apps/web/app/(dashboard)/team/page.tsx`
- `apps/web/app/bill/[token]/page.tsx`
- `apps/web/app/customer-display/page.tsx`
- `apps/web/app/demo/page.tsx`
- `apps/web/app/docs/accessibility/page.tsx`
- `apps/web/app/docs/api/page.tsx`
- `apps/web/app/docs/compliance-india/page.tsx`
- `apps/web/app/docs/page.tsx`
- `apps/web/app/kiosk/[token]/manifest.webmanifest/route.ts`
- `apps/web/app/kiosk/[token]/page.tsx`
- `apps/web/app/kiosk/sw.js/route.ts`
- `apps/web/app/login/page.tsx`
- `apps/web/app/order/[qrToken]/page.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/pay/return/page.tsx`
- `apps/web/app/signup/page.tsx`
- `apps/web/app/t/[ref]/page.tsx`

## 3. Backend feature modules

- `apps/backend/src/modules/accounting/accounting.module.ts`
- `apps/backend/src/modules/attendance/attendance.module.ts`
- `apps/backend/src/modules/bill-share/bill-share.module.ts`
- `apps/backend/src/modules/customers/customers.module.ts`
- `apps/backend/src/modules/dashboard/dashboard.module.ts`
- `apps/backend/src/modules/delivery/delivery.module.ts`
- `apps/backend/src/modules/display/display.module.ts`
- `apps/backend/src/modules/downloads/downloads.module.ts`
- `apps/backend/src/modules/email/email.module.ts`
- `apps/backend/src/modules/gift-cards/gift-cards.module.ts`
- `apps/backend/src/modules/hr/hr.module.ts`
- `apps/backend/src/modules/imports/imports.module.ts`
- `apps/backend/src/modules/inventory/inventory.module.ts`
- `apps/backend/src/modules/kds/kds.module.ts`
- `apps/backend/src/modules/marketing/marketing.module.ts`
- `apps/backend/src/modules/menu/menu.module.ts`
- `apps/backend/src/modules/nfc/nfc.module.ts`
- `apps/backend/src/modules/operations/operations.module.ts`
- `apps/backend/src/modules/orders/orders.module.ts`
- `apps/backend/src/modules/paging/paging.module.ts`
- `apps/backend/src/modules/public/public.module.ts`
- `apps/backend/src/modules/ratings/ratings.module.ts`
- `apps/backend/src/modules/referrals/referrals.module.ts`
- `apps/backend/src/modules/reports/reports.module.ts`
- `apps/backend/src/modules/reservations/reservations.module.ts`
- `apps/backend/src/modules/restaurants/restaurants.module.ts`
- `apps/backend/src/modules/rider/rider.module.ts`
- `apps/backend/src/modules/settings/settings.module.ts`
- `apps/backend/src/modules/tables/tables.module.ts`
- `apps/backend/src/modules/users/users.module.ts`
- `apps/backend/src/modules/verifactu/verifactu.module.ts`
- `apps/backend/src/modules/waitlist/waitlist.module.ts`
- `apps/backend/src/modules/webhooks/webhooks.module.ts`

## 4. Cross-cutting backend controllers and capabilities

In addition to the feature modules, the source tree contains controllers for:

- `apps/backend/src/ai/ai.controller.ts`
- `apps/backend/src/app.controller.ts`
- `apps/backend/src/audit/audit.controller.ts`
- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/backup/backup.controller.ts`
- `apps/backend/src/devices/devices.controller.ts`
- `apps/backend/src/integration-hub/integration-hub.controller.ts`
- `apps/backend/src/integration-hub/integration-hub.webhook.controller.ts`
- `apps/backend/src/integrations/integration-api-keys.controller.ts`
- `apps/backend/src/integrations/integrations.controller.ts`
- `apps/backend/src/integrations/staff-api-keys.controller.ts`
- `apps/backend/src/licensing/licensing.controller.ts`
- `apps/backend/src/mcp/mcp.controller.ts`
- `apps/backend/src/modules/accounting/accounting.controller.ts`
- `apps/backend/src/modules/accounting/ledger.controller.ts`
- `apps/backend/src/modules/accounting/petty-cash.controller.ts`
- `apps/backend/src/modules/attendance/attendance.controller.ts`
- `apps/backend/src/modules/customers/customers.controller.ts`
- `apps/backend/src/modules/dashboard/dashboard.controller.ts`
- `apps/backend/src/modules/delivery/delivery.controller.ts`
- `apps/backend/src/modules/display/display.controller.ts`
- `apps/backend/src/modules/downloads/downloads.controller.ts`
- `apps/backend/src/modules/gift-cards/gift-cards.controller.ts`
- `apps/backend/src/modules/hr/hr.controller.ts`
- `apps/backend/src/modules/imports/imports.controller.ts`
- `apps/backend/src/modules/inventory/inventory.controller.ts`
- `apps/backend/src/modules/inventory/stock-journal.controller.ts`
- `apps/backend/src/modules/inventory/transfers.controller.ts`
- `apps/backend/src/modules/kds/kds.controller.ts`
- `apps/backend/src/modules/marketing/marketing.controller.ts`
- `apps/backend/src/modules/menu/menu.controller.ts`
- `apps/backend/src/modules/nfc/nfc.controller.ts`
- `apps/backend/src/modules/operations/operations.controller.ts`
- `apps/backend/src/modules/orders/orders.controller.ts`
- `apps/backend/src/modules/paging/paging.controller.ts`
- `apps/backend/src/modules/public/public-bill.controller.ts`
- `apps/backend/src/modules/public/public-kiosk.controller.ts`
- `apps/backend/src/modules/public/public-menu.controller.ts`
- `apps/backend/src/modules/ratings/ratings.controller.ts`
- `apps/backend/src/modules/reports/report-schedules.controller.ts`
- `apps/backend/src/modules/reports/reports.controller.ts`
- `apps/backend/src/modules/reservations/reservations.controller.ts`
- `apps/backend/src/modules/restaurants/branches.controller.ts`
- `apps/backend/src/modules/rider/rider.controller.ts`
- `apps/backend/src/modules/settings/settings.controller.ts`
- `apps/backend/src/modules/tables/tables.controller.ts`
- `apps/backend/src/modules/users/users.controller.ts`
- `apps/backend/src/modules/verifactu/verifactu.controller.ts`
- `apps/backend/src/modules/waitlist/waitlist.controller.ts`
- `apps/backend/src/modules/webhooks/webhooks.controller.ts`
- `apps/backend/src/notifications/notifications.controller.ts`
- `apps/backend/src/payment-gateways/gateway-payments.controller.ts`
- `apps/backend/src/payment-gateways/payment-gateways.controller.ts`
- `apps/backend/src/push/devices.controller.ts`
- `apps/backend/src/roles/roles.controller.ts`
- `apps/backend/src/standalone/standalone.controller.ts`
- `apps/backend/src/sync/sync.controller.ts`
- `apps/backend/src/system/update.controller.ts`

### Explicitly verified API examples

The following routes were extracted from controller decorators, not inferred from page names:

- Authentication: `/v1/auth` — register, login, demo login, PIN login, logout, current user, setup status and 2FA setup/enable/disable/reset.
- Orders: `/v1/orders` — open/manage/dues listing, get/create, add/update/remove items, release/accept/reject/cancel, discount and bill preview, checkout, receipt, KOT, printing, refund, bulk delete and merge.
- Inventory: `/v1/inventory` — ingredients, adjustments, movement/batch history, recipe/tracking setup, suppliers, purchase orders, goods receipts, waste, purchase requests, quotations and supplier invoices/payments.
- Stock journals: `/v1/inventory` — journal entries, post/void, balances, summaries, locations/transfers, stocktakes, expiring/reorder reports, production, recipes, manufacturing reports and waste approvals/reversals.
- Payment gateways: `/v1/payment-gateways` — provider catalogue, connections, custom providers, credentials, tests, mode and enable/disable settings.
- Gateway payments: `/v1` — order payment creation/listing, active/recent payments, refund review/resolution, refund, refresh, provider webhook and return status.
- Public bill: `/v1/public/bill/:token` read endpoint.
- Public kiosk: `/v1/public/kiosk/:kioskToken` menu and order submission.
- Public QR menu: `/v1/public/menu/:qrToken` menu, order submission, online/cash payment intent, session join/status, order status and table requests.
- Sync: `/v1/sync` settings/status/test/run/disable and `/v1/sync-peer` ping/pull/push using a separate sync-key guard.
- Backup: `/v1/backups` status/list/config/manual trigger/export/restore/download; source comments specify whole-instance backup scope and a dedicated `backup.manage` permission.
- Licensing: `/v1/license` status/import; source comments describe local licence status/import behaviour in the existing local deployment.

This is a sample of high-impact controllers extracted in detail. The full controller file inventory above is not a complete per-handler API specification; each remaining controller still needs decorator/DTO/permission extraction before migration.

## 5. Realtime, background work and integrations

### Realtime

The current backend uses a Socket.IO gateway. Source comments and implementation show:
- Branch rooms for order/table/KOT events.
- User-specific rooms for notifications.
- Socket handshake validates the existing session cookie, active user, revoked-session state and branch access before joining.
- The cloud target must preserve branch scoping and per-user notification targeting. A Firestore listener must never become a broad tenant-wide data feed.

### Background scheduling

The Nest root module imports `ScheduleModule.forRoot()`. A preliminary code-search pass did not return matches for `@Cron`, `@Interval` or `setInterval(`; this is **not proof that there are no scheduled jobs**. Service files and module providers still require a targeted scan. Report schedules and backup schedules also exist as product domains and must be inspected in their services.

### External systems / runtime dependencies evidenced by source tree and package manifests

- Payment providers/adapters: Cashfree, Razorpay and Stripe; gateway payment/refund reservation and webhook flows.
- Object storage: AWS SDK S3 client; backup service and upload flows require storage parity.
- Email: Nodemailer-based email module.
- Realtime: Socket.IO server and browser client.
- Local hardware: USB printing dependency and ESC/POS/printer code; browser/cloud Functions cannot directly access a restaurant PC's USB printer.
- File/report generation: ExcelJS, PDFKit, archiver, CSV exports and local backup archive creation.
- AI: AI module and web AI SDK integration.
- Integration surfaces: integration hub, integration API keys, staff API keys, webhooks, external API routes and MCP controller.
- NFC, push notifications, device management and display terminals.
- Existing peer sync endpoints and sync key guard.
- Licensing service/guard and local install-specific behaviour.

Each integration needs an explicit target decision: Firebase Function, third-party hosted API, browser capability, local device bridge, or retired/unsupported. Do not put provider secrets in browser configuration or client-readable Firestore documents.

## 6. Migration classification and risk register

| Area | Risk | Required design/verification |
|---|---|---|
| POS order + checkout | Critical | Preserve server-authoritative price/tax, bill locking, partial payments, idempotency and atomic settlement; see `SITENOVA-FIRESTORE-POS-TRANSACTION-DESIGN.md` |
| Inventory / stock ledger | Critical | FIFO, exact decimal arithmetic, batch balance, negative stock policy, reversals and audit |
| Auth / roles / branch access | Critical | Port every permission and membership check; test cross-tenant and cross-branch access |
| Payment gateways / refunds | Critical | Provider webhook verification, idempotent payment state, pending refund reservations and reconciliation |
| Accounting / payroll / tax compliance | Critical | Ledger balance, audit trail, retention, tax exports and access restrictions |
| Backup / restore / import | High | Whole-tenant vs whole-instance boundary, encryption, restore rehearsal and export parity |
| Public QR / kiosk / bill share | High | Scoped opaque tokens, expiry/revocation, abuse limits and no public collection reads |
| Realtime / notifications | High | Branch isolation, user-targeted events and permission-specific notifications |
| Printer / cash drawer / USB | High | Local print bridge or supported browser print; device pairing and LAN security |
| Sync / multi-site | High | Clarify whether cloud migration replaces peer sync or retains an edge sync protocol |
| AI / MCP / integrations | High | Secret handling, tenant scoping, command allowlists, rate limits and audit |
| Reports / exports | High | Query aggregation design, cost control, pagination, date/timezone and report parity |

## 7. Important checklist qualification

`FEATURE-CHECKLIST.md` explicitly distinguishes Shipped, Partial, Planned and Not supported. Examples from its current text include:
- POS core, modifiers, combos, order merge, refunds, inclusive tax calculation and browser receipt printing marked Shipped.
- Split bill marked Partial (display-only calculator, not separate per-guest checks).
- Barcode scanning, SKU, saved draft orders, split tender and multiple currencies marked Planned.
- Kiosk ordering flow marked Shipped but kiosk payment marked Planned and kiosk offline queue marked Not supported.
- QR ordering is described as Partial in the checklist.
- USB-HID scanner and real hardware printing are not claimed as verified on physical hardware.

The migration scope is to preserve existing implemented behaviour and explicitly track partial/planned features; it must not silently upgrade roadmap items to "already shipped".

## 8. Next Phase 0 work still required

1. Extract all controller handlers, request DTOs, response shapes and permission decorators into a machine-readable API contract inventory.
2. Extract every scheduled provider/job and its cadence, lock/idempotency behaviour and side effects.
3. Inspect integration hub, webhooks, payment gateway callbacks, backup/import/restore, email, push, NFC, devices, AI/MCP, reports and Verifactu services individually.
4. Map every frontend route to its data queries, commands, permissions, realtime subscriptions, uploads/downloads and acceptance tests.
5. Reconcile the route/API inventory with the Prisma model mapping and the feature checklist.
6. Define Firebase Emulator test suites and seed fixtures before writing migration Functions.

## 9. Scope boundary

This commit adds documentation only. It does not:
- Change or remove the existing Next.js/NestJS/PostgreSQL app.
- Create Firebase project resources, Firestore collections, Security Rules or Functions.
- Migrate production data or credentials.
- Claim feature parity, successful builds, or passing emulator tests.

Keep all migration work on `sitenova/phase-0-customization`. Do not merge, open a PR, or modify `master` unless explicitly requested.


## Phase 0 exit

The consolidated Phase 0 documentation exit and implementation acceptance gates are recorded in [`SITENOVA-PHASE-0-EXIT-AND-ACCEPTANCE-MATRIX.md`](./SITENOVA-PHASE-0-EXIT-AND-ACCEPTANCE-MATRIX.md). Documentation exit is achieved; implementation and emulator proof remain pending.
