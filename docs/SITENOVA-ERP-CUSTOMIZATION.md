# SiteNova Restaurant ERP — Customization Plan

> Working plan for the SiteNova fork. This document records the verified starting point and the safe implementation sequence. It does not claim that planned features are already implemented.

## Repository and branch safety

- Repository: `Sitenovastudio/restaurant-pos`
- Working branch: `sitenova/phase-0-customization`
- Base branch: `master`
- All customization commits must stay on the working branch until reviewed. Do not push branding or product changes directly to `master`.
- Preserve the upstream AGPL-3.0 license, copyright notices, NOTICE, attribution, and applicable trademark restrictions. SiteNova branding must not imply endorsement by or affiliation with the upstream authors.

## Verified starting point

This fork is based on Nodedr OrderRestro, a pnpm/Turborepo monorepo:

- Frontend: Next.js 16, React 19, Tailwind CSS 4.
- Backend: NestJS 11.
- Data: PostgreSQL with Prisma.
- Realtime: Socket.IO.
- Deployment: Docker Compose; Node.js >=22 and pnpm 11.
- Product domains already include restaurant POS/billing, tables/reservations, KOT/KDS, menu, inventory/procurement, CRM, staff, accounting, delivery, analytics, finance, maintenance, documents, security, integrations and admin.

The codebase already has light and dark themes and a documented premium design direction. Current application tokens use warm-neutral surfaces and violet accents (light `#6D4AFF`, dark `#A18AFF`). The first UI pass should refine and consistently apply this system rather than replace it without a reason.

## Product goals

1. Present the product as **SiteNova Restaurant ERP** while retaining required upstream attribution and license notices.
2. Keep the existing restaurant workflows stable: order entry, table service, kitchen tickets, checkout, inventory and reporting.
3. Deliver a consistent premium interface across desktop, tablet and mobile, with working light/dark mode and accessible touch targets.
4. Retain the self-hosted/local-LAN operating model and document cloud deployment as an alternative, not as a replacement for local operation.
5. Improve payment configuration only where the provider integration is genuinely implemented and can be tested.
6. Avoid introducing a subscription billing promise until the subscription lifecycle, webhooks, entitlements, retries, cancellation and reconciliation are implemented and tested.

## Important capability boundaries

- **Offline:** the documented guarantee is strongest for a branch running its own local server on the LAN. Do not describe every browser/device as independently offline-capable or promise conflict-free multi-writer synchronization unless that capability is built and verified.
- **Cloud:** the existing Docker stack can be hosted on a VPS/cloud server. This is hosting the same application, not a separate managed cloud-sync service.
- **Payments:** the payment guide documents hosted integrations for Razorpay, Stripe and Cashfree, but says live-account validation is still required. Other catalog entries are reference-only, not working integrations. Keep all provider secrets server-side.
- **Subscriptions:** no subscription-management implementation has been verified in the repository. Treat this as a separate future workstream, not an existing checkout feature.
- **Money and permissions:** preserve server-authoritative pricing/tax/discount calculations and granular RBAC. Never trust browser-submitted totals or expose integration secrets.

## Implementation sequence

### Phase 0 — Safe baseline and product identity
- [x] Create a dedicated customization branch from `master`.
- [x] Review repository architecture, design tokens, roadmap and payment integration status.
- [ ] Add SiteNova product identity and UI branding without deleting upstream legal notices.
- [ ] Inventory all user-facing product names, logos, metadata, install instructions and documentation references before changing them.
- [ ] Record baseline build, typecheck, lint and test results before application-code changes.

### Phase 1 — Brand and interface consistency
- [ ] Establish the SiteNova logo/wordmark and favicon assets (use approved assets; do not fabricate a logo file).
- [ ] Update app metadata, login/signup, navigation shell, sidebar, dashboard and printable surfaces consistently.
- [ ] Verify both themes and responsive layouts at phone, tablet and desktop widths.
- [ ] Preserve touch-first POS/KDS controls, keyboard access, focus visibility and reduced-motion behavior.

### Phase 2 — Operational reliability
- [ ] Regression-test core order → KOT → KDS → bill → payment workflows.
- [ ] Verify inventory deduction, refunds, permissions, audit trail, backup and restore.
- [ ] Confirm local-LAN operation with WAN disconnected and document supported device behavior precisely.
- [ ] Add or update automated tests for every changed workflow.

### Phase 3 — Deployment and integrations
- [ ] Document local Docker deployment and a secure VPS deployment separately.
- [ ] Review environment variables, HTTPS, cookies, backups, database migrations and secret handling.
- [ ] Run sandbox end-to-end tests for each enabled payment provider before describing it as production-ready.
- [ ] Evaluate subscription billing as a distinct backend feature with provider, webhook, entitlement and accounting design before implementation.

### Phase 4 — Release readiness
- [ ] Run repository CI and resolve regressions.
- [ ] Review license/NOTICE/attribution and trademark presentation.
- [ ] Prepare release notes, setup guide, rollback steps and a tested backup.
- [ ] Open a pull request from this branch to `master`; do not merge without review.

## Working rules

- Make small, reviewable commits on `sitenova/phase-0-customization`.
- Inspect existing components before replacing them; reuse the current design tokens and component library.
- Do not change database schema or migrations unless the feature requires it and a migration/rollback plan is included.
- Do not store API keys, passwords, production customer data or payment credentials in Git.
- Mark each checklist item complete only after the relevant code change and verification have actually happened.
