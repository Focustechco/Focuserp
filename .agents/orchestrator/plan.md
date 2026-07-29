# High-Level Plan — Focuserp Refactoring

## Objectives
Refactor Focuserp from local storage document state to Supabase PostgreSQL 3NF relational model, with Keycloak JWT authentication, multi-tenant RLS, Zod schemas, TanStack React Query hooks, and robust CI/CD verification.

## Phase Breakdown

### Phase 0: E2E Testing Suite & Infrastructure (Dual Track)
- Create test runner / harness and comprehensive opaque-box E2E test cases across 4 tiers:
  - Tier 1: Feature Coverage (Clientes, Financeiro, Projetos, RH)
  - Tier 2: Boundary & Corner Cases (empty inputs, limit sizes, multi-tenant leaks)
  - Tier 3: Cross-Feature Interactions
  - Tier 4: Real-World Scenarios
- Publish `TEST_READY.md` upon completion.

### Phase 1: Database DDL 3NF & Security (RLS & Auth)
- Define 3NF tables: `tenants`, `users`, `clientes`, `contas_receber`, `contas_pagar`, `projetos`, `audit_logs`.
- Configure `tenant_id` foreign keys and indexes.
- Enable RLS policies enforcing strict `tenant_id` isolation.
- Integrate Keycloak JWT claim parsing for Supabase Auth.

### Phase 2: Strongly Typed Schemas & SDK Services Layer
- Implement Zod schemas in `src/schemas/` for entity validation.
- Implement Supabase SDK services in `src/services/` with error handling.

### Phase 3: Frontend Refactoring (React Query)
- Replace `useLocalStorageState` with custom React Query hooks (`useQuery`, `useMutation`).
- Refactor UI modules: Clientes, Financeiro, Projetos, RH.
- Preserve 100% UI/UX, Radix UI components, TailwindCSS styling, and Sonner toast notifications.

### Phase 4: Build Verification, CI/CD Pipeline & Victory Claim
- Execute static type checking (`npx tsc --noEmit`).
- Verify production build (`npm run build`).
- Verify GitHub Actions workflow (`.github/workflows/ci-cd.yml`).
- Submit victory report to Sentinel.
