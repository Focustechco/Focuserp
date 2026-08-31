import { useEffect, useMemo } from 'react';
import { useLocalStorageState } from "@/hooks/useDataStore";
import { PastaDMS, DocumentoDMS, AuditLogDocumento, FormatoArquivo, ModuloOrigemDMS } from "../types";
import { INITIAL_PASTAS, INITIAL_DOCUMENTOS } from "../data/initialData";
import { dmsService } from "@/services/dmsService";

export function useDocumentosStore() {
  const { data: rawPastas, addItem: addPastaItem, updateItem: updatePastaItem, removeItem: removePastaItem, save: savePastas } = useLocalStorageState<PastaDMS>('focus_dms_pastas', INITIAL_PASTAS);
  const { data: rawDocumentos, addItem: addDocItem, updateItem: updateDocItem, removeItem: removeDocItem, save: saveDocumentos } = useLocalStorageState<DocumentoDMS>('focus_dms_documentos', INITIAL_DOCUMENTOS);
  const { data: lixeira, addItem: addTrashItem, removeItem: removeTrashItem, save: saveLixeira } = useLocalStorageState<DocumentoDMS>('focus_dms_lixeira', []);
  const { data: auditLogs, addItem: addAuditItem } = useLocalStorageState<AuditLogDocumento>('focus_dms_audit', []);
  const { data: deletedDocIds, addItem: addDeletedId, save: saveDeletedIds } = useLocalStorageState<string>('focus_dms_deleted_ids', []);

  // Leitura de entidades para sincronização automática de pastas e documentos
  const { data: clientes } = useLocalStorageState<any>('focus_clientes', []);
  const { data: fornecedores } = useLocalStorageState<any>('focus_fornecedores', []);
  const { data: projetos } = useLocalStorageState<any>('focus_projetos', []);
  const { data: colaboradores } = useLocalStorageState<any>('focus_rh_colaboradores', []);
  const { data: produtos } = useLocalStorageState<any>('focus_produtos', []);
  const { data: contratos } = useLocalStorageState<any>('focus_contratos', []);
  const { data: relatoriosHistorico } = useLocalStorageState<any>('focus_relatorios_history', []);
  const { data: assinaturasDocs } = useLocalStorageState<any>('focus_assinaturas_docs', []);
  const { data: fiscalDocs } = useLocalStorageState<any>('focus_fiscal_documentos', []);

  // 1. Pastas consolidadas com auto-geração para cada Módulo e Entidade
  const pastas = useMemo(() => {
    const map = new Map<string, PastaDMS>();

    // 1.1 Pastas Padrão do Sistema
    INITIAL_PASTAS.forEach((p) => map.set(p.id, p));

    // Pastas Raízes Obrigatórias de Módulos
    const defaultRoots: PastaDMS[] = [
      { id: 'p-cli', nome: 'Clientes', parentId: null, caminhoCompleto: '/Clientes', moduloVinculado: 'Clientes', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-forn', nome: 'Fornecedores', parentId: null, caminhoCompleto: '/Fornecedores', moduloVinculado: 'Fornecedores', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-prj', nome: 'Projetos', parentId: null, caminhoCompleto: '/Projetos', moduloVinculado: 'Projetos', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rh', nome: 'RH', parentId: null, caminhoCompleto: '/RH', moduloVinculado: 'RH', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rh-colab', nome: 'Colaboradores', parentId: 'p-rh', caminhoCompleto: '/RH/Colaboradores', moduloVinculado: 'RH', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-prod', nome: 'Produtos Focus', parentId: null, caminhoCompleto: '/Produtos Focus', moduloVinculado: 'Produtos Focus', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rel', nome: 'Relatórios', parentId: null, caminhoCompleto: '/Relatórios', moduloVinculado: 'Relatórios', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rel-dre', nome: 'DRE Gerencial', parentId: 'p-rel', caminhoCompleto: '/Relatórios/DRE Gerencial', moduloVinculado: 'Relatórios', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rel-fluxo', nome: 'Fluxo de Caixa', parentId: 'p-rel', caminhoCompleto: '/Relatórios/Fluxo de Caixa', moduloVinculado: 'Relatórios', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rel-faturam', nome: 'Faturamento e Vendas', parentId: 'p-rel', caminhoCompleto: '/Relatórios/Faturamento e Vendas', moduloVinculado: 'Relatórios', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rel-audit', nome: 'Auditoria e Compliance', parentId: 'p-rel', caminhoCompleto: '/Relatórios/Auditoria e Compliance', moduloVinculado: 'Relatórios', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-rel-rh', nome: 'Recursos Humanos', parentId: 'p-rel', caminhoCompleto: '/Relatórios/Recursos Humanos', moduloVinculado: 'Relatórios', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-ctr', nome: 'Contratos', parentId: null, caminhoCompleto: '/Contratos', moduloVinculado: 'Contratos', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-ass', nome: 'Assinaturas Digitais', parentId: null, caminhoCompleto: '/Assinaturas Digitais', moduloVinculado: 'Contratos', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-fisc', nome: 'Fiscal', parentId: null, caminhoCompleto: '/Fiscal', moduloVinculado: 'Fiscal', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-fin', nome: 'Financeiro', parentId: null, caminhoCompleto: '/Financeiro', moduloVinculado: 'Financeiro', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
      { id: 'p-com', nome: 'Comercial', parentId: null, caminhoCompleto: '/Comercial', moduloVinculado: 'Comercial', dataCriacao: '2026-01-01', criadoPor: 'Sistema' },
    ];
    defaultRoots.forEach((p) => map.set(p.id, p));

    // 1.2 Pastas salvas pelo usuário
    (rawPastas || []).forEach((p) => map.set(p.id, p));

    // 1.3 Auto-sincronizar subpastas de Clientes
    (clientes || []).forEach((c: any) => {
      if (c && c.id) {
        const folderId = `p-cli-${c.id}`;
        const nomeCliente = c.nomeFantasia || c.razaoSocial || c.nome || 'Cliente';
        map.set(folderId, {
          id: folderId,
          nome: nomeCliente,
          parentId: 'p-cli',
          caminhoCompleto: `/Clientes/${nomeCliente}`,
          moduloVinculado: 'Clientes',
          entidadeId: c.id,
          dataCriacao: c.dataCadastro || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Clientes)',
          corIcone: '#3B82F6',
        });
      }
    });

    // 1.4 Auto-sincronizar subpastas de Fornecedores
    (fornecedores || []).forEach((f: any) => {
      if (f && f.id) {
        const folderId = `p-forn-${f.id}`;
        const nomeForn = f.nomeFantasia || f.razaoSocial || f.nome || 'Fornecedor';
        map.set(folderId, {
          id: folderId,
          nome: nomeForn,
          parentId: 'p-forn',
          caminhoCompleto: `/Fornecedores/${nomeForn}`,
          moduloVinculado: 'Fornecedores',
          entidadeId: f.id,
          dataCriacao: f.dataCadastro || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Fornecedores)',
          corIcone: '#64748B',
        });
      }
    });

    // 1.5 Auto-sincronizar subpastas de Projetos
    (projetos || []).forEach((prj: any) => {
      if (prj && prj.id) {
        const folderId = `p-prj-${prj.id}`;
        const nomePrj = prj.codigo ? `${prj.codigo} - ${prj.nome || 'Projeto'}` : prj.nome || 'Projeto';
        map.set(folderId, {
          id: folderId,
          nome: nomePrj,
          parentId: 'p-prj',
          caminhoCompleto: `/Projetos/${nomePrj}`,
          moduloVinculado: 'Projetos',
          entidadeId: prj.id,
          dataCriacao: prj.dataCriacao || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Projetos)',
          corIcone: '#10B981',
        });
      }
    });

    // 1.6 Auto-sincronizar subpastas de RH (Colaboradores)
    (colaboradores || []).forEach((colab: any) => {
      if (colab && colab.id) {
        const folderId = `p-rh-colab-${colab.id}`;
        const nomeColab = colab.nome || colab.nomeCompleto || colab.nomeExibicao || 'Colaborador';
        map.set(folderId, {
          id: folderId,
          nome: nomeColab,
          parentId: 'p-rh-colab',
          caminhoCompleto: `/RH/Colaboradores/${nomeColab}`,
          moduloVinculado: 'RH',
          entidadeId: colab.id,
          dataCriacao: colab.dataAdmissao || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (RH)',
          corIcone: '#8B5CF6',
        });
      }
    });

    // 1.7 Auto-sincronizar subpastas de Produtos Focus
    (produtos || []).forEach((prod: any) => {
      if (prod && prod.id) {
        const folderId = `p-prod-${prod.id}`;
        const nomeProd = prod.nome || 'Produto Focus';
        map.set(folderId, {
          id: folderId,
          nome: nomeProd,
          parentId: 'p-prod',
          caminhoCompleto: `/Produtos Focus/${nomeProd}`,
          moduloVinculado: 'Produtos Focus',
          entidadeId: prod.id,
          dataCriacao: new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Produtos)',
          corIcone: '#FF6A00',
        });
      }
    });

    return Array.from(map.values());
  }, [rawPastas, clientes, fornecedores, projetos, colaboradores, produtos]);

  // Persistir pastas sincronizadas se houver novas
  useEffect(() => {
    if (pastas.length !== (rawPastas || []).length) {
      savePastas(pastas);
    }
  }, [pastas, rawPastas, savePastas]);

  // 2. Consolidação e Auto-Indexação Universal de Documentos Reais (excluindo os deletados)
  const documentos = useMemo(() => {
    const docMap = new Map<string, DocumentoDMS>();
    const deletedSet = new Set(deletedDocIds || []);

    // 2.1 Documentos Salvos no Banco de Dados DMS
    (rawDocumentos || []).forEach((d) => {
      if (d && d.id && !deletedSet.has(d.id)) {
        docMap.set(d.id, d);
      }
    });

    // 2.2 Auto-indexar Relatórios Gerados Reais (focus_relatorios_history) apenas se não houver no docMap
    const existingDocNames = new Set(Array.from(docMap.values()).map(d => (d.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '')));

    (relatoriosHistorico || []).forEach((rel: any) => {
      const docId = `doc-rel-${rel.id}`;
      const ext = (rel.format?.toLowerCase() || 'pdf') as FormatoArquivo;
      const reportTitle = rel.reportTitle || 'Relatório Executivo';
      const normalizedTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Evitar duplicatas se já foi salvo no DMS diretamente com urlConteudo ou mesmo nome
      const isAlreadyInDms = Array.from(docMap.values()).some(d => 
        d.id === docId || 
        (d.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedTitle)
      );

      if (!isAlreadyInDms && !docMap.has(docId) && !deletedSet.has(docId) && !deletedSet.has(rel.id)) {
        let pastaTargetId = 'p-rel-geral';
        if (rel.category === 'Financeiro' || reportTitle.includes('DRE')) pastaTargetId = 'p-rel-dre';
        else if (reportTitle.includes('Fluxo')) pastaTargetId = 'p-rel-fluxo';
        else if (rel.category === 'Comercial' || reportTitle.includes('Vendas')) pastaTargetId = 'p-rel-faturam';
        else if (rel.category === 'RH') pastaTargetId = 'p-rel-rh';
        else if (rel.category === 'Auditoria') pastaTargetId = 'p-rel-audit';

        docMap.set(docId, {
          id: docId,
          codigo: `REL-${new Date(rel.generatedAt || Date.now()).getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          nome: `${reportTitle}.${ext}`,
          extensao: ext,
          tamanho: rel.fileSize || '1.4 MB',
          tamanhoBytes: 1468006,
          pastaId: pastaTargetId,
          caminhoPasta: `/Relatórios/${rel.category || 'Geral'}`,
          moduloOrigem: 'Relatórios',
          relatorioTipo: reportTitle,
          categoria: `Relatório Executivo - ${rel.category || 'Geral'}`,
          tags: ['Relatórios', rel.category || 'Geral', 'Gerado Automaticamente'],
          responsavelUpload: rel.generatedBy || 'Sistema Integrado (Relatórios)',
          dataUpload: rel.generatedAt || new Date().toISOString(),
          dataUltimaAlteracao: rel.generatedAt || new Date().toISOString(),
          versaoAtual: '1.0',
          favorito: false,
          status: 'Ativo',
          historicoVersoes: [
            {
              numeroVersao: '1.0',
              alteradoPor: rel.generatedBy || 'Sistema Integrado (Relatórios)',
              dataAlteracao: rel.generatedAt || new Date().toISOString(),
              descricaoAlteracao: `Relatório oficial emitido com filtros: ${rel.filtersSummary || 'Geral'}`,
              tamanhoArquivo: rel.fileSize || '1.4 MB',
            },
          ],
        });
      }
    });

    // 2.3 Auto-indexar Contratos Reais (focus_contratos)
    (contratos || []).forEach((ctr: any) => {
      const docId = `doc-ctr-${ctr.id}`;
      if (!docMap.has(docId) && !deletedSet.has(docId) && !deletedSet.has(ctr.id)) {
        const clienteNome = ctr.clienteNome || 'Cliente';
        const clientFolderId = ctr.clienteId ? `p-cli-${ctr.clienteId}` : 'p-ctr';
        const numContrato = ctr.numeroContrato || `CTR-${ctr.id?.slice(0, 6)}`;

        docMap.set(docId, {
          id: docId,
          codigo: numContrato,
          nome: `Contrato_${numContrato}_${clienteNome.replace(/\s+/g, '_')}.pdf`,
          extensao: 'pdf',
          tamanho: '2.1 MB',
          tamanhoBytes: 2202009,
          pastaId: clientFolderId,
          caminhoPasta: ctr.clienteId ? `/Clientes/${clienteNome}` : '/Contratos',
          moduloOrigem: 'Contratos',
          clienteId: ctr.clienteId,
          clienteNome: clienteNome,
          contratoId: ctr.id,
          contratoNumero: numContrato,
          categoria: 'Contrato de Prestação de Serviços',
          tags: ['Contratos', ctr.status || 'Ativo', clienteNome],
          responsavelUpload: 'Módulo Contratos',
          dataUpload: ctr.created_at || ctr.dataInicio || new Date().toISOString(),
          dataUltimaAlteracao: ctr.updated_at || new Date().toISOString(),
          versaoAtual: '1.0',
          favorito: false,
          status: 'Ativo',
          historicoVersoes: [
            {
              numeroVersao: '1.0',
              alteradoPor: 'Módulo Contratos',
              dataAlteracao: ctr.created_at || new Date().toISOString(),
              descricaoAlteracao: `Objeto: ${ctr.objetoContrato || 'Prestação de Serviços'}. Valor: R$ ${(ctr.valorTotal || 0).toLocaleString('pt-BR')}`,
              tamanhoArquivo: '2.1 MB',
            },
          ],
        });
      }
    });

    // 2.4 Auto-indexar Assinaturas Digitais Reais (focus_assinaturas_docs)
    (assinaturasDocs || []).forEach((ass: any) => {
      const docId = `doc-ass-${ass.id}`;
      if (!docMap.has(docId) && !deletedSet.has(docId) && !deletedSet.has(ass.id)) {
        docMap.set(docId, {
          id: docId,
          codigo: `ASS-${ass.id?.slice(0, 6)?.toUpperCase() || 'DIG'}`,
          nome: `${ass.titulo || 'Documento Assinado'}.pdf`,
          extensao: 'pdf',
          tamanho: ass.tamanho || '1.8 MB',
          tamanhoBytes: 1887436,
          pastaId: 'p-ass',
          caminhoPasta: '/Assinaturas Digitais',
          moduloOrigem: 'Contratos',
          categoria: `Assinatura Digital (${ass.tipoDocumento || 'Geral'})`,
          tags: ['Assinaturas Digitais', ass.status || 'Em Assinatura', 'ICP-Brasil / Focus IAM'],
          responsavelUpload: ass.remetente || 'Módulo Assinaturas Digitais',
          dataUpload: ass.dataCriacao || new Date().toISOString(),
          dataUltimaAlteracao: ass.dataConclusao || new Date().toISOString(),
          versaoAtual: '1.0',
          favorito: false,
          status: 'Ativo',
          historicoVersoes: [
            {
              numeroVersao: '1.0',
              alteradoPor: ass.remetente || 'Módulo Assinaturas Digitais',
              dataAlteracao: ass.dataCriacao || new Date().toISOString(),
              descricaoAlteracao: `Assinaturas: ${ass.assinantes?.length || 0} signatários vinculados. Hash SHA-256 verificado.`,
              tamanhoArquivo: ass.tamanho || '1.8 MB',
            },
          ],
        });
      }
    });

    // 2.5 Auto-indexar Documentos Fiscais Reais (focus_fiscal_documentos)
    (fiscalDocs || []).forEach((fisc: any) => {
      const docId = `doc-fisc-${fisc.id}`;
      if (!docMap.has(docId) && !deletedSet.has(docId) && !deletedSet.has(fisc.id)) {
        const tipoNota = fisc.tipo || 'NFS-e';
        const nomeEntidade = fisc.entidade?.nome || 'Tomador';
        docMap.set(docId, {
          id: docId,
          codigo: `NF-${fisc.numero || fisc.id?.slice(0, 5)}`,
          nome: `DANFE_${tipoNota}_${fisc.numero || '000'}_${nomeEntidade.replace(/\s+/g, '_')}.pdf`,
          extensao: 'pdf',
          tamanho: '350 KB',
          tamanhoBytes: 358400,
          pastaId: 'p-fisc',
          caminhoPasta: '/Fiscal',
          moduloOrigem: 'Fiscal',
          categoria: `Nota Fiscal (${tipoNota})`,
          tags: ['Fiscal', tipoNota, `NF-${fisc.numero}`, nomeEntidade],
          responsavelUpload: 'Módulo Fiscal',
          dataUpload: fisc.dataEmissao || new Date().toISOString(),
          dataUltimaAlteracao: fisc.dataAtualizacao || new Date().toISOString(),
          versaoAtual: '1.0',
          favorito: false,
          status: 'Ativo',
          historicoVersoes: [
            {
              numeroVersao: '1.0',
              alteradoPor: 'Módulo Fiscal',
              dataAlteracao: fisc.dataEmissao || new Date().toISOString(),
              descricaoAlteracao: `Valor Total: R$ ${(fisc.valorTotal || 0).toLocaleString('pt-BR')}. Chave: ${fisc.chaveAcesso || 'N/A'}`,
              tamanhoArquivo: '350 KB',
            },
          ],
        });
      }
    });

    return Array.from(docMap.values());
  }, [rawDocumentos, relatoriosHistorico, contratos, assinaturasDocs, fiscalDocs, deletedDocIds]);

  const logAction = (docId: string, docName: string, acao: AuditLogDocumento['acao'], detalhes?: string) => {
    const newLog: AuditLogDocumento = {
      id: `log-${Date.now()}`,
      documentoId: docId,
      nomeDocumento: docName,
      usuario: 'Usuário do Sistema',
      acao,
      dataHora: new Date().toISOString(),
      ip: '127.0.0.1',
      detalhes,
    };
    addAuditItem(newLog);
  };

  const createFolder = (nome: string, parentId: string | null = null, moduloVinculado: ModuloOrigemDMS = 'Geral') => {
    let parentPath = '';
    if (parentId) {
      const parentFolder = pastas.find((p) => p.id === parentId);
      if (parentFolder) parentPath = parentFolder.caminhoCompleto;
    }
    const caminhoCompleto = `${parentPath}/${nome}`.replace(/\/\/+/g, '/');

    const newFolder: PastaDMS = {
      id: `p-${Date.now()}`,
      nome,
      parentId,
      caminhoCompleto,
      moduloVinculado,
      dataCriacao: new Date().toISOString(),
      criadoPor: 'Usuário do Sistema',
    };

    addPastaItem(newFolder);
    dmsService.savePasta(newFolder);
  };

  const uploadDocument = (params: {
    nome: string;
    extensao: FormatoArquivo;
    tamanho: string;
    tamanhoBytes: number;
    pastaId: string;
    moduloOrigem: ModuloOrigemDMS;
    categoria: string;
    tags: string[];
    clienteId?: string;
    clienteNome?: string;
    fornecedorId?: string;
    fornecedorNome?: string;
    projetoId?: string;
    projetoNome?: string;
    contratoId?: string;
    contratoNumero?: string;
    colaboradorId?: string;
    colaboradorNome?: string;
    produtoId?: string;
    produtoNome?: string;
    relatorioTipo?: string;
    urlConteudo?: string;
  }) => {
    const targetFolder = pastas.find((p) => p.id === params.pastaId);
    const caminhoPasta = targetFolder ? targetFolder.caminhoCompleto : `/${params.moduloOrigem}`;
    const codigo = `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDoc: DocumentoDMS = {
      id: `doc-${Date.now()}`,
      codigo,
      nome: params.nome,
      extensao: params.extensao,
      tamanho: params.tamanho,
      tamanhoBytes: params.tamanhoBytes,
      pastaId: params.pastaId,
      caminhoPasta,
      moduloOrigem: params.moduloOrigem,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      fornecedorId: params.fornecedorId,
      fornecedorNome: params.fornecedorNome,
      projetoId: params.projetoId,
      projetoNome: params.projetoNome,
      contratoId: params.contratoId,
      contratoNumero: params.contratoNumero,
      colaboradorId: params.colaboradorId,
      colaboradorNome: params.colaboradorNome,
      produtoId: params.produtoId,
      produtoNome: params.produtoNome,
      relatorioTipo: params.relatorioTipo,
      tags: params.tags,
      categoria: params.categoria,
      responsavelUpload: 'Usuário do Sistema',
      dataUpload: new Date().toISOString(),
      dataUltimaAlteracao: new Date().toISOString(),
      versaoAtual: '1.0',
      favorito: false,
      status: 'Ativo',
      urlConteudo: params.urlConteudo,
      historicoVersoes: [
        {
          numeroVersao: '1.0',
          alteradoPor: 'Usuário do Sistema',
          dataAlteracao: new Date().toISOString(),
          descricaoAlteracao: 'Versão inicial enviada ao sistema.',
          tamanhoArquivo: params.tamanho,
          urlDownload: params.urlConteudo,
        },
      ],
    };

    addDocItem(newDoc);
    dmsService.saveDocumento(newDoc);
    logAction(newDoc.id, newDoc.nome, 'Upload', `Arquivo indexado na pasta ${caminhoPasta}`);
    return newDoc;
  };

  const uploadFileFromModule = (params: Parameters<typeof dmsService.uploadFileFromModule>[0]) => {
    const doc = dmsService.uploadFileFromModule(params);
    addDocItem(doc);
    return doc;
  };

  const addVersion = (docId: string, descricaoAlteracao: string, novoTamanho: string) => {
    const doc = documentos.find((d) => d.id === docId);
    if (!doc) return;

    const currentMajor = parseInt(doc.versaoAtual.split('.')[0] || '1');
    const newVersion = `${currentMajor + 1}.0`;

    const updatedVersoes = [
      {
        numeroVersao: newVersion,
        alteradoPor: 'Usuário do Sistema',
        dataAlteracao: new Date().toISOString(),
        descricaoAlteracao,
        tamanhoArquivo: novoTamanho,
      },
      ...doc.historicoVersoes,
    ];

    updateDocItem(docId, {
      versaoAtual: newVersion,
      tamanho: novoTamanho,
      dataUltimaAlteracao: new Date().toISOString(),
      historicoVersoes: updatedVersoes,
    });

    logAction(doc.id, doc.nome, 'Versão Criada', `Nova versão ${newVersion} adicionada: ${descricaoAlteracao}`);
  };

  const renameDocument = (docId: string, novoNome: string) => {
    const doc = documentos.find((d) => d.id === docId);
    if (!doc) return;

    updateDocItem(docId, {
      nome: novoNome,
      dataUltimaAlteracao: new Date().toISOString(),
    });

    logAction(docId, novoNome, 'Renomeação', `Documento renomeado de '${doc.nome}' para '${novoNome}'`);
  };

  const toggleFavorite = (docId: string) => {
    const doc = documentos.find((d) => d.id === docId);
    if (!doc) return;

    updateDocItem(docId, {
      favorito: !doc.favorito,
    });
  };

  // Mover para Lixeira
  const moveToTrash = (docId: string) => {
    const doc = documentos.find((d) => d.id === docId);
    if (doc) {
      addTrashItem(doc);
      logAction(doc.id, doc.nome, 'Exclusão', 'Documento movido para a lixeira.');
    }

    removeDocItem(docId);
    if (!deletedDocIds.includes(docId)) {
      addDeletedId(docId);
    }
  };

  const moveToTrashBatch = (docIds: string[]) => {
    const docsToTrash = documentos.filter((d) => docIds.includes(d.id));
    saveLixeira([...(lixeira || []), ...docsToTrash]);
    saveDocumentos(rawDocumentos.filter((d) => !docIds.includes(d.id)));

    const newDeleted = Array.from(new Set([...(deletedDocIds || []), ...docIds]));
    saveDeletedIds(newDeleted);

    docsToTrash.forEach((d) => {
      logAction(d.id, d.nome, 'Exclusão', 'Documento movido para a lixeira (em lote).');
    });
  };

  // Restaurar da Lixeira
  const restoreFromTrash = (docId: string) => {
    const doc = (lixeira || []).find((d) => d.id === docId);
    if (!doc) return;

    removeTrashItem(docId);
    addDocItem(doc);
    saveDeletedIds((deletedDocIds || []).filter((id) => id !== docId));
    logAction(doc.id, doc.nome, 'Restauração', 'Documento restaurado da lixeira.');
  };

  // Excluir Permanentemente
  const deletePermanently = (docId: string) => {
    removeTrashItem(docId);
    removeDocItem(docId);
    if (!deletedDocIds.includes(docId)) {
      addDeletedId(docId);
    }
    dmsService.deleteDocumento(docId);
  };

  const deletePermanentlyBatch = (docIds: string[]) => {
    const idSet = new Set(docIds);
    saveLixeira((lixeira || []).filter((d) => !idSet.has(d.id)));
    saveDocumentos((rawDocumentos || []).filter((d) => !idSet.has(d.id)));

    const newDeleted = Array.from(new Set([...(deletedDocIds || []), ...docIds]));
    saveDeletedIds(newDeleted);

    dmsService.deleteDocumentosBatch(docIds);
  };

  const updateDocument = (docId: string, updates: Partial<DocumentoDMS>) => {
    updateDocItem(docId, updates);
  };

  return {
    pastas,
    documentos,
    lixeira: lixeira || [],
    auditLogs: auditLogs || [],
    createFolder,
    uploadDocument,
    uploadFileFromModule,
    addVersion,
    renameDocument,
    toggleFavorite,
    moveToTrash,
    moveToTrashBatch,
    restoreFromTrash,
    deletePermanently,
    deletePermanentlyBatch,
    updateDocument,
    logAction,
  };
}
