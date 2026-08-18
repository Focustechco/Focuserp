import { useLocalStorageState } from "@/hooks/useDataStore";
import { PastaDMS, DocumentoDMS, AuditLogDocumento, FormatoArquivo, ModuloOrigemDMS } from "../types";
import { INITIAL_PASTAS, INITIAL_DOCUMENTOS } from "../data/initialData";
import { dmsService } from "@/services/dmsService";

export function useDocumentosStore() {
  const { data: pastas, addItem: addPastaItem, updateItem: updatePastaItem, removeItem: removePastaItem } = useLocalStorageState<PastaDMS>('focus_dms_pastas', INITIAL_PASTAS);
  const { data: documentos, addItem: addDocItem, updateItem: updateDocItem, removeItem: removeDocItem } = useLocalStorageState<DocumentoDMS>('focus_dms_documentos', INITIAL_DOCUMENTOS);
  const { data: lixeira, addItem: addTrashItem, removeItem: removeTrashItem } = useLocalStorageState<DocumentoDMS>('focus_dms_lixeira');
  const { data: auditLogs, addItem: addAuditItem } = useLocalStorageState<AuditLogDocumento>('focus_dms_audit');

  const logAction = (docId: string, docName: string, acao: AuditLogDocumento['acao'], detalhes?: string) => {
    const newLog: AuditLogDocumento = {
      id: `log-${Date.now()}`,
      documentoId: docId,
      nomeDocumento: docName,
      usuario: 'Usuário Administrador',
      acao,
      dataHora: new Date().toISOString(),
      ip: '192.168.1.100',
      detalhes
    };
    addAuditItem(newLog);
  };

  const createFolder = (nome: string, parentId: string | null = null, moduloVinculado?: ModuloOrigemDMS) => {
    let parentPath = '';
    if (parentId) {
      const parentFolder = pastas.find(p => p.id === parentId);
      if (parentFolder) parentPath = parentFolder.caminhoCompleto;
    }
    const caminhoCompleto = `${parentPath}/${nome}`;

    const newFolder: PastaDMS = {
      id: `p-${Date.now()}`,
      nome,
      parentId,
      caminhoCompleto,
      moduloVinculado,
      dataCriacao: new Date().toISOString(),
      criadoPor: 'Usuário Administrador'
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
    contratoId?: string;
    contratoNumero?: string;
    urlConteudo?: string;
  }) => {
    const targetFolder = pastas.find(p => p.id === params.pastaId);
    const caminhoPasta = targetFolder ? targetFolder.caminhoCompleto : '/';
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
      contratoId: params.contratoId,
      contratoNumero: params.contratoNumero,
      tags: params.tags,
      categoria: params.categoria,
      responsavelUpload: 'Usuário Administrador',
      dataUpload: new Date().toISOString(),
      dataUltimaAlteracao: new Date().toISOString(),
      versaoAtual: '1.0',
      favorito: false,
      status: 'Ativo',
      urlConteudo: params.urlConteudo,
      historicoVersoes: [
        {
          numeroVersao: '1.0',
          alteradoPor: 'Usuário Administrador',
          dataAlteracao: new Date().toISOString(),
          descricaoAlteracao: 'Versão inicial enviada ao sistema.',
          tamanhoArquivo: params.tamanho,
          urlDownload: params.urlConteudo
        }
      ]
    };

    addDocItem(newDoc);
    dmsService.saveDocumento(newDoc);
    logAction(newDoc.id, newDoc.nome, 'Upload', `Arquivo enviado para ${caminhoPasta}`);
  };

  const addVersion = (docId: string, descricaoAlteracao: string, novoTamanho: string) => {
    const doc = documentos.find(d => d.id === docId);
    if (!doc) return;

    const currentMajor = parseInt(doc.versaoAtual.split('.')[0] || '1');
    const newVersion = `${currentMajor + 1}.0`;

    const updatedVersoes = [
      {
        numeroVersao: newVersion,
        alteradoPor: 'Usuário Administrador',
        dataAlteracao: new Date().toISOString(),
        descricaoAlteracao,
        tamanhoArquivo: novoTamanho
      },
      ...doc.historicoVersoes
    ];

    updateDocItem(docId, {
      versaoAtual: newVersion,
      tamanho: novoTamanho,
      dataUltimaAlteracao: new Date().toISOString(),
      historicoVersoes: updatedVersoes
    });

    logAction(docId, doc.nome, 'Versão Criada', `Nova versão ${newVersion} adicionada: ${descricaoAlteracao}`);
  };

  const moveToTrash = (docId: string) => {
    const doc = documentos.find(d => d.id === docId);
    if (!doc) return;

    removeDocItem(docId);
    addTrashItem(doc);
    logAction(docId, doc.nome, 'Exclusão', 'Documento movido para a Lixeira');
  };

  const restoreFromTrash = (docId: string) => {
    const doc = lixeira.find(d => d.id === docId);
    if (!doc) return;

    removeTrashItem(docId);
    addDocItem(doc);
    logAction(docId, doc.nome, 'Restauração', 'Documento restaurado da Lixeira');
  };

  const deletePermanently = (docId: string) => {
    const doc = lixeira.find(d => d.id === docId);
    if (!doc) return;

    removeTrashItem(docId);
    logAction(docId, doc.nome, 'Exclusão', 'Documento excluído permanentemente');
  };

  const toggleFavorite = (docId: string) => {
    const doc = documentos.find(d => d.id === docId);
    if (!doc) return;

    updateDocItem(docId, { favorito: !doc.favorito });
  };

  const moveDocument = (docId: string, newFolderId: string) => {
    const doc = documentos.find(d => d.id === docId);
    const targetFolder = pastas.find(p => p.id === newFolderId);
    if (!doc || !targetFolder) return;

    updateDocItem(docId, {
      pastaId: targetFolder.id,
      caminhoPasta: targetFolder.caminhoCompleto
    });

    logAction(docId, doc.nome, 'Renomeação', `Documento movido para ${targetFolder.caminhoCompleto}`);
  };

  return {
    pastas,
    documentos,
    lixeira,
    auditLogs,
    createFolder,
    uploadDocument,
    addVersion,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    toggleFavorite,
    moveDocument,
    logAction
  };
}
