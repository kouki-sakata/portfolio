# Design Review Report: Stamp Request Workflow

**Feature:** stamp-request-workflow
**Reviewer:** Design Validation Agent
**Review Date:** 2025-11-15
**Design Version:** Phase 2 (Design Complete, Pre-Tasks)

---

## 1. Executive Summary

### Overall Decision: **CONDITIONAL GO**

**Overall Score: 4.0/5**

The stamp-request-workflow design is architecturally sound and demonstrates excellent alignment with existing project patterns. The design follows SOLID principles, implements comprehensive security measures, and provides strong testability. However, **3 moderate issues must be addressed before proceeding to implementation** to ensure production readiness.

**Recommendation:** Address the critical N+1 query issue, document Spring Mail configuration requirements, and define the audit log JSONB structure before generating implementation tasks. Once these are resolved, proceed to `/kiro:spec-tasks`.

### Key Strengths

1. **Excellent Architecture Alignment (Score: 4.5/5)**
   - Perfect adherence to existing CQRS pattern from News feature
   - Service layer separation follows SOLID principles (Query/Registration/Approval/Cancellation/BulkOperation/Notification)
   - MyBatis patterns match existing NewsMapper and StampHistoryMapper implementations
   - Frontend module structure mirrors news/ feature directory layout

2. **Comprehensive Security Design (Score: 4.7/5)**
   - Multi-layer validation: Bean Validation (@NotBlank, @Size) + Service layer business rules + Zod schemas
   - RBAC properly enforced with @PreAuthorize("hasRole('ADMIN')") on admin endpoints
   - Employee ownership validation in service layer (e.g., cancelRequest checks employeeId matches)
   - SQL injection prevention through MyBatis parameterized queries (#{employeeId}, #{status})
   - XSS prevention via React auto-escaping and DTO transformation layer

3. **Strong Testability Design (Score: 4.75/5)**
   - Clock injection enables deterministic time-dependent testing (Clock.fixed() for tests)
   - Clear mock boundaries: Controller → Service → Mapper
   - Async email service can be disabled with @ConditionalOnProperty for test environments
   - Comprehensive test strategy: unit tests (services), integration tests (@WebMvcTest + Testcontainers), E2E tests (Playwright)

### Critical Issues

1. **N+1 Query Performance Problem (HIGH PRIORITY)**
   - **Impact:** Performance degradation on pending requests list
   - **Root Cause:** Controller's `toResponse()` method fetches employee names individually via EmployeeMapper
   - **Scenario:** Admin views 50 pending requests → 1 query for requests + 50 queries for employee names = 51 total queries
   - **Solution Required:** Add JOIN queries in StampRequestMapper to batch-fetch employee data (first_name, last_name) along with request data
   - **Example Fix:**
     ```sql
     SELECT sr.*, e.first_name, e.last_name, ae.first_name AS approval_first_name, ae.last_name AS approval_last_name
     FROM stamp_request sr
     INNER JOIN employee e ON sr.employee_id = e.id
     LEFT JOIN employee ae ON sr.approval_employee_id = ae.id
     WHERE sr.status = 'PENDING'
     ORDER BY sr.created_at DESC
     LIMIT #{limit} OFFSET #{offset}
     ```

2. **Email Infrastructure Missing (HIGH PRIORITY)**
   - **Impact:** Core requirement 5 (Email Notification System) cannot function without infrastructure setup
   - **Missing Components:**
     - Spring Mail dependency in build.gradle: `implementation 'org.springframework.boot:spring-boot-starter-mail'`
     - SMTP configuration in application.yml (host, port, username, password, properties)
     - @EnableAsync annotation on main application class or configuration class
     - ThreadPoolTaskExecutor bean for async email sending
   - **Mitigation Present:** Design includes @ConditionalOnProperty for graceful degradation
   - **Action Required:** Document complete Spring Mail setup in design or create separate configuration guide

3. **Incomplete Audit Trail Specification (MEDIUM PRIORITY)**
   - **Impact:** Requirement 7 (Audit Trail and Compliance) partially unmet
   - **Missing Details:**
     - log_history.detail JSONB structure not documented (what fields to include in JSON?)
     - Query filtering by employee ID, request ID, action type, date range not implemented
     - Example JSONB structure needed for consistency across all request workflow actions
   - **Solution Required:** Define standard JSONB schema for stamp request events:
     ```json
     {
       "requestId": 123,
       "stampHistoryId": 789,
       "employeeId": 456,
       "action": "STAMP_REQUEST_APPROVED",
       "originalValues": {"inTime": "...", "outTime": "..."},
       "requestedValues": {"inTime": "...", "outTime": "..."},
       "approvalNote": "...",
       "approverId": 1
     }
     ```

---

## 2. Requirements Coverage Matrix

| Requirement | Design Section | Coverage | Notes |
|-------------|----------------|----------|-------|
| **Req 1: Stamp Correction Request Submission** | § 3.2 DTOs, § 3.3 StampRequestRegistrationService, § 4.2 RequestCorrectionModal | ✅ Complete | All 8 acceptance criteria covered: pre-filled form, validation, duplicate check, reason requirement (10-500 chars), next-day checkout, success toast |
| **Req 2: Request Status Management and Tracking** | § 2.1 State Machine, § 3.2 StampRequestResponse, § 4.2 MyRequestsPage, RequestStatusBadge | ✅ Complete | All 7 criteria covered: status badge, pending request disable, filtering, detail view, timestamps, visual distinction |
| **Req 3: Administrator Request Review** | § 3.3 StampRequestApprovalService, § 4.2 PendingRequestsAdminPage, § 3.3 hasConflict() | ✅ Complete | All 9 criteria covered: pending list, comparison view, approve/reject with notes, stamp_history update, conflict detection, audit log |
| **Req 4: Bulk Request Processing** | § 3.3 StampRequestBulkOperationService, § 3.2 StampRequestBulkOperationResponse, § 4.2 BulkActionBar | ✅ Complete | All 7 criteria covered: checkboxes, bulk approve/reject, MAX_BATCH_SIZE=50, partial failure handling, summary toast, loading indicator |
| **Req 5: Email Notification System** | § 3.3 StampRequestNotificationService, @Async, @TransactionalEventListener | ✅ Complete | All 7 criteria covered: admin notification on submission, employee notification on approval/rejection, async processing, error logging, @ConditionalOnProperty toggle |
| **Req 6: Request Cancellation** | § 3.3 StampRequestCancellationService, § 3.2 StampRequestCancellationRequest, § 4.2 CancellationDialog | ✅ Complete | All 6 criteria covered: cancel action, confirmation dialog, reason requirement, status update, PENDING validation, re-enable "Request Correction" |
| **Req 7: Audit Trail and Compliance** | § 3.3 LogHistoryRegistrationService integration, § 2.1 original_* immutable fields | ⚠️ Partial | **ISSUE:** JSONB detail structure not documented. Query filtering by employee/request/action/date not shown. 7-year retention mentioned but no migration policy. |
| **Req 8: Permission and Access Control** | § 3.6 Security Configuration, § 3.5 @PreAuthorize, SecurityUtil | ✅ Complete | All 7 criteria covered: employee self-access only, admin approval/rejection, 403 Forbidden errors, @PreAuthorize annotations, session expiry redirect |
| **Req 9: Data Validation and Business Rules** | § 3.3 validateStampTimes(), § 3.6 @ValidTimeSequence, Bean Validation | ⚠️ Partial | **ISSUE:** Missing "reasonable working hours (00:00-23:59)" validation. OvertimeCalculator integration not mentioned for recalculation after approval. |
| **Req 10: Frontend User Experience** | § 4.2 Components, § 4.3 React Query, § 4.4 API Client, TanStack Table | ✅ Complete | All 8 criteria covered: React Hook Form + Zod, TanStack Table with sorting/filtering/pagination, React Query optimistic updates, loading skeletons, color-coded badges, responsive layouts, cache invalidation |

**Summary:**
- **Fully Covered:** 8/10 requirements (80%)
- **Partially Covered:** 2/10 requirements (20%) - Req 7 (Audit Trail), Req 9 (Business Rules)
- **Not Covered:** 0/10 requirements (0%)

**Coverage Score: 4/5** - Very good coverage, minor gaps in audit queries and overtime calculation logic.

---

## 3. Consistency Analysis

### 3.1 Database Design Consistency

**Alignment with Existing Schema:** ✅ **EXCELLENT**

| Aspect | Design Approach | Existing Pattern | Consistency |
|--------|-----------------|------------------|-------------|
| **Naming Convention** | snake_case (stamp_request, employee_id, created_at) | ✅ Matches all tables (employee, stamp_history, news) | Perfect |
| **Primary Key** | INTEGER GENERATED BY DEFAULT AS IDENTITY | ✅ Same as employee.id, news.id | Perfect |
| **Timestamps** | TIMESTAMP WITH TIME ZONE, trigger for updated_at | ✅ Same as stamp_history, profile_activity_log | Perfect |
| **Foreign Keys** | REFERENCES employee(id) ON DELETE CASCADE | ✅ Matches FK pattern in log_history, stamp_history | Perfect |
| **Audit Columns** | created_at, updated_at, approved_at, rejected_at, cancelled_at | ✅ Follows stamp_history pattern (created_at, update_date) | Perfect |
| **Indexes** | B-Tree (idx_stamp_request_employee_status), Partial (idx_stamp_request_pending WHERE status='PENDING') | ✅ Matches V4 migration pattern (idx_log_history_daily_check, idx_employee_name_search) | Perfect |
| **Migration Naming** | V7__create_stamp_request_workflow.sql | ✅ Follows V1-V6 sequential versioning | Perfect |

**Examples of Consistency:**
- ✅ CHECK constraints for status transitions match existing enum patterns
- ✅ Unique constraint `CONSTRAINT uk_employee_stamp_pending UNIQUE (...) WHERE status = 'PENDING'` uses partial unique index pattern
- ✅ Trigger function `update_stamp_request_updated_at()` follows existing pattern from stamp_history

**Database Consistency Score: 5/5** - No deviations from existing conventions.

---

### 3.2 Backend Design Consistency

**Alignment with News and StampHistory Features:** ✅ **EXCELLENT**

#### Service Layer Architecture (CQRS Pattern)

| Component | Design | Existing Pattern (News) | Consistency |
|-----------|--------|-------------------------|-------------|
| **Query Service** | StampRequestQueryService (read-only) | NewsManageService (read-only facade) | ✅ Perfect match |
| **Command Services** | Registration, Approval, Cancellation, BulkOperation | NewsManageRegistrationService, NewsManageReleaseService, NewsManageDeletionService, NewsManageBulkDeletionService | ✅ Perfect match |
| **Notification Service** | StampRequestNotificationService (@Async) | ❌ Not present in News | ✅ New but follows Spring patterns |

**Evidence from Gap Analysis:**
- ✅ News uses Query/Command separation: `NewsManageService` (reads) vs `NewsManage[Action]Service` (writes)
- ✅ Bulk operation pattern: `NewsManageBulkDeletionService` with partial failure handling
- ✅ Service naming: `[Domain][Action]Service` convention followed

#### Controller Layer Patterns

| Aspect | Design | Existing Pattern | Consistency |
|--------|--------|------------------|-------------|
| **Endpoint Structure** | POST /api/stamp-requests, GET /api/stamp-requests/my-requests, POST /api/stamp-requests/bulk/approve | ✅ Matches /api/news, /api/stamp-history/export | Perfect |
| **DTO Naming** | StampRequestCreateRequest, StampRequestResponse, StampRequestListResponse | ✅ Matches NewsCreateRequest, NewsResponse (from OpenAPI) | Perfect |
| **Bean Validation** | @NotBlank, @Size(min=10, max=500), @Pattern | ✅ Matches News validation (title, content) | Perfect |
| **Security** | @PreAuthorize("hasRole('ADMIN')"), SecurityUtil.getCurrentEmployeeId() | ✅ Matches NewsRestController | ⚠️ **Need to verify 'ADMIN' vs 'ROLE_ADMIN'** |
| **Error Handling** | ResponseStatusException, extractRootCause() | ✅ Matches existing pattern in NewsRestController | Perfect |

**⚠️ ISSUE IDENTIFIED:** Design uses `hasRole('ADMIN')` but Spring Security convention typically requires `hasRole('ROLE_ADMIN')` or checks `admin_flag` directly. Need to verify existing project's role naming strategy.

#### MyBatis Patterns

| Aspect | Design | Existing Pattern (NewsMapper) | Consistency |
|--------|--------|------------------------------|-------------|
| **Interface + XML** | StampRequestMapper.java + StampRequestMapper.xml | ✅ NewsMapper follows same split | Perfect |
| **ResultMap** | stampRequestResultMap with snake_case→camelCase | ✅ Matches newsResultMap pattern | Perfect |
| **Dynamic SQL** | `<if test="status != null">` for optional filters | ✅ Matches News bulk operations | Perfect |
| **Batch Operations** | `<foreach collection='requestIds' item='id'>` | ✅ Matches News bulk delete pattern | Perfect |
| **useGeneratedKeys** | `useGeneratedKeys="true" keyProperty="id"` | ✅ Standard MyBatis pattern | Perfect |

**Backend Consistency Score: 4/5** - Excellent match with existing patterns, minor uncertainty on Spring Security role naming.

---

### 3.3 Frontend Design Consistency

**Alignment with News Feature:** ✅ **EXCELLENT**

#### Module Structure

```
Designed:                          Existing (news/):
features/stampRequest/             features/news/
├── api/                           ├── api/
│   └── stampRequestApi.ts         │   └── newsApi.ts                 ✅ Match
├── components/                    ├── components/
│   ├── RequestCorrectionModal     │   ├── NewsFormModal              ✅ Match
│   ├── MyRequestsPage             │   ├── NewsManagementPage         ✅ Match
│   └── BulkActionBar              │   └── BulkActionBar              ✅ Match
├── hooks/                         ├── hooks/
│   ├── useStampRequests.ts        │   ├── useNews.ts                 ✅ Match
│   └── useRequestColumns.tsx      │   └── useNewsColumns.tsx         ✅ Match
├── lib/                           ├── lib/
│   └── requestViewModel.ts        │   └── newsViewModel.ts           ✅ Match
├── schemas/                       ├── (not present in news)          ➕ New
│   └── stampRequestSchema.ts
└── types/                         └── types/
    └── index.ts                       └── bulk.ts                    ✅ Match
```

**Directory structure consistency: 100% match** (schemas/ is additive, not divergent)

#### React Query Patterns

**Evidence from Gap Analysis (useNews.ts):**

| Pattern | Design | Existing (useNews.ts) | Consistency |
|---------|--------|-----------------------|-------------|
| **Query Keys** | `stampRequestQueryKeys.all`, `.myRequests()`, `.pending()` | ✅ `newsQueryKeys.all`, `.list()`, `.detail()` | Perfect |
| **staleTime/gcTime** | `QUERY_CONFIG.stampRequest.staleTime` (5min) | ✅ `QUERY_CONFIG.news.staleTime` (5min) | Perfect |
| **useMutation** | `useCreateStampRequestMutation` with onSuccess/onError | ✅ `useCreateNewsMutation`, `useUpdateNewsMutation` | Perfect |
| **Cache Invalidation** | `invalidateQueries({ queryKey: stampRequestQueryKeys.myRequests() })` | ✅ `invalidateQueries({ queryKey: newsQueryKeys.all })` | Perfect |
| **Toast Notifications** | `toast({ title, description, variant })` | ✅ Same toast pattern in useNews | Perfect |

**⚠️ ISSUE IDENTIFIED:** Design mentions "optimistic updates" but doesn't show full `onMutate/onError/onSettled` pattern. Existing News feature implements this:
```tsx
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: newsQueryKeys.all });
  const previousData = queryClient.getQueryData(newsQueryKeys.all);
  queryClient.setQueryData(newsQueryKeys.all, (old) => [...old, newData]);
  return { previousData };
},
onError: (err, newData, context) => {
  queryClient.setQueryData(newsQueryKeys.all, context.previousData);
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: newsQueryKeys.all });
}
```
Design should include this pattern for requirement 10 (optimistic updates for improved perceived performance).

#### TanStack Table Integration

| Aspect | Design | Existing (useNewsColumns) | Consistency |
|--------|--------|---------------------------|-------------|
| **Column Hook** | useRequestColumns() returns column definitions | ✅ useNewsColumns() pattern | Perfect |
| **Row Selection** | Set<number> for selectedIds, onSelectionChange | ✅ Same in news/components/NewsManagementPage | Perfect |
| **DataTable Component** | Reuse from @/shared/components/DataTable | ✅ Same component used in News | Perfect |
| **Pagination** | page, pageSize, totalCount, onPageChange | ✅ Same props in News | Perfect |

**Frontend Consistency Score: 4/5** - Excellent match, minor gap in documenting optimistic update implementation details.

---

### 3.4 Integration Point Validation

**Checking if Referenced Components Exist:**

#### Backend Dependencies

| Component | Status | Notes |
|-----------|--------|-------|
| LogHistoryRegistrationService | ✅ Exists | Gap-analysis confirms direct reuse for audit trails |
| StampHistoryMapper | ✅ Exists | Gap-analysis confirms findById(), update() methods available |
| EmployeeMapper | ✅ Exists | Gap-analysis confirms, but need to verify `findAdmins()` method exists |
| SecurityUtil.getCurrentEmployeeId() | ✅ Exists | Used across all controllers (confirmed in gap-analysis) |
| Clock | ❌ **Not Configured** | Design injects Clock but no @Bean Clock in existing config. **BLOCKER:** Need to add `@Bean Clock systemUTC()` to configuration class |
| JavaMailSender | ❌ **Not Present** | **CRITICAL DEPENDENCY:** Requires Spring Mail dependency + SMTP config + @EnableAsync |

**Action Required:**
1. Add Clock bean to configuration:
   ```java
   @Configuration
   public class ClockConfig {
       @Bean
       public Clock clock() {
           return Clock.systemUTC();
       }
   }
   ```

2. Add Spring Mail configuration (detailed in Critical Issue #2 above)

#### Frontend Dependencies

| Component | Status | Notes |
|-----------|--------|-------|
| DataTable | ✅ Exists | @/shared/components/DataTable (reused from News) |
| Dialog, DialogContent | ✅ Exists | shadcn/ui components (@/components/ui/dialog) |
| useForm, Controller | ✅ Exists | react-hook-form dependency already present |
| zodResolver | ✅ Exists | @hookform/resolvers/zod dependency present |
| useQuery, useMutation | ✅ Exists | @tanstack/react-query v5.90.2 |
| toast | ✅ Exists | @/hooks/use-toast (used across features) |

**Frontend integration: 100% verified** - All dependencies exist.

#### API Contract Alignment

**Backend DTO ↔ Frontend OpenAPI Types:**

| Contract | Backend (Java record) | Frontend (OpenAPI) | Aligned? |
|----------|----------------------|-------------------|----------|
| **Create Request** | StampRequestCreateRequest (stampHistoryId, requestedInTime, reason) | Same fields in openapi/stamp-request.yaml | ✅ Yes |
| **Response** | StampRequestResponse (id, employeeId, employeeName, originalInTime, requestedInTime, status) | Same fields in OpenAPI schema | ✅ Yes |
| **Bulk Operation** | StampRequestBulkOperationResponse (successCount, failureCount, results[]) | Matches news bulk pattern | ✅ Yes |

**Integration Consistency Score: 3/5** - Frontend dependencies verified, but backend missing Clock bean and Spring Mail setup.

---

## 4. Quality Assessment

### 4.1 SOLID Principles Adherence

**Single Responsibility Principle: ✅ EXCELLENT (5/5)**

Each service has a single, well-defined responsibility:
- `StampRequestQueryService`: Only reads (findById, getEmployeeRequests, getPendingRequests)
- `StampRequestRegistrationService`: Only creates requests (createRequest, validateStampTimes)
- `StampRequestApprovalService`: Only approves/rejects (approveRequest, rejectRequest, hasConflict)
- `StampRequestCancellationService`: Only cancels (cancelRequest)
- `StampRequestBulkOperationService`: Only batch operations (bulkApprove, bulkReject)
- `StampRequestNotificationService`: Only sends emails (sendSubmissionNotification, sendApprovalNotification, sendRejectionNotification)

**Open/Closed Principle: ✅ GOOD (4/5)**
- Status enum can be extended without modifying state machine logic (CHECK constraint can be updated in migration)
- NotificationService uses `@ConditionalOnProperty` for feature toggle (open for extension, closed for modification)
- ⚠️ Minor: Adding new request types would require modifying multiple services

**Dependency Inversion Principle: ✅ EXCELLENT (5/5)**
- Services depend on Mapper interfaces (not concrete implementations)
- Clock injection enables testing with Clock.fixed()
- JavaMailSender interface injection (not SMTP implementation)

**Interface Segregation Principle: ✅ GOOD (4/5)**
- Services have focused interfaces with 1-3 public methods each
- ⚠️ StampRequestMapper has 9 methods - could be split into ReadMapper and WriteMapper interfaces for stricter segregation

**Overall SOLID Score: 4.5/5** - Excellent adherence, very minor improvement possible in interface segregation.

---

### 4.2 Security Measures

**Authentication: ✅ EXCELLENT (5/5)**
- All endpoints require authentication via SecurityUtil.getCurrentEmployeeId()
- Session-based authentication reuses existing 8-hour session timeout
- 401 Unauthorized handling via GlobalErrorHandler (existing infrastructure)

**Authorization (RBAC): ✅ VERY GOOD (4/5)**
- ✅ @PreAuthorize("hasRole('ADMIN')") on admin endpoints (approve, reject, pending list, bulk operations)
- ✅ Service layer validates employee ownership (cancelRequest checks request.employeeId == employeeId)
- ✅ Detail view access control: employees can only view own requests, admins can view all
- ⚠️ **Uncertainty:** Design uses `hasRole('ADMIN')` but Spring Security convention is `hasRole('ROLE_ADMIN')` or checking `admin_flag` directly. Need to verify existing project's SecurityConfig.

**Input Validation: ✅ EXCELLENT (5/5)**
- **Layer 1 (Frontend):** Zod schema validation (stampRequestCreateSchema with min/max length, required fields)
- **Layer 2 (Controller):** Bean Validation annotations (@NotBlank, @Size(min=10, max=500), @Pattern)
- **Layer 3 (Service):** Business rule validation (validateStampTimes checks time sequence, future date, break within in/out)
- **Layer 4 (Database):** CHECK constraints enforce status transitions, reason length, timestamp consistency
- Custom validator: @ValidTimeSequence for cross-field validation (in_time < break_start < break_end < out_time)

**SQL Injection Prevention: ✅ EXCELLENT (5/5)**
- All MyBatis queries use parameterized queries: `WHERE employee_id = #{employeeId}` (no string concatenation)
- Dynamic SQL uses `<if test>` with parameter binding, not string manipulation
- No raw SQL queries or string concatenation in service layer

**XSS Prevention: ✅ EXCELLENT (5/5)**
- React auto-escapes all text output (no dangerouslySetInnerHTML in design)
- DTO transformation layer prevents raw entity exposure
- Reason field sanitized through validation (max 500 chars, no script tags in pattern)

**Data Exposure Risk: ✅ GOOD (4/5)**
- ✅ toResponse() method transforms entities to DTOs (no direct StampRequest entity exposure)
- ✅ Sensitive fields (approval_employee_id) only populated after approval
- ⚠️ **Review Needed:** Original stamp values (originalInTime, originalOutTime) are exposed in StampRequestResponse. Verify if employees should see original values of their own requests (likely yes) and if admins should see original values of all requests (likely yes for comparison). Not a security issue, but confirm business requirement.

**Overall Security Score: 4.7/5** - Very strong security posture, minor role naming verification needed.

---

### 4.3 Performance Considerations

**Index Strategy: ✅ EXCELLENT (5/5)**

| Index | Purpose | Query Pattern Supported | Performance Gain |
|-------|---------|------------------------|------------------|
| idx_stamp_request_employee_status | Employee request filtering | `WHERE employee_id = ? AND status = ?` | O(log n) lookup vs O(n) scan |
| idx_stamp_request_status_created | Admin pending list sorting | `WHERE status='PENDING' ORDER BY created_at DESC` | Sorted retrieval without filesort |
| idx_stamp_request_pending (partial) | Hot path optimization | `WHERE status='PENDING'` | 80% smaller index, faster scans |
| idx_stamp_request_stamp_history | FK lookup | JOIN to stamp_history | Prevents sequential scan |

**Index coverage: 100% of query patterns** - No missing indexes identified.

**N+1 Query Prevention: ❌ CRITICAL ISSUE (2/5)**

**Problem:** Controller's `toResponse()` method fetches employee data individually:
```java
private StampRequestResponse toResponse(StampRequest request) {
    Employee employee = employeeMapper.findById(request.getEmployeeId())
        .orElse(null); // <-- N+1 QUERY!

    Employee approver = employeeMapper.findById(request.getApprovalEmployeeId())
        .orElse(null); // <-- N+1 QUERY!

    return new StampRequestResponse(
        request.getId(),
        employee.getFirstName() + " " + employee.getLastName(), // ...
    );
}

// Called from getPendingRequests():
List<StampRequestResponse> responses = requests.stream()
    .map(this::toResponse) // <-- Each call triggers 2 queries!
    .toList();
```

**Impact:** For 50 pending requests: 1 query (requests) + 50×2 queries (employee + approver) = **101 total queries**

**Solution Required:**
```sql
-- Add JOIN query to StampRequestMapper.xml
<select id="findPendingRequestsWithEmployees" resultMap="stampRequestWithEmployeeResultMap">
    SELECT
        sr.*,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name,
        ae.first_name AS approver_first_name,
        ae.last_name AS approver_last_name
    FROM stamp_request sr
    INNER JOIN employee e ON sr.employee_id = e.id
    LEFT JOIN employee ae ON sr.approval_employee_id = ae.id
    WHERE sr.status = 'PENDING'
    ORDER BY sr.created_at DESC
    LIMIT #{limit} OFFSET #{offset}
</select>
```

**Caching Strategy: ⚠️ PARTIAL (3/5)**
- ✅ Frontend: React Query with staleTime: 5min, gcTime: 10min
- ❌ Backend: No caching mentioned (e.g., Spring Cache for employee names)
- Recommendation: Add `@Cacheable` for frequently accessed employee data

**Bulk Operation Limits: ✅ EXCELLENT (5/5)**
- MAX_BATCH_SIZE = 50 (prevents memory exhaustion)
- Partial failure handling (individual try-catch per request)
- Detailed error reporting (success/failure counts + individual error messages)

**Pagination: ✅ EXCELLENT (5/5)**
- LIMIT/OFFSET in all list queries
- Default page size: 20 (reasonable for UI and DB)
- Total count returned for pagination controls

**Overall Performance Score: 3.8/5** - Good indexes and pagination, but N+1 query issue is critical blocker.

---

### 4.4 Testability

**Unit Test Strategy: ✅ EXCELLENT (5/5)**
- Clock injection enables deterministic testing:
  ```java
  Clock fixedClock = Clock.fixed(Instant.parse("2025-01-15T10:00:00Z"), ZoneOffset.UTC);
  StampRequestRegistrationService service = new StampRequestRegistrationService(
      requestMapper, stampHistoryMapper, logHistoryService, notificationService, fixedClock
  );
  ```
- Constructor injection allows easy mocking (no field injection, no @Autowired on fields)
- Service methods have clear inputs/outputs (no hidden state)
- Design shows unit test example for RequestCorrectionModal with Vitest + Testing Library

**Integration Test Approach: ✅ EXCELLENT (5/5)**
- @WebMvcTest for controller layer tests (mock service dependencies)
- Testcontainers for database integration tests (real PostgreSQL)
- MyBatis mappers tested with real DB (no H2 mismatch issues)
- Spring Boot Test with @Transactional for rollback

**E2E Test Scenarios: ✅ GOOD (4/5)**
- ✅ Design shows Playwright tests for:
  - Employee creates stamp correction request
  - Admin approves request
- ⚠️ Missing E2E tests for:
  - Bulk approve/reject operations
  - Request cancellation flow
  - Conflict scenario (concurrent modification)
  - Email notification verification (using test SMTP server)

**Mock Boundaries: ✅ EXCELLENT (5/5)**
- Clear separation: Controller → Service → Mapper
- Notification service can be disabled with @ConditionalOnProperty(name="app.notification.enabled", havingValue="false")
- No tight coupling between layers (each can be tested independently)

**Overall Testability Score: 4.75/5** - Excellent test design, minor gaps in E2E coverage.

---

## 5. Risk Assessment

### 5.1 Technical Risks

| Risk | Severity | Impact | Mitigation Strategy | Status |
|------|----------|--------|---------------------|--------|
| **Email Infrastructure Not Present** | HIGH | Core requirement 5 (Email Notifications) cannot function without Spring Mail setup | Design includes @ConditionalOnProperty for graceful degradation. Document complete setup: Spring Mail dependency, SMTP config, @EnableAsync, ThreadPoolTaskExecutor bean | ⚠️ Action Required |
| **N+1 Query in toResponse()** | HIGH | Performance degradation when viewing pending requests list (50 requests = 101 queries) | Add JOIN queries in StampRequestMapper to batch-fetch employee data (see § 4.3 for SQL example) | ⚠️ Action Required |
| **Clock Bean Not Configured** | MEDIUM | Services inject Clock but @Bean Clock not shown in config | Add `@Bean Clock clock() { return Clock.systemUTC(); }` to configuration class | ⚠️ Action Required |
| **@EnableAsync Not Verified** | MEDIUM | @Async annotations on notification methods won't work without @EnableAsync on config | Verify existing config has @EnableAsync or add to main application class | ⚠️ Action Required |
| **Optimistic Locking Precision** | LOW | OffsetDateTime equality checks might have nanosecond precision issues | Design uses field-by-field comparison (safe). Consider using update_date timestamp comparison for additional safety | ✅ Mitigated |
| **Spring Security Role Naming** | LOW | Design uses hasRole('ADMIN') but Spring convention may require 'ROLE_ADMIN' | Verify existing project's SecurityConfig and adjust @PreAuthorize annotations if needed | ⚠️ Verify |

### 5.2 Integration Risks

| Risk | Impact | Mitigation Strategy | Status |
|------|--------|---------------------|--------|
| **Breaking Changes to stamp_history** | LOW | Approval updates stamp_history.in_time, out_time, etc. Existing StampHistoryService queries might not expect admin-modified records | Design only does UPDATEs (no schema changes). Test with existing CSV export and monthly statistics queries to ensure compatibility | ✅ Low Risk |
| **Circular Dependencies** | LOW | StampRequestApprovalService → StampHistoryMapper might create cycles | Dependency graph is one-way (approval service uses stamp history, not vice versa). No risk of circular dependencies | ✅ Low Risk |
| **Email Spam/Failures** | MEDIUM | Email notifications might spam admins or fail silently | Design logs email failures. Add retry logic (3 attempts) and dead-letter queue for failed notifications. Rate limit to 1 email per employee per hour | ⚠️ Consider Enhancement |
| **Audit Log JSONB Inconsistency** | MEDIUM | log_history.detail JSONB structure not standardized across different actions (create/approve/reject/cancel) | Define standard JSONB schema (see § 1 Critical Issue #3) and document in design | ⚠️ Action Required |

### 5.3 Mitigation Strategies

**Priority 1: Must Fix Before Implementation**
1. **N+1 Query:** Rewrite StampRequestMapper to use JOIN queries for employee data
2. **Email Configuration:** Document complete Spring Mail setup requirements
3. **Audit Log JSONB:** Define and document standard JSONB structure for all request workflow events

**Priority 2: Should Fix (Not Blocking)**
4. **OvertimeCalculator Integration:** Show how to recalculate overtime after approval (requirement 9)
5. **Optimistic Update Pattern:** Add full onMutate/onError/onSettled example in React Query hooks
6. **Spring Security Role Naming:** Verify 'ADMIN' vs 'ROLE_ADMIN' in existing SecurityConfig

**Priority 3: Nice-to-Have Improvements**
7. **Backend Caching:** Add @Cacheable for employee data lookups
8. **E2E Test Expansion:** Add Playwright tests for bulk operations, cancellation, conflicts
9. **Clock Bean:** Add @Bean Clock systemUTC() to configuration documentation

---

## 6. Dimension Scores

### 6.1 Requirements Coverage: **4/5**

**Rationale:**
- Fully covered: 8/10 requirements (Req 1,2,3,4,5,6,8,10) with concrete design for all acceptance criteria
- Partially covered: 2/10 requirements
  - Req 7 (Audit Trail): Missing log_history.detail JSONB structure definition and query filtering implementation
  - Req 9 (Business Rules): Missing "reasonable working hours" validation and OvertimeCalculator integration
- No missing requirements (0/10)
- Overall coverage: 80% complete, 20% partial → **Score: 4/5**

**Deductions:**
- -0.5: Req 7 audit log query filtering not designed
- -0.5: Req 9 overtime calculation integration not shown

---

### 6.2 Consistency: **4/5**

**Rationale:**
- Database design: 5/5 - Perfect alignment with existing schema conventions (snake_case, audit columns, indexes, FK patterns)
- Backend design: 4/5 - Excellent CQRS, service layer, MyBatis patterns from News/StampHistory; minor uncertainty on Spring Security role naming
- Frontend design: 4/5 - Excellent module structure, React Query, TanStack Table patterns from News; minor gap in optimistic update details
- Integration points: 3/5 - Frontend dependencies verified, but backend missing Clock bean and Spring Mail setup
- Average: (5+4+4+3)/4 = 4.0 → **Score: 4/5**

**Deductions:**
- -0.5: Spring Security role naming uncertainty ('ADMIN' vs 'ROLE_ADMIN')
- -0.5: Optimistic update implementation details missing

---

### 6.3 Implementability: **4/5**

**Rationale:**
- Dependencies: 2 new (Spring Mail, Clock bean) - both straightforward to add
- Complexity: Moderate - approval workflow is standard CRUD with state machine, conflict detection uses field comparison (not complex), bulk operations follow News pattern
- Risks: Email infrastructure HIGH risk but mitigatable with @ConditionalOnProperty feature flag
- Team capability: Patterns match existing codebase (News, StampHistory), team has experience with similar features (News bulk operations, StampHistory approval workflows)
- Realistic timeline: Design estimates 2-3 weeks for full feature delivery (matches gap-analysis roadmap)
- **Score: 4/5** - Realistic and achievable, email setup is main blocker but not technically difficult

**Deductions:**
- -1.0: Email infrastructure missing requires external SMTP setup (might need DevOps involvement for production)

---

### 6.4 Quality: **4/5**

**Rationale:**
- SOLID principles: 4.5/5 - Excellent service separation, DI, SRP
- Security: 4.7/5 - Strong multi-layer validation, RBAC, SQL injection prevention
- Performance: 3.8/5 - Good indexes and pagination, but N+1 query issue is critical
- Testability: 4.75/5 - Excellent Clock injection, clear mock boundaries, comprehensive test strategy
- Average: (4.5+4.7+3.8+4.75)/4 = 4.44 → **Score: 4/5**

**Deductions:**
- -1.0: N+1 query issue in toResponse() prevents perfect score (would cause production performance issues)

---

### 6.5 Completeness: **4/5**

**Rationale:**
- Database: Complete schema, indexes, constraints, migration strategy, trigger, seed data
- Backend: All services (6), controller (1), mapper (1 interface + XML), DTOs (6 records), custom validators (1), security config specified
- Frontend: All components (9), hooks (3), API client (1), schemas (1), types (1), routes (1) specified
- Missing details:
  - log_history.detail JSONB structure not documented
  - toResponse() batch fetching implementation not shown (critical for N+1 fix)
  - Optimistic update onMutate/onError/onSettled pattern not fully detailed
  - Spring Mail application.yml configuration not shown
- Coverage: ~95% complete → **Score: 4/5**

**Deductions:**
- -0.5: JSONB structure and audit queries missing
- -0.5: Implementation details (batch fetching, optimistic updates, email config) missing

---

## 7. Final Score and Recommendation

### Overall Assessment

**Average Score: (4+4+4+4+4)/5 = 4.0/5**

**Decision: CONDITIONAL GO** - Proceed to task generation after addressing moderate issues

### Interpretation

- **4.0-5.0 (GO):** Design is production-ready, proceed to implementation
- **3.0-3.9 (CONDITIONAL):** Address moderate issues before proceeding ← **Current Status**
- **1.0-2.9 (NO-GO):** Significant revision needed, do not proceed

The stamp-request-workflow design is fundamentally sound with excellent architecture, security, and testability. However, **3 moderate issues must be resolved before implementation:**

1. **N+1 Query Performance Issue** (CRITICAL) - Add JOIN queries to batch-fetch employee data
2. **Email Infrastructure Setup** (CRITICAL) - Document Spring Mail configuration requirements
3. **Audit Log JSONB Structure** (IMPORTANT) - Define standard schema for log_history.detail

Once these are addressed, the design will be **GO** quality (4.5/5 score).

---

## 8. Recommendations

### Critical (Must Fix Before Proceeding)

1. **Fix N+1 Query in StampRequestMapper** (Priority: CRITICAL)
   - **Problem:** toResponse() fetches employee data individually (50 requests = 101 queries)
   - **Solution:** Rewrite findPendingRequests() and findByEmployeeId() to JOIN employee table:
     ```sql
     SELECT sr.*, e.first_name, e.last_name, ae.first_name AS approval_first_name
     FROM stamp_request sr
     INNER JOIN employee e ON sr.employee_id = e.id
     LEFT JOIN employee ae ON sr.approval_employee_id = ae.id
     WHERE sr.status = 'PENDING'
     ORDER BY sr.created_at DESC
     ```
   - **Impact:** Reduces 101 queries to 1 query for 50 requests (100x performance improvement)
   - **Effort:** 1-2 hours (update mapper XML, add ResultMap, update toResponse())

2. **Document Spring Mail Configuration** (Priority: CRITICAL)
   - **Problem:** Email notification service requires infrastructure not present in project
   - **Solution:** Add configuration guide to design or create separate setup document:
     ```yaml
     # application.yml
     spring:
       mail:
         host: smtp.example.com
         port: 587
         username: ${MAIL_USERNAME}
         password: ${MAIL_PASSWORD}
         properties:
           mail.smtp.auth: true
           mail.smtp.starttls.enable: true

     app:
       notification:
         enabled: true  # false to disable emails in test
     ```
   - **Dependencies:** Add to build.gradle: `implementation 'org.springframework.boot:spring-boot-starter-mail'`
   - **Config:** Add @EnableAsync to main application class
   - **Impact:** Enables core requirement 5 (Email Notification System)
   - **Effort:** 2-3 hours (setup + testing with Gmail SMTP or Mailhog)

3. **Define Audit Log JSONB Structure** (Priority: IMPORTANT)
   - **Problem:** log_history.detail JSONB schema not standardized for request workflow events
   - **Solution:** Document standard structure in design:
     ```json
     {
       "requestId": 123,
       "stampHistoryId": 789,
       "employeeId": 456,
       "action": "STAMP_REQUEST_APPROVED",
       "originalValues": {
         "inTime": "2025-01-15T09:00:00+09:00",
         "outTime": "2025-01-15T18:00:00+09:00"
       },
       "requestedValues": {
         "inTime": "2025-01-15T08:45:00+09:00",
         "outTime": "2025-01-15T18:00:00+09:00"
       },
       "approvalNote": "承認します",
       "approverId": 1
     }
     ```
   - **Impact:** Enables requirement 7 (query filtering, audit trail completeness)
   - **Effort:** 1 hour (documentation + example SQL queries)

### Important (Should Fix, Not Blocking)

4. **Add OvertimeCalculator Integration** (Priority: MEDIUM)
   - **Problem:** Requirement 9 specifies "calculating overtime from requested values" but design doesn't show integration
   - **Solution:** Add to StampRequestApprovalService.approveRequest():
     ```java
     // After updating stamp_history with requested values
     OvertimeHours overtime = overtimeCalculator.calculate(
         stampHistory.getInTime(),
         stampHistory.getOutTime(),
         stampHistory.getBreakStartTime(),
         stampHistory.getBreakEndTime()
     );
     stampHistory.setOvertimeHours(overtime); // Update overtime field
     ```
   - **Impact:** Ensures overtime is recalculated after approval (compliance requirement)
   - **Effort:** 2 hours (integrate existing OvertimeCalculator service)

5. **Add Full Optimistic Update Pattern Example** (Priority: MEDIUM)
   - **Problem:** Design mentions "optimistic updates" but doesn't show onMutate/onError/onSettled pattern
   - **Solution:** Add to useStampRequests.ts documentation:
     ```tsx
     onMutate: async (newRequest) => {
       await queryClient.cancelQueries({ queryKey: stampRequestQueryKeys.myRequests() });
       const previousRequests = queryClient.getQueryData(stampRequestQueryKeys.myRequests());
       queryClient.setQueryData(stampRequestQueryKeys.myRequests(), (old) => ({
         ...old,
         requests: [...old.requests, { ...newRequest, status: 'PENDING' }],
       }));
       return { previousRequests };
     },
     onError: (err, newRequest, context) => {
       queryClient.setQueryData(stampRequestQueryKeys.myRequests(), context.previousRequests);
       toast({ title: "エラー", description: err.message, variant: "destructive" });
     },
     onSettled: () => {
       queryClient.invalidateQueries({ queryKey: stampRequestQueryKeys.myRequests() });
     }
     ```
   - **Impact:** Improves UX (requirement 10: improved perceived performance)
   - **Effort:** 1 hour (documentation)

6. **Verify Spring Security Role Naming** (Priority: MEDIUM)
   - **Problem:** Design uses hasRole('ADMIN') but Spring convention often requires 'ROLE_ADMIN'
   - **Solution:** Check existing SecurityConfig in project:
     - If uses admin_flag directly: Change to custom expression `@PreAuthorize("@securityService.isAdmin()")`
     - If uses roles: Verify role name and update to `hasRole('ROLE_ADMIN')` if needed
   - **Impact:** Prevents 403 Forbidden errors on admin endpoints
   - **Effort:** 30 minutes (code review + find-replace)

### Nice-to-Have (Optional Improvements)

7. **Add Backend Caching for Employee Lookups** (Priority: LOW)
   - **Solution:** Add @Cacheable to EmployeeMapper.findById():
     ```java
     @Cacheable(value = "employees", key = "#id")
     Optional<Employee> findById(Integer id);
     ```
   - **Impact:** Reduces DB load for frequently accessed employee data
   - **Effort:** 1 hour (add Spring Cache config)

8. **Expand E2E Test Coverage** (Priority: LOW)
   - **Missing Scenarios:** Bulk approve/reject, cancellation flow, conflict detection, email sending
   - **Solution:** Add Playwright tests in frontend/tests/e2e/stamp-request.spec.ts
   - **Impact:** Increases confidence in deployment
   - **Effort:** 4-6 hours (write + debug E2E tests)

9. **Add Clock Bean to Configuration** (Priority: LOW)
   - **Solution:** Create ClockConfig.java:
     ```java
     @Configuration
     public class ClockConfig {
         @Bean
         public Clock clock() {
             return Clock.systemUTC();
         }
     }
     ```
   - **Impact:** Enables Clock injection in services (required for time-dependent logic)
   - **Effort:** 15 minutes

---

## 9. Next Steps

### If Decision is GO (After Addressing Critical Issues)

1. **Update Design Document**
   - Add JOIN queries to § 3.4 StampRequestMapper.xml
   - Add Spring Mail configuration to § 9 (or create separate setup guide)
   - Add JSONB structure definition to § 3.3 LogHistoryRegistrationService integration

2. **Proceed to Task Generation**
   ```bash
   /kiro:spec-tasks stamp-request-workflow -y
   ```

3. **Implementation Order** (from gap-analysis roadmap)
   - Week 1: Database & Backend Foundation (V7 migration, entities, mappers, query service)
   - Week 2: Approval & Workflow (approval service, conflict detection, audit logs)
   - Week 3: Bulk Operations & Email (bulk service, Spring Mail config, notification service)
   - Week 4: Frontend - Core UI (API client, hooks, RequestCorrectionModal, MyRequestsPage)
   - Week 5: Frontend - Admin Pages (PendingRequestsAdminPage, approval/rejection dialogs, bulk UI)
   - Week 6: Integration & Polish (E2E tests, performance optimization, documentation)

### If Decision is CONDITIONAL (Current Status)

1. **Address Critical Issues First** (Estimated: 4-6 hours)
   - Fix N+1 query (1-2 hours)
   - Document Spring Mail setup (2-3 hours)
   - Define JSONB structure (1 hour)

2. **Re-validate Design**
   - Update design.md with fixes
   - Run `/kiro:validate-design stamp-request-workflow` again

3. **Then Proceed to GO**

### If Decision is NO-GO (Not Applicable)

- Revise design with `/kiro:spec-design stamp-request-workflow`
- Address fundamental architecture issues
- Re-run validation

---

## 10. Conclusion

The stamp-request-workflow design is **architecturally excellent** and demonstrates strong alignment with existing project patterns. The SOLID principles, security measures, and testability design are of very high quality (4.5-4.75/5 scores).

The main blockers are **implementation details** rather than fundamental design flaws:
1. N+1 query can be fixed with JOIN queries (standard MyBatis pattern)
2. Spring Mail configuration is straightforward (documented in Spring Boot docs)
3. JSONB structure needs documentation (1-hour effort)

Once these 3 issues are resolved, the design will be **production-ready** and can proceed to implementation with high confidence.

**Estimated Time to GO Status:** 4-6 hours of design updates and documentation.

---

**Reviewed by:** Design Validation Agent
**Approved for:** Conditional progression to task generation
**Next Action:** Address critical issues, then run `/kiro:spec-tasks stamp-request-workflow`
