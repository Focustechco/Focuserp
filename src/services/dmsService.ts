import { supabase } from '@/lib/supabaseClient';
import { PastaDMS, DocumentoDMS, AuditLogDocumento, FormatoArquivo, ModuloOrigemDMS } from '@/features/documentos/types';
import { INITIAL_PASTAS, INITIAL_DOCUMENTOS } from '@/features/documentos/data/initialData';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const DOCS_STORAGE_KEYS = ['focus_app_focus_dms_documentos', 'focus_dms_documentos'];
const PASTAS_STORAGE_KEYS = ['focus_app_focus_dms_pastas', 'focus_dms_pastas'];
const AUDIT_STORAGE_KEYS = ['focus_app_focus_dms_audit', 'focus_dms_audit'];

function triggerSyncEvent() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('focus_storage_update'));
      window.dispatchEvent(new Event('focus_dms_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

/**
 * Service Central de Gestão Eletrônica de Documentos (DMS / ECM)
 * Integração universal com Clientes, CRM, Projetos, RH, Produtos, Relatórios e Financeiro.
 */
export const dmsService = {
  // ---------------------------------------------------------------------------
  // Pastas
  // ---------------------------------------------------------------------------
  getPastas(): PastaDMS[] {
    try {
      for (const key of PASTAS_STORAGE_KEYS) {
        const raw = safeGetItem(key);
        if (raw) {
          const list: PastaDMS[] = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) return list;
        }
      }
    } catch {}
    return INITIAL_PASTAS;
  },

  async savePastas(pastas: PastaDMS[]): Promise<void> {
    const serialized = JSON.stringify(pastas);
    for (const key of PASTAS_STORAGE_KEYS) {
      safeSetItem(key, serialized);
    }
    triggerSyncEvent();
  },

  async savePasta(pasta: PastaDMS): Promise<void> {
    const list = this.getPastas();
    const filtered = list.filter((p) => p.id !== pasta.id);
    const updated = [...filtered, pasta];
    await this.savePastas(updated);

    try {
      await supabase.from('dms_pastas').upsert({
        id: pasta.id,
        nome: pasta.nome,
        parent_id: pasta.parentId,
        caminho_completo: pasta.caminhoCompleto,
        modulo_vinculado: pasta.moduloVinculado,
        data_criacao: pasta.dataCriacao,
        criado_por: pasta.criadoPor,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  },

  // ---------------------------------------------------------------------------
  // Garantir Criação de Pasta Raiz ou Subpasta Específica de Entidade
  // ---------------------------------------------------------------------------
  ensureFolder(
    nome: string,
    parentId: string | null = null,
    moduloVinculado: ModuloOrigemDMS = 'Geral',
    entidadeId?: string,
    customId?: string
  ): PastaDMS {
    const pastas = this.getPastas();
    
    // Verificar se a pasta já existe
    const existing = pastas.find((p) => {
      if (customId && p.id === customId) return true;
      if (entidadeId && p.entidadeId === entidadeId) return true;
      if (p.parentId === parentId && p.nome.toLowerCase().trim() === nome.toLowerCase().trim()) return true;
      return false;
    });

    if (existing) return existing;

    let parentPath = '';
    if (parentId) {
      const parent = pastas.find((p) => p.id === parentId);
      if (parent) parentPath = parent.caminhoCompleto;
    }
    const caminhoCompleto = `${parentPath}/${nome}`.replace('//', '/');

    const folderId = customId || (entidadeId ? `p-${moduloVinculado.toLowerCase().replace(/\s+/g, '-')}-${entidadeId}` : `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

    const newFolder: PastaDMS = {
      id: folderId,
      nome,
      parentId,
      caminhoCompleto,
      moduloVinculado,
      entidadeId,
      dataCriacao: new Date().toISOString(),
      criadoPor: 'Sistema Integrado Focus ERP',
    };

    const updated = [...pastas, newFolder];
    this.savePastas(updated);
    return newFolder;
  },

  // 1. Clientes: Cria automaticamente /Clientes e /Clientes/[Nome do Cliente]
  ensureClientFolder(cliente: { id: string; nome?: string; nomeFantasia?: string; razaoSocial?: string }): PastaDMS {
    const rootFolder = this.ensureFolder('Clientes', null, 'Clientes', undefined, 'p-cli');
    const nomeCliente = cliente.nomeFantasia || cliente.razaoSocial || cliente.nome || 'Cliente Sem Nome';
    const folderId = `p-cli-${cliente.id}`;
    return this.ensureFolder(nomeCliente, rootFolder.id, 'Clientes', cliente.id, folderId);
  },

  // 2. Projetos: Cria automaticamente /Projetos e /Projetos/[Nome do Projeto]
  ensureProjectFolder(projeto: { id: string; nome?: string; codigo?: string }): PastaDMS {
    const rootFolder = this.ensureFolder('Projetos', null, 'Projetos', undefined, 'p-prj');
    const nomeProjeto = projeto.codigo ? `${projeto.codigo} - ${projeto.nome || 'Projeto'}` : projeto.nome || 'Projeto Sem Nome';
    const folderId = `p-prj-${projeto.id}`;
    return this.ensureFolder(nomeProjeto, rootFolder.id, 'Projetos', projeto.id, folderId);
  },

  // 3. RH: Cria automaticamente /RH e /RH/Colaboradores/[Nome do Colaborador]
  ensureRhFolder(colaborador: { id: string; nome?: string; nomeExibicao?: string }): PastaDMS {
    const rootFolder = this.ensureFolder('RH', null, 'RH', undefined, 'p-rh');
    const colabRoot = this.ensureFolder('Colaboradores', rootFolder.id, 'RH', undefined, 'p-rh-colab');
    const nomeColaborador = colaborador.nome || colaborador.nomeExibicao || 'Colaborador';
    const folderId = `p-rh-colab-${colaborador.id}`;
    return this.ensureFolder(nomeColaborador, colabRoot.id, 'RH', colaborador.id, folderId);
  },

  // 4. Produtos Focus: Cria automaticamente /Produtos Focus e /Produtos Focus/[Nome do Produto]
  ensureProductFolder(produto: { id: string; nome?: string }): PastaDMS {
    const rootFolder = this.ensureFolder('Produtos Focus', null, 'Produtos Focus', undefined, 'p-prod');
    const nomeProduto = produto.nome || 'Produto Focus';
    const folderId = `p-prod-${produto.id}`;
    return this.ensureFolder(nomeProduto, rootFolder.id, 'Produtos Focus', produto.id, folderId);
  },

  // 5. Relatórios: Cria automaticamente /Relatórios e subpastas temáticas
  ensureReportFolder(tipo: 'DRE Gerencial' | 'Fluxo de Caixa' | 'Faturamento e Vendas' | 'Auditoria e Compliance' | 'Geral' = 'Geral'): PastaDMS {
    const rootFolder = this.ensureFolder('Relatórios', null, 'Relatórios', undefined, 'p-rel');
    
    if (tipo.includes('DRE')) {
      return this.ensureFolder('DRE Gerencial', rootFolder.id, 'Relatórios', undefined, 'p-rel-dre');
    }
    if (tipo.includes('Fluxo')) {
      return this.ensureFolder('Fluxo de Caixa', rootFolder.id, 'Relatórios', undefined, 'p-rel-fluxo');
    }
    if (tipo.includes('Vendas') || tipo.includes('Faturamento')) {
      return this.ensureFolder('Faturamento e Vendas', rootFolder.id, 'Relatórios', undefined, 'p-rel-faturam');
    }
    if (tipo.includes('Auditoria') || tipo.includes('Compliance')) {
      return this.ensureFolder('Auditoria e Compliance', rootFolder.id, 'Relatórios', undefined, 'p-rel-audit');
    }
    
    return rootFolder;
  },

  // ---------------------------------------------------------------------------
  // Documentos
  // ---------------------------------------------------------------------------
  getDocumentos(): DocumentoDMS[] {
    try {
      for (const key of DOCS_STORAGE_KEYS) {
        const raw = safeGetItem(key);
        if (raw) {
          const list: DocumentoDMS[] = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) return list;
        }
      }
    } catch {}
    return INITIAL_DOCUMENTOS;
  },

  async saveDocumentos(docs: DocumentoDMS[]): Promise<void> {
    const serialized = JSON.stringify(docs);
    for (const key of DOCS_STORAGE_KEYS) {
      safeSetItem(key, serialized);
    }
    triggerSyncEvent();
  },

  async saveDocumento(doc: DocumentoDMS): Promise<void> {
    const list = this.getDocumentos();
    const filtered = list.filter((d) => d.id !== doc.id);
    const updated = [doc, ...filtered];
    await this.saveDocumentos(updated);

    // Auditoria
    this.logAction(doc.id, doc.nome, 'Upload', `Arquivo indexado na pasta ${doc.caminhoPasta}`);
  },

  // ---------------------------------------------------------------------------
  // Upload / Geração Integrada Direta a partir de Qualquer Módulo
  // ---------------------------------------------------------------------------
  uploadFileFromModule(params: {
    nome: string;
    extensao?: FormatoArquivo;
    tamanho?: string;
    tamanhoBytes?: number;
    urlConteudo?: string;
    moduloOrigem: ModuloOrigemDMS;
    categoria?: string;
    tags?: string[];
    // Vínculos
    clienteId?: string;
    clienteNome?: string;
    projetoId?: string;
    projetoNome?: string;
    colaboradorId?: string;
    colaboradorNome?: string;
    produtoId?: string;
    produtoNome?: string;
    relatorioTipo?: string;
    responsavelUpload?: string;
  }): DocumentoDMS {
    let targetFolder: PastaDMS;

    // Roteamento inteligente para a pasta correta da entidade
    if (params.clienteId) {
      targetFolder = this.ensureClientFolder({ id: params.clienteId, nome: params.clienteNome });
    } else if (params.projetoId) {
      targetFolder = this.ensureProjectFolder({ id: params.projetoId, nome: params.projetoNome });
    } else if (params.colaboradorId) {
      targetFolder = this.ensureRhFolder({ id: params.colaboradorId, nome: params.colaboradorNome });
    } else if (params.produtoId) {
      targetFolder = this.ensureProductFolder({ id: params.produtoId, nome: params.produtoNome });
    } else if (params.moduloOrigem === 'Relatórios') {
      targetFolder = this.ensureReportFolder((params.relatorioTipo as any) || 'Geral');
    } else {
      targetFolder = this.ensureFolder(params.moduloOrigem, null, params.moduloOrigem);
    }

    const ext = (params.extensao || params.nome.split('.').pop()?.toLowerCase() || 'pdf') as FormatoArquivo;
    const codigo = `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDoc: DocumentoDMS = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      codigo,
      nome: params.nome,
      extensao: ext,
      tamanho: params.tamanho || '1.0 MB',
      tamanhoBytes: params.tamanhoBytes || 1048576,
      pastaId: targetFolder.id,
      caminhoPasta: targetFolder.caminhoCompleto,
      moduloOrigem: params.moduloOrigem,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      projetoId: params.projetoId,
      projetoNome: params.projetoNome,
      colaboradorId: params.colaboradorId,
      colaboradorNome: params.colaboradorNome,
      produtoId: params.produtoId,
      produtoNome: params.produtoNome,
      relatorioTipo: params.relatorioTipo,
      tags: params.tags || [params.moduloOrigem, 'Anexo'],
      categoria: params.categoria || 'Documentos Anexados',
      responsavelUpload: params.responsavelUpload || 'Usuário do Sistema',
      dataUpload: new Date().toISOString(),
      dataUltimaAlteracao: new Date().toISOString(),
      versaoAtual: '1.0',
      favorito: false,
      status: 'Ativo',
      urlConteudo: params.urlConteudo,
      historicoVersoes: [
        {
          numeroVersao: '1.0',
          alteradoPor: params.responsavelUpload || 'Usuário do Sistema',
          dataAlteracao: new Date().toISOString(),
          descricaoAlteracao: `Arquivo recebido via módulo ${params.moduloOrigem}.`,
          tamanhoArquivo: params.tamanho || '1.0 MB',
          urlDownload: params.urlConteudo,
        },
      ],
    };

    this.saveDocumento(newDoc);
    return newDoc;
  },

  // ---------------------------------------------------------------------------
  // Auditoria
  // ---------------------------------------------------------------------------
  logAction(docId: string, docName: string, acao: AuditLogDocumento['acao'], detalhes?: string): void {
    try {
      let list: AuditLogDocumento[] = [];
      for (const key of AUDIT_STORAGE_KEYS) {
        const raw = safeGetItem(key);
        if (raw) {
          list = JSON.parse(raw);
          break;
        }
      }
      const newLog: AuditLogDocumento = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        documentoId: docId,
        nomeDocumento: docName,
        usuario: 'Usuário do Sistema',
        acao,
        dataHora: new Date().toISOString(),
        ip: '127.0.0.1',
        detalhes,
      };
      const updated = [newLog, ...list.slice(0, 100)];
      const serialized = JSON.stringify(updated);
      for (const key of AUDIT_STORAGE_KEYS) {
        safeSetItem(key, serialized);
      }
    } catch {}
  },
};
