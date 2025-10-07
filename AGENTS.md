# Repository Guidelines

## Technology Stack Details

### Backend Technologies

- **Java 21** (Eclipse Temurin JDK)
- **Spring Boot 3.4.3** - Core framework
- **Spring Security** - Session-based authentication with CSRF protection
- **MyBatis 3.0.4** - SQL mapper framework for database operations
- **PostgreSQL 16** - Primary database (all environments)
- **Lombok** - Boilerplate code reduction
- **SpringDoc OpenAPI 2.6.0** - Swagger UI and API documentation
- **HikariCP** - Connection pooling (included in Spring Boot)
- **Gradle 8.14.2** - Build automation

### Frontend Technologies

- **React 19.1.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 7.1.7** - Build tool and dev server
- **React Router 7.9.2** - Client-side routing
- **React Query (TanStack Query) 5.90.2** - Server state management
- **React Hook Form 7.63.0** - Form management with Zod validation
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **shadcn-ui@canary** - Component library built on Radix UI (use canary version
  for latest features)
- **Radix UI** - Unstyled, accessible UI components (base for shadcn-ui)
- **Lucide React** - Icon library
- **Axios 1.12.2** - HTTP client
- **date-fns 4.1.0** - Date utilities
- **Biome** - Linting and formatting (replacing ESLint/Prettier)

### Testing Infrastructure

- **Backend:**
    - JUnit 5 with Spring Boot Test
    - Testcontainers (PostgreSQL) - Integration testing with real database
    - Mockito - Unit test mocking
    - REST Assured (via Spring Test) - API testing
    - OpenAPI4j - Contract validation (optional with `-PenableOpenApiContract`)
    - JaCoCo - Code coverage

- **Frontend:**
    - Vitest 3.2.4 - Unit testing framework
    - Testing Library (React) - Component testing
    - Playwright 1.49.1 - E2E testing
    - jsdom - DOM simulation for Vitest
    - Axios Mock Adapter - API mocking

### Development Tools

- **Docker & Docker Compose** - Containerization
- **Node.js 22.12.0 / npm 10.9.2** - Frontend toolchain (version specified in
  `frontend/.nvmrc`)
- **GitHub Actions** - CI/CD pipeline
- **SonarCloud** - Code quality analysis
- **OWASP Dependency Check** - Security vulnerability scanning
- **Ultracite** - Development automation tool

## AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation using claude code slash
commands, hooks and agents.

### Adhere to each best practice

When implementing code, always refer to context7 and proceed with
implementation. Before you start coding, please get the latest documentation
using context7 (MCP server).

## Project Context

### Important Notes

- Never use `any` or `unknown` types in TypeScript (per global CLAUDE.md)
- Always check for existing libraries before adding dependencies
- Frontend build output is integrated into Spring Boot static resources
- Profiles: `dev` (Swagger enabled), `test` (Testcontainers), `prod` (optimized)
- **shadcn-ui Components**: Always use `@canary` version for latest features and
  compatibility with React 19
- **Component Imports**: Import UI components from `@/components/ui/*` not from
  external packages
- **Styling**: Components use Tailwind CSS with CSS variables defined in
  `src/index.css`

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`
- Commands: `.claude/commands/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual
features

### Active Specifications

- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines

- Think in English, but generate responses in Japanese (
  思考は英語、回答の生成は日本語で行うように)

## Workflow

### Phase 0: Steering (Optional)

`/kiro:steering` - Create/update steering documents
`/kiro:steering-custom` - Create custom steering for specialized contexts

**Note**: Optional for new features or small additions. Can proceed directly to
spec-init.

### Phase 1: Specification Creation

1. `/kiro:spec-init [detailed description]` - Initialize spec with detailed
   project description
2. `/kiro:spec-requirements [feature]` - Generate requirements document
3. `/kiro:spec-design [feature]` - Interactive: "
   requirements.mdをレビューしましたか？ [y/N]"
4. `/kiro:spec-tasks [feature]` - Interactive: Confirms both requirements and
   design review

### Phase 2: Progress Tracking

`/kiro:spec-status [feature]` - Check current progress and phases

## Development Rules

1. **Consider steering**: Run `/kiro:steering` before major development (
   optional for new features)
2. **Follow 3-phase approval workflow**: Requirements → Design → Tasks →
   Implementation
3. **Approval required**: Each phase requires human review (interactive prompt
   or manual)
4. **No skipping phases**: Design requires approved requirements; Tasks require
   approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/kiro:steering` after significant changes
7. **Check spec compliance**: Use `/kiro:spec-status` to verify alignment

## Steering Configuration

### Current Steering Files

Managed by `/kiro:steering` command. Updates here reflect command changes.

### Active Steering Files

- `product.md`: Always included - Product context and business objectives
- `tech.md`: Always included - Technology stack and architectural decisions
- `structure.md`: Always included - File organization and code patterns

### Custom Steering Files

<!-- Added by /kiro:steering-custom command -->

### Inclusion Modes

- **Always**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., `"*.test.js"`)
- **Manual**: Reference with `@filename.md` syntax

## Project Structure & Module Organization

- Backend source lives in `src/main/java/com/example/...`; group new code by
  feature (attendance, employee, auth).
- Tests mirror the same tree under `src/test/java` for JUnit + Testcontainers.
- `frontend/src` contains the Vite SPA (`app/`, `features/`, `shared/`); shared
  assets stay in `frontend/public`.
- SQL setup files are `src/main/resources/01_schema.sql` and `02_data.sql`.
- Dev tooling (Docker compose, workflow script) resides in `docker/`,
  `docker-compose.yml`, and `scripts/dev-workflow.sh`.

## Build, Test, and Development Commands

- `./gradlew bootRun` (with `SPRING_PROFILES_ACTIVE=dev`) starts the API
  locally.
- `npm run dev --prefix frontend` runs Vite on http://localhost:5173.
- `./gradlew build` packages backend plus SPA output in `build/libs/`.
- `./gradlew check` runs Java tests, Biome lint, TS typecheck, and Vitest.
- `docker-compose up -d` spins up app + PostgreSQL; shut down with
  `docker-compose down`.

## Coding Style & Naming Conventions

- Java: 4-space indent, Lombok, feature packages; PascalCase types, camelCase
  members, tests `*Test.java`.
- SQL migrations follow `0N_description.sql`; keep DDL in `01_` and data in
  `02_`.
- TypeScript: Strict mode enabled, no `any` or `unknown` types
- Frontend lint/format via Biome; run `npm run lint --prefix frontend` or
  `npm run lint:fix --prefix frontend` before pushing.
- Components in PascalCase files, hooks camelCase, shared helpers under
  `frontend/src/shared` or `lib`.

## Testing Guidelines

- `./gradlew test` covers unit + integration; place specs near implementation.
- Mark API suites `@Tag("api")` to run with `./gradlew apiTest`.
- Generate coverage with `./gradlew jacocoTestReport`; optional
  `jacocoCoverageVerification` enforces ≥25% line coverage.
- Frontend unit tests: `npm run lint:fix --prefix frontend`; Playwright E2E:
  `npm run test:e2e --prefix frontend`; TypeScript type checks:
  `npm run typecheck --prefix frontend`.
- Reseed Postgres using `01_schema.sql` and `02_data.sql` when data drifts.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.) like the
  existing history.
- Keep commits focused and mention OpenAPI or schema changes explicitly.
- PRs must include purpose, linked issue, local verification (`./gradlew check`,
  frontend tests), and UI evidence for visual work.
- Request reviewers from both Java and frontend maintainers when touching shared
  contracts or DTOs.

## Security & Environment Notes

- Copy `.env.example` to `.env`; supply `DB_*`, `JWT_SECRET`, `ENCRYPTION_KEY`;
  never commit secrets.
- SPA dev requires `VITE_API_BASE_URL=http://localhost:8080/api` and the backend
  running with `dev` profile.
- CI secrets live in GitHub Actions; production pulls via AWS/ECS managers;
  reuse headers in `src/main/java/com/example/teamdev/config`.
- Rotate demo credentials and prune stale Docker volumes (`docker volume prune`)
  during resets.
