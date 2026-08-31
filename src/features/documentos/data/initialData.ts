import { PastaDMS, DocumentoDMS } from "../types";

export const INITIAL_PASTAS: PastaDMS[] = [
  // Módulos Principais
  { id: "p-cli", nome: "Clientes", parentId: null, caminhoCompleto: "/Clientes", moduloVinculado: "Clientes", dataCriacao: "2026-01-01", criadoPor: "Sistema", corIcone: "#3B82F6" },
  { id: "p-forn", nome: "Fornecedores", parentId: null, caminhoCompleto: "/Fornecedores", moduloVinculado: "Fornecedores", dataCriacao: "2026-01-01", criadoPor: "Sistema", corIcone: "#64748B" },
  { id: "p-prj", nome: "Projetos", parentId: null, caminhoCompleto: "/Projetos", moduloVinculado: "Projetos", dataCriacao: "2026-01-01", criadoPor: "Sistema", corIcone: "#10B981" },
  { id: "p-rh", nome: "RH", parentId: null, caminhoCompleto: "/RH", moduloVinculado: "RH", dataCriacao: "2026-01-01", criadoPor: "Sistema", corIcone: "#8B5CF6" },
  { id: "p-rh-colab", nome: "Colaboradores", parentId: "p-rh", caminhoCompleto: "/RH/Colaboradores", moduloVinculado: "RH", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-prod", nome: "Produtos Focus", parentId: null, caminhoCompleto: "/Produtos Focus", moduloVinculado: "Produtos Focus", dataCriacao: "2026-01-01", criadoPor: "Sistema", corIcone: "#FF6A00" },
  { id: "p-rel", nome: "Relatórios", parentId: null, caminhoCompleto: "/Relatórios", moduloVinculado: "Relatórios", dataCriacao: "2026-01-01", criadoPor: "Sistema", corIcone: "#F59E0B" },
  { id: "p-rel-dre", nome: "DRE Gerencial", parentId: "p-rel", caminhoCompleto: "/Relatórios/DRE Gerencial", moduloVinculado: "Relatórios", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-rel-fluxo", nome: "Fluxo de Caixa", parentId: "p-rel", caminhoCompleto: "/Relatórios/Fluxo de Caixa", moduloVinculado: "Relatórios", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-rel-faturam", nome: "Faturamento e Vendas", parentId: "p-rel", caminhoCompleto: "/Relatórios/Faturamento e Vendas", moduloVinculado: "Relatórios", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-rel-audit", nome: "Auditoria e Compliance", parentId: "p-rel", caminhoCompleto: "/Relatórios/Auditoria e Compliance", moduloVinculado: "Relatórios", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-ctr", nome: "Contratos", parentId: null, caminhoCompleto: "/Contratos", moduloVinculado: "Contratos", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-ass", nome: "Assinaturas Digitais", parentId: null, caminhoCompleto: "/Assinaturas Digitais", moduloVinculado: "Contratos", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-fin", nome: "Financeiro", parentId: null, caminhoCompleto: "/Financeiro", moduloVinculado: "Financeiro", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-fin-comp", nome: "Comprovantes", parentId: "p-fin", caminhoCompleto: "/Financeiro/Comprovantes", moduloVinculado: "Financeiro", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-fisc", nome: "Fiscal", parentId: null, caminhoCompleto: "/Fiscal", moduloVinculado: "Fiscal", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
  { id: "p-com", nome: "Comercial", parentId: null, caminhoCompleto: "/Comercial", moduloVinculado: "Comercial", dataCriacao: "2026-01-01", criadoPor: "Sistema" },
];

// Documentos reais do banco de dados (inicialmente vazio, sem dados mockados)
export const INITIAL_DOCUMENTOS: DocumentoDMS[] = [];
