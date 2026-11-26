# Prisma to Firestore Data Mapping Worklist

**Status:** Source extraction is complete; the target collection design is provisional and requires review before implementation.

Source inventory: [`prisma-schema-inventory.json`](./fixtures/prisma-schema-inventory.json). It records all source model fields, types, attributes, model constraints, enums and enum values from the inspected branch snapshot.

## Source coverage

- 127 Prisma models
- 63 Prisma enums
- 1,808 parsed model fields, including relation fields

## Mapping rules for the Firebase design

1. Keep tenant ownership explicit on every tenant-owned record; resolve tenant and branch from the authenticated principal, not client-provided IDs.
2. Model high-write financial and inventory history as append-only ledgers with immutable posting snapshots and idempotency keys.
3. Use stable source IDs during migration; maintain a source-ID-to-Firestore-path mapping until reconciliation and rollback windows close.
4. For one-to-many collections, choose subcollections only where parent lifecycle, query patterns and security rules support that boundary; otherwise use top-level collections with tenant/branch keys and indexes.
5. Preserve Prisma uniqueness and compound-index semantics explicitly. Firestore does not automatically reproduce PostgreSQL unique constraints; use trusted transactional reservation documents or server-side uniqueness guards where needed.
6. Preserve Decimal precision intentionally. Do not use binary floating-point for money; use integer minor units or a rigorously specified decimal representation and convert only at display boundaries.
7. Preserve DateTime timezone semantics as UTC timestamps while retaining business-local date keys/timezone where reporting and numbering depend on them.
8. Treat JSON fields as versioned, validated schemas, not arbitrary untrusted objects.
9. Map relation fields to stable document IDs or explicit document references; do not assume Firestore enforces relational foreign keys or cascade behaviour.
10. Map delete/update cascades to explicit trusted Functions. Financial, stock, audit and legal records generally require reversal/retention rather than cascading deletion.
11. Review every model-level @@unique, @@index, @@id and @@map from the source JSON before approving collection layout and composite indexes.
12. Security Rules and Functions must enforce tenant/branch isolation, role permissions, ownership and public-token scope independently of UI visibility.

## Required next step before coding

Create a reviewed mapping row for every model and field with: source model/field, target collection/document path, target field name, transform, null/default handling, security classification, read/write owner, query/index requirement, migration backfill rule and reconciliation test. The JSON inventory is the exhaustive input catalogue; this worklist is not yet an approved schema.
