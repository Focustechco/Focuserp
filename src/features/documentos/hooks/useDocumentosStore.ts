import { useEffect, useMemo, useCallback } from 'react';
import { useLocalStorageState } from "@/hooks/useDataStore";
import { PastaDMS, DocumentoDMS, AuditLogDocumento, FormatoArquivo, ModuloOrigemDMS } from "../types";
import { INITIAL_PASTAS, INITIAL_DOCUMENTOS } from "../data/initialData";
import { dmsService } from "@/services/dmsService";
import { dmsBlobStore } from "@/lib/indexedDbStorage";

export function useDocumentosStore() {
  const { data: rawPastas, addItem: addPastaItem, updateItem: updatePastaItem, removeItem: removePastaItem, save: savePastas } = useLocalStorageState<PastaDMS>('focus_dms_pastas', INITIAL_PASTAS);
  const { data: rawDocumentos, addItem: addDocItem, updateItem: updateDocItem, removeItem: removeDocItem, save: saveDocumentos } = useLocalStorageState<DocumentoDMS>('focus_dms_documentos', INITIAL_DOCUMENTOS);
  const { data: lixeira, addItem: addTrashItem, removeItem: removeTrashItem, save: saveLixeira } = useLocalStorageState<DocumentoDMS>('focus_dms_lixeira', []);
  const { data: auditLogs, addItem: addAuditItem } = useLocalStorageState<AuditLogDocumento>('focus_dms_audit', []);
  const { data: deletedDocIds, addItem: addDeletedId, save: saveDeletedIds } = useLocalStorageState<string>('focus_dms_deleted_ids', []);

  // Leitura de entidades para sincronização automática de pastas
  const { data: clientes } = useLocalStorageState<any>('focus_clientes', []);
  const { data: fornecedores } = useLocalStorageState<any>('focus_fornecedores', []);
  const { data: projetos } = useLocalStorageState<any>('focus_projetos', []);
  const { data: colaboradores } = useLocalStorageState<any>('focus_rh_colaboradores', []);
  const { data: produtos } = useLocalStorageState<any>('focus_produtos', []);

  // 1. Pastas Oficiais e Subpastas Consolidadas (Deduplicação Estrita por Caminho e ID)
  const pastas = useMemo(() => {
    const map = new Map<string, PastaDMS>();
    const pathMap = new Map<string, string>(); // caminhoNormalizado -> idOficial
    const nameMap = new Map<string, string>(); // nomeNormalizado -> idOficial

    // 1.1 Pastas Oficiais Raízes e Subpastas Padrão
    INITIAL_PASTAS.forEach((p) => {
      map.set(p.id, p);
      pathMap.set(p.caminhoCompleto.toLowerCase().trim(), p.id);
      if (p.parentId === null) {
        nameMap.set(p.nome.toLowerCase().trim(), p.id);
      }
    });

    // 1.2 Auto-sincronizar subpastas de Clientes Cadastrados
    (clientes || []).forEach((c: any) => {
      if (c && c.id) {
        const folderId = `p-cli-${c.id}`;
        const nomeCliente = c.nomeFantasia || c.razaoSocial || c.nome || 'Cliente';
        const caminhoCompleto = `/Clientes/${nomeCliente}`;
        const pastaCliente: PastaDMS = {
          id: folderId,
          nome: nomeCliente,
          parentId: 'p-cli',
          caminhoCompleto,
          moduloVinculado: 'Clientes',
          entidadeId: c.id,
          dataCriacao: c.dataCadastro || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Clientes)',
        };
        map.set(folderId, pastaCliente);
        pathMap.set(caminhoCompleto.toLowerCase().trim(), folderId);
      }
    });

    // 1.3 Auto-sincronizar subpastas de Fornecedores Cadastrados
    (fornecedores || []).forEach((f: any) => {
      if (f && f.id) {
        const folderId = `p-forn-${f.id}`;
        const nomeForn = f.nomeFantasia || f.razaoSocial || f.nome || 'Fornecedor';
        const caminhoCompleto = `/Fornecedores/${nomeForn}`;
        const pastaForn: PastaDMS = {
          id: folderId,
          nome: nomeForn,
          parentId: 'p-forn',
          caminhoCompleto,
          moduloVinculado: 'Fornecedores',
          entidadeId: f.id,
          dataCriacao: f.dataCadastro || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Fornecedores)',
        };
        map.set(folderId, pastaForn);
        pathMap.set(caminhoCompleto.toLowerCase().trim(), folderId);
      }
    });

    // 1.4 Auto-sincronizar subpastas de Projetos Cadastrados
    (projetos || []).forEach((prj: any) => {
      if (prj && prj.id) {
        const folderId = `p-prj-${prj.id}`;
        const nomePrj = prj.codigo ? `${prj.codigo} - ${prj.nome || 'Projeto'}` : prj.nome || 'Projeto';
        const caminhoCompleto = `/Projetos/${nomePrj}`;
        const pastaPrj: PastaDMS = {
          id: folderId,
          nome: nomePrj,
          parentId: 'p-prj',
          caminhoCompleto,
          moduloVinculado: 'Projetos',
          entidadeId: prj.id,
          dataCriacao: prj.dataCriacao || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Projetos)',
        };
        map.set(folderId, pastaPrj);
        pathMap.set(caminhoCompleto.toLowerCase().trim(), folderId);
      }
    });

    // 1.5 Auto-sincronizar subpastas de RH (Colaboradores / Funcionários)
    (colaboradores || []).forEach((colab: any) => {
      if (colab && colab.id) {
        const folderId = `p-rh-colab-${colab.id}`;
        const nomeColab = colab.nome || colab.nomeCompleto || colab.nomeExibicao || 'Colaborador';
        const caminhoCompleto = `/RH/Colaboradores/${nomeColab}`;
        const pastaColab: PastaDMS = {
          id: folderId,
          nome: nomeColab,
          parentId: 'p-rh-colab',
          caminhoCompleto,
          moduloVinculado: 'RH',
          entidadeId: colab.id,
          dataCriacao: colab.dataAdmissao || new Date().toISOString(),
          criadoPor: 'Sistema Integrado (RH)',
        };
        map.set(folderId, pastaColab);
        pathMap.set(caminhoCompleto.toLowerCase().trim(), folderId);
      }
    });

    // 1.6 Auto-sincronizar subpastas de Produtos Focus
    (produtos || []).forEach((prod: any) => {
      if (prod && prod.id) {
        const folderId = `p-prod-${prod.id}`;
        const nomeProd = prod.nome || 'Produto Focus';
        const caminhoCompleto = `/Produtos Focus/${nomeProd}`;
        const pastaProd: PastaDMS = {
          id: folderId,
          nome: nomeProd,
          parentId: 'p-prod',
          caminhoCompleto,
          moduloVinculado: 'Produtos Focus',
          entidadeId: prod.id,
          dataCriacao: new Date().toISOString(),
          criadoPor: 'Sistema Integrado (Produtos)',
        };
        map.set(folderId, pastaProd);
        pathMap.set(caminhoCompleto.toLowerCase().trim(), folderId);
      }
    });

    // Mapeamento de subpastas conhecidas que nunca devem ficar soltas na raiz
    const KNOWN_SUBFOLDERS_PARENT_MAP: Record<string, { parentId: string; caminhoCompleto: string }> = {
      'extratos bancários': { parentId: 'p-fin', caminhoCompleto: '/Financeiro/Extratos Bancários' },
      'extratos': { parentId: 'p-fin', caminhoCompleto: '/Financeiro/Extratos Bancários' },
      'comprovantes': { parentId: 'p-fin', caminhoCompleto: '/Financeiro/Comprovantes' },
      'comprovantes bancários': { parentId: 'p-fin', caminhoCompleto: '/Financeiro/Comprovantes' },
      'assinaturas digitais': { parentId: 'p-ctr', caminhoCompleto: '/Contratos/Assinaturas Digitais' },
      'colaboradores': { parentId: 'p-rh', caminhoCompleto: '/RH/Colaboradores' },
      'serviços (nfs-e)': { parentId: 'p-fisc', caminhoCompleto: '/Fiscal/Serviços (NFS-e)' },
      'mercadorias (nf-e)': { parentId: 'p-fisc', caminhoCompleto: '/Fiscal/Mercadorias (NF-e)' },
      'propostas comerciais': { parentId: 'p-com', caminhoCompleto: '/Comercial/Propostas Comerciais' },
      'ordens de serviço': { parentId: 'p-com', caminhoCompleto: '/Comercial/Ordens de Serviço' },
      'ordens de serviço (os)': { parentId: 'p-com', caminhoCompleto: '/Comercial/Ordens de Serviço' },
      'campanhas': { parentId: 'p-mkt', caminhoCompleto: '/Marketing/Campanhas' },
      'dre gerencial': { parentId: 'p-rel', caminhoCompleto: '/Relatórios/DRE Gerencial' },
      'fluxo de caixa': { parentId: 'p-rel', caminhoCompleto: '/Relatórios/Fluxo de Caixa' },
      'faturamento e vendas': { parentId: 'p-rel', caminhoCompleto: '/Relatórios/Faturamento e Vendas' },
      'auditoria e compliance': { parentId: 'p-rel', caminhoCompleto: '/Relatórios/Auditoria e Compliance' },
      'recursos humanos': { parentId: 'p-rel', caminhoCompleto: '/Relatórios/Recursos Humanos' },
    };

    // 1.7 Pastas criadas pelo usuário (somente se não forem duplicatas de caminhos oficiais)
    (rawPastas || []).forEach((p) => {
      if (!p || !p.nome) return;
      const normNome = p.nome.toLowerCase().trim();
      const normalizedPath = (p.caminhoCompleto || `/${p.nome}`).toLowerCase().trim();

      // Se for subpasta conhecida que foi salva na raiz incorretamente
      if (KNOWN_SUBFOLDERS_PARENT_MAP[normNome]) {
        return;
      }

      // Se a pasta é oficial raiz ou já foi mapeada
      if (nameMap.has(normNome) && p.parentId === null) {
        return;
      }
      if (pathMap.has(normalizedPath)) {
        return;
      }

      // Se for uma pasta válida customizada criada pelo usuário
      if (!map.has(p.id)) {
        map.set(p.id, p);
        pathMap.set(normalizedPath, p.id);
      }
    });

    return Array.from(map.values());
  }, [rawPastas, clientes, fornecedores, projetos, colaboradores, produtos]);

  // Persistir pastas sincronizadas se houver alteração
  useEffect(() => {
    if (pastas.length !== (rawPastas || []).length) {
      savePastas(pastas);
    }
  }, [pastas, rawPastas, savePastas]);

  // 2. Documentos Reais e Persistentes (Sem oscilações ou documentos fantasmas)
  const documentos = useMemo(() => {
    const deletedSet = new Set(deletedDocIds || []);
    const trashSet = new Set((lixeira || []).map((t) => t.id));
    const docMap = new Map<string, DocumentoDMS>();

    // Criar mapa de pastas canônicas para normalização de IDs
    const folderPathToId = new Map<string, string>();
    pastas.forEach((p) => {
      folderPathToId.set(p.caminhoCompleto.toLowerCase().trim(), p.id);
      folderPathToId.set(p.nome.toLowerCase().trim(), p.id);
    });

    (rawDocumentos || []).forEach((d) => {
      if (!d || !d.id || deletedSet.has(d.id) || trashSet.has(d.id)) return;

      // Normalizar pastaId se apontar para ID antigo ou duplicado
      let correctedPastaId = d.pastaId;
      if (d.caminhoPasta) {
        const canonicalId = folderPathToId.get(d.caminhoPasta.toLowerCase().trim());
        if (canonicalId) {
          correctedPastaId = canonicalId;
        }
      }

      docMap.set(d.id, {
        ...d,
        pastaId: correctedPastaId || d.pastaId,
      });
    });

    return Array.from(docMap.values());
  }, [rawDocumentos, lixeira, deletedDocIds, pastas]);

  const logAction = useCallback((docId: string, docName: string, acao: AuditLogDocumento['acao'], detalhes?: string) => {
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
    addAuditItem(newLog);
  }, [addAuditItem]);

  const createFolder = (nome: string, parentId: string | null = null, moduloVinculado: ModuloOrigemDMS = 'Geral') => {
    let parentPath = '';
    if (parentId) {
      const parentFolder = pastas.find((p) => p.id === parentId);
      if (parentFolder) parentPath = parentFolder.caminhoCompleto;
    }
    const caminhoCompleto = `${parentPath}/${nome}`.replace(/\/\/+/g, '/');

    const newFolder: PastaDMS = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

    const newDocId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (params.urlConteudo && (params.urlConteudo.startsWith('data:') || params.urlConteudo.length > 2000)) {
      dmsBlobStore.saveBlob(newDocId, params.urlConteudo);
    }

    const storedUrl = params.urlConteudo && (params.urlConteudo.startsWith('data:') || params.urlConteudo.length > 2000)
      ? `indexeddb:${newDocId}`
      : params.urlConteudo;

    const newDoc: DocumentoDMS = {
      id: newDocId,
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
      urlConteudo: storedUrl,
      historicoVersoes: [
        {
          numeroVersao: '1.0',
          alteradoPor: 'Usuário do Sistema',
          dataAlteracao: new Date().toISOString(),
          descricaoAlteracao: 'Versão inicial enviada ao sistema.',
          tamanhoArquivo: params.tamanho,
          urlDownload: storedUrl,
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
