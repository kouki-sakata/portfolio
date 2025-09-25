# pgloader Staging Rehearsal Guide

This directory contains artefacts used when rehearsing the migration from the legacy MySQL deployment to PostgreSQL in a staging environment.

## Files

- `staging-migration.load` — template for the pgloader configuration. Replace the placeholder values with the actual staging connection strings before running. The file is safe to keep under version control while it only contains placeholders; create a copy (e.g. `staging-migration.local.load`) for secrets.

## Rehearsal Steps

1. Provision both source (MySQL) and target (PostgreSQL 16) databases in the staging environment.
2. Take a fresh MySQL snapshot or clone so the rehearsal operates on current data.
3. Duplicate `staging-migration.load` to `staging-migration.local.load` and fill the placeholder tokens:

   ```bash
   cp docs/pgloader/staging-migration.load docs/pgloader/staging-migration.local.load
   vi docs/pgloader/staging-migration.local.load
   ```

4. Run pgloader from your workstation or staging jump host:

   ```bash
   pgloader docs/pgloader/staging-migration.local.load
   ```

5. Validate the migrated PostgreSQL schema:

   ```bash
   psql "$STAGING_PG_URL" -c "\dt"
   ./gradlew test -PskipTestcontainers=true --info
   ```

6. Capture metrics (duration, warnings, errors) in the migration log and store them alongside staging runbooks.
7. Drop the rehearsal database if required, or keep it for diff/validation until the production cut-over.

> **Note:** pgloader requires network access between the runner and both database hosts. Ensure the firewall rules and security groups allow temporary connectivity during the rehearsal window.

