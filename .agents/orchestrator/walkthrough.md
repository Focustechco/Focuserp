# System Walkthrough & Verification Guide

## Purpose
This document tracks the step-by-step verification of each refactored component in Focuserp.

## Verification Checklist

### 1. Database & Security
- [ ] Verify DDL syntax and relational constraints in `supabase_schema.sql`
- [ ] Test RLS policies for tenant isolation with synthetic tenant JWTs
- [ ] Confirm Keycloak JWT validation setup

### 2. Validation & Services
- [ ] Check Zod schemas in `src/schemas/` against TypeScript types
- [ ] Verify Supabase SDK methods in `src/services/` handle query filtering and errors gracefully

### 3. Frontend & UI/UX
- [ ] Verify `useLocalStorageState` is removed from features
- [ ] Confirm `@tanstack/react-query` hooks handle loading, error, and cached states seamlessly
- [ ] Check visual components (Radix UI, Lucide Icons, TailwindCSS) match 100% of original presentation
- [ ] Confirm Sonner toasts trigger on actions

### 4. Build & CI/CD
- [ ] Run `npx tsc --noEmit` — 0 errors
- [ ] Run `npm run build` — successful bundle
- [ ] Validate `.github/workflows/ci-cd.yml` workflow syntax
