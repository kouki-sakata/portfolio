# Repository Guidelines

## Adhere to each best practice

When implementing code, always refer to context7 and proceed with
implementation.

Before you start coding, please get the latest documentation using context7 (MCP
server).

## Project Structure & Module Organization

This Spring Boot app keeps domain code under
`src/main/java/com/example/teamdev`, split into `config`, `controller`,
`service`, `mapper`, `entity`, `dto`, and `util` packages. Views and static
assets live in `src/main/resources/templates` and `src/main/resources/static`,
while SQL seed files (`01_schema.sql`, `02_data.sql`) stay alongside
`application-*.properties`. Tests belong in `src/test/java`, mirroring the main
package tree. Docker tooling (`docker/`, `docker-compose.yml`) provisions MySQL
and the app container, and workflow scripts reside in `scripts/`.

## Build, Test, and Development Commands

- `./gradlew bootRun` — start the API with the default profile; pass
  `SPRING_PROFILES_ACTIVE=dev` or `--args='--spring.profiles.active=test'` for
  alternate configs.
- `./gradlew build` — compile, run tests, and create the executable jar under
  `build/libs/`.
- `./gradlew test` — execute the JUnit suite; use before every push.
- `./scripts/dev-workflow.sh --quick` — local CI shortcut (compilation + unit
  tests); `--full` adds security scans and Docker checks.
- `docker-compose up -d` — launch the containerized stack defined in `docker/`
  for parity with production.

## Coding Style & Naming Conventions

Use Java 21 with four-space indentation and avoid tab characters. Classes are
`PascalCase`, beans and methods `camelCase`, constants `UPPER_SNAKE_CASE`. Keep
controllers lean—delegate to services and mappers. Annotate logging with Lombok
`@Slf4j` where logging is needed, and prefer constructor injection. Front-end
snippets in Thymeleaf templates follow HTML5 + ES6 standards; mirror existing
naming under `static/js` and `static/css`.

## Testing Guidelines

JUnit 5 is configured via `useJUnitPlatform()`. Name test classes `*Test` (unit)
or `*IT` (integration) and locate them under the corresponding package in
`src/test/java`. Activate the lightweight `test` profile when relying on
in-memory data: `SPRING_PROFILES_ACTIVE=test ./gradlew test`. Cover business
logic in services, include mapper-level checks with MyBatis testers, and assert
security rules using `spring-security-test`. Aim to keep new features
accompanied by positive and negative cases.

## Commit & Pull Request Guidelines

Follow conventional commits observed in history (`feat:`, `fix:`, `security:`,
`docs:`, `debug:`). Keep summary lines under 72 characters and add context-rich
bodies when behavior changes. Pull requests should describe the change, link any
GitHub issue, list validation commands (`./gradlew test`, workflow script
options), and attach UI screenshots for template updates. Request review once CI
succeeds and flag any follow-up work.

## Security & Quality Checks

Run `./gradlew dependencyCheckAnalyze` before merging to surface CVEs (fails on
CVSS ≥ 7). SonarQube properties are preconfigured; trigger a local scan with
`./gradlew sonar` when you need a full report. Avoid committing credentials—
`scripts/dev-workflow.sh --security` performs secret scans and large-file
detection for you.
