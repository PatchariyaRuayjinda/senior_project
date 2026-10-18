# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary inventory user is warehouse staff. In the first version, one staff
user can complete receiving, withdrawals, ABC analysis, and storage-location
selection without handing those tasks to a separate warehouse-manager role.

## Product Purpose

Rework the original undergraduate inventory application into a personal
playground for implementing features and practising collaboration with AI.
There is no existing data to migrate and no confirmed external customer.

The inventory workflow uses ABC classification to help arrange products into
warehouse zones and shelves so frequently picked products are easier to reach.
Placement is the first objective, rather than prioritizing stock by usage value.

## Capabilities and Constraints

- The application requires sign-in; a public-facing catalog is not in scope.
- Use Ant Design (`antd`) for standard interface components instead of rebuilding
  controls, tables, forms, menus, or overlays from scratch.
- The agreed ABC ranking measure is the number of withdrawal occurrences per
  product, rather than the total number of units withdrawn or their value.
- A withdrawal document can contain multiple product lines. Each distinct
  product counts once per successfully issued document, regardless of the
  quantity issued for that product.
- ABC analysis defaults to the trailing 90 days. Users can select a different
  date range on the analysis screen.
- Each product has one storage location in the first version; quantities are
  not split across multiple locations for the same product.
- A storage location is one slot with a short identifier such as `A01`: zone A,
  slot 01. The first UI does not require separate rack, level, and compartment
  fields from the legacy location hierarchy.
- Each slot holds one product type, with multiple units allowed. Different
  product types cannot share a slot in this first version.
- ABC results lead directly into a relocation workflow: review products whose
  current zone differs from the recommended class, select an appropriate empty
  slot, physically move the stock, then confirm. The recorded location changes
  only after staff confirms the physical move.
- The active stack is React 18, Vite and TypeScript, with an Elysia/Bun API and
  MongoDB. Auth already supports login, refresh, logout, and server-side checks.
- Initial auth roles are `admin` and `staff`. The first inventory workflow is
  available end-to-end to staff; detailed permissions beyond that are open.
- Open decisions: cumulative class boundaries and tie handling, further location
  constraints, and inventory API scope.

## Evidence on Hand

- `legacy/` preserves the original inventory implementation, including receiving,
  withdrawals, returns, zones, shelves, and ABC-related placement screens.
- The legacy ABC formula is reference material, not the specification for the
  newly agreed withdrawal-frequency metric.
- `docs/auth.md` describes the active authentication implementation and limits.
- The active frontend includes the approved ABC workbench with temporary sample
  inventory and relocation state. Inventory APIs and MongoDB persistence are not
  implemented; `docs/ux/abc-stock/implementation.md` records that boundary.
- No real inventory dataset has been supplied. Any demonstration inventory must
  be identified as sample data.

## Product Principles

- Design the inventory workflow around an action users can take with ABC results.
- Make classification criteria and the meaning of displayed numbers explicit.
- Reuse established component behavior consistently through Ant Design.
- Build in small, usable workflows that support learning and experimentation.

## Visual Preferences

- The user selected the ABC table with an adjacent product/location panel
  (wireframe option 2). On mobile the panel becomes a full-width drawer.
- The user selected Clear Blue as the only theme for the first release, replacing
  the initial green treatment. Dark mode is outside the initial scope; Graphite
  remains a possible future direction, not a delivery commitment.
- The user approved a white (`#ffffff`) mobile canvas for Clear Blue; the desktop
  canvas remains as designed. `DESIGN.md` records the implemented theme and
  `docs/ux/abc-stock/README.md` records the agreed workflow.
