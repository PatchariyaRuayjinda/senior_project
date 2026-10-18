# Phase 1: persistent inventory master data

Implement section 1 of [the inventory plan](inventory-plan.md). Inventory receipts,
withdrawals, picking and approvals remain subsequent phases.

## Structure

- `backend/src/inventory/`: Hexagonal domain, application use cases/ports and
  HTTP/MongoDB adapters; explicit wiring in `backend/src/composition.ts`.
- `frontend/src/features/master-data/`: feature API, types, hooks and editor/table
  components. `frontend/src/pages/master-data/` composes these with shared Atomic
  Design UI under `frontend/src/components/` and the existing Clear Blue theme.
- See [architecture](architecture.md) for dependency rules and a request trace.
- Add migration `202610180004-master-data.js` and a new frozen schema snapshot.
  Preserve applied migrations and `migration-support/v1.js`.

## Data and consistency

Products gain picking targets, active status, first-receipt time, revision and
update time. Lots gain a unique internal code and first-receipt time; manufacturer
lot numbers become optional and nonunique. Calendar dates use Bangkok midnight
in MongoDB and `YYYY-MM-DD` at the HTTP boundary. Locations gain independent
inbound/outbound blocks, active status, revision and update time.

Master-data mutations and their audit event commit in one MongoDB transaction.
An `Idempotency-Key` makes retries return the original response, with a conflict
if a key is reused for a different request. Updates also require the last observed
revision, so stale screens cannot silently overwrite another user's edits.

Transactions write the affected product/location before evaluating dependent
records. Later quantity-changing workflows must acquire the same document writes,
set first-receipt timestamps on first confirmation and preserve receipt history.
This is the shared concurrency contract for subsequent phases, not a claim that
the receiving workflow already exists.

Location reservations have a unique location ID and work reference. Metadata edits
and deactivation reject occupied or reserved slots, including zero-quantity pallets
awaiting clearance. Blocking a slot does not edit stock or position. `TMP01` keeps
its dedicated identity and purpose.

Rollback refuses operational data/audit history or altered reference records;
unused backfilled reference data can be safely restored to the prior schema.

## Public interfaces and validation

Authenticated `/api/inventory` routes list/create/update products, lots and
locations, list pallets and read entity audit history. There is no pallet quantity
mutation endpoint. Admin manages products and locations; staff can read and create
lots for an existing active SKU. Used lot dates cannot be changed directly.

The already-approved test interfaces are the real HTTP API, migration CLI and
browser workflows. Tests use disposable MongoDB replica sets and override database
targets; they never load Atlas credentials. Cover authorization, normalization,
date validation, locks, audit, idempotency, stale/concurrent writes and rollback.
Browser checks cover persistence after reload and staff/admin behavior.

Demo data is an explicit, idempotent command for a disposable test database, with
no stock fabrication through the master-data UI and no clearing existing data.

## Running and API contract

Stop the API and apply the new migration with `yarn migrate-up` in `backend/`.
Then start the API and Vite as documented in the README. Menus for products, lots,
locations and pallets use the live API. The ABC sample remains a separate sample
until Phase 5; these screens do not reuse its fixtures.

| Resource under `/api/inventory` | Operations |
| --- | --- |
| `/products` | authenticated GET; admin POST |
| `/products/:id` | admin PUT with `revision` and full editable fields |
| `/lots?productId=…` | authenticated GET, optional product filter |
| `/lots` | authenticated POST for an active product |
| `/lots/:id` | admin PUT before receipt, with `revision` |
| `/locations` | authenticated GET; admin POST |
| `/locations/:id` | admin PUT with `revision`; block changes require `reason`, renames require `labelConfirmed` |
| `/pallets` | authenticated GET, no quantity mutation |
| `/history/:entityType/:id` | authenticated GET for product/lot/location audit history |

Every write requires an `Idempotency-Key`. GET responses expose `id` instead of
MongoDB `_id`; lot dates are calendar strings or null. Failures follow the existing
`{ error: { code, message } }` envelope. Conflicts such as stale revisions,
duplicate codes, received-record locks and occupied slots return HTTP 409.

Optional demo: use a separate migrated database named `demo_…` or `test_…`, seed
its accounts, then run `yarn seed-demo` with that database explicitly configured.
It adds `DEMO-PEN`/`DEMO-BOX` and initial lots only; existing records and quantities
are preserved. It refuses database names outside those disposable prefixes.

Later stock writers must include `stockSources` in the same transaction as pallet
changes. Sources distinguish receipt provenance from count gains, preserving
their original FIFO timestamp. No receipt or quantity changes are implemented in
this phase.

## Validation completed

- Backend typecheck passed; the full auth/inventory/migration suite passed 61
  tests. Two additional demo-command tests passed after adding that command's
  repeatability/preservation and database-name guard checks.
- Frontend production build and 13 Vitest tests passed, including authenticated
  mutation retry and the removed-lot-label history regression.
- All five Playwright tests passed using `PLAYWRIGHT_CHANNEL=chrome yarn test:e2e`.
  The new flow verifies admin edits/history, reload persistence, independent slot
  blocks, staff permissions, repeated manufacturer lot labels and narrow layouts.
- Standards and spec reviews completed; the history removal display and a
  cross-test fixture dependency were corrected and rechecked.
- All database checks used disposable local replica sets. Migration 004 has not
  been applied to the user's Atlas database by this implementation task.

The build still reports large JavaScript chunks; production build succeeds. The
application remains a self-trial system, with operational workflows scheduled in
the subsequent phases.
