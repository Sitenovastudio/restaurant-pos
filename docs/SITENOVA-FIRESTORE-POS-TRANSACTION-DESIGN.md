# SiteNova POS Aggregate and Transaction Design for Firestore

**Status:** Architecture proposal based on current source behaviour. Not implemented.  
**Target branch:** `sitenova/phase-0-customization`

## 1. Source behaviour verified

Inspected source files:

- `apps/backend/src/modules/orders/orders.service.ts`
- `apps/backend/src/modules/orders/pricing.ts`
- `apps/backend/src/modules/orders/settlement.ts`
- `apps/backend/src/modules/inventory/inventory.service.ts`
- `apps/backend/src/modules/inventory/stock.service.ts`
- `apps/backend/prisma/schema.prisma`

The current source has these important behaviours:

1. Orders are branch-scoped. Checkout/refund lookup uses both `orderId` and `branchId`.
2. Order number allocation is done inside a database transaction with a per-branch, per-day lock.
3. Order lines retain historical name, unit price and tax-rate snapshots; modifiers retain name and price-adjustment snapshots.
4. Checkout checks an existing request ID, requires OPEN status and refuses a PENDING acceptance order.
5. Checkout serializes payment attempts by updating/locking the order row and re-reading the bill and payments inside the transaction.
6. The first payment locks bill figures. Partial payment leaves the order OPEN; the final payment performs the OPEN-to-PAID transition.
7. Gift-card redemption, coupon redemption, loyalty point decrement, payment rows, inventory deduction and final order status are coordinated in the checkout transaction.
8. Recipe/direct/combo stock use is planned from menu and recipe configuration. Stock consumption uses exact decimal arithmetic, FIFO batches ordered by receivedAt ascending, updates ingredient currentStock and appends StockMovement rows.
9. Short stock is allowed on checkout by the current `allowNegative: true` call; unmapped tracked items are reported as skipped rather than silently ignored.
10. Refunds are accepted only for PAID orders, must be positive, and are capped by paid total minus recorded refunds and active unlinked gateway refund reservations.
11. Refunds serialize on the order row and re-read refunds/reservations before calculating the remaining refundable amount.
12. A money-only refund does not restore stock. Only explicitly returned items create OrderItemStockReturn records and compensating REVERSAL movements, capped at sold quantity less earlier returns.
13. Gift-card/store-credit refund handling, VeriFactu refund recording and loyalty point reversal are part of the refund transaction.

## 2. Proposed Firestore document layout

These paths are proposals. Tenant and branch identifiers must be derived from verified Firebase Auth membership and server-side access checks.

```text
restaurants/{restaurantId}
  branches/{branchId}
    orders/{orderId}
      items/{orderItemId}
        modifiers/{orderItemModifierId}
        stockReturns/{returnId}
      payments/{paymentId}
      refunds/{refundId}
      giftCardRedemptions/{redemptionId}
      kots/{kotId}
        items/{kotItemId}
      deliveryAssignments/{assignmentId}

    orderNumberCounters/{localDate}
    checkoutRequests/{requestId}
    refundRequests/{requestId}

    ingredients/{ingredientId}
      stockBatches/{batchId}
    stockMovements/{movementId}
    stockJournalEntries/{entryId}
      lines/{lineId}

    menuItems/{menuItemId}
      recipeLines/{recipeLineId}
      comboComponents/{componentId}
      modifierGroupLinks/{linkId}

    customers/{customerId}
      pointsLedger/{ledgerId}
    giftCards/{giftCardId}
      redemptions/{redemptionId}

    gatewayRefundReservations/{reservationId}
    auditLogs/{auditId}
```

### Why this shape

- Order is the root aggregate because status, acceptance, bill snapshots, customer/table references and delivery state are coordinated around it.
- Order items are children of the order. Modifiers and KOT item links remain children of their owning records. Keep menu item IDs as references but retain the source snapshot fields on the order item.
- Payments and refunds are separate child documents, not a mutable array on the order. They are append-oriented records and may grow over the order lifecycle.
- Stock movements are branch-level ledger records because they must be queried by ingredient, batch, order, date and journal entry. Keep stable `orderId` and `ingredientId` fields for those queries.
- Current ingredient stock and each batch's remaining quantity are operational balances. Movements remain the audit history; do not reconstruct the whole ledger on every POS screen.
- The order-number counter and idempotency request documents are explicit concurrency/uniqueness controls, not user-facing data.

## 3. Trusted command Functions

Do not allow the browser to write authoritative order/payment/stock/refund fields directly. Expose command Functions with authenticated context:

| Command | Responsibility |
|---|---|
| `createOrder` | Validate branch membership, active menu items, modifier selections, table/customer ownership, pricing and delivery zone; allocate daily order number; create order, item snapshots and KOTs as allowed |
| `updateOpenOrder` | Change items/notes only while order is OPEN and before bill figures are locked; reprice from server catalogue and retain item history rules |
| `acceptOnlineOrder` | Guard PENDING → ACCEPTED, then create KOTs and notify branch |
| `checkoutOrder` | Serialize on order, re-read bill, validate discount and tender, redeem gift card/points/coupon, append payments, deduct stock exactly once, close table/session and set PAID when fully settled |
| `refundOrder` | Serialize on order, compute refundable amount including gateway holds, append refund, update gift card/store credit/points/VeriFactu and optionally append stock return/reversal |
| `mergeOrders` | Require two OPEN unpaid orders in same branch; reparent/move items and KOTs; recalculate totals and cancel source order |
| `transitionKot` | Validate station/user permissions and allowed KOT transition; append timestamps and broadcast change |
| `postStockJournal` | Validate draft, lock/guard affected ingredient balances and append stock movements atomically with posted journal state |

Each Function must independently verify Firebase Auth, restaurant membership, branch membership, role/permission grants, licence state and request schema. Admin SDK bypasses Firestore Rules, so Function checks are mandatory.

## 4. Checkout transaction sequence

The proposed cloud command should follow this order:

1. Authenticate caller; resolve restaurant and branch from trusted membership data.
2. Validate request ID and payload shape. Read the idempotency record; if completed, return the stored result.
3. Read order, items, payments, branch tax settings and restaurant discount/loyalty settings.
4. Confirm order belongs to branch, status is OPEN, and acceptance is not PENDING.
5. Recompute authoritative price, tax breakup, discounts, coupon/promotion, tip, delivery fee, loyalty and remaining balance using ported source formulas.
6. Begin the transactional commit with an order concurrency/version guard; re-read the authoritative order/payment state and abort/retry if it changed since calculation.
7. Recalculate the balance from committed payment records. Enforce first-payment bill locking and partial-payment semantics.
8. Validate gift-card balance and loyalty points with guarded balance updates; reserve unique redemption/idempotency records.
9. Append payment records. Only cash can absorb over-tender and produce change. Reject non-cash overpayment.
10. If partially paid: persist locked bill figures, payment(s), idempotency result and leave status OPEN. Do not deduct stock or close table.
11. If fully paid: compute stock plan; update ingredient balances and FIFO batch balances; append consumption movements; set order PAID; persist the idempotency result; close table/session if idle.
12. After commit, emit realtime events and send notifications/webhooks as retryable side effects. Side-effect failure must not roll back a committed sale.

**Critical implementation issue:** Firestore transactions require all transaction reads to occur before writes. The exact transaction read/write plan and write count must be designed and tested; do not mechanically port the Prisma callback line-by-line. For high-volume orders or large recipe expansions, consider a durable command/outbox workflow with explicit pending state rather than splitting an allegedly atomic sale without recovery semantics.

## 5. Idempotency and unique constraints

Firestore does not provide PostgreSQL-style arbitrary compound unique constraints. Reproduce the important source constraints with deterministic reservation documents written in the same transaction as the operation:

| Source constraint | Proposed target guard |
|---|---|
| `Order(branchId, orderNumber)` | `orderNumberCounters/{localDate}` transaction; reserve next number and create order in same transaction |
| `Order(branchId, clientRequestId)` | `checkoutRequests/{hash(branchId, clientRequestId)}` or create-order request record with payload hash |
| `Order(branchId, externalSource, externalOrderId)` | Deterministic external-order reservation key under branch |
| `Payment(orderId, clientRequestId)` | `checkoutRequests/{requestId}` linked to payment/result; one request ID cannot create a second payment |
| `Refund.clientRequestId` | `refundRequests/{requestId}` with stored result |
| `StockBatch(branchId, idempotencyKey)` | Deterministic stock-batch idempotency record |
| `StockJournalEntry(branchId, entryNo/idempotencyKey)` | Journal number counter and idempotency reservation |
| `PointsLedger.idempotencyKey` | Deterministic ledger key per earning/redemption event |
| `StockLevel(ingredientId, locationId)` | Deterministic composite document ID |

Use a stable hash/encoding function with collision-safe delimiters; do not use untrusted raw values as document paths. Store the request payload hash and reject reuse of a key with a different payload. Define retention policy for idempotency records before implementation.

## 6. Inventory and refund invariants

- FIFO is based on `StockBatch.receivedAt` ascending, not arbitrary document order.
- Batch remaining quantity and ingredient currentStock must update together with appended movement records.
- Preserve 3-decimal quantity and 4-decimal unit-cost precision; never use JavaScript floating-point as the authoritative calculation.
- Preserve negative stock on checkout where source permits it; surface unmapped tracked menu items as an explicit warning/result.
- Do not mutate/delete original consumption movements when returning goods.
- A physical return is capped at sold quantity minus earlier return quantities.
- Refundable amount includes active unlinked gateway refund reservations; a pending provider refund must reserve value before the external call.
- External payment provider calls cannot be part of a Firestore transaction. Use a durable reservation/outbox state machine, idempotent provider request and reconciliation callback before finalizing the local refund.
- Only the explicit returned quantities trigger stock restoration; money-only refund never changes stock.
- A gift-card refund and a store-credit refund are different settlement methods and must not double-credit a card/wallet.

## 7. Data precision and snapshots

| Source field family | Source precision | Proposed representation |
|---|---:|---|
| Selling price, line total, tax, discount, tip, payment, refund | Decimal(12,2) | Integer minor units (paise) for authoritative calculations; display as INR rupees |
| Ingredient quantities, batch quantities, stock movements | Decimal(12,3) | Integer milli-units where unit scale is fixed, or decimal-string + decimal arithmetic if conversions require it |
| Unit cost | Decimal(12,4) / Decimal(14,4) | Scaled integer or decimal-string with exact decimal arithmetic |
| Tax rates | Decimal(5,2) | Integer basis points (e.g. 18.00% = 1800) |
| Coordinates and layout geometry | Float | Number with validation; not monetary |
| DateTime | PostgreSQL timestamp | Firestore Timestamp in UTC plus branch-local date key for daily numbering/reporting |
| JSON configuration | Json | Versioned validated object with schema version |

The source has tax-inclusive line pricing and tax breakup as informational components. Keep source formulas and tax-mode semantics; do not add GST again to inclusive prices. Store immutable item name, unit price, tax rate, modifier name/adjustment and bill snapshots on the transaction so later menu edits do not rewrite old receipts.

## 8. Firestore Security Rules outline

Rules should default-deny. Users may read only tenant/branch documents after their membership and permission context is verified. For the sensitive aggregate collections:

- Client direct writes to orders, payments, refunds, stock movements, stock batches, points ledgers, gift-card balances/redemptions, gateway reservations, audit records and stock journals should be denied.
- Client writes to open-order draft fields, if permitted at all, must be narrowly field-whitelisted and must not accept authoritative price/tax/total/status/payment/stock fields.
- Public QR/kiosk/bill-share/display access must use scoped, expiring, revocable tokens and narrow read/command Functions; never grant public collection reads.
- Functions must repeat all tenant, branch and permission checks because Admin SDK bypasses Rules.
- Never store raw gateway secrets, API keys or token hashes in client-readable documents.

## 9. Required golden tests before first Firebase checkout

1. Same request ID and same payload returns the same checkout result without a duplicate payment.
2. Same request ID with different payload is rejected.
3. Two simultaneous checkouts against one OPEN order cannot overpay or deduct stock twice.
4. Partial payment locks bill figures but leaves order OPEN and stock unchanged.
5. Final partial payment transitions to PAID and deducts stock once.
6. PENDING online order cannot be paid until accepted.
7. Cash over-tender records exact change; card/UPI overpayment is rejected.
8. Two simultaneous redemptions cannot spend the same loyalty/gift-card balance twice.
9. FIFO batch consumption is deterministic and exactly reconciles ingredient balance.
10. Recipe, direct-stock and combo deduction match source stock planning.
11. Unmapped tracked items are surfaced; permitted negative stock remains consistent.
12. Refunds cannot exceed paid total after previous refunds and pending gateway reservations.
13. Concurrent refunds cannot exceed refundable balance.
14. Money-only refund leaves stock unchanged.
15. Returned items cannot exceed sold quantity minus previous returns; reversals are append-only.
16. Cross-restaurant and cross-branch order, customer, menu, table, payment and refund IDs are rejected.
17. A failure before commit leaves no partial payment, stock or bill state.
18. A post-commit notification/webhook failure does not reverse a completed sale and is safely retried.

## 10. Open design decisions / do not guess

- Firestore collection layout and subcollection strategy need validation against actual query/report workloads and tenant-wide export requirements.
- Exact transaction size and maximum recipe/batch write count must be measured with realistic menu/order data.
- Choose paise/milli-unit scaling policy for all supported currencies and ingredient conversion units.
- Determine whether order item edits after first partial payment are blocked or supported by current source; preserve source behaviour exactly.
- Define gateway refund reservation expiry, retry, manual review and reconciliation schedule.
- Define local printer bridge protocol and device authentication separately from cloud transaction functions.

## 11. Readiness

This document is a source-derived design proposal only. No Firebase Functions, Firestore Rules, collections, emulator tests, payment integrations or data migration have been implemented. Approve and test the aggregate/transaction design before writing the first cloud checkout command.
