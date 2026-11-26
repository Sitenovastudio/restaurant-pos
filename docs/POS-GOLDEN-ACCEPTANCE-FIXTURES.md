# POS Golden Acceptance Fixtures — Source-Derived Baseline

**Target branch:** `sitenova/phase-0-customization`  
**Status:** Test specification only. These fixtures have not yet been executed against the existing Jest suite or a Firebase implementation.

## Source of truth inspected

- `apps/backend/src/modules/orders/pricing.ts`
- `apps/backend/src/modules/orders/settlement.ts`
- `apps/backend/src/modules/orders/orders.service.ts`

The source explicitly treats line prices as tax-inclusive for downstream billing. In EXCLUSIVE tax mode, raw menu price is grossed up once before line pricing. Discounts are applied to the inclusive subtotal; the tax breakup is then scaled by the discounted-subtotal ratio. Loyalty is tender/settlement value, not a tax-reducing price discount. Tips and delivery fees are outside the taxable subtotal.

## Key numerical acceptance cases

| Case | Input | Expected result |
|---|---|---|
| 118 at 18% inclusive | Quantity 1, unit price 118 | Line total 118; tax breakup 18 |
| Exclusive 100 at 18% | Raw price 100 | Effective inclusive price 118 |
| 10% manual discount | Subtotal 118 | Discount 11.80; discounted total 106.20 |
| Full bill example | Above bill, loyalty 5, tip 5, delivery 10 | Tax 16.20; total due 116.20 |
| Cash tender | Amount applied 116.20, cash received 120 | Change 3.80 |
| Split tender | Cash 50 + card 66.20 | Fully paid, no change |
| Partial tender | Cash 50, partial allowed | Balance 66.20 |
| Non-cash overpayment | Card 120 against 116.20 | Rejected; only cash can absorb over-tender |
| Flat discount cap | Flat 15 on subtotal 118, cap 10% | Rejected without manager override |

The complete machine-readable fixture set is in `docs/fixtures/pos-pricing-settlement-golden.json`.

## Required service-level parity assertions

1. Repeated checkout with an already-used `requestId` returns the existing checkout result.
2. Checkout only proceeds for OPEN orders.
3. An incoming order with acceptance=PENDING cannot be paid until accepted.
4. Refunds must be finite, positive, and applied only to PAID orders.
5. Concurrent refunds must not exceed the original paid amount.
6. Order lookup and mutation must remain scoped to the requested branch.

## Migration gate

The Firebase implementation must pass the same cases against trusted server Functions, not merely reproduce browser preview calculations. Add negative tests for unauthorized roles, cross-tenant and cross-branch IDs, repeated request IDs, duplicate webhook deliveries and concurrent checkout/refund attempts. Preserve the source's rounding and exact error/validation semantics where those are part of the user-visible contract.

