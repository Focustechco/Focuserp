import { useEffect, useMemo } from 'react';
import { useLocalStorageState } from "@/hooks/useDataStore";
import { PastaDMS, DocumentoDMS, AuditLogDocumento, FormatoArquivo, ModuloOrigemDMS } from "../types";
import { INITIAL_PASTAS, INITIAL_DOCUMENTOS } from "../data/initialData";
import { dmsService } from "@/services/dmsService";

export function useDocumentosStore() {
  const { data: rawPastas, addItem: addPastaItem, updateItem: updatePastaItem, removeItem: removePastaItem, save: savePastas } = useLocalStorageState<PastaDMS>('focus_dms_pastas', INITIAL_PASTAS);
  const { data: documentos, addItem: addDocItem, updateItem: updateDocItem, removeItem: removeDocItem } = useLocalStorageState<DocumentoDMS>('focus_dms_documentos', INITIAL_DOCUMENTOS);
  const { data: lixeira, addItem: addTrashItem, removeItem: removeTrashItem } = useLocalStorageState<DocumentoDMS>('focus_dms_lixeira');
  const { data: auditLogs, addItem: addAuditItem } = useLocalStorageState<AuditLogDocumento>('focus_dms_audit');

  // Leitura de entidades para sincronização automática de pastas
  const { data: clientes } = useLocalStorageState<any>('focus_clientes', []);
  const { data: projetos } = useLocalStorageState<any>('focus_projetos', []);
  const { data: colaboradores } = useLocalStorageState<any>('focus_colaboradores', []);
  const { data: produtos } = useLocalStorageState<any>('focus_produtos', []);

  // Pastas consolidadas com auto-geração para cada Cliente, Projeto, RH e Produto
  const pastas = useMemo(() => {
    const map = new Map<string, PastaDMS>();

    // 1. Pastas Padrão do Sistema
    INITIAL_PASTAS.forEach((p) => map.set(p.id, p));

    // 2. Pastas salvas pelo usuário
    (rawPastas || []).forEach((p) => map.set(p.id, p));

    // 3. Auto-sincronizar subpastas de Clientes
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

    // 4. Auto-sincronizar subpastas de Projetos
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

    // 5. Auto-sincronizar subpastas de RH (Colaboradores)
    (colaboradores || []).forEach((colab: any) => {
      if (colab && colab.id) {
        const folderId = `p-rh-colab-${colab.id}`;
        const nomeColab = colab.nome || colab.nomeCompleto || 'Colaborador';
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

    // 6. Auto-sincronizar subpastas de Produtos Focus
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
  }, [rawPastas, clientes, projetos, colaboradores, produtos]);

  // Persistir pastas sincronizadas se houver novas
  useEffect(() => {
    if (pastas.length !== (rawPastas || []).length) {
      savePastas(pastas);
    }
  }, [pastas, rawPastas, savePastas]);

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
    const caminhoCompleto = `${parentPath}/${nome}`.replace('//', '/');

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
    projetoId?: string;
    projetoNome?: string;
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
      projetoId: params.projetoId,
      projetoNome: params.projetoNome,
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

    logAction(docId, doc.nome, 'Versão Criada', `Nova versão ${newVersion} adicionada: ${descricaoAlteracao}`);
  };

  const moveToTrash = (docId: string) => {
    const doc = documentos.find((d) => d.id === docId);
    if (!doc) return;

    removeDocItem(docId);
    addTrashItem(doc);
    logAction(docId, doc.nome, 'Exclusão', 'Documento movido para a Lixeira');
  };

  const restoreFromTrash = (docId: string) => {
    const doc = lixeira.find((d) => d.id === docId);
    if (!doc) return;

    removeTrashItem(docId);
    addDocItem(doc);
    logAction(docId, doc.nome, 'Restauração', 'Documento restaurado da Lixeira');
  };

  const deletePermanently = (docId: string) => {
    const doc = lixeira.find((d) => d.id === docId);
    if (!doc) return;

    removeTrashItem(docId);
    logAction(docId, doc.nome, 'Exclusão', 'Documento excluído permanentemente');
  };

  const toggleFavorite = (docId: string) => {
    const doc = documentos.find((d) => d.id === docId);
    if (!doc) return;

    updateDocItem(docId, { favorito: !doc.favorito });
  };

  const moveDocument = (docId: string, newFolderId: string) => {
    const doc = documentos.find((d) => d.id === docId);
    const targetFolder = pastas.find((p) => p.id === newFolderId);
    if (!doc || !targetFolder) return;

    updateDocItem(docId, {
      pastaId: targetFolder.id,
      caminhoPasta: targetFolder.caminhoCompleto,
    });

    logAction(docId, doc.nome, 'Renomeação', `Documento movido para ${targetFolder.caminhoCompleto}`);
  };

  const updateDocument = (docId: string, patch: Partial<DocumentoDMS>) => {
    updateDocItem(docId, patch);
    const current = documentos.find(d => d.id === docId);
    if (current) {
      dmsService.saveDocumento({ ...current, ...patch });
    }
  };

  return {
    pastas,
    documentos,
    lixeira,
    auditLogs,
    createFolder,
    uploadDocument,
    uploadFileFromModule,
    addVersion,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    toggleFavorite,
    moveDocument,
    updateDocument,
    logAction,
  };
}
