---
description: Execute spec tasks using TDD methodology
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch, WebSearch
argument-hint: <feature-name> [task-numbers]
---

# Execute Spec Tasks with TDD

Execute implementation tasks for **$1** using Kent Beck's Test-Driven
Development (TDD) methodology, adhering to strict TypeScript standards and best
practices.

## Instructions

### Pre-Execution Validation

Validate that the required files exist for feature **$1**:

- Requirements: `.kiro/specs/$1/requirements.md`
- Design: `.kiro/specs/$1/design.md`
- Tasks: `.kiro/specs/$1/tasks.md`
- Metadata: `.kiro/specs/$1/spec.json`

### Context Loading

**Core Steering:**

- Structure: @.kiro/steering/structure.md
- Tech Stack: @.kiro/steering/tech.md
- Product: @.kiro/steering/product.md

**Custom Steering:**

- Additional `*.md` files in `.kiro/steering/` (excluding structure.md, tech.md,
  product.md)

**Spec Documents for $1:**

- Metadata: @.kiro/specs/$1/spec.json
- Requirements: @.kiro/specs/$1/requirements.md
- Design: @.kiro/specs/$1/design.md
- Tasks: @.kiro/specs/$1/tasks.md

### Task Execution

1. **Feature**: $1
2. **Task numbers**: $2 (optional, defaults to all pending tasks)
3. **Load all context** (steering + spec documents).
4. **Execute selected tasks** using the TDD methodology.

### TDD Implementation

For each selected task:

1. **RED**: Write a failing test first.
2. **GREEN**: Write the minimal amount of code to pass the test.
3. **REFACTOR**: Clean up and improve the code's structure.
4. **Verify**:
    - All tests pass.
    - No regressions in existing tests.
    - Code quality and test coverage are maintained, and all coding standards
      are met.
5. **Mark Complete**: Update the checkbox from `- [ ]` to `-[x]` in `tasks.md`.

## Implementation Notes

- **Feature**: Use `$1` for the feature name.
- **Tasks**: Use `$2` for specific task numbers (optional).
- **Development Approach**:
  - Create a branch and begin implementation.
  Name the branch according to the task
  - Utilize **context7** for all development activities.
  - Consistently apply software development **best practices**.
- **Coding Standards (TypeScript)**:
    - **Type Safety**: Strictly enforce TypeScript's type consistency. All code
      must be fully type-safe.
    - **Biome + ultracite Rules**: Adhere to the ultracite preset for Biome,
      which provides:
        - **Strict Type Safety**: Enforces TypeScript's strictest type
          checking (no `any`, strict null checks, exhaustive type handling)
        - **AI-Ready Code Quality**: Optimized for AI-generated code with
          comprehensive linting and formatting rules
        - **Performance**: Rust-powered Biome engine for instant feedback during
          development
- **TDD Focus**: Strictly follow the Red-Green-Refactor cycle. Always write
  tests before implementation.
- **Validation**: Check that all required spec files exist before starting.
- **Task Tracking**: Update checkboxes in `tasks.md` as tasks are completed.
