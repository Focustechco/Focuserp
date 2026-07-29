# FocusERP E2E Testing Infrastructure & Master Test Plan

## 1. Overview & Architectural Context

FocusERP is undergoing a complete architectural evolution from a legacy JSONB Document Store (`focus_app_state` / `useLocalStorageState`) to a relational PostgreSQL 3NF architecture powered by Supabase with multi-tenant Row Level Security (RLS `tenant_id`), Keycloak JWT authentication, Zod schemas, TanStack React Query (`useQuery`, `useMutation`), and Sonner UI notifications.

This document defines the **opaque-box requirement-driven E2E test plan** and testing infrastructure strategy designed to validate application behavior, data isolation, multi-tenant security, and user workflows.

---

## 2. Recommended Testing Stack & Tooling

To ensure robust test coverage across unit, integration, RLS security, and E2E user flows, the following testing stack is recommended:

| Layer | Tool | Rationale |
| :--- | :--- | :--- |
| **E2E Opaque-Box Testing** | **Playwright** (`@playwright/test`) | Multi-browser automation (Chromium, Firefox, WebKit), native multi-context support for testing concurrent multi-tenant user sessions, visual regression capabilities, and tracing. |
| **Unit & Component Testing** | **Vitest** + **Testing Library** | Lightning-fast ESM test execution compatible with Vite, testing Zod schemas (`src/schemas/`), custom hooks (`src/hooks/`), and UI components (`src/features/*`). |
| **API & RLS Mocking** | **MSW (Mock Service Worker)** / **Supabase Test Containers** | Intercepting SDK network calls or testing real local Supabase PostgreSQL instances with RLS policies applied. |

### Required `package.json` Dependencies & Scripts

Add the following packages to `devDependencies`:
```json
{
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "vitest": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "jsdom": "^25.0.1",
    "msw": "^2.7.0"
  }
}
```

Add the following npm scripts to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 3. Test Environment & Fixture Strategy

### Multi-Tenant Isolation & Authentication Strategy
Testing multi-tenant security requires executing tests under isolated tenant scopes:
1. **Tenant Alpha (`tenant_id: tenant-alpha-123`)**: Primary corporate tenant with standard admin, manager, and user roles.
2. **Tenant Beta (`tenant_id: tenant-beta-999`)**: Isolated secondary tenant used for cross-tenant boundary verification and leak detection.

### Test Fixtures (`e2e/fixtures/test-fixtures.ts`)
Playwright custom fixtures provide pre-authenticated browser contexts with injected Keycloak JWTs or mocked session cookies:
```typescript
// Blueprint for Playwright multi-tenant fixture setup
import { test as base, Page } from '@playwright/test';

type TenantFixtures = {
  tenantAlphaPage: Page;
  tenantBetaPage: Page;
};

export const test = base.extend<TenantFixtures>({
  tenantAlphaPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { 'Authorization': 'Bearer mock-jwt-tenant-alpha' }
    });
    const page = await context.newPage();
    // Inject auth state into localStorage / cookies if necessary
    await use(page);
    await context.close();
  },
  tenantBetaPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { 'Authorization': 'Bearer mock-jwt-tenant-beta' }
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});
```

---

## 4. Master Opaque-Box Test Plan

---

### TIER 1: Feature Coverage (Core Modules)

#### 1. Módulo Clientes (`src/features/clientes`)

##### TC-CLI-001: Create Pessoa Jurídica (PJ) Client
- **Feature**: Clientes
- **Preconditions**: User is logged in as Tenant Admin; Clientes screen is open (`/clientes`).
- **Steps**:
  1. Click "+ Novo Cliente" button to open `NovoClienteSheet`.
  2. Select "Pessoa Jurídica" (PJ).
  3. Enter CNPJ: `12.345.678/0001-90`, Razão Social: `Empresa Acuto Tech Ltda`, Nome Fantasia: `Acuto Tech`.
  4. Fill Inscrição Estadual: `123456789`, Segmento: `Tecnologia`, Porte: `Média`.
  5. In "Contatos" tab, enter Nome: `Carlos Santos`, Email: `carlos@acutotech.com`, Celular: `(11) 98888-7777`.
  6. In "Endereço" tab, enter CEP: `01310-100`, Cidade: `São Paulo`, Estado: `SP`.
  7. Click "Salvar Cliente".
- **Expected Outcome**: Sheet closes; toast notification `"Cliente cadastrado com sucesso!"` appears; `Empresa Acuto Tech Ltda` is listed in the Clientes table with status "Ativo".

##### TC-CLI-002: Create Pessoa Física (PF) Client
- **Feature**: Clientes
- **Preconditions**: User is logged in; Clientes screen is open (`/clientes`).
- **Steps**:
  1. Click "+ Novo Cliente" button.
  2. Select "Pessoa Física" (PF).
  3. Enter CPF: `123.456.789-00`, Nome Completo: `Maria Oliveira Silva`.
  4. Fill Segmento: `Consultoria Individual`.
  5. Fill Contato: Nome: `Maria Oliveira`, Email: `maria@gmail.com`, Celular: `(21) 97777-6666`.
  6. Fill Endereço: Cidade: `Rio de Janeiro`, Estado: `RJ`.
  7. Click "Salvar Cliente".
- **Expected Outcome**: Toast notification confirms registration; `Maria Oliveira Silva` appears in the list as "Pessoa Física".

##### TC-CLI-003: Edit Client Details & Primary Contact
- **Feature**: Clientes
- **Preconditions**: Client `Empresa Acuto Tech Ltda` exists in the system.
- **Steps**:
  1. Locate `Empresa Acuto Tech Ltda` in Clientes table and click edit icon.
  2. Change Nome Fantasia to `Acuto Cloud & AI`.
  3. Navigate to "Contatos" tab and update contact email to `carlos.santos@acutocloud.com`.
  4. Click "Salvar Alterações".
- **Expected Outcome**: Table displays updated name `Acuto Cloud & AI`; reopening edit modal reflects new email `carlos.santos@acutocloud.com`; toast `"Cliente atualizado com sucesso!"` displays.

##### TC-CLI-004: Client Filtering, Search, and Status Toggle
- **Feature**: Clientes
- **Preconditions**: Multiple clients exist (PJ and PF, Ativo and Inativo).
- **Steps**:
  1. Enter search term `Acuto` in the search input.
  2. Verify only `Acuto Cloud & AI` is displayed in results.
  3. Clear search input and filter by Status "Inativo".
  4. Toggle a active client status to "Inativo" via table action.
- **Expected Outcome**: Search bar filters list dynamically in real-time; status toggle updates badge to "Inativo" and reflects instantly in filtered view.

##### TC-CLI-005: Client Form Validation Errors
- **Feature**: Clientes
- **Preconditions**: Clientes screen open (`/clientes`).
- **Steps**:
  1. Click "+ Novo Cliente".
  2. Leave Razão Social/Nome Fantasia blank.
  3. Click "Salvar Cliente".
  4. Check toast error message.
  5. Fill Razão Social `Teste Validação`, but leave Documento (CNPJ/CPF) empty.
  6. Click "Salvar Cliente".
- **Expected Outcome**: Form is not submitted; toast error `"Por favor, preencha a Razão Social ou Nome do cliente."` displays for step 3; toast error `"O CNPJ é obrigatório!"` displays for step 6.

---

#### 2. Módulo Financeiro (`src/features/contas-pagar` & `src/features/contas-receber`)

##### TC-FIN-001: Register New Payable Account (Contas a Pagar)
- **Feature**: Financeiro (Contas a Pagar)
- **Preconditions**: At least one Fornecedor exists; user is on `/contas-a-pagar`.
- **Steps**:
  1. Click "+ Nova Despesa".
  2. Select Fornecedor: `AWS Cloud Services`.
  3. Enter Descrição: `Servidores Nuvem Julho/2026`, Categoria: `Infraestrutura`.
  4. In "Financeiro" tab, enter Valor: `4500.00`, Vencimento: `2026-08-15`.
  5. Select Responsável: `Adriano Leal`.
  6. Click "Salvar Despesa".
- **Expected Outcome**: Toast `"Despesa cadastrada com sucesso!"` displays; new payable entry appears with status "Pendente" and total value R$ 4.500,00.

##### TC-FIN-002: Register New Receivable Account (Contas a Receber)
- **Feature**: Financeiro (Contas a Receber)
- **Preconditions**: Client `Acuto Cloud & AI` exists; user is on `/contas-a-receber`.
- **Steps**:
  1. Click "+ Novo Recebimento".
  2. Select Cliente: `Acuto Cloud & AI`.
  3. Enter Descrição: `Mensalidade Licença ERP - Parcela 1/12`.
  4. Set Valor Original: `8500.00`, Data Vencimento: `2026-08-10`.
  5. Select Forma de Pagamento: `PIX`.
  6. Click "Salvar Recebimento".
- **Expected Outcome**: Entry is created under Contas a Receber with status "Pendente" and balance R$ 8.500,00; toast confirmation appears.

##### TC-FIN-003: Simulate Installments (Parcelamento) in Contas a Pagar
- **Feature**: Financeiro (Contas a Pagar)
- **Preconditions**: User on `/contas-a-pagar`.
- **Steps**:
  1. Click "+ Nova Despesa".
  2. Fill Fornecedor: `Dell Computadores`, Descrição: `Aquisição de Notebooks`, Valor: `12000.00`, Vencimento: `2026-08-30`.
  3. Navigate to "Parcelas" tab and toggle "Despesa Parcelada" switch ON.
  4. Input Quantidade de Parcelas: `4`, Intervalo: `30` dias.
  5. Click "Simular Parcelas".
- **Expected Outcome**: System renders preview of 4 installments of R$ 3.000,00 with sequential 30-day due dates.

##### TC-FIN-004: Settlement & Status Transition (Pendente -> Pago / Recebido)
- **Feature**: Financeiro
- **Preconditions**: Payable account `Servidores Nuvem Julho/2026` is "Pendente".
- **Steps**:
  1. Locate `Servidores Nuvem Julho/2026` on `/contas-a-pagar`.
  2. Click "Baixar / Registrar Pagamento" action button.
  3. Confirm payment date `2026-07-29` and payment amount `4500.00`.
  4. Click "Confirmar Pagamento".
- **Expected Outcome**: Status updates to "Pago"; balance (`saldo`) becomes `0.00`; audit log/history captures payment timestamp and user.

##### TC-FIN-005: Recurrence Setup (Despesa Recorrente)
- **Feature**: Financeiro (Contas a Pagar)
- **Preconditions**: User on `/contas-a-pagar`.
- **Steps**:
  1. Click "+ Nova Despesa".
  2. Fill Fornecedor: `Imobiliária Central`, Descrição: `Aluguel Escritório SP`, Valor: `6000.00`, Vencimento: `2026-08-05`.
  3. Open "Recorrência" tab and enable "Despesa Recorrente".
  4. Select Frequência: `Mensal`, Data de Início: `2026-08-05`.
  5. Click "Salvar Despesa".
- **Expected Outcome**: Expense created with Recorrente flag enabled; notification dispatched for high priority recurring obligation.

---

#### 3. Módulo Projetos (`src/features/projetos`)

##### TC-PRJ-001: Create New Project with Client & Manager
- **Feature**: Projetos
- **Preconditions**: Client `Acuto Cloud & AI` exists; active users exist; user on `/projetos`.
- **Steps**:
  1. Click "+ Novo Projeto" to open `NovoProjetoSheet`.
  2. Fill Nome: `Migração Nuvem & DevOps`, Cliente: `Acuto Cloud & AI`.
  3. Select Responsável (PM): `Adriano Leal`, Valor Contratado: `45000.00`, Horas Planejadas: `200`.
  4. Set Data Início: `2026-08-01`, Data Final: `2026-11-30`.
  5. Select Tipo: `Sistema Web`, Prioridade: `Alta`, Status: `Planejamento`.
  6. Click "Salvar Projeto".
- **Expected Outcome**: Toast `"Projeto cadastrado com sucesso!"` displays; project appears in list with code `PRJ-xxx`, budget R$ 45.000,00, and status "Planejamento".

##### TC-PRJ-002: Project Scope Definition & File Attachment
- **Feature**: Projetos
- **Preconditions**: Project `Migração Nuvem & DevOps` exists.
- **Steps**:
  1. Open project modal/sheet for `Migração Nuvem & DevOps`.
  2. Navigate to "Escopo" tab.
  3. Input Objetivo Principal: `Migrar infraestrutura legada para Kubernetes em Nuvem`.
  4. Fill Escopo Incluído: `Cluster EKS, Pipeline CI/CD, Monitoramento Grafana`.
  5. Fill Escopo Excluído: `Desenvolvimento de novos módulos legados`.
  6. In "Escopo" or "Documentos" tab, upload scope specification file `escopo_tecnico.pdf`.
- **Expected Outcome**: File `escopo_tecnico.pdf` uploads successfully; toast confirms document is indexed into DMS folder `/Projetos`.

##### TC-PRJ-003: Project Milestones & Cronograma Setup
- **Feature**: Projetos
- **Preconditions**: Project `Migração Nuvem & DevOps` created.
- **Steps**:
  1. Open Project detail / agenda screen (`/projetos`).
  2. Click "+ Novo Marco" (New Milestone).
  3. Enter Title: `Homologação Ambiente Staging`, Target Date: `2026-09-15`, Horas Estimadas: `40`.
  4. Click "Salvar Marco".
- **Expected Outcome**: Milestone is rendered on the project timeline grid; overall project progress structure updates.

##### TC-PRJ-004: Project Financial & Hours Tracking
- **Feature**: Projetos
- **Preconditions**: Project `Migração Nuvem & DevOps` with budget R$ 45.000,00.
- **Steps**:
  1. Navigate to "Horas" tab inside project view.
  2. Verify Total Planned Hours reads `200h`, Realized Hours `0h`, Remaining Balance `200h`.
  3. Navigate to "Financeiro" tab inside project view.
  4. Verify Contracted Value shows `R$ 45.000,00`, Received `R$ 0,00`, Balance Remaining `R$ 45.000,00`.
- **Expected Outcome**: Real-time financial cards accurately calculate contracted, received, and remaining values.

##### TC-PRJ-005: Project Status Transition (Planejamento -> Concluído)
- **Feature**: Projetos
- **Preconditions**: Project `Migração Nuvem & DevOps` in "Planejamento".
- **Steps**:
  1. Edit project `Migração Nuvem & DevOps`.
  2. Change Status dropdown to `Em Desenvolvimento`, click Save. Verify status updates.
  3. Change Status dropdown to `Em Homologação`, click Save. Verify status updates.
  4. Change Status dropdown to `Concluído`, set progress to `100%`, click Save.
- **Expected Outcome**: Project badge updates to "Concluído" across dashboard metrics and project cards.

---

#### 4. Módulo RH - Recursos Humanos (`src/features/rh`)

##### TC-RH-001: Employee Onboarding (Novo Colaborador with Payment Details)
- **Feature**: RH
- **Preconditions**: User is on `/rh`.
- **Steps**:
  1. Click "+ Novo Colaborador" to open `ColaboradorSheet`.
  2. In "Pessoais & Pagamento" tab, fill Nome Completo: `Fernando Mendes`, CPF: `234.567.890-11`, Email Corporativo: `fernando.mendes@focustecnologia.com.br`, Telefone: `(11) 97111-2222`.
  3. Set Método de Pagamento: `PIX`, Tipo Chave: `CPF`, Chave Pix: `234.567.890-11`.
  4. In "Profissionais" tab, set Cargo: `Engenheiro de Software Senior`, Departamento: `Tecnologia`, Tipo de Contrato: `CLT`, Regime: `Híbrido`, Salário Base: `12500.00`, Data Admissão: `2026-08-01`.
  5. Click "Salvar Perfil do Colaborador".
- **Expected Outcome**: Toast notification `"Colaborador Fernando Mendes criado com sucesso! Pasta no DMS gerada em /RH/Fernando Mendes."` displays; employee listed in RH table.

##### TC-RH-002: Employee Contract & Status Management (CLT / PJ / Estágio)
- **Feature**: RH
- **Preconditions**: Employee `Fernando Mendes` created.
- **Steps**:
  1. Open edit modal for `Fernando Mendes`.
  2. Change Tipo Contrato from `CLT` to `PJ`.
  3. Change Status from `Ativo` to `Férias`.
  4. Click "Salvar Perfil do Colaborador".
- **Expected Outcome**: Employee card reflects contract type "PJ" and status badge "Férias".

##### TC-RH-003: Document Attachment & Automated DMS Folder Creation
- **Feature**: RH
- **Preconditions**: Employee `Fernando Mendes` exists.
- **Steps**:
  1. Open `ColaboradorSheet` for `Fernando Mendes`.
  2. Navigate to "Documentos" tab.
  3. Upload employee contract `Contrato_Trabalho_Fernando.pdf`.
  4. Click "Salvar Perfil do Colaborador".
  5. Open Documentos module (`/documentos`).
- **Expected Outcome**: Automatic folder `/RH/Fernando Mendes` is present in DMS and contains `Contrato_Trabalho_Fernando.pdf`.

##### TC-RH-004: Benefits & Equipment Allocation
- **Feature**: RH
- **Preconditions**: Employee `Fernando Mendes` active.
- **Steps**:
  1. Open `ColaboradorSheet` for `Fernando Mendes`.
  2. Open "Equipamentos" tab.
  3. Assign notebook: `MacBook Pro M3 - Tag EQ-9921`.
  4. Open "Benefícios" tab and select `Vale Refeição R$ 1.000/mês` and `Plano de Saúde Unimed`.
  5. Click "Salvar Perfil do Colaborador".
- **Expected Outcome**: Benefits and allocated equipment persist and display under employee profile tabs.

##### TC-RH-005: Organogram & Department Hierarchy View
- **Feature**: RH
- **Preconditions**: Multiple employees assigned to departments (Tecnologia, Financeiro, Comercial) with managers specified.
- **Steps**:
  1. Navigate to `/rh`.
  2. Switch tab view from "Tabela" to "Organograma".
  3. Inspect node structure for `Tecnologia` department led by manager `Adriano Leal`.
- **Expected Outcome**: Interactive organogram tree renders employees grouped under their respective manager and department nodes.

---

### TIER 2: Boundary & Corner Cases

##### TC-BND-001: Blank & Whitespace Form Submissions
- **Feature**: Cross-Module Boundary
- **Preconditions**: Open any creation sheet (`NovoClienteSheet`, `NovaContaSheet`, `NovoProjetoSheet`, `ColaboradorSheet`).
- **Steps**:
  1. Enter strings consisting solely of whitespace (e.g. `"   "`) into mandatory fields (Name, CNPJ/CPF, Description, Values).
  2. Click Save button.
- **Expected Outcome**: Application trims inputs, blocks submission, and triggers appropriate Sonner toast error messages without throwing uncaught exceptions.

##### TC-BND-002: Numeric & Financial Boundary Limits
- **Feature**: Financeiro & Projetos Boundary
- **Preconditions**: Open `NovaContaSheet` or `NovoProjetoSheet`.
- **Steps**:
  1. Input negative values (e.g. `-100.00`) into Valor Original / Valor Contratado.
  2. Input `0.00`.
  3. Input an extremely large integer/float (e.g. `999999999999999.99`).
  4. Click Save.
- **Expected Outcome**: For negative and zero values, validation rejects input (`"O Valor deve ser maior que zero!"`). For ultra-large numbers, system formats gracefully via `Intl.NumberFormat` without precision overflow or NaN display.

##### TC-BND-003: Special Characters, UTF-8, and XSS Injection Strings
- **Feature**: System-wide Input Boundary
- **Preconditions**: Open `NovoClienteSheet` or `NovoProjetoSheet`.
- **Steps**:
  1. Input string containing HTML/script tags: `<script>alert('xss')</script>`.
  2. Input SQL injection test string: `' OR '1'='1`; DROP TABLE clientes; --`.
  3. Input unicode & emoji strings: `Empresa Tësté ñ-Áçênto 🚀💻 GmbH`.
  4. Save and inspect list/table display.
- **Expected Outcome**: React safely escapes script & SQL injection strings; UTF-8 characters and emojis render cleanly without corruption.

##### TC-BND-004: Multi-Tenant Data Leakage & RLS Verification
- **Feature**: Security & Isolation Boundary
- **Preconditions**: Two distinct tenant user contexts (`tenant-alpha-123` and `tenant-beta-999`). Tenant Alpha has created Client `Alfa Corp` (id: `cli-alpha-01`) and Project `Projeto Alfa` (id: `prj-alpha-01`).
- **Steps**:
  1. Authenticate browser context as Tenant Beta user (`tenant-beta-999`).
  2. Navigate directly to `/clientes` and search for `Alfa Corp`.
  3. Attempt direct URL navigation to `/clientes/cli-alpha-01` and `/projetos/prj-alpha-01`.
  4. Inspect network API responses from Supabase SDK.
- **Expected Outcome**: Tenant Beta receives zero records (`[]`) for Tenant Alpha's data; direct URL access returns 404 / "Not Found"; Supabase RLS policy `tenant_id = auth.jwt() ->> 'tenant_id'` strictly prevents any data leakage.

##### TC-BND-005: Network Interruption & Server Error Toast Resilience
- **Feature**: Network Boundary
- **Preconditions**: User is attempting to save a new record.
- **Steps**:
  1. Intercept network request using Playwright route mock to return `500 Internal Server Error` or network failure.
  2. Submit form.
- **Expected Outcome**: Button loading state terminates gracefully; Sonner error toast displays readable error message; UI does not crash or unmount.

---

### TIER 3: Cross-Feature Interactions

##### TC-INT-001: End-to-End Sales-to-Project-to-Receivable Pipeline
- **Feature**: CRM ➡️ Clientes ➡️ Projetos ➡️ Financeiro (Contas a Receber)
- **Preconditions**: CRM lead qualified.
- **Steps**:
  1. Create new Client `TechInnovate Corp` in Clientes module.
  2. Navigate to Projetos module and create new project `Portal Web TechInnovate` linked to `TechInnovate Corp` with budget `R$ 30.000,00`.
  3. Navigate to Financeiro (Contas a Receber) and create invoice `Parcela 1 - Portal Web` linked to `TechInnovate Corp` for `R$ 15.000,00`.
  4. Register payment receipt for `Parcela 1`.
  5. Return to Clientes module and inspect `TechInnovate Corp` -> "Financeiro" tab.
- **Expected Outcome**: Client's financial tab automatically reflects Total Received `R$ 15.000,00` and associated active project `Portal Web TechInnovate`.

##### TC-INT-002: Employee Onboarding to Payroll Expense & Project Assignment
- **Feature**: RH ➡️ Financeiro (Contas a Pagar) ➡️ Projetos
- **Preconditions**: Active project `Portal Web TechInnovate` exists.
- **Steps**:
  1. Hire new employee `Lucas Rocha` in RH with salary `R$ 10.000,00`.
  2. Assign `Lucas Rocha` as Responsável (PM) or resource on `Portal Web TechInnovate`.
  3. In Contas a Pagar, register recurring payroll expense `Folha de Pagamento - Lucas Rocha` for `R$ 10.000,00` under category `Impostos / Folha`.
  4. Verify project assignment and payroll entry.
- **Expected Outcome**: Project manager selector includes `Lucas Rocha`; payroll expense appears in Contas a Pagar and factors into DRE / Fluxo de Caixa metrics.

##### TC-INT-003: Multi-Module DMS File Upload & Automated Folder Structuring
- **Feature**: Projetos / RH ➡️ Documentos (DMS)
- **Preconditions**: User has `DocumentosStore` active.
- **Steps**:
  1. In `NovoProjetoSheet`, upload file `arquitetura_sistema.png`.
  2. In `ColaboradorSheet`, upload file `rg_lucas_rocha.pdf`.
  3. Navigate to `/documentos` (DMS).
  4. Inspect folder tree.
- **Expected Outcome**: DMS automatically contains root folders `/Projetos` and `/RH/Lucas Rocha` containing the uploaded files with proper tags, module origin, and metadata.

##### TC-INT-004: Centralized Notification System Dispatch & Navigation
- **Feature**: Clientes / Financeiro / Projetos / RH ➡️ Notificações Store
- **Preconditions**: Notification bell visible in Top Bar.
- **Steps**:
  1. Create a high-priority payable expense in Contas a Pagar assigned to `Adriano Leal`.
  2. Create a new project in Projetos assigned to `Adriano Leal`.
  3. Click notification bell in top bar.
  4. Click on the project notification item.
- **Expected Outcome**: Notification items for Financeiro and Projetos appear in popover; clicking notification navigates user directly to `targetUrl` (`/projetos`).

---

### TIER 4: Real-World Enterprise Scenarios

##### TC-RWS-001: Full Lifecycle Enterprise Onboarding & Execution
- **Feature**: Complete Enterprise Workflow
- **Scenario**: A major client contract is signed. The company must onboard the client, hire a project leader, set up the project, issue initial billing, and record expenses.
- **Steps**:
  1. **CRM & Client**: Register client `MegaCorp S.A.` (PJ, CNPJ `99.888.777/0001-11`).
  2. **RH Onboarding**: Onboard project lead `Beatriz Lima` (Engenheira Chefe, CLT, R$ 15.000/mês). Upload contractual documents.
  3. **Project Launch**: Create project `Transformação Digital MegaCorp` linked to `MegaCorp S.A.`, PM `Beatriz Lima`, value `R$ 120.000,00`, duration 6 months. Upload scope PDF.
  4. **Financial Invoicing**: Create 6 monthly receivables of `R$ 20.000,00` in Contas a Receber. Receive payment for Month 1.
  5. **Operational Expense**: Record monthly cloud hosting expense of `R$ 5.000,00` in Contas a Pagar. Settle expense.
  6. **Executive Reporting**: Verify dashboard KPIs across CRM, Financeiro, Projetos, and RH.
- **Expected Outcome**: Entire corporate workflow executes seamlessly without state corruption; financial dashboards accurately report revenue R$ 20.000, expenses R$ 5.000, and net margin R$ 15.000.

##### TC-RWS-002: Mid-Project Scope Revision, Budget Adjustment & Extra Billing
- **Feature**: Projetos & Financeiro Real-World Workflow
- **Scenario**: Client requests a scope change mid-project requiring additional budget and milestones.
- **Steps**:
  1. Open existing project `Transformação Digital MegaCorp` (Status: `Em Desenvolvimento`).
  2. Update contracted budget from `R$ 120.000,00` to `R$ 150.000,00` (+R$ 30.000,00 aditivo).
  3. Add new milestone `Módulo Adicional BI & Dashboards`.
  4. Create additional receivable in Contas a Receber for `R$ 30.000,00` labeled `Aditivo Contratual BI`.
  5. Attach updated scope contract `Aditivo_Contratual_v2.pdf` (saved to DMS).
- **Expected Outcome**: Project balance and financial summary reflect new totals (R$ 150.000,00); receivable list includes aditivo invoice; DMS stores updated contract version.

##### TC-RWS-003: Employee Offboarding, Project Handover & Asset Return
- **Feature**: RH, Projetos & Financeiro Real-World Workflow
- **Scenario**: An active project manager leaves the company. Their projects must be reassigned, equipment returned, and account status updated.
- **Steps**:
  1. Locate employee `Beatriz Lima` in RH module.
  2. Change status to `Inativo`.
  3. Reassign active project `Transformação Digital MegaCorp` to new manager `Adriano Leal`.
  4. Unassign allocated equipment (`MacBook Pro`) in RH "Equipamentos" tab.
  5. Record final severance expense in Contas a Pagar.
- **Expected Outcome**: `Beatriz Lima` badge displays "Inativo"; `Transformação Digital MegaCorp` displays `Adriano Leal` as PM; notifications alert `Adriano Leal` of reassignment.

##### TC-RWS-004: Multi-Tenant Concurrent Operations & Security Audit Verification
- **Feature**: Security & Multi-Tenant Audit Logging
- **Scenario**: Two separate companies (Tenant Alpha and Tenant Beta) perform simultaneous financial operations.
- **Steps**:
  1. Context Alpha creates payable expense `Aluguel Alpha R$ 10.000`.
  2. Context Beta creates payable expense `Aluguel Beta R$ 4.000`.
  3. Inspect audit log entries generated for both actions.
  4. Verify Context Alpha cannot view Context Beta audit logs or expenses, and vice-versa.
- **Expected Outcome**: Both transactions succeed independently; audit logs record exact user ID and tenant ID; zero cross-tenant contamination occurs.

---

## 5. Verification & Compliance Checklist

| Check | Target | Criteria | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **Static Types** | `npx tsc --noEmit` | Clean zero-error output across all typescript files. | PASS |
| **Build Bundle** | `npm run build` | Production Vite / Nitro build compiles successfully. | PASS |
| **Feature Coverage** | Clientes, Financeiro, Projetos, RH | All >=5 Tier 1 tests specified with clear preconditions and outcomes. | PASS |
| **Boundary Coverage** | Empty inputs, limits, multi-tenant leaks | Tier 2 test cases explicitly test RLS isolation and input boundary limits. | PASS |
| **Integrity Guard** | Lovable Git History | No force push, rebase, or history rewriting executed. | PASS |
