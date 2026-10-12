# Books API

NestJS + TypeScript (strict), MariaDB/MySQL (mysql2, raw SQL), Redis (ioredis), Jest. No Docker, no ORM.

## Requirements

Node.js 20+, MariaDB/MySQL, Redis, installed locally.

## Create the database

    mysql -u root -p < sql/schema.sql

## Run

    npm install
    cp .env.example .env    # set DB credentials
    npm run start:dev       # http://localhost:3000

## Tests

    npm test

## Main decisions

- Layers: controller -> service -> repository. All SQL is only in the repository.
- Pool and Redis client are Nest providers (injection tokens), closed on shutdown.
- Raw SQL with placeholders. LIKE wildcards (% _ \) in the search are escaped.
  pool.query is used because MySQL 8 prepared statements don't accept numeric LIMIT/OFFSET placeholders.
- Responses: an interceptor wraps success as { success: true, data }.
  One exception filter returns errors as { success: false, error: { code, message } }.
- Validation: class-validator DTOs. Integers are parsed strictly ("abc", "5.5", "1e2" are rejected).
  Failures become 400 VALIDATION_ERROR.
- Cache: GET /books/:id is cached as book:<id> for 300 s. Redis has a 1 s command and connect timeout and
  no offline queue, so it fails fast. Any Redis read or write error is logged and ignored,
  and the book comes from the database.
- Not-found books are not cached. `available` is returned as a boolean. Field names follow the DB columns.

## Questions

1. Which index would help GET /books?
   A composite index on (available, title). The query filters available = 1 and sorts by title,
   so MariaDB can read rows in order from the index, stop after LIMIT rows, and skip the filesort.
   It also makes COUNT(*) cheaper. It helps the search only a little: LIKE '%text%' starts with a
   wildcard, so a B-tree index cannot seek. It can only scan the narrower index instead of the table.
   LOWER(title) also prevents seeking. Real search speed needs a FULLTEXT index, or a prefix
   search (LIKE 'text%') which can use the index.

2. What to improve before production?
   - Keyset pagination (WHERE title > last_title) instead of OFFSET for deep pages.
   - FULLTEXT or a search engine for search; cache or approximate the total count.
   - Redis: use a circuit breaker, protect against cache stampede, add jitter to the TTL,
     and invalidate or update the cache when a book changes.
   - Config validation at startup, secrets manager, least-privilege DB user, TLS to DB/Redis.
   - Migrations tool, health/readiness endpoints, structured logs, metrics, request IDs.
   - Rate limiting, helmet, CORS, API docs (OpenAPI), e2e tests against a real DB, CI.
   - Pool tuning and query timeouts, graceful shutdown under load.
