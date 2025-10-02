# Repository Guidelines

## Project Structure & Module Organization
Backend resides in `src/main/java/com/example/teamdev/` with packages `config`, `controller`, `service`, `mapper`, `entity`, `dto`, `util`; keep cross-cutting helpers in `util`. API contracts surface under `controller/api`. Shared SQL such as `01_schema.sql` and `02_data.sql` plus `application-*.properties` live in `src/main/resources`. SPA assets live in `frontend/` (React, Vite) and build output is copied to `src/main/resources/static`. JUnit sources mirror the main tree in `src/test/java`. Docker recipes (`docker/`, `docker-compose.yml`) spin up PostgreSQL + app, and automation scripts live in `scripts/`.

## Build, Test, and Development Commands
- `SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun` – start the API locally against Postgres.
- `npm run dev --prefix frontend` – launch the SPA dev server on port 5173.
- `./gradlew build` – compile, run tests, and produce `build/libs/*.jar` including bundled SPA.
- `./gradlew test` – execute JUnit/Testcontainers suite; run before every push.
- `./scripts/dev-workflow.sh --quick` – compile + unit tests; `--full` adds Docker, security, and contract checks.
- `docker-compose up -d` – provision app + PostgreSQL for parity with production.

## Coding Style & Naming Conventions
Use Java 21, four-space indentation, and constructor injection. Classes stay `PascalCase`, beans/methods `camelCase`, constants `UPPER_SNAKE_CASE`. Controllers should be thin facades delegating to services/mappers; annotate log-heavy classes with `@Slf4j`. Frontend TypeScript follows ESLint + Prettier defaults; React components live under `frontend/src/app` and `frontend/src/features` with `PascalCase` filenames.

## Testing Guidelines
Back-end tests use JUnit 5 (`useJUnitPlatform`) with `*Test` and `*IT` naming. Activate lightweight fixtures via `SPRING_PROFILES_ACTIVE=test ./gradlew test`. Add mapper tests for MyBatis SQL edges and security rules with `spring-security-test`. Frontend relies on Vitest and Playwright: `npm run test --prefix frontend` for unit/specs, `npm run test:e2e --prefix frontend` for UI coverage.

## Commit & Pull Request Guidelines
Adopt conventional commit prefixes (`feat:`, `fix:`, `docs:`, `security:`, `debug:`) and keep subject lines ≤72 chars. PRs must describe behavior changes, link tracking issues, list validation commands run (e.g., `./gradlew test`, workflow scripts), and attach UI screenshots when touching templates or SPA views. Request review after CI passes and call out follow-up tasks.

## Security & Quality Checks
Run `./gradlew dependencyCheckAnalyze` before merging; the build fails for CVSS ≥7. Trigger SonarQube locally with `./gradlew sonar` when substantial refactors land. Use `scripts/dev-workflow.sh --security` to scan for secrets and large files. Never commit credentials—prefer `.env` templates and managed secrets stores.
