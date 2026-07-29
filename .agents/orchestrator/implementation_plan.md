# Implementation Plan — Focuserp Architecture Refactoring

## Architecture Overview
Transitioning Focuserp from a monolith document-store (where state is stored in JSONB or `useLocalStorageState`) to a 3NF relational database on Supabase with React Query handling state synchronization.

## Detailed Steps

### Step 1: E2E Testing Suite Setup
- Build test harness to execute end-to-end user workflows.
- Create test files covering all 4 tiers of acceptance criteria.
- Produce `TEST_READY.md`.

### Step 2: Database Schema & Row Level Security (RLS)
- Write DDL in `supabase_schema.sql` covering:
  - `tenants` (id, name, created_at)
  - `users` (id, tenant_id, email, role, name, created_at)
  - `clientes` (id, tenant_id, nome, email, telefone, status, created_at)
  - `contas_receber` (id, tenant_id, descricao, valor, status, data_vencimento, cliente_id, created_at)
  - `contas_pagar` (id, tenant_id, descricao, valor, status, data_vencimento, fornecedor, created_at)
  - `projetos` (id, tenant_id, nome, descricao, status, orcamento, created_at)
  - `audit_logs` (id, tenant_id, user_id, action, entity, details, created_at)
- Enable RLS on all tables with tenant isolation policies.
- Configure Keycloak JWT integration.

### Step 3: Type Validation & Data Access Layer
- Create `src/schemas/` containing Zod schemas for entity creation, update, and query filters.
- Create `src/services/` containing Supabase SDK CRUD helper methods for each entity.

### Step 4: Frontend State Migration (React Query)
- Replace `useLocalStorageState` hooks across features:
  - `src/features/clientes/` -> `useClientes`, `useCreateCliente`, etc.
  - `src/features/financeiro/` -> `useContasReceber`, `useContasPagar`, etc.
  - `src/features/projetos/` -> `useProyectos`, etc.
  - `src/features/rh/` -> `useUsers`, etc.
- Integrate TanStack QueryClient provider at top level.
- Ensure toast notifications via Sonner trigger on mutation success/failure.

### Step 5: Verification & Quality Assurance
- Run `npx tsc --noEmit` to ensure complete type safety.
- Run `npm run build` for production bundle generation.
- Check CI/CD workflow `.github/workflows/ci-cd.yml`.
