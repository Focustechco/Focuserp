import { PastaDMS, DocumentoDMS } from "../types";

export const INITIAL_PASTAS: PastaDMS[] = [
  // Módulos Principais Solicitados
  { id: "p-cli", nome: "Clientes", parentId: null, caminhoCompleto: "/Clientes", moduloVinculado: "Clientes", dataCriacao: "2026-01-10", criadoPor: "Sistema", corIcone: "#3B82F6" },
  { id: "p-prj", nome: "Projetos", parentId: null, caminhoCompleto: "/Projetos", moduloVinculado: "Projetos", dataCriacao: "2026-01-10", criadoPor: "Sistema", corIcone: "#10B981" },
  { id: "p-rh", nome: "RH", parentId: null, caminhoCompleto: "/RH", moduloVinculado: "RH", dataCriacao: "2026-01-10", criadoPor: "Sistema", corIcone: "#8B5CF6" },
  { id: "p-rh-colab", nome: "Colaboradores", parentId: "p-rh", caminhoCompleto: "/RH/Colaboradores", moduloVinculado: "RH", dataCriacao: "2026-01-18", criadoPor: "Sistema" },
  { id: "p-rh-folha", nome: "Folha de Pagamento", parentId: "p-rh", caminhoCompleto: "/RH/Folha de Pagamento", moduloVinculado: "RH", dataCriacao: "2026-01-18", criadoPor: "Sistema" },
  { id: "p-rh-contratos", nome: "Contratos de Trabalho", parentId: "p-rh", caminhoCompleto: "/RH/Contratos de Trabalho", moduloVinculado: "RH", dataCriacao: "2026-01-18", criadoPor: "Sistema" },
  { id: "p-rh-atestados", nome: "Atestados e Licenças", parentId: "p-rh", caminhoCompleto: "/RH/Atestados e Licenças", moduloVinculado: "RH", dataCriacao: "2026-01-18", criadoPor: "Sistema" },
  
  { id: "p-prod", nome: "Produtos Focus", parentId: null, caminhoCompleto: "/Produtos Focus", moduloVinculado: "Produtos Focus", dataCriacao: "2026-01-10", criadoPor: "Sistema", corIcone: "#FF6A00" },
  { id: "p-prod-manuais", nome: "Manuais e Guias", parentId: "p-prod", caminhoCompleto: "/Produtos Focus/Manuais e Guias", moduloVinculado: "Produtos Focus", dataCriacao: "2026-01-20", criadoPor: "Sistema" },
  { id: "p-prod-apis", nome: "Documentações de API", parentId: "p-prod", caminhoCompleto: "/Produtos Focus/Documentações de API", moduloVinculado: "Produtos Focus", dataCriacao: "2026-01-20", criadoPor: "Sistema" },
  { id: "p-prod-assets", nome: "Blueprints e Assets", parentId: "p-prod", caminhoCompleto: "/Produtos Focus/Blueprints e Assets", moduloVinculado: "Produtos Focus", dataCriacao: "2026-01-20", criadoPor: "Sistema" },

  { id: "p-rel", nome: "Relatórios", parentId: null, caminhoCompleto: "/Relatórios", moduloVinculado: "Relatórios", dataCriacao: "2026-01-10", criadoPor: "Sistema", corIcone: "#F59E0B" },
  { id: "p-rel-dre", nome: "DRE Gerencial", parentId: "p-rel", caminhoCompleto: "/Relatórios/DRE Gerencial", moduloVinculado: "Relatórios", dataCriacao: "2026-01-20", criadoPor: "Sistema" },
  { id: "p-rel-fluxo", nome: "Fluxo de Caixa", parentId: "p-rel", caminhoCompleto: "/Relatórios/Fluxo de Caixa", moduloVinculado: "Relatórios", dataCriacao: "2026-01-20", criadoPor: "Sistema" },
  { id: "p-rel-faturam", nome: "Faturamento e Vendas", parentId: "p-rel", caminhoCompleto: "/Relatórios/Faturamento e Vendas", moduloVinculado: "Relatórios", dataCriacao: "2026-01-20", criadoPor: "Sistema" },
  { id: "p-rel-audit", nome: "Auditoria e Compliance", parentId: "p-rel", caminhoCompleto: "/Relatórios/Auditoria e Compliance", moduloVinculado: "Relatórios", dataCriacao: "2026-01-20", criadoPor: "Sistema" },

  // Módulos Complementares
  { id: "p-fin", nome: "Financeiro", parentId: null, caminhoCompleto: "/Financeiro", moduloVinculado: "Financeiro", dataCriacao: "2026-01-10", criadoPor: "Sistema" },
  { id: "p-fin-bol", nome: "Boletos", parentId: "p-fin", caminhoCompleto: "/Financeiro/Boletos", moduloVinculado: "Financeiro", dataCriacao: "2026-01-12", criadoPor: "Sistema" },
  { id: "p-fin-comp", nome: "Comprovantes", parentId: "p-fin", caminhoCompleto: "/Financeiro/Comprovantes", moduloVinculado: "Financeiro", dataCriacao: "2026-01-12", criadoPor: "Sistema" },
  { id: "p-fisc", nome: "Fiscal", parentId: null, caminhoCompleto: "/Fiscal", moduloVinculado: "Fiscal", dataCriacao: "2026-01-10", criadoPor: "Sistema" },
  { id: "p-fisc-xml", nome: "XML", parentId: "p-fisc", caminhoCompleto: "/Fiscal/XML", moduloVinculado: "Fiscal", dataCriacao: "2026-01-15", criadoPor: "Sistema" },
  { id: "p-fisc-danfe", nome: "DANFE", parentId: "p-fisc", caminhoCompleto: "/Fiscal/DANFE", moduloVinculado: "Fiscal", dataCriacao: "2026-01-15", criadoPor: "Sistema" },
  { id: "p-ct", nome: "Contratos", parentId: null, caminhoCompleto: "/Contratos", moduloVinculado: "Contratos", dataCriacao: "2026-01-10", criadoPor: "Sistema" },
  { id: "p-forn", nome: "Fornecedores", parentId: null, caminhoCompleto: "/Fornecedores", moduloVinculado: "Fornecedores", dataCriacao: "2026-01-10", criadoPor: "Sistema" },
  { id: "p-mkt", nome: "Marketing", parentId: null, caminhoCompleto: "/Marketing", moduloVinculado: "Marketing", dataCriacao: "2026-01-10", criadoPor: "Sistema" },
];

export const INITIAL_DOCUMENTOS: DocumentoDMS[] = [
  {
    id: "doc-001",
    codigo: "DOC-2026-001",
    nome: "Contrato_Prestacao_Servicos_TechServices.pdf",
    extensao: "pdf",
    tamanho: "2.4 MB",
    tamanhoBytes: 2400000,
    pastaId: "p-ct",
    caminhoPasta: "/Contratos",
    moduloOrigem: "Contratos",
    clienteId: "cli-001",
    clienteNome: "TechServices Brasil Ltda",
    tags: ["Contrato", "Jurídico", "Vigente"],
    categoria: "Contratos Assinados",
    responsavelUpload: "Adriano Leal",
    dataUpload: "2026-01-15T10:30:00Z",
    dataUltimaAlteracao: "2026-01-15T10:30:00Z",
    versaoAtual: "1.0",
    favorito: true,
    status: "Ativo",
    historicoVersoes: [
      { numeroVersao: "1.0", alteradoPor: "Adriano Leal", dataAlteracao: "2026-01-15T10:30:00Z", descricaoAlteracao: "Versão inicial assinada via Docusign.", tamanhoArquivo: "2.4 MB" }
    ]
  },
  {
    id: "doc-002",
    codigo: "DOC-2026-002",
    nome: "Comprovante_Pagamento_Servidor_AWS.pdf",
    extensao: "pdf",
    tamanho: "480 KB",
    tamanhoBytes: 480000,
    pastaId: "p-fin-comp",
    caminhoPasta: "/Financeiro/Comprovantes",
    moduloOrigem: "Financeiro",
    tags: ["Financeiro", "Comprovante", "AWS"],
    categoria: "Comprovante de Pagamento",
    responsavelUpload: "Davi Nogueira",
    dataUpload: "2026-02-01T14:15:00Z",
    dataUltimaAlteracao: "2026-02-01T14:15:00Z",
    versaoAtual: "1.0",
    favorito: false,
    status: "Ativo",
    historicoVersoes: [
      { numeroVersao: "1.0", alteradoPor: "Davi Nogueira", dataAlteracao: "2026-02-01T14:15:00Z", descricaoAlteracao: "Comprovante de quitação mensal de infraestrutura.", tamanhoArquivo: "480 KB" }
    ]
  },
  {
    id: "doc-003",
    codigo: "DOC-2026-003",
    nome: "NFe_38910_Prestacao_Servicos.xml",
    extensao: "xml",
    tamanho: "45 KB",
    tamanhoBytes: 45000,
    pastaId: "p-fisc-xml",
    caminhoPasta: "/Fiscal/XML",
    moduloOrigem: "Fiscal",
    tags: ["Fiscal", "XML", "NF-e"],
    categoria: "Nota Fiscal Eletrônica",
    responsavelUpload: "Sistema Automático",
    dataUpload: "2026-02-05T09:00:00Z",
    dataUltimaAlteracao: "2026-02-05T09:00:00Z",
    versaoAtual: "1.0",
    favorito: false,
    status: "Ativo",
    historicoVersoes: [
      { numeroVersao: "1.0", alteradoPor: "Sistema Automático", dataAlteracao: "2026-02-05T09:00:00Z", descricaoAlteracao: "Recepção de XML da SEFAZ.", tamanhoArquivo: "45 KB" }
    ]
  },
  {
    id: "doc-004",
    codigo: "DOC-2026-004",
    nome: "Arquitetura_Software_FocusERP_v2.pdf",
    extensao: "pdf",
    tamanho: "3.2 MB",
    tamanhoBytes: 3200000,
    pastaId: "p-prod-apis",
    caminhoPasta: "/Produtos Focus/Documentações de API",
    moduloOrigem: "Produtos Focus",
    produtoNome: "Focus ERP",
    tags: ["Documentação", "API", "Arquitetura"],
    categoria: "Especificações Técnicas",
    responsavelUpload: "Gabriel Sbrana",
    dataUpload: "2026-02-10T11:00:00Z",
    dataUltimaAlteracao: "2026-02-10T11:00:00Z",
    versaoAtual: "1.0",
    favorito: true,
    status: "Ativo",
    historicoVersoes: [
      { numeroVersao: "1.0", alteradoPor: "Gabriel Sbrana", dataAlteracao: "2026-02-10T11:00:00Z", descricaoAlteracao: "Blueprint da arquitetura modular do ERP.", tamanhoArquivo: "3.2 MB" }
    ]
  }
];
