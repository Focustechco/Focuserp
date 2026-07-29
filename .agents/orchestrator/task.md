# Task Checklist — Focuserp Refactoring

## Milestone 0: E2E Testing Suite (Dual Track)
- [ ] Define E2E Test Infra & Test Runner (`TEST_INFRA.md`)
- [ ] Implement Tier 1 Feature Coverage Tests
- [ ] Implement Tier 2 Boundary & Corner Case Tests
- [ ] Implement Tier 3 Cross-Feature Tests
- [ ] Implement Tier 4 Real-World Application Scenario Tests
- [ ] Publish `TEST_READY.md`

## Milestone 1: Database DDL 3NF, RLS & Keycloak Auth
- [ ] Create PostgreSQL 3NF DDL (`supabase_schema.sql`) for `tenants`, `users`, `clientes`, `contas_receber`, `contas_pagar`, `projetos`, `audit_logs`
- [ ] Implement RLS policies on all tables filtering by `auth.jwt() ->> 'tenant_id'`
- [ ] Verify Keycloak JWT verification and secret configuration
- [ ] Test DDL execution and tenant isolation

## Milestone 2: Zod Schemas & Supabase SDK Services
- [ ] Define Zod validation schemas in `src/schemas/` (`tenant.ts`, `user.ts`, `cliente.ts`, `financeiro.ts`, `projeto.ts`, `audit.ts`)
- [ ] Create Supabase SDK client wrapper and services in `src/services/`
- [ ] Add error handling and response parsing

## Milestone 3: Frontend Refactoring (React Query)
- [ ] Create React Query hooks in `src/hooks/` for each feature domain
- [ ] Refactor Clientes module (replace `useLocalStorageState`)
- [ ] Refactor Financeiro module (contas a receber & pagar)
- [ ] Refactor Projetos module
- [ ] Refactor RH / Users module
- [ ] Retain UI/UX styling, Radix UI, Lucide Icons, Sonner toast notifications

## Milestone 4: CI/CD Pipeline & Final Verification
- [ ] Verify TypeScript static type check (`npx tsc --noEmit`)
- [ ] Verify production build (`npm run build`)
- [ ] Check `.github/workflows/ci-cd.yml` configuration
- [ ] Verify Lovable rule compliance (no force push / rebase)
- [ ] Submit Victory Claim Report to Sentinel
