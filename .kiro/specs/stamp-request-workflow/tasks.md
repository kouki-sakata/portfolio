# Implementation Plan

- [x] 1. Deliver employee-facing UI via TDD
- [x] 1.1 Write Vitest + Testing Library specs before building components
  - Cover RequestCorrectionModal (prefill, RHF+Zod validation, toasts), status badges on stamp history rows, My Requests table filters/pagination, cancellation dialog, and React Query cache invalidation expectations so UX behavior is locked prior to coding.
  - Assert responsive layout breakpoints, optimistic updates, accessibility contrast, and duplicate-prevention UX so any regression fails fast.
  - Capture the new dual-pane workspace shell: header contents (title, role switch, ⌘K trigger, new request CTA, user summary), 384px sidebar with search/tabs/sort, request-card chrome (status badges, unread dot, shortcut hints, hover quick actions), and detail panel sections (info grid, reasons, rejection banner, role-aware actions) so tests guard the specified interactions.
  - _Requirements: 1,2,6,8,10_
- [x] 1.2 Implement employee UI flows until the tests pass
  - Build the modal, stamp history integration, My Requests page, and cancellation dialog that satisfy the penned specs, including toast messaging, skeletons, badge color mapping, and hook-driven cache invalidation.
  - Ensure pending/approved statuses disable actions and UI state re-enables after cancellation per the verified expectations.
  - Wire keyboard navigation (↑/↓/j/k + Enter), `WorkflowCommandPalette` actions (new request + status filters + settings shortcut), unread indicators, and Sonner toasts so the list/detail workspace behaves exactly as defined.
  - _Requirements: 1,2,6,8,10_

- [x] 2. Deliver administrator UI via TDD
- [x] 2.1 Create pending list, bulk bar, and approval/rejection dialog tests first
  - Validate AdminGuard routing, TanStack Table selection limits, bulk action prompts, comparison dialog fields, audit timeline renderings, and conflict toast handling before implementation so parallel work stays safe.
  - Specify responsive layouts and RBAC redirect behavior to guarantee UX consistency.
  - Extend specs to cover admin-only visuals: employee name on cards/detail header, sidebar bulk checkboxes, BulkActionBar count + pinned placement, role-aware quick actions, and command palette options for status filters + bulk affordances.
  - _Requirements: 3,4,7,8,10_
- [x] 2.2 Implement admin UI routes and interactions to satisfy the tests
  - Wire PendingRequestsAdminPage, BulkActionBar, detail/comparison/approval/rejection dialogs, and audit timeline visualizations with React Query mutations, optimistic removal, and responsive layouts.
  - Surface partial-success messaging and enforce ≤50 selection logic per the preceding specs.
  - Implement WorkflowSidebar quick actions + hover affordances for admin operations, ensure bulk select stays sticky at 384px width, and align command palette, keyboard hints, and Sonner toasts with the shared workspace requirements.
  - _Requirements: 3,4,7,8,10_

- [x] 3. Enforce access control, query projections, and error semantics through tests
- [x] 3.1 Build controller/security tests ahead of implementation
  - Use MockMvc/Spring Security to prove only authenticated employees can hit create/my-requests/cancel routes, admins gate pending/approval/bulk endpoints, and unauthorized users see 401/403 while responses still include pagination metadata.
  - Add query projection tests that expect badges, timestamps, audit fragments, and error payload shapes, ensuring the API contract remains behavior-first.
  - _Requirements: 1,2,3,4,6,7,8,9_
- [x] 3.2 Implement/adjust controllers, PreAuthorize annotations, and response mappers to make the tests pass
  - Wire DTOs to services, normalize validation/conflict errors, guarantee pagination counts + filters, and sanitize payloads before persistence so the verified boundary behavior holds.
  - _Requirements: 1,2,3,4,6,7,8,9_

- [x] 4. Validate employee workflow backend behavior via TDD
- [x] 4.1 Craft failing unit/integration tests for submission, cancellation, and status projection
  - Cover registration service logic (reason length, chronological rules, future/working-hour checks, duplicate prevention, next-day checkout adjustments) plus controller flows to ensure 400/409/401 responses and log_history writes occur.
  - Add tests for cancellation safeguards, ensuring only pending requests cancel, reasons meet thresholds, and stamp_history remains unchanged while badges re-enable in projections.
  - _Requirements: 1,2,6,7,8,9_
- [x] 4.2 Implement registration, cancellation, and status-surface services to pass tests
  - Persist snapshots, emit log_history entries, expose enriched employee list/detail responses with timestamps/reasons/approver metadata, and integrate duplicate-status helpers so stamp history badges and My Requests filters work as asserted.
  - _Requirements: 1,2,6,7,8,9_

- [x] 5. Validate administrator workflow backend via TDD
- [x] 5.1 Write failing approval/rejection/bulk tests covering conflicts and audit
  - Exercise service and controller layers for single approvals/rejections (optional approval note, mandatory rejection reason), conflict detection against mutated stamp_history, and audit log capture for every transition.
  - Design bulk operation tests that enforce batch limit (≤50), partial success reporting, and shared rejection reasons to guarantee ergonomics before coding.
  - _Requirements: 3,4,7,8,9_
- [x] 5.2 Implement approval, rejection, conflict handling, and bulk orchestration to satisfy tests
  - Update stamp_history when approving, preserve originals on reject, set timestamps/actors, generate audit/log entries, and propagate structured HTTP 409 payloads consumed by the tests.
  - Reuse single-item logic inside bulk services, aggregating per-item errors and emitting observability logs demanded by the suite.
  - _Requirements: 3,4,7,8,9_

- [x] 6. Drive stamp request persistence and contracts through tests
- [x] 6.1 Author persistence integration tests before schema work
  - Use Flyway + Testcontainers to codify expectations for the stamp_request lifecycle: immutable original/requested snapshots, status enum transitions, updated_at trigger, and pending-only unique constraint so failing migrations reveal contract gaps immediately.
  - Add Mapper-level tests covering pagination order, duplicate detection, and counts, asserting required indexes (employee+status, status+created_at, pending partial, stamp_history_id) exist for the targeted latency budgets.
  - _Requirements: 1,2,3,4,6,7,9_
- [x] 6.2 Implement migration, domain model, mapper, and OpenAPI payloads to satisfy tests
  - Ship Flyway V7 schema + trigger + grants, domain/entity validations, MyBatis mapper/XML, and helper queries that expose latest request state back to stamp history without breaking the new tests.
  - Publish DTOs plus OpenAPI updates (create, my-requests, pending, detail, approve/reject/cancel, bulk endpoints with pagination + error payload schemas) so API clients regenerate types off a passing contract suite.
  - _Requirements: 1,2,3,4,6,7,8,9_

- [x] 7. Comprehensive integration verification
- [x] 7.1 Compose backend + frontend integration tests
  - Orchestrate Spring Boot + React integration suites (MockMvc/Testcontainers + MSW/Vitest harness) that run the full request workflow without browser automation, covering submission→approval→cancellation flows, conflict handling, audit surfacing, and RBAC redirects.
  - Validate React Query caches and API payloads wire together by simulating real fetch/mutation cycles so mismatched contracts surface before E2E.
  - _Requirements: 1,2,3,4,6,7,8,9,10_

- [ ] 8. Minimal end-to-end validation (after all suites turn green)
- [ ] 8.1 Verify only the highest-risk journeys
  - Use Playwright to cover: employee submits a correction, admin approves one request, employee cancels a pending request, and a non-admin is denied on the pending route, ensuring toast/status updates align with prior acceptance criteria without expanding into redundant cases.
  - _Requirements: 1,2,3,4,6,8,10_
