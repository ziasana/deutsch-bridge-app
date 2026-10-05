# Local Postgres for development

Use this when the hosted Postgres is unavailable (e.g. over quota) or to work offline.

## 1. Start the database
```bash
docker compose up -d postgres      # postgres:18 on localhost:5433, db "deutschbridge-db", user postgres / root
```

## 2. Point the backend at it
Override these three variables (keep everything else from `backend/.env`; do not commit them):
```
POSTGRES_URI=jdbc:postgresql://localhost:5433/deutschbridge-db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=root
```
In IntelliJ: add them to the run configuration's environment variables.

## 3a. Empty database (first start)
`V1__baseline.sql` is only a marker, so Flyway cannot build a brand-new schema. Start the backend **once** with
```
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_FLYWAY_ENABLED=false
```
so Hibernate creates the tables. After that, remove both overrides.
(Seed data from migrations such as feature limits and blog covers is not created this way.)

## 3b. Import a backup of the hosted database (preferred)
Use a `pg_dump` whose major version is >= the hosted server's. Then restore into a clean database so the
dump's `flyway_schema_history` lets Flyway continue normally:
```bash
pg_dump --no-owner --no-privileges -Fc "<hosted connection string>" -f live.dump
docker exec my-postgres psql -U postgres -c 'DROP DATABASE "deutschbridge-db"' -c 'CREATE DATABASE "deutschbridge-db"'
docker exec -i my-postgres pg_restore -U postgres -d deutschbridge-db --no-owner < live.dump
```
Start the backend with only the three variables from step 2.

MongoDB (daily words, lexicon) is still the hosted instance from `MONGODB_URI`.
