import { supabase } from '@/lib/supabaseClient';
import { PastaDMS, DocumentoDMS, AuditLogDocumento, ModuloOrigemDMS, FormatoArquivo } from '@/features/documentos/types';
import { INITIAL_PASTAS, INITIAL_DOCUMENTOS } from '@/features/documentos/data/initialData';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const PASTAS_STORAGE_KEY = 'focus_app_dms_pastas';
const DOCS_STORAGE_KEY = 'focus_app_dms_documentos';
const AUDIT_STORAGE_KEY = 'focus_app_dms_audit';

/**
 * Service Central de Gestão de Documentos (DMS / ECM) integrado com
 * Clientes, Projetos, RH, Produtos Focus e Relatórios.
 */
export const dmsService = {
  // ---------------------------------------------------------------------------
  // Pastas
  // ---------------------------------------------------------------------------
  getPastas(): PastaDMS[] {
    try {
      const raw = safeGetItem(PASTAS_STORAGE_KEY);
      if (raw) {
        const list: PastaDMS[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          // Garantir que as pastas iniciais padrão também estejam presentes
          const map = new Map<string, PastaDMS>();
          INITIAL_PASTAS.forEach((p) => map.set(p.id, p));
          list.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        }
      }
    } catch {}
    return INITIAL_PASTAS;
  },

  async savePastas(pastas: PastaDMS[]): Promise<void> {
    safeSetItem(PASTAS_STORAGE_KEY, JSON.stringify(pastas));
  },

  async savePasta(pasta: PastaDMS): Promise<void> {
    const list = this.getPastas();
    const filtered = list.filter((p) => p.id !== pasta.id);
    const updated = [...filtered, pasta];
    await this.savePastas(updated);

    // Sincronizar em segundo plano com o Supabase caso a tabela exista
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
    entidadeId?: string
  ): PastaDMS {
    const pastas = this.getPastas();
    
    // Verificar se a pasta já existe
    const existing = pastas.find((p) => {
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

    const newFolder: PastaDMS = {
      id: entidadeId ? `p-${moduloVinculado.toLowerCase()}-${entidadeId}` : `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
    const rootFolder = this.ensureFolder('Clientes', null, 'Clientes');
    const nomeCliente = cliente.nomeFantasia || cliente.razaoSocial || cliente.nome || 'Cliente Sem Nome';
    return this.ensureFolder(nomeCliente, rootFolder.id, 'Clientes', cliente.id);
  },

  // 2. Projetos: Cria automaticamente /Projetos e /Projetos/[Nome do Projeto]
  ensureProjectFolder(projeto: { id: string; nome?: string; codigo?: string }): PastaDMS {
    const rootFolder = this.ensureFolder('Projetos', null, 'Projetos');
    const nomeProjeto = projeto.codigo ? `${projeto.codigo} - ${projeto.nome || 'Projeto'}` : projeto.nome || 'Projeto Sem Nome';
    return this.ensureFolder(nomeProjeto, rootFolder.id, 'Projetos', projeto.id);
  },

  // 3. RH: Cria automaticamente /RH e /RH/Colaboradores/[Nome do Colaborador]
  ensureRhFolder(colaborador: { id: string; nome?: string; nomeExibicao?: string }): PastaDMS {
    const rootFolder = this.ensureFolder('RH', null, 'RH');
    const colabRoot = this.ensureFolder('Colaboradores', rootFolder.id, 'RH');
    const nomeColaborador = colaborador.nome || colaborador.nomeExibicao || 'Colaborador';
    return this.ensureFolder(nomeColaborador, colabRoot.id, 'RH', colaborador.id);
  },

  // 4. Produtos Focus: Cria automaticamente /Produtos Focus e /Produtos Focus/[Nome do Produto]
  ensureProductFolder(produto: { id: string; nome?: string }): PastaDMS {
    const rootFolder = this.ensureFolder('Produtos Focus', null, 'Produtos Focus');
    const nomeProduto = produto.nome || 'Produto Focus';
    return this.ensureFolder(nomeProduto, rootFolder.id, 'Produtos Focus', produto.id);
  },

  // 5. Relatórios: Cria automaticamente /Relatórios e subpastas temáticas
  ensureReportFolder(tipo: 'DRE Gerencial' | 'Fluxo de Caixa' | 'Faturamento e Vendas' | 'Auditoria e Compliance' | 'Geral' = 'Geral'): PastaDMS {
    const rootFolder = this.ensureFolder('Relatórios', null, 'Relatórios');
    return this.ensureFolder(tipo, rootFolder.id, 'Relatórios');
  },

  // ---------------------------------------------------------------------------
  // Documentos
  // ---------------------------------------------------------------------------
  getDocumentos(): DocumentoDMS[] {
    try {
      const raw = safeGetItem(DOCS_STORAGE_KEY);
      if (raw) {
        const list: DocumentoDMS[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return INITIAL_DOCUMENTOS;
  },

  async saveDocumentos(docs: DocumentoDMS[]): Promise<void> {
    safeSetItem(DOCS_STORAGE_KEY, JSON.stringify(docs));
  },

  async saveDocumento(doc: DocumentoDMS): Promise<void> {
    const list = this.getDocumentos();
    const filtered = list.filter((d) => d.id !== doc.id);
    const updated = [doc, ...filtered];
    await this.saveDocumentos(updated);

    // Auditoria
    this.logAction(doc.id, doc.nome, 'Upload', `Arquivo indexado na pasta ${doc.caminhoPasta}`);

    try {
      await supabase.from('dms_documentos').upsert({
        id: doc.id,
        codigo: doc.codigo,
        nome: doc.nome,
        extensao: doc.extensao,
        tamanho: doc.tamanho,
        tamanho_bytes: doc.tamanhoBytes,
        pasta_id: doc.pastaId,
        caminho_pasta: doc.caminhoPasta,
        modulo_origem: doc.moduloOrigem,
        cliente_id: doc.clienteId,
        cliente_nome: doc.clienteNome,
        projeto_id: doc.projetoId,
        projeto_nome: doc.projetoNome,
        tags: doc.tags,
        categoria: doc.categoria,
        responsavel_upload: doc.responsavelUpload,
        data_upload: doc.dataUpload,
        data_ultima_alteracao: doc.dataUltimaAlteracao,
        versao_atual: doc.versaoAtual,
        favorito: doc.favorito,
        status: doc.status,
        url_conteudo: doc.urlConteudo,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  },

  // ---------------------------------------------------------------------------
  // Upload Integrado Direto a partir de Qualquer Módulo
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
      targetFolder = this.ensureReportFolder(params.relatorioTipo as any || 'Geral');
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
      const raw = safeGetItem(AUDIT_STORAGE_KEY);
      const list: AuditLogDocumento[] = raw ? JSON.parse(raw) : [];
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
      safeSetItem(AUDIT_STORAGE_KEY, JSON.stringify([newLog, ...list.slice(0, 100)]));
    } catch {}
  },
};
