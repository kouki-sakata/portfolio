# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Memory
Project memory keeps persistent guidance (steering, specs notes, component docs) so Codex honors your standards each run. Treat it as the long-lived source of truth for patterns, conventions, and decisions.

- Use `.kiro/steering/` for project-wide policies: architecture principles, naming schemes, security constraints, tech stack decisions, api standards, etc.
- Use local `AGENTS.md` files for feature or library context (e.g. `src/lib/payments/AGENTS.md`): describe domain assumptions, API contracts, or testing conventions specific to that folder. Codex auto-loads these when working in the matching path.
- Specs notes stay with each spec (under `.kiro/specs/`) to guide specification-level workflows.

## Project Context

### test account
- email:test@gmail.com
- password:testtest

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/prompts:kiro-spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)

## Minimal Workflow
- Phase 0 (optional): `/prompts:kiro-steering`, `/prompts:kiro-steering-custom`
- Phase 1 (Specification):
  - `/prompts:kiro-spec-init "description"`
  - `/prompts:kiro-spec-requirements {feature}`
  - `/prompts:kiro-validate-gap {feature}` (optional: for existing codebase)
  - `/prompts:kiro-spec-design {feature} [-y]`
  - `/prompts:kiro-validate-design {feature}` (optional: design review)
  - `/prompts:kiro-spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/prompts:kiro-spec-impl {feature} [tasks]`
  - `/prompts:kiro-validate-impl {feature}` (optional: after implementation)
- Progress check: `/prompts:kiro-spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/prompts:kiro-spec-status`

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/prompts:kiro-steering-custom`)


# Repository Guidelines

## Project Structure & Module Organization
- Backend code lives in `src/main/java`; configuration and MyBatis mappers stay in `src/main/resources` under `mapper`.
- Frontend sources are in `frontend/src`; UI components belong to `frontend/src/components`, shared utilities to `frontend/src/lib` and `frontend/src/shared`.
- Backend tests sit in `src/test/java`; frontend unit tests and mocks reside in `frontend/src/__tests__` and `frontend/src/__mocks__`; Playwright E2E suites use `frontend/tests/e2e`.
- Steering and specifications for agents are tracked in `.kiro/steering` and `.kiro/specs`; review them before planning work.

## Build, Test, and Development Commands
- `./gradlew bootRun` with `SPRING_PROFILES_ACTIVE=dev` starts the Spring Boot API against PostgreSQL.
- `npm run dev --prefix frontend` launches the Vite dev server at http://localhost:5173 with hot reload for React 19.
- `./gradlew build` bundles the backend and the compiled SPA into `build/libs/`.
- `./gradlew check` runs JUnit, Mockito, Testcontainers, Biome, Vitest, and TypeScript checks in one pass.
- `docker-compose up -d` provisions the app plus PostgreSQL; stop with `docker-compose down` when finished.

## Coding Style & Naming Conventions
- Java uses 4-space indents; classes in PascalCase, fields and methods in camelCase; test classes end with `Test.java`.
- TypeScript stays in strict mode—do not use `any` or `unknown`; components use PascalCase filenames, hooks use camelCase.
- SQL migrations follow `01_` for schema and `02_` for seed data; prefer incremental, descriptive filenames.
- Biome handles linting and formatting; run `npm run lint --prefix frontend` before committing, `npm run lint:fix --prefix frontend` for autofixes.

## Testing Guidelines
- `./gradlew test` covers unit and integration suites; scope API-only runs with `./gradlew apiTest` and `@Tag("api")`.
- Frontend checks rely on `npm run typecheck --prefix frontend`, `npm run test --prefix frontend`, and `npm run test:e2e --prefix frontend`.
- Review coverage using `./gradlew jacocoTestReport`; adjust `jacocoCoverageVerification` if thresholds change.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat: add attendance summary API`); call out OpenAPI or schema changes explicitly in the body.
- Pull requests must describe purpose, link issues, document local verification (`./gradlew check` plus relevant npm scripts), and attach screenshots for UI updates.
- Request reviewers from both Java and frontend maintainers whenever a change touches shared contracts or DTOs.

## Agent Workflow Notes
- Progress through `/kiro:spec-init`, `/kiro:spec-requirements`, `/kiro:spec-design`, and `/kiro:spec-tasks` sequentially; do not skip approval stages.
- Fetch current library documentation through Context7 prior to coding, then confirm assumptions inside the spec tasks.
- Conduct internal reasoning in English but deliver repository communications in Japanese, matching the project convention.
