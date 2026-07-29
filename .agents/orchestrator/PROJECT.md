# Project: Focuserp Architecture & Refactoring Plan

## Overview
Full refactoring of Focuserp from Document Store (JSONB) / useLocalStorageState to a Relational Supabase (PostgreSQL 3NF) architecture with multi-tenant RLS, Keycloak Auth, strongly typed Zod Schemas, TanStack React Query services, and verified CI/CD.

## Architecture
- **Database**: PostgreSQL 3NF on Supabase with Row Level Security (RLS) policies scoped by `tenant_id`.
- **Auth**: Keycloak JWT validation & Supabase Auth integration.
- **Validation**: Zod Schemas in `src/schemas/`.
- **Services**: Supabase JS SDK clients in `src/services/`.
- **Frontend State & Data Fetching**: TanStack React Query (`useQuery`, `useMutation`) replacing `useLocalStorageState`.
- **UI/UX**: Radix UI, Lucide Icons, TailwindCSS, Sonner toasts.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | E2E Testing Track | Requirement-driven opaque-box test suite (`TEST_INFRA.md`) | none | DONE |
| 1 | Database & Auth | DDL 3NF (`supabase_schema.sql`), RLS, Keycloak Auth, suppliers table, net balance formulas, unique constraints, updated_at triggers | M0 | DONE |
| 2 | Schemas & Services | Zod schemas (`src/schemas/`), Supabase SDK (`src/services/`) | M1 | IN_PROGRESS |
| 3 | Frontend Refactoring | React Query hooks replacing useLocalStorageState (Clientes, Financeiro, Projetos, RH) | M2 | PLANNED |
| 4 | QA & Build Verification | static typing (`tsc`), `npm run build`, CI/CD pipeline | M3 | PLANNED |

## Interface Contracts
### Keycloak Auth ↔ Supabase Auth
- JWT claims containing `tenant_id`, `sub`, `email`, `role`.
- RLS policy helper `get_auth_tenant_id()`.

### Supabase SDK Services ↔ React Query Hooks
- Type-safe Zod parsed inputs/outputs.
- Query keys scoped per tenant and feature entity.

## Code Layout
- `src/schemas/` — Zod schemas for all domain entities (users, tenants, clientes, contas_receber, contas_pagar, projetos, contratos, colaboradores, fornecedores, cobrancas, audit_logs).
- `src/services/` — Supabase SDK service methods for CRUD operations.
- `src/hooks/` — React Query hooks wrapping Supabase services.
- `src/features/` & `src/components/` — UI components consuming React Query hooks.
- `supabase_schema.sql` — PostgreSQL DDL 3NF and RLS policies.
