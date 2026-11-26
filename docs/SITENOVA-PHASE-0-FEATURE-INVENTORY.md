# SiteNova Restaurant ERP — Phase 0 Source Inventory & Feature Parity Baseline

**Target branch:** `sitenova/phase-0-customization`  
**Target architecture:** Firebase cloud + vanilla HTML/CSS/JavaScript frontend  
**Scope:** Preserve every feature currently implemented; planned roadmap items are not silently treated as existing features.  
**Phase 0 status:** Source inventory and parity baseline. No application code, database, or production deployment was changed by this inventory.

## 1. Repository baseline inspected

The inventory was read from the target branch, not inferred from the migration proposal alone.

| Source | Observed baseline |
|---|---|
| Web application | `apps/web`, Next.js 16.4.5, React 19.2.8, TypeScript, Tailwind CSS v4 |
| Backend | `apps/backend`, NestJS 11, TypeScript, Express 5 |
| Database | PostgreSQL via Prisma 6.19.3 |
| Realtime | Socket.IO via NestJS gateways |
| Workspace | pnpm workspaces + Turborepo (documented in `ARCHITECTURE.md`) |
| Frontend build scripts | dev, build, start, typecheck, lint, test |
| Backend scripts | build, dev/start, typecheck, lint, Jest unit/e2e, Prisma generate/migrate/deploy/seed |
| Data schema | 127 Prisma models and 63 enums in the inspected schema snapshot |
| Backend feature modules | 31 feature modules imported by `apps/backend/src/app.module.ts` (list below) |
| Existing feature checklist | `FEATURE-CHECKLIST.md`; its own header says it was cross-referenced as of 2026-08-14 |

### Backend module inventory

Auth and shared infrastructure are also present. The root application module imports these feature modules:

1. Menu
2. Attendance
3. Delivery
4. Rider
5. HR
6. Accounting
7. Marketing
8. Reports
9. Operations
10. Webhooks
11. Imports
12. Email
13. Tables
14. Orders
15. KDS
16. Dashboard
17. Restaurants
18. Reservations
19. Waitlist
20. Public
21. NFC
22. Downloads
23. Customers
24. Gift Cards
25. Inventory
26. Settings
27. Users
28. Display
29. Paging
30. Ratings
31. VeriFactu

Additional root infrastructure includes authentication, Prisma, realtime, throttling, scheduling, configuration and global exception handling. The inventory must also account for integration-hub and payment-gateway modules, which are imported separately in the root module.

## 2. Existing feature status baseline

The current checklist contains the following status counts when counting its feature rows (the counts are a snapshot, not a claim that every roadmap feature is implemented):

| Checklist status | Rows |
|---|---:|
| Shipped | 129 |
| Partial | 17 |
| Planned | 123 |
| Not supported | 1 |
| **Total classified rows** | **270** |

The checklist includes 29 product areas. The migration acceptance target is:
- all currently Shipped behaviours are ported and pass parity tests;
- all Partial behaviours preserve the implemented portion and document the remaining gap;
- Planned and Not supported items remain explicitly out of the migration-parity gate unless separately approved as new product scope.

Important examples from the checklist:
- POS: billing, modifiers, combos, order-level discounts, GST/VAT inclusive-price calculations, tips, refunds/partial refunds, multiple payment methods, receipts and digital bill sharing are marked shipped. Barcode/SKU/variants, saved drafts, true per-guest split bills, split tender and several discount types are not shipped.
- Tables: floors, spatial floor layouts, table states, reservations, waitlist, QR tokens, table transfers/merges and live KDS status are shipped. Drag repositioning and sections are partial.
- Menu: products, modifier groups, combos, recipes, images, allergens, kitchen station routing and item availability are shipped. Subcategories and dietary tags are partial; variants and named day-part menus are planned.
- KDS: ticket workflow, station routing, parallel station tickets, priority, timers and kitchen notes are shipped. Item-level state, recall and expediter workflows are planned.
- Kiosk: token-gated kiosk basket and idempotent order submission are shipped; kiosk payment is planned; offline queued kiosk orders are not supported.
- QR/table ordering: digital menu is shipped, but customer ordering/payment is not yet shipped.
- Inventory: recipe deduction, FIFO batch usage, stock movements, stocktakes, waste, food costing, suppliers, purchase orders, GRNs and supplier payments are shipped; inter-branch stock transfer and several analytical features are planned.
- CRM: customer profiles/history and a points ledger are shipped; tiers, segmentation and campaign automation are planned.
- Payments: cash/card/UPI/wallet/bank-transfer recording and refunds are shipped; gateway collection, QR payment collection, split payment and reconciliation are planned.
- Staff: accounts, roles, granular permissions, PIN/password login are shipped; biometric login and manager approval workflows are planned.
- Reports: dashboard summary/trends are shipped; full report catalogue, exports and scheduled email are planned.
- Delivery: checklist currently marks the category planned, although backend Delivery and Rider modules and delivery-related schema entities exist. This is a reconciliation item: inspect current routes and UI before deciding what is actually usable.
- Offline: the old architecture includes local-first and sync-related concepts. The selected Firebase target is cloud-first; offline behaviour must be specified per workflow and cannot be assumed equivalent to the existing local system.

## 3. API and command surface samples verified from controllers

These are examples of concrete controller contracts fetched from the branch. The complete route inventory still needs a systematic extraction pass across every controller.

| Domain | Controller prefix | Verified operations / examples | Vanilla target |
|---|---|---|---|
| Orders / POS | `/v1/orders` | list/manage/dues/detail; create; add/edit/remove items; release/accept/reject/cancel; discount and bill preview; checkout; receipt; bill share; KOT; printing/diagnostics; refund; merge | `/pos`, `/orders`; trusted Functions for checkout, refund, stock and immutable receipt snapshots |
| Tables | `/v1/tables` | floors; create/update/delete tables; bulk operations; floor layouts; overview; sessions and join tokens; status; QR token rotation | `/tables`, `/floor-plan`; Functions for session/token lifecycle and permission checks |
| KDS | `/v1/kds` | stations; tickets/incoming; accept/reject; progress/performance; status; priority; print/reprint | `/kds`; Firestore listeners for live queue and Functions for guarded transitions |
| Menu | `/v1/menu` | categories; stations; items; bulk price; image upload; modifiers; combo components | `/menu`; Firestore catalogue + Storage, privileged Functions for controlled changes |
| Inventory | `/v1/inventory` | ingredients; low stock; adjustments/movements/batches; recipes/tracking; suppliers; purchase orders; GRNs; waste; purchase requests | `/inventory`, `/purchasing`; Functions for posting stock and procurement ledgers |
| Reports | `/v1/reports` | report index; bill report; keyed report; CSV/export endpoints | `/reports`; aggregate/read models and server-generated exports |

**Important:** USB receipt/KOT printing and cash-drawer operations exist in the orders API. A cloud Function cannot directly access a USB printer or cash drawer attached to a restaurant terminal. Preserve this capability through browser print where suitable or a separately secured local print bridge/device agent; verify actual supported hardware during acceptance.

## 4. Data model inventory and migration mapping

The Prisma schema contains 127 models and 63 enums in the inspected snapshot. Do not flatten this schema into one generic Firestore document or translate every table mechanically. Each aggregate needs an explicit ownership, lifecycle, query and security design.

| Domain | Source models / model families | Firestore / Functions migration treatment |
|---|---|---|
| Tenant, branch, access | Restaurant, Branch, User, Role, Permission, RolePermission, UserPermissionOverride, UserBranch, StaffApiKey, IntegrationApiKey | Tenant-scoped documents; Firebase Auth UID mapping; server-verified branch membership and permission checks |
| Audit and operations | AuditLog, Notification, Backup, BackupConfig, SyncState, SyncChange, DeviceToken | Append-only audit records, controlled notification/backup metadata, migration-only sync records unless a target equivalent is required |
| Tables and guest access | Floor, Table, FloorLayout, TableSession, TableSessionGrant, TableAccess, TableRequest | Tenant/branch scoped tables and layouts; short-lived hashed guest grants; server-issued access/session tokens |
| Menu and recipes | MenuCategory, MenuItem, ModifierGroup, Modifier, MenuItemModifierGroup, ComboComponent, KitchenStation, Ingredient, RecipeIngredient, ProductRecipe, ProductRecipeLine, MenuItemCosting, ModifierIngredient | Catalogue documents and versioned recipe snapshots; avoid mutating historical order-line snapshots |
| Orders and kitchen | Order, OrderItem, OrderItemCost, OrderItemModifier, Kot, KotItem, PublicOrderKey, OrderRating | Order aggregate, line/tax/discount snapshots, idempotency keys, KOT subcollections and ratings; trusted state transitions |
| Payments | Payment, Refund, GiftCard, GiftCardRedemption, GatewayPayment, GatewayWebhookEvent, GatewayRefund, PaymentGatewayCatalogEntry, PaymentGatewayConnection | Immutable payment/refund ledger and gateway event idempotency; never accept browser-reported payment success |
| Reservations and CRM | Reservation, WaitlistEntry, Customer, CustomerAddress, Coupon, Promotion, Campaign, Referral, PointsLedger | Tenant/branch-scoped customer records, consent-aware marketing, append-only points ledger |
| Inventory and purchasing | StockBatch, StockMovement, WasteLog, StockTransfer, StockTake, StockLocation, StockLevel, LocationTransfer, StockJournalEntry, StockJournalLine, Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem, PurchaseRequest, PurchaseRequestItem, SupplierQuotation, SupplierQuotationItem, SupplierInvoice, SupplierPayment | Trusted stock-posting Functions, immutable movement ledger, batch/valuation snapshots, explicit idempotency and reconciliation |
| Staff and finance | Attendance, Shift, LeaveRequest, StaffPay, PayrollRun, PayrollLine, Expense, PettyCashEntry, CashClosing, PhoneTillClosing, Budget, BankTransaction | Highly restricted role/tenant access; payroll and finance data must not be readable by ordinary staff |
| Delivery and service | DeliveryZone, DeliveryAssignment, Equipment, ServiceLog, Buzzer, BuzzerCall | Verify shipped UI/workflow against checklist; Functions for assignment and signed outbound device webhooks |
| Public surfaces and integrations | DisplayTerminal, DisplayAd, NfcTag, NfcTap, WebhookEndpoint, WebhookDelivery, IntegrationConnection, IntegrationLog, Document, DocumentFile, DownloadStat, ReportSchedule, VeriFactuSettings, VeriFactuRecord | Public tokens are narrowly scoped; secrets stay server-side; external webhooks verified and idempotent; file access via Storage Rules and signed/authorized operations |

The full source of truth for fields, indexes, relations, defaults and enum values remains `apps/backend/prisma/schema.prisma`. This summary is a domain map, not a substitute for per-model field-level mapping.

## 5. Target route and service parity matrix

The following target route names are proposed logical routes, not code that has already been created.

| Source domain / surface | Target vanilla route(s) | Data/services | Critical acceptance evidence |
|---|---|---|---|
| Login, signup, PIN, team, roles | `/login`, `/signup`, `/team`, `/settings/roles` | Firebase Auth; user/branch membership; permission resolver Function | password/PIN policy; disabled user; branch isolation; permission allow/deny tests |
| Dashboard | `/dashboard` | branch summary/read models; realtime counters | same totals and date boundaries as source |
| POS and order management | `/pos`, `/orders`, `/orders/:id` | order command Functions; price/tax engine; payment/refund ledgers | exact totals, rounding, discount/tip/tax, cancel/refund caps, duplicate-submit protection |
| Tables, floor plan, reservations, waitlist | `/tables`, `/floor-plan`, `/reservations`, `/waitlist` | tables/floors/sessions/reservations; realtime listeners | occupancy lifecycle; token rotation; concurrent table assignment |
| KDS and station screens | `/kds` | KOT/ticket collections; guarded transitions; realtime listeners | station routing, ticket ordering, accept/reject/bump/priority, reconnect behaviour |
| Menu, modifiers, combos, recipes | `/menu`, `/menu/categories`, `/menu/recipes` | catalogue docs; Storage; recipe version snapshots | modifier constraints, combo pricing, availability windows, image permissions |
| Inventory, stock journal, suppliers, procurement | `/inventory`, `/stock-journal`, `/suppliers`, `/purchasing` | stock ledger; batch records; procurement Functions | FIFO, recipe deduction, waste, stocktake, GRN, supplier balance reconciliation |
| Customers, gift cards, loyalty | `/customers`, `/gift-cards`, `/loyalty` | customer docs; gift-card and points ledgers | history, balances, redemption limits, branch/tenant isolation |
| Staff, attendance, HR | `/team`, `/attendance`, `/hr` | restricted staff records and HR Functions | least privilege, attendance corrections, payroll privacy |
| Accounting, expenses, cash | `/accounting`, `/expenses`, `/cash-closing` | ledger/expense/cash close docs and trusted posting | reconcile source totals, immutable posted entries |
| Reports and exports | `/reports`, `/reports/:key` | read models and server-side CSV/PDF/XLSX generation | source-to-target totals and export contents |
| Marketing and campaigns | `/marketing`, `/campaigns` | customer consent, campaign jobs and delivery logs | opt-out, recipient eligibility, job retry/idempotency |
| Public menu, kiosk, bill share, display | `/order/:token`, `/kiosk/:token`, `/bill/:token`, `/display/:token` | public read models, scoped tokens, public order Functions | no cross-tenant reads; token expiry/revocation; rate limits |
| Delivery, riders, paging, NFC | `/delivery`, `/riders`, `/paging`, `/nfc` | verify current UI and API completeness first | signed webhooks, replay resistance, device lifecycle |
| Settings, imports, downloads, integrations, VeriFactu | `/settings`, `/imports`, `/downloads`, `/integrations`, `/verifactu` | privileged Functions, Storage, integration secrets | tenant-scoped credentials, import validation, legal/export evidence |

## 6. Security and invariants that must survive migration

1. Tenant and branch ownership must be checked on every read and write; never rely on a client-supplied `restaurantId` or `branchId`.
2. Firebase Admin SDK bypasses Firestore Security Rules. Every privileged Function must independently authenticate the caller and verify tenant, branch, role and permission.
3. Browser code must not calculate authoritative totals or post payments/refunds/stock changes. It may preview; the server recomputes and validates.
4. Checkout, refund, stock posting, gift-card redemption, loyalty redemption, cash closing and webhook processing need idempotency and concurrency tests.
5. Preserve source tax regime/mode, inclusive-price calculation, precision/rounding, tips, discounts and receipt snapshots.
6. Preserve append-only audit and financial/stock ledgers. Corrections should reverse or compensate posted entries rather than rewrite history.
7. Public kiosk, QR, bill-share, display, NFC and guest-session tokens must have explicit scope, expiry/rotation/revocation and rate limits.
8. Keep secrets, private signing keys, gateway credentials and webhook secrets out of frontend bundles, Firestore-readable documents and Git history.
9. File upload/download permissions must be tenant/branch scoped and content validated.
10. Verify CORS, App Check, abuse throttling, backup/restore and incident recovery before production.

## 7. Cloud migration constraints to resolve during implementation

- **Offline:** Firestore web cache is not a replacement for the current local database authority. Checkout, refunds and shared stock mutations require online trusted Functions in this cloud-first plan. If the business requires offline checkout, pause and design a separate local transaction authority plus conflict-safe synchronization.
- **Printing / cash drawer:** cloud Functions cannot reach a restaurant's USB or private-LAN peripherals. Keep browser print and design a secure local bridge where raw device access is required.
- **Realtime:** replace Socket.IO event semantics with explicit Firestore listeners and command Functions; define ordering, reconnect, deduplication and stale-client behaviour per screen.
- **Reports:** do not run expensive aggregation on every dashboard render. Define materialized summaries, update triggers and reconciliation jobs.
- **Large imports/exports:** use background jobs and Storage rather than long-running browser requests.
- **Costs:** model Firestore reads/writes/listeners, Storage egress, Functions invocations, scheduled jobs and logging before rollout. Budget alerts are alerts, not hard spending caps.
- **AGPL-3.0-only:** preserve required notices and review distribution/network-service obligations and any commercial licensing model with qualified counsel.

## 8. Phase 0 exit criteria

Phase 0 is complete only when:
- [x] Existing stack and major domain model inventory recorded.
- [x] Existing feature checklist status counts recorded.
- [x] Representative critical controller routes inspected.
- [ ] Every frontend route/page and public surface enumerated from the current branch.
- [ ] Every backend controller route and permission guard enumerated.
- [ ] Every Prisma model/enum mapped field-by-field to target collection/document design or explicitly retained/retired.
- [ ] Every scheduled job, Socket.IO event, webhook, integration, file flow and device workflow enumerated.
- [ ] Feature checklist discrepancies (especially Delivery and offline behaviour) reconciled against actual UI/controller/service code.
- [ ] Golden test fixtures created for checkout/tax/discount/tip/refund/stock/loyalty/cash-close and tenant isolation.
- [ ] User-approved parity scope and migration/cutover sequence recorded.

## 9. Next implementation gate

Do not begin mass conversion yet. Finish the unchecked source extraction and build golden fixtures first. Then implement the Firebase Emulator foundation and one vertical slice (authentication + tenant/branch context + menu read) before POS checkout. The old Next.js/NestJS/PostgreSQL application remains intact until the replacement passes parity and migration rehearsal.
