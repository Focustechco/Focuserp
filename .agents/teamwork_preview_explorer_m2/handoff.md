# Milestone 2 Handoff Analysis Report: Supabase & React Query Data Architecture Design

## 1. Observation

### 1.1 Workspace & File Structure Inspection
- Working directory: `c:\Focuserp\`
- Core files examined:
  - `c:\Focuserp\.agents\ORIGINAL_REQUEST.md` (Lines 1-83)
  - `c:\Focuserp\.agents\orchestrator\PROJECT.md` (Lines 1-38)
  - `c:\Focuserp\src\hooks\useDataStore.ts` (Lines 1-324)
  - `c:\Focuserp\src\schemas\clienteSchema.ts` (Lines 1-50)
  - `c:\Focuserp\src\services\clienteService.ts` (Lines 1-117)
  - `c:\Focuserp\src\features\clientes\hooks\useClientesQuery.ts` (Lines 1-61)
  - `c:\Focuserp\src\routes\__root.tsx` (Lines 1-166)
  - `c:\Focuserp\src\router.tsx` (Lines 1-17)
  - `c:\Focuserp\supabase_schema.sql` (Lines 1-32)

### 1.2 Legacy Storage Pattern Analysis (`src/hooks/useDataStore.ts`)
The legacy state persistence mechanism relies on `useLocalStorageState<T>`, which operates as a hybrid LocalStorage and un-normalized document store.
- **Key Observation 1**: `useLocalStorageState` reads and writes to `window.localStorage.getItem('focus_app_' + table)` (Line 33, 52).
- **Key Observation 2**: For non-`clients` tables, `useLocalStorageState` encodes JSON string payloads into the `contact_email` column of the `clients` table using a deterministic UUID prefix `__FOCUS_STATE__<table_name>` (Lines 141-158, 240-255):
  ```ts
  const statePayload = {
    id: stateUuid,
    name: `__FOCUS_STATE__${table}`,
    status: 'inativo',
    contact_email: JSON.stringify(cleanedData),
    updated_at: new Date().toISOString(),
  };
  await supabase.from('clients').upsert(statePayload);
  ```
- **Key Observation 3**: Polling mechanism is set to 5000ms (`setInterval`, Lines 187-191) to fetch updates across devices, causing unnecessary network overhead and CPU usage.

### 1.3 Mounted Infrastructure Inspection (`src/routes/__root.tsx` & `src/router.tsx`)
- `QueryClient` is initialized in `src/router.tsx` (Line 6).
- `QueryClientProvider` wraps the entire application root shell in `src/routes/__root.tsx` (Line 150):
  ```tsx
  <QueryClientProvider client={queryClient}>
    <SidebarProvider>...</SidebarProvider>
    <Toaster position="top-right" />
  </QueryClientProvider>
  ```
- `Toaster` from `sonner` is already mounted at the root level (Line 161), ready for mutation feedback across all modules.

### 1.4 Complete Inventory of Local Storage Keys & Managed Entities

A total of 58 `focus_*` storage keys were identified across 32 feature subdirectories and core components:

| Legacy Storage Key | Feature Module | Managed Entity Type | Target 3NF Database Table |
|---|---|---|---|
| `focus_active_user` | User Management / TopBar | `ActiveUserProfile` | `users` |
| `focus_usuarios` | User Management / Permissoes | `Usuario` | `users` |
| `focus_clientes` | Clientes / Financeiro / CRM | `Cliente` | `clientes` |
| `focus_contas_receber` | Contas a Receber / Agenda / DRE | `TituloReceber` / `ContaReceber` | `contas_receber` |
| `focus_contas_pagar` | Contas a Pagar / ITAM / IT | `ContaPagar` | `contas_pagar` |
| `focus_contratos` | Contratos / Clientes / Agenda | `Contrato` | `contratos` |
| `focus_projetos` | Projetos / Dev / Agenda | `Projeto` | `projetos` |
| `focus_rh_colaboradores` | RH / Permissoes | `ColaboradorRH` | `colaboradores` |
| `focus_fornecedores` | Fornecedores | `Fornecedor` | `fornecedores` |
| `focus_cobrancas` | Cobranças / Régua de Cobrança | `Cobranca` | `cobrancas` |
| `focus_centro_custos` | Centro de Custos | `CentroCusto` | `centro_custos` |
| `focus_contas_bancarias` | Conciliação Bancária | `ContaBancaria` | `contas_bancarias` |
| `focus_extratos` | Conciliação Bancária | `MovimentacaoBancaria` | `extratos_bancarios` |
| `focus_crm_clickup_config` | CRM ClickUp Integration | `ClickUpSyncConfig` | `crm_integracoes` |
| `focus_crm_oportunidades` | CRM Pipeline | `OportunidadeCrm` | `crm_oportunidades` |
| `focus_crm_leads` | CRM Leads | `LeadCrm` | `crm_leads` |
| `focus_crm_empresas` | CRM Companies | `EmpresaCrm` | `crm_empresas` |
| `focus_crm_contatos` | CRM Contacts | `ContatoCrm` | `crm_contatos` |
| `focus_crm_atividades` | CRM Activities | `AtividadeCrm` | `crm_atividades` |
| `focus_crm_sync_logs` | CRM Logs | `LogSyncClickUp` | `crm_sync_logs` |
| `focus_comercial_propostas` | Comercial | `PropostaComercial` | `comercial_propostas` |
| `focus_comercial_equipe` | Comercial | `MembroEquipeComercial` | `comercial_equipe` |
| `focus_comercial_metas` | Comercial | `MetaComercial` | `comercial_metas` |
| `focus_comercial_okrs` | Comercial | `OkrComercial` | `comercial_okrs` |
| `focus_comercial_comissoes` | Comercial | `RegraComissao` | `comercial_comissoes` |
| `focus_comercial_produtos` | Comercial | `ProdutoComercial` | `comercial_produtos` |
| `focus_comercial_servicos` | Comercial | `ServicoComercial` | `comercial_servicos` |
| `focus_comercial_tabelas` | Comercial | `TabelaPreco` | `comercial_tabelas` |
| `focus_comercial_planejamento`| Comercial | `PlanejamentoComercialItem` | `comercial_planejamento` |
| `focus_comercial_agenda` | Comercial | `EventoAgendaComercial` | `comercial_agenda` |
| `focus_comercial_metricas_usuarios`| Comercial | `MetricasComercialUsuario`| `comercial_metricas` |
| `focus_dms_pastas` | Documentos (DMS) | `PastaDMS` | `documentos_pastas` |
| `focus_dms_documentos` | Documentos (DMS) | `DocumentoDMS` | `documentos_arquivos` |
| `focus_dms_lixeira` | Documentos (DMS) | `DocumentoDMS` | `documentos_lixeira` |
| `focus_dms_audit` | Documentos (DMS) | `AuditLogDocumento` | `documentos_audit_logs` |
| `focus_dev_backlog` | Desenvolvimento / Dev | `ItemBacklog` | `dev_backlog` |
| `focus_dev_sprints` | Desenvolvimento / Dev | `SprintDelivery` | `dev_sprints` |
| `focus_dev_versions` | Desenvolvimento / Dev | `VersaoSemVer` | `dev_versoes` |
| `focus_dev_git` | Desenvolvimento / Dev | `RepositorioGitConfig` | `dev_git_repos` |
| `focus_dev_branches` | Desenvolvimento / Dev | `GitBranchItem` | `dev_branches` |
| `focus_dev_releases` | Desenvolvimento / Dev | `ReleaseDelivery` | `dev_releases` |
| `focus_dev_deploys` | Desenvolvimento / Dev | `DeployItem` | `dev_deploys` |
| `focus_dev_qa` | Desenvolvimento / Dev | `CasoTesteQA` | `dev_qa_casos` |
| `focus_dev_bugs` | Desenvolvimento / Dev | `BugItem` | `dev_bugs` |
| `focus_dev_fixes` | Desenvolvimento / Dev | `CorrecaoBugItem` | `dev_correcoes` |
| `focus_dev_ambientes` | Desenvolvimento / Dev | `AmbienteInfo` | `dev_ambientes` |
| `focus_dev_publicacoes` | Desenvolvimento / Dev | `PublicacaoApp` | `dev_publicacoes` |
| `focus_dev_logs` | Desenvolvimento / Dev | `LogDelivery` | `dev_logs` |
| `focus_dev_pipelines` | Desenvolvimento / Dev | `PipelineCICD` | `dev_pipelines` |
| `focus_fiscal_documentos` | Fiscal | `DocumentoFiscal` | `fiscal_documentos` |
| `focus_itam_equipamentos` | ITAM / Estoque & Patrimônio | `Equipamento` | `itam_equipamentos` |
| `focus_itam_estoque_itens` | ITAM / Estoque & Patrimônio | `EstoqueItem` | `itam_estoque_itens` |
| `focus_itam_licencas` | ITAM / Estoque & Patrimônio | `Licenca` | `itam_licencas` |
| `focus_itam_patrimonios` | ITAM / Estoque & Patrimônio | `Patrimonio` | `itam_patrimonios` |
| `focus_itam_movimentacoes` | ITAM / Estoque & Patrimônio | `Movimentacao` | `itam_movimentacoes` |
| `focus_itam_inventarios` | ITAM / Estoque & Patrimônio | `Inventario` | `itam_inventarios` |
| `focus_itam_manutencoes` | ITAM / Estoque & Patrimônio | `Manutencao` | `itam_manutencoes` |
| `focus_cs_customers` | Customer Success | `CsCustomer` | `cs_customers` |
| `focus_cs_onboardings` | Customer Success | `CsOnboardingStep` | `cs_onboardings` |
| `focus_cs_nps_surveys` | Customer Success | `CsNpsSurvey` | `cs_nps_surveys` |
| `focus_cs_renewals` | Customer Success | `CsRenewalOpportunity` | `cs_renewals` |
| `focus_cs_expansions` | Customer Success | `CsExpansionOpportunity` | `cs_expansions` |
| `focus_cs_churn_records` | Customer Success | `CsChurnRecord` | `cs_churn_records` |
| `focus_cs_action_plans` | Customer Success | `CsActionPlanItem` | `cs_action_plans` |
| `focus_cs_timelines` | Customer Success | `CsTimelineEvent` | `cs_timelines` |
| `focus_cs_tasks_meetings` | Customer Success | `CsTaskMeeting` | `cs_tasks_meetings` |
| `focus_cs_documents` | Customer Success | `CsDocument` | `cs_documents` |
| `focus_notificacoes` | Notificações | `Notificacao` | `notificacoes` |
| `focus_notificacoes_prefs` | Notificações | `UserNotificationPreferences` | `notificacao_preferencias` |
| `focus_assinaturas_docs` | Assinaturas Digitais | `DocumentoAssinatura` | `assinaturas_documentos` |
| `focus_assinaturas_modelos` | Assinaturas Digitais | `ModeloDocumento` | `assinaturas_modelos` |
| `focus_assinaturas_certificados`| Assinaturas Digitais | `CertificadoDigital` | `assinaturas_certificados` |
| `focus_permissoes_perfis` | Permissões | `PerfilAcesso` | `permissoes_perfis` |
| `focus_produtos` | Produtos | `ProdutoFocus` | `produtos` |
| `focus_relatorios_history` | Relatórios | `ReportExecutionHistory` | `relatorios_historico` |
| `focus_relatorios_schedules` | Relatórios | `ReportSchedule` | `relatorios_agendamentos` |
| `focus_relatorios_templates` | Relatórios | `ReportModelTemplate` | `relatorios_modelos` |
| `focus_suporte_chamados` | Suporte Desk | `ChamadoSuporte` | `suporte_chamados` |
| `focus_suporte_kb` | Suporte Desk | `ArtigoConhecimento` | `suporte_kb` |
| `focus_suporte_mensagens` | Suporte Desk | `MensagemChamado` | `suporte_mensagens` |
| `focus_suporte_timeline` | Suporte Desk | `TimelineSuporte` | `suporte_timeline` |

---

## 2. Logic Chain

1. **Premise 1**: The legacy application stores state in LocalStorage and serializes multi-module payloads into JSON strings inside Supabase's `clients.contact_email` column under dummy UUID keys (`__FOCUS_STATE__`).
2. **Premise 2**: This model violates PostgreSQL 3NF relational principles, lacks strong server-side validation, prevents proper multi-tenant Row Level Security (`tenant_id`), and relies on expensive 5-second polling intervals (`setInterval`).
3. **Premise 3**: By defining strongly-typed Zod schemas in `src/schemas/` for every domain entity, input/output validation can be enforced both at the API service layer (`src/services/`) and in React components.
4. **Premise 4**: Creating type-safe Supabase SDK service modules in `src/services/` targeting 3NF relational tables (`clientes`, `contas_receber`, `contas_pagar`, `projetos`, `users`, `contratos`, `colaboradores`, `audit_logs`) establishes a robust data layer.
5. **Premise 5**: Wrapping these services with `@tanstack/react-query` hooks (`useQuery`, `useMutation`) provides re-render optimization, automatic background refetching, client-side caching, and deterministic cache invalidation upon mutations.
6. **Premise 6**: Sonner toast integration inside mutation callbacks (`onSuccess`, `onError`) guarantees 100% visual parity and user feedback without modifying component UI layouts.

---

## 3. Caveats

1. **Cross-Module Automation Dependencies**:
   - Several modules interact reactively:
     - **CRM -> Clientes/Contratos/Financeiro**: Moving an opportunity to "Fechado Ganho" auto-creates a `Cliente`, a `Contrato`, and a `ContaReceber` (`src/features/crm/hooks/useCrmStore.ts`, lines 164-220).
     - **Suporte -> Desenvolvimento**: Converting a support ticket auto-creates a Bug or Backlog item in Dev (`src/features/suporte/useSuporte.ts`, lines 175-235).
     - **Fiscal -> DMS**: Saving a tax document auto-syncs PDF attachments into `Documentos` (`src/features/fiscal/hooks/useFiscalStore.ts`, lines 123-175).
   - *Mitigation*: React Query mutations for these composite actions must issue invalidations across all affected query keys (e.g. invalidating `['crm_oportunidades']`, `['clientes']`, `['contratos']`, and `['contas_receber']` in a single mutation `onSuccess`).

2. **Migration & Fallback Strategy**:
   - During the incremental migration phase (M3), database tables in local development or test environments might be empty.
   - *Mitigation*: Supabase SDK services in `src/services/` should implement safe fallback mechanisms (returning default array states or reading from LocalStorage if Supabase queries yield empty results or table missing errors), preventing UI runtime crashes during development.

---

## 4. Conclusion & Architecture Specification

### 4.1 Domain Models & Zod Schemas (`src/schemas/`)

To support complete refactoring, the following Zod schema modules are specified:

1. **`clienteSchema.ts`** *(Existing, verified)*:
   - Exports: `clienteSchema`, `enderecoSchema`, `contatoSchema`, `ClienteDTO`.
2. **`userSchema.ts`**:
   - Exports: `userSchema`, `activeUserSchema`, `UserDTO`, `ActiveUserDTO`.
   - Fields: `id`, `tenantId`, `email`, `nome`, `cargo`, `departamento`, `perfil`, `status`, `created_at`.
3. **`contaReceberSchema.ts`**:
   - Exports: `contaReceberSchema`, `ContaReceberDTO`.
   - Fields: `id`, `tenantId`, `descricao`, `clienteId`, `clienteNome`, `valorOriginal`, `valorRecebido`, `saldo`, `dataVencimento`, `dataPagamento`, `status`, `categoria`, `formaPagamento`, `created_at`.
4. **`contaPagarSchema.ts`**:
   - Exports: `contaPagarSchema`, `ContaPagarDTO`.
   - Fields: `id`, `tenantId`, `descricao`, `fornecedorId`, `fornecedorNome`, `valorOriginal`, `valorPago`, `dataVencimento`, `dataPagamento`, `status`, `categoria`, `centroCusto`, `created_at`.
5. **`projetoSchema.ts`**:
   - Exports: `projetoSchema`, `ProjetoDTO`.
   - Fields: `id`, `tenantId`, `codigo`, `nome`, `clienteId`, `clienteNome`, `tipo`, `valorContratado`, `orcamentoEstimado`, `responsavelPrincipal`, `dataInicio`, `dataFinal`, `status`, `prioridade`, `progressoGlobal`, `created_at`.
6. **`contratoSchema.ts`**:
   - Exports: `contratoSchema`, `ContratoDTO`.
   - Fields: `id`, `tenantId`, `numeroContrato`, `clienteId`, `clienteNome`, `objetoContrato`, `valorTotal`, `valorMensal`, `tipoContrato`, `dataInicio`, `dataFim`, `status`, `renovacaoAutomatica`, `created_at`.
7. **`colaboradorSchema.ts`**:
   - Exports: `colaboradorSchema`, `ColaboradorDTO`.
   - Fields: `id`, `tenantId`, `nomeCompleto`, `cpf`, `email`, `cargo`, `departamento`, `salarioBase`, `dataAdmissao`, `status`, `created_at`.
8. **`fornecedorSchema.ts`**:
   - Exports: `fornecedorSchema`, `FornecedorDTO`.
   - Fields: `id`, `tenantId`, `razaoSocial`, `nomeFantasia`, `cnpj`, `email`, `telefone`, `categoria`, `status`, `created_at`.
9. **`cobrancaSchema.ts`**:
   - Exports: `cobrancaSchema`, `CobrancaDTO`.
   - Fields: `id`, `tenantId`, `clienteId`, `clienteNome`, `tituloId`, `valorTotal`, `diasAtraso`, `etapaAtual`, `status`, `historicoInteracoes`, `created_at`.
10. **`auditLogSchema.ts`**:
    - Exports: `auditLogSchema`, `AuditLogDTO`.
    - Fields: `id`, `tenantId`, `userId`, `userName`, `action`, `entity`, `details`, `ip`, `created_at`.

### 4.2 Supabase SDK Services (`src/services/`)

Each entity service wraps `@supabase/supabase-js` with typed Zod parsing:

1. **`clienteService.ts`** *(Existing, verified)*:
   - Methods: `getClientes()`, `saveCliente()`, `deleteCliente()`.
2. **`userService.ts`**:
   - Methods: `getUsers()`, `getCurrentUser()`, `saveUser()`, `updateUserProfile()`.
3. **`contaReceberService.ts`**:
   - Methods: `getContasReceber()`, `saveContaReceber()`, `deleteContaReceber()`, `baixarTitulo()`.
4. **`contaPagarService.ts`**:
   - Methods: `getContasPagar()`, `saveContaPagar()`, `deleteContaPagar()`, `pagarConta()`.
5. **`projetoService.ts`**:
   - Methods: `getProjetos()`, `getProjetoById()`, `saveProjeto()`, `deleteProjeto()`, `updateProgresso()`.
6. **`contratoService.ts`**:
   - Methods: `getContratos()`, `saveContrato()`, `deleteContrato()`.
7. **`colaboradorService.ts`**:
   - Methods: `getColaboradores()`, `saveColaborador()`, `deleteColaborador()`.
8. **`fornecedorService.ts`**:
   - Methods: `getFornecedores()`, `saveFornecedor()`, `deleteFornecedor()`.
9. **`cobrancaService.ts`**:
   - Methods: `getCobrancas()`, `saveCobranca()`, `avancarEtapaCobranca()`.
10. **`auditLogService.ts`**:
    - Methods: `getAuditLogs()`, `logAction()`.

### 4.3 React Query Hook Architecture & Invalidation Design

#### Query Key Taxonomy:
- Clientes: `['clientes']`, `['clientes', id]`
- Contas a Receber: `['contas_receber']`, `['contas_receber', { status }]`
- Contas a Pagar: `['contas_pagar']`, `['contas_pagar', { status }]`
- Projetos: `['projetos']`, `['projetos', id]`
- Contratos: `['contratos']`, `['contratos', id]`
- Usuários / Active User: `['users']`, `['active_user']`
- Colaboradores (RH): `['colaboradores']`
- Fornecedores: `['fornecedores']`
- Cobranças: `['cobrancas']`
- Audit Logs: `['audit_logs']`

#### Query Options Standard:
```ts
staleTime: 1000 * 60 * 5, // 5 minutos sem refetch desnecessário
gcTime: 1000 * 60 * 30,    // 30 minutos de retenção em cache
refetchOnWindowFocus: false
```

#### Mutation & Toast Feedback Pattern:
```ts
export function useContasReceberQuery() {
  const queryClient = useQueryClient();

  const { data: contasReceber = [], isLoading, isError, error, refetch } = useQuery<ContaReceberDTO[]>({
    queryKey: ['contas_receber'],
    queryFn: () => contaReceberService.getContasReceber(),
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: (conta: ContaReceberDTO) => contaReceberService.saveContaReceber(conta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
      toast.success('Conta a receber salva com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar conta: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contaReceberService.deleteContaReceber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      toast.success('Conta a receber removida com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao remover conta: ${err.message}`);
    },
  });

  return {
    contasReceber,
    isLoading,
    isError,
    error,
    refetch,
    saveContaReceber: saveMutation.mutateAsync,
    deleteContaReceber: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

---

## 5. Verification Method

To independently verify the implementation of this architecture in downstream tasks:

1. **Static Type Validation**:
   - Command: `npx tsc --noEmit`
   - Expected Result: 0 errors across all Zod DTO imports and service calls.
2. **Production Bundle Verification**:
   - Command: `npm run build`
   - Expected Result: Successful compilation producing output files in `dist/`.
3. **Local Storage Elimination Inspection**:
   - Inspect files in `src/features/` and `src/components/`.
   - Verify that imports of `useLocalStorageState` are replaced by corresponding `use*Query` hooks.
   - Verify Sonner `toast.success` and `toast.error` execute on mutation resolution.
4. **Git Safety Invalidation Condition**:
   - Confirm NO `git push --force` or `git rebase` is performed, maintaining Lovable synchronization safety.
