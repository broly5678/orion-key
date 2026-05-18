# Repository Guidelines

## Project Structure & Module Organization
This monorepo contains two apps under `apps/`. `apps/web` is the Next.js 16 storefront and admin UI; route files live in `app/`, shared UI in `components/`, reusable logic in `lib/`, `hooks/`, and `services/`, and static assets in `public/`. `apps/api` is the Spring Boot backend; keep HTTP controllers in `controller/`, business logic in `service/` and `service/impl/`, persistence in `repository/`, and JPA models in `entity/`. Runtime config lives in `apps/api/src/main/resources/`, and the current backend tests are under `apps/api/src/test/`.

## Build, Test, and Development Commands
Run frontend development from the repo root with `pnpm install` once, then `pnpm dev:web` for the web app on Next.js. Use `pnpm build:web` to create a production web build and `pnpm lint:web` to run ESLint. For the API, work from `apps/api`: `mvn spring-boot:run` starts the backend, `mvn test` runs JUnit tests, and `mvn package` builds the jar. Use `docker-compose.yml` for integrated runs when validating container behavior.

## Coding Style & Naming Conventions
TypeScript/React files use 2-space indentation, double quotes, and no semicolons; follow the existing App Router pattern and keep component filenames kebab-case such as `product-card.tsx`. Java code uses 4-space indentation, standard Spring naming, and package layout under `com.orionkey`. Prefer `PascalCase` for React components and Java classes, `camelCase` for functions and variables, and keep DTOs in `model/request` or `model/response`. Run `pnpm lint:web` before opening a PR.

## Testing Guidelines
Backend tests use Spring Boot Test with JUnit 5. Name new test classes `*Tests.java` and keep them in the matching package under `apps/api/src/test/java`. Add focused service or controller tests for behavior changes; do not rely only on `contextLoads()`. The frontend currently has no committed test suite, so at minimum include lint-clean code and manual verification notes for affected pages or flows.

## Commit & Pull Request Guidelines
Git history currently uses Conventional Commit-style prefixes such as `docs:`. Continue with short messages like `feat: add admin risk filter` or `fix: validate webhook signature`. PRs should describe the user-visible change, list commands run (`pnpm lint:web`, `mvn test`), link related issues, and include screenshots for UI updates. Keep secrets out of commits; use `.env.example` and `application.yml` placeholders instead of real credentials.
