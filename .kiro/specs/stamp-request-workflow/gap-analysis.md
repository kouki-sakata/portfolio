# Stamp Request Workflow - Gap Analysis Report

## Executive Summary

The stamp-request-workflow feature requires approximately **60-65% new development** with significant opportunity to leverage existing patterns and services. The project already has mature implementations of:
- Bulk operation patterns (news management)
- Request/approval workflows (audit trails via LogHistory)
- React Query state management with optimistic updates
- TanStack Table integration
- Form validation (Zod schemas)
- Role-based access control (@PreAuthorize)

**Key Complexity Areas:**
- New database schema (stamp_request table with state machine)
- Email notification infrastructure (currently absent)
- Request comparison/conflict detection logic
- Approval workflow with optimistic locking

**Risk Assessment:** Low-Medium risk. All architectural patterns are proven; main efforts focus on domain logic implementation and email integration.

---

## Phase 1: Existing Components Analysis

### Backend: Reusable Services & Patterns

#### Fully Reusable Components

| Component | Location | Reusability | Notes |
|-----------|----------|-------------|-------|
| **Audit Trail Service** | `LogHistoryRegistrationService` | ✅ Direct reuse | Already logs stamp corrections; extend with JSONB detail for request context |
| **Role-Based Access Control** | `SecurityConfig`, `@PreAuthorize` | ✅ Direct reuse | Patterns established for ADMIN checks; use `hasRole('ADMIN')` for approval endpoints |
| **Authentication Context** | `SecurityUtil.getCurrentEmployeeId()` | ✅ Direct reuse | Used across all controllers; extract operator context for audit logs |
| **Bean Validation Framework** | `@NotBlank`, `@Pattern`, `@Size` | ✅ Direct reuse | Apply same annotations for reason fields (min 10, max 500 chars) |
| **Exception Handling** | `ValidationException`, `BusinessException` | ✅ Direct reuse | Create `DuplicateStampRequestException` extending `BusinessException` |
| **MyBatis Mapper Pattern** | `NewsMapper`, `StampHistoryMapper` | ✅ Direct reuse | Use for CRUD operations; follow annotation-based + XML split pattern |

#### Partially Reusable Components

| Component | Location | Adaptation Required | Details |
|-----------|----------|---------------------|---------|
| **Bulk Operation Logic** | `NewsManageBulkDeletionService` | ⚠️ Adapt logic | News does delete-only; requests need approve/reject with different outcomes. Copy structure but create new `StampRequestBulkApprovalService` |
| **Form Bridge Pattern** | `NewsManageForm` | ⚠️ Create new form | Design `StampRequestForm` with original/requested values, reason, approval notes |
| **DTO Layer** | `news/` subdirectory | ⚠️ Create new DTOs | Follow naming: `StampRequestCreateRequest`, `StampRequestApprovalRequest`, `StampRequestListResponse` |
| **MyBatis Dynamic SQL** | `NewsMapper` | ⚠️ Adapt queries | News uses simple CRUD; requests need filtering by status, employee ID, date range |
| **Service Layer Facade** | `NewsManageService` (read-only) | ⚠️ Create new facade | Design `StampRequestQueryService` for reads; separate approval into `StampRequestApprovalService` |

#### New Components Required

| Component | Purpose | Type | Scope |
|-----------|---------|------|-------|
| **StampRequest Entity** | JPA/MyBatis entity | Backend Entity | Hold original_values, requested_values, status, reason, approval_note, timestamps |
| **StampRequestMapper** | MyBatis mapper for CRUD & filtering | Backend Mapper | CRUD + findPendingByEmployeeId, findAllPending, findByRequestId, updateStatus |
| **StampRequestQueryService** | Employee views own requests; admin views all pending | Backend Service | Query layer for filtering, pagination (TanStack Table compatibility) |
| **StampRequestApprovalService** | Approve/reject with optimistic locking | Backend Service | Handle conflict detection, update stamp_history on approval |
| **StampRequestBulkApprovalService** | Batch approve/reject up to 50 requests | Backend Service | Partial failure handling, return success/failure counts |
| **EmailNotificationService** | Send async emails on status changes | Backend Service | NEW - requires Spring Mail configuration |
| **StampRequestRestController** | REST endpoints for workflow | Backend Controller | Endpoints: POST create, GET list, GET detail, PATCH approve/reject, DELETE cancel, POST bulk-approve/reject |

### Frontend: Reusable Components & Patterns

#### Fully Reusable Components

| Component | Location | Reusability | Notes |
|-----------|----------|-------------|-------|
| **Query Client Config** | `app/config/queryClient` | ✅ Direct reuse | 5min staleTime, 10min gcTime; apply to stamp request queries |
| **useQuery/useMutation Hooks** | `features/news/hooks/useNews.ts` | ✅ Pattern reuse | Copy structure for `useStampRequest` hook (create, update, list queries) |
| **Optimistic Updates** | `useNews.ts:onMutate/onError/onSettled` | ✅ Direct reuse | Apply same pattern: update cache on mutate, rollback on error, refetch on settle |
| **TanStack Table Integration** | `useNewsColumns`, `DataTable` | ✅ Direct reuse | Columns, sorting, filtering, row selection; adapt for stamp request list |
| **Row Selection State** | `Set<number>` + `RowSelectionState` | ✅ Direct reuse | Use for bulk action checkboxes and selection management |
| **Toast Notifications** | `use-toast` hook | ✅ Direct reuse | Success/error/info messages; no custom configuration needed |
| **Zod Schema Validation** | `loginSchema.ts`, `StampHistoryTypes` | ✅ Pattern reuse | Create `stampRequestSchema.ts` with reason validation (min 10, max 500) |
| **React Hook Form Integration** | News forms | ✅ Direct reuse | `useForm` + `Controller` for time inputs, reason text areas |
| **Modal Components** | `NewsFormModal` | ✅ Direct reuse | Reuse Dialog/Modal for stamp correction form and approval dialogs |
| **Error Handling** | `GlobalErrorHandler`, `error-logger` | ✅ Direct reuse | 401/403 redirects, toast error display integrated automatically |
| **Admin Guard** | `AdminGuard` component | ✅ Direct reuse | Protect "Pending Requests" and approval endpoints |
| **Feature Flag Infrastructure** | `FeatureFlagProvider`, `ui-wrapper` | ⚠️ Optional use | May use for gradual rollout of stamp request UI |

#### Partially Reusable Components

| Component | Location | Adaptation Required | Details |
|-----------|----------|---------------------|---------|
| **News API Module** | `features/news/api/newsApi.ts` | ⚠️ Create new module | Design `stampRequestApi.ts` with endpoints for create, list, approve, reject, bulk operations |
| **useNewsColumns Hook** | `useNewsColumns.tsx` | ⚠️ Create new hook | Design `useStampRequestColumns` with: ID, employee name, date, original vs. requested, status badge, action buttons |
| **TanStack Table Wrapper** | `DataTable` component | ✅ Direct reuse | Use existing DataTable; customize columns and row actions |
| **View Model Transform** | `profileViewModel.ts`, `newsViewModel.ts` | ⚠️ Create new transforms | Design `stampRequestViewModel.ts` to convert API response to UI model (calculate display dates, format times, derive status color) |
| **Dialog/Modal Pattern** | `NewsFormModal`, `DeleteConfirmDialog` | ✅ Direct reuse | Create `StampRequestCorrectionModal`, `ApprovalDialogModal`, `RejectReasonDialog` |
| **Status Badge Component** | `newsViewModel.ts:categoryBadge` | ⚠️ Create new component | Design status badge with colors: yellow=PENDING, green=APPROVED, red=REJECTED, gray=CANCELLED |
| **Bulk Action Bar** | `BulkActionBar.tsx` | ⚠️ Adapt component | Copy structure but adapt for approve/reject actions instead of delete/publish |

#### New Components Required

| Component | Purpose | Type | Scope |
|-----------|---------|------|-------|
| **stampRequestApi.ts** | REST API integration | Frontend API | POST /api/stamp-request (create), GET /api/stamp-request (list), POST /api/stamp-request/{id}/approve, POST /api/stamp-request/{id}/reject, DELETE /api/stamp-request/{id}/cancel, POST /api/stamp-request/bulk/approve, POST /api/stamp-request/bulk/reject |
| **useStampRequest.ts** | React Query hooks for requests | Frontend Hook | useStampRequestList, useStampRequestDetail, useCreateStampRequest, useApproveRequest, useRejectRequest, useCancelRequest, useBulkApproveRequests |
| **useStampRequestColumns.tsx** | TanStack Table column definitions | Frontend Hook | Columns: checkbox (selection), employee name, date, original times, requested times, reason (truncated), status badge, actions |
| **stampRequestViewModel.ts** | API response ↔ UI model transforms | Frontend Utility | Format timestamps, derive display dates, calculate time differences, determine badge colors |
| **StampRequestCorrectionModal.tsx** | Form for submitting correction requests | Frontend Component | Modal form with time inputs (in_time, break_start, break_end, out_time), reason text area, validation errors |
| **StampRequestListPage.tsx** | Employee view of own requests | Frontend Page | TanStack Table with list, detail view, cancel button, status filtering |
| **PendingRequestsPage.tsx** | Administrator view of all pending requests | Frontend Page | TanStack Table with bulk checkboxes, approve/reject buttons, conflict warning modal |
| **StampRequestDetailModal.tsx** | Side-by-side comparison view | Frontend Component | Show original vs. requested values, reason, approval note, audit trail |
| **BulkApprovalDialog.tsx** | Bulk approve with optional note field | Frontend Component | Multi-select + optional approval note input |
| **BulkRejectDialog.tsx** | Bulk reject with required reason field | Frontend Component | Multi-select + mandatory rejection reason input |
| **routes/StampRequestRoute.tsx** | Route configuration for feature | Frontend Route | Nested routes: /stamp-request (employee list), /stamp-request/pending (admin), guards with AdminGuard |

### Database: Schema Analysis

#### Existing Related Tables

| Table | Columns Relevant to Feature | Notes |
|-------|----------------------------|-------|
| **employee** | id, first_name, last_name, email, admin_flag | Required for user context and notifications |
| **stamp_history** | id, employee_id, stamp_date, in_time, out_time, break_start_time, break_end_time, is_night_shift, update_date | Source data for requests; will be updated on approval |
| **log_history** | id, display_name, operation_type, employee_id, update_employee_id, update_date, detail (JSONB) | Will log all request status transitions with full context in JSONB detail |

#### New Tables Required

| Table | Columns | Purpose | Notes |
|-------|---------|---------|-------|
| **stamp_request** | id, employee_id, stamp_history_id, original_in_time, original_out_time, original_break_start, original_break_end, original_is_night_shift, requested_in_time, requested_out_time, requested_break_start, requested_break_end, requested_is_night_shift, reason, status (ENUM: PENDING/APPROVED/REJECTED/CANCELLED), approval_employee_id, approval_note, rejection_reason, created_at, updated_at, approved_at, rejected_at, cancelled_at | Store complete request history with before/after values and timestamps | Status machine: PENDING → (APPROVED \| REJECTED \| CANCELLED). Preserve original values immutably. Add unique constraint on (employee_id, stamp_history_id, status='PENDING') to prevent duplicates |

#### Migration Strategy

1. **V7__add_stamp_request_workflow.sql**: Create stamp_request table with indexes
   - Primary key on id
   - Foreign keys: employee_id, approval_employee_id
   - Index on (employee_id, status) for fast filtering
   - Index on created_at DESC for sorting
   - Index on (status) for pending request queries
   - Partial index on (status='PENDING') for active requests

2. **Existing log_history use**: Extend detail JSONB with request context
   ```json
   {
     "requestId": 123,
     "employeeId": 456,
     "action": "STAMP_REQUEST_APPROVED",
     "stampHistoryId": 789,
     "originalValues": { "inTime": "...", "outTime": "..." },
     "requestedValues": { "inTime": "...", "outTime": "..." },
     "approverNote": "..."
   }
   ```

---

## Phase 2: Detailed Implementation Gap

### Backend: Service Layer Architecture

#### New Service Classes Required

```
service/
├── StampRequestQueryService
│   ├── getEmployeeRequests(employeeId, status, page, size)
│   ├── getPendingRequests(page, size)
│   ├── getRequestDetail(requestId)
│   └── findDuplicatePending(employeeId, stampHistoryId)
│
├── StampRequestApprovalService
│   ├── approveRequest(requestId, approverId, approvalNote)
│   ├── rejectRequest(requestId, rejecterId, rejectionReason)
│   └── validateNoConflict(stampHistoryId)
│
├── StampRequestRegistrationService
│   ├── createRequest(createRequest, employeeId)
│   └── validateRequest(times, employeeId, stampHistoryId)
│
├── StampRequestBulkApprovalService
│   ├── bulkApprove(requestIds, approverIds, approvalNote)
│   └── bulkReject(requestIds, rejecterId, rejectionReason)
│
├── StampRequestCancellationService
│   ├── cancelRequest(requestId, employeeId, cancellationReason)
│   └── validateCancel(request)
│
└── StampRequestNotificationService (NEW - requires Spring Mail)
    ├── sendSubmissionNotification(request, adminEmails)
    ├── sendApprovalNotification(request, employeeEmail)
    └── sendRejectionNotification(request, employeeEmail)
```

**Key Design Decisions:**

1. **Query/Command Separation (CQRS)**
   - Queries go to `StampRequestQueryService`
   - Commands (create, approve, reject, cancel) to specialized services
   - Follows existing pattern from news management

2. **Conflict Detection**
   - `validateNoConflict()` checks if stamp_history was modified since request creation
   - Compare update_date timestamps
   - Return conflict warning via response

3. **Optimistic Locking**
   - Use version field or timestamp-based optimistic locking
   - On conflict, return HTTP 409 Conflict with current state

4. **Email Notifications**
   - Use `@Async` annotation for async email sending
   - Fallback: log error but don't block main transaction
   - Config flag to disable emails in test environment

#### Controller Endpoints

```java
@RestController
@RequestMapping("/api/stamp-request")
@Tag(name = "Stamp Request Workflow", description = "打刻修正リクエスト")
public class StampRequestRestController {
    // Employee endpoints
    POST   /api/stamp-request
    GET    /api/stamp-request?status=&page=&size=
    GET    /api/stamp-request/{id}
    DELETE /api/stamp-request/{id}/cancel
    
    // Administrator endpoints (@PreAuthorize("hasRole('ADMIN')"))
    GET    /api/stamp-request/pending?page=&size=
    POST   /api/stamp-request/{id}/approve
    POST   /api/stamp-request/{id}/reject
    POST   /api/stamp-request/bulk/approve
    POST   /api/stamp-request/bulk/reject
}
```

### Frontend: Feature Module Structure

```
frontend/src/features/stampRequest/
├── api/
│   └── stampRequestApi.ts          # REST call wrappers
├── components/
│   ├── StampRequestCorrectionModal.tsx
│   ├── StampRequestListPage.tsx
│   ├── PendingRequestsAdminPage.tsx
│   ├── StampRequestDetailModal.tsx
│   ├── BulkApprovalDialog.tsx
│   ├── BulkRejectDialog.tsx
│   └── StatusBadge.tsx
├── hooks/
│   ├── useStampRequest.ts
│   ├── useStampRequestColumns.tsx
│   └── useStampRequestSelection.ts  (bulk operation state)
├── lib/
│   ├── stampRequestViewModel.ts    (API → UI transforms)
│   └── stampRequestValidation.ts   (client-side validation)
├── schemas/
│   └── stampRequestSchema.ts       (Zod validation)
├── types/
│   └── index.ts                    (TypeScript types)
└── routes/
    └── StampRequestRoute.tsx       (Feature routing)
```

### Data Flow: Create & Approve

```
Employee submits correction request:
StampHistoryPage → StampRequestCorrectionModal
  ↓
useCreateStampRequest (mutation) → stampRequestApi.post("/api/stamp-request")
  ↓
StampRequestRestController.create()
  ↓
StampRequestRegistrationService.createRequest()
  - Validate times (sequence, future, within working hours)
  - Check for duplicate PENDING request
  - Create stamp_request record with status=PENDING
  - Log to log_history with detail JSONB
  ↓
StampRequestNotificationService.sendSubmissionNotification()
  - Fetch all admins (admin_flag=1)
  - Send async emails (onSuccess)
  ↓
React Query optimistic update: invalidate stamps list + stamp requests list
  ↓
Toast success + refresh StampHistoryPage (disable "Request Correction" button)

---

Admin approves request:
PendingRequestsAdminPage (TanStack Table) → ApprovalModal
  ↓
useApproveRequest (mutation) → stampRequestApi.post("/api/stamp-request/{id}/approve")
  ↓
StampRequestRestController.approve()
  ↓
StampRequestApprovalService.approveRequest()
  - Validate: request status=PENDING
  - Check conflict: stamp_history.update_date unchanged
  - Update stamp_history with requested values
  - Update stamp_request status=APPROVED, approval_timestamp
  - Log to log_history with action=APPROVED
  ↓
StampRequestNotificationService.sendApprovalNotification()
  - Fetch employee email from stamp_request.employee_id → employee table
  - Send async email with new stamp values
  ↓
React Query optimistic update: sync pending list + employee requests list
  ↓
Toast success + remove row from table
```

---

## Phase 3: Integration Points & Compatibility

### Database Integration

**stamp_history changes:**
- No schema changes needed
- Updates occur via `UPDATE stamp_history SET in_time=?, ... WHERE id=?`
- Existing indexes sufficient for performance

**log_history changes:**
- Reuse existing table
- Extend `detail` JSONB with request context
- Add GIN index if not already present (V6 migration adds it)

**Existing constraints:**
- `UNIQUE (employee_id, year, month, day)` on stamp_history
- Requests must not violate this constraint when approved

### Authentication & Authorization

**Use existing patterns:**
- `SecurityUtil.getCurrentEmployeeId()` for operator context
- `@PreAuthorize("hasRole('ADMIN')")` for approval endpoints
- 401/403 handling via `GlobalErrorHandler`
- Session management via `AuthSessionService` (8-hour timeout)

### API Design Patterns

**Follow existing conventions:**
- Record DTOs: `StampRequestCreateRequest`, `StampRequestApprovalRequest`
- Bean Validation: `@NotBlank`, `@Pattern`, `@Size`, `@ValidTimeSequence` (custom validator)
- Error responses: `ValidationException` → 400, `BusinessException` → 400, `NotFoundException` → 404
- Bulk operation response format: `{ successCount, failureCount, results[] }` (copy from news)

### React Query Integration

**Maintain consistency:**
- Query keys: `queryKeys.stampRequest.all`, `.list()`, `.detail(id)`, `.pending()`
- Stale time: 5 minutes (same as news)
- Cache invalidation: use `useQueryClient().invalidateQueries()`
- Optimistic updates: same onMutate/onError/onSettled pattern

### Frontend Form Validation

**Align with existing patterns:**
- Zod schema for client-side validation
- React Hook Form for form state
- Validation rule: `min(10, "理由は10文字以上です")` on reason field
- Time validation: in_time < break_start < break_end < out_time

---

## Phase 4: Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Email infrastructure not present** | HIGH - Cannot send notifications | Implement Spring Mail integration; use `@Async` + fallback logging |
| **Optimistic locking conflicts** | MEDIUM - Race condition on approval | Implement version field or timestamp-based conflict detection; return 409 Conflict |
| **Bulk operation partial failures** | MEDIUM - Difficult to debug | Return detailed failure reasons for each item; implement comprehensive error logging |
| **State machine violations** | LOW - Invalid status transitions | Add validation methods; use enums to restrict transitions |
| **Audit trail completeness** | MEDIUM - Compliance issue | Ensure every status transition logs to log_history with full context in JSONB |

### Integration Risks

| Risk | Mitigation |
|------|-----------|
| **Breaking changes to stamp_history** | Don't modify existing columns; only add UPDATE transactions. Test with existing queries (StampHistoryService, CSV export). |
| **Performance degradation** | Add indexes on stamp_request(status, created_at). Monitor slow queries during bulk operations. |
| **Circular dependencies** | StampRequestApprovalService → StampHistoryService is fine (one-way). Don't create bidirectional deps. |
| **Email spam/failures** | Log all email failures; implement retry logic or dead-letter queue for failed notifications. |

### Mitigation Strategies

1. **Phased Rollout:**
   - Phase 1: Basic CRUD (create, list, detail) without approval
   - Phase 2: Admin approval/rejection
   - Phase 3: Bulk operations
   - Phase 4: Email notifications
   - Phase 5: Cancellation

2. **Testing Strategy:**
   - Unit tests: service layer logic (validation, status transitions)
   - Integration tests: controller + mapper + database (Testcontainers)
   - E2E tests: Playwright for happy path + error scenarios
   - Load tests: Bulk operation performance (50 requests, 3-second SLA)

3. **Feature Flags:**
   - Use `/api/public/feature-flags` to control rollout
   - Allow gradual enablement by environment (dev → staging → prod)

---

## Phase 5: Implementation Roadmap

### Week 1: Database & Backend Foundation
- [ ] Create V7 migration: stamp_request table + indexes
- [ ] Design StampRequest entity and StampRequestMapper
- [ ] Implement StampRequestQueryService
- [ ] Implement StampRequestRegistrationService with validation
- [ ] Write unit + integration tests

### Week 2: Approval & Workflow
- [ ] Implement StampRequestApprovalService with conflict detection
- [ ] Implement StampRequestCancellationService
- [ ] Add StampRequestRestController endpoints (non-bulk)
- [ ] Integrate LogHistoryRegistrationService for audit trails
- [ ] Write comprehensive tests

### Week 3: Bulk Operations & Email
- [ ] Implement StampRequestBulkApprovalService
- [ ] Configure Spring Mail + async email service
- [ ] Implement StampRequestNotificationService
- [ ] Add bulk approval/rejection endpoints
- [ ] Error handling for email failures

### Week 4: Frontend - Core UI
- [ ] Design stampRequestApi.ts and useStampRequest hooks
- [ ] Implement StampRequestCorrectionModal
- [ ] Integrate "Request Correction" action into StampHistoryPage
- [ ] Test form validation and submission flow

### Week 5: Frontend - Admin Pages
- [ ] Implement PendingRequestsAdminPage with TanStack Table
- [ ] Implement StampRequestDetailModal (side-by-side comparison)
- [ ] Implement BulkApprovalDialog and BulkRejectDialog
- [ ] Add ApprovalModal for single request approval

### Week 6: Integration & Polish
- [ ] E2E tests (Playwright)
- [ ] Status badge colors and responsive layout
- [ ] Toast notifications and error handling
- [ ] Performance optimization (pagination, caching)
- [ ] Documentation and OpenAPI schema

---

## Component Reusability Summary

| Category | Fully Reusable | Partially Reusable | New | Coverage |
|----------|:---:|:---:|:---:|:---:|
| **Backend Services** | 6 | 4 | 6 | 40% reuse |
| **Frontend Components** | 10 | 4 | 8 | 50% reuse |
| **Database** | 3 tables | - | 1 table | 75% reuse |
| **Overall** | - | - | - | **55-60% new development** |

---

## Success Criteria

- ✅ All 10 requirements met with passing tests
- ✅ 80%+ code coverage (backend services)
- ✅ Bulk operations complete within 3 seconds (50 requests)
- ✅ Request submission API responds within 200ms (p95)
- ✅ Email notifications sent asynchronously
- ✅ No breaking changes to existing stamp_history or employee endpoints
- ✅ Audit trail complete for all status transitions
- ✅ Responsive UI on mobile (320px+), tablet (768px+), desktop (1024px+)

---

## Final Notes

**Why DDD is NOT recommended for this feature:**
This feature has a clear request-approval workflow with stable requirements. Unlike Profile (which has flexible metadata), stamp requests have a fixed schema and linear state machine. **Keep it in the traditional MyBatis + Service layer pattern** for consistency and maintainability.

**Key Dependencies:**
1. Spring Mail configuration (or external email service)
2. Async execution framework (already in Spring Boot)
3. Existing email list for admins (from Employee table)

**Estimated Effort:**
- Backend: 8-10 days (4 developers)
- Frontend: 6-8 days (2 developers)
- Testing: 4-5 days (1 QA)
- **Total: 2-3 weeks for full feature delivery**

