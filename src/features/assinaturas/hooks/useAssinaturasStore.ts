import React, { useMemo, useEffect } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { DocumentoAssinatura, ModeloDocumento, CertificadoDigital, TrilhaAuditoria } from '../types';
import { INITIAL_DOCUMENTOS_ASSINATURA, INITIAL_MODELOS_DOCUMENTOS, INITIAL_CERTIFICADOS } from '../data/initialData';
import { dmsService } from '@/services/dmsService';
import { toast } from 'sonner';

export function useAssinaturasStore() {
  const { 
    data: rawDocumentos, 
    addItem: addDocumentoRaw, 
    updateItem: updateDocumento, 
    deleteItem: deleteDocumento 
  } = useLocalStorageState<DocumentoAssinatura>('focus_assinaturas_docs', INITIAL_DOCUMENTOS_ASSINATURA);

  const { data: modelos, addItem: addModelo } = useLocalStorageState<ModeloDocumento>('focus_assinaturas_modelos', INITIAL_MODELOS_DOCUMENTOS);
  const { data: certificados, addItem: addCertificado } = useLocalStorageState<CertificadoDigital>('focus_assinaturas_certificados', INITIAL_CERTIFICADOS);

  // Auto-purga de registros corrompidos ou sem título no armazenamento local
  useEffect(() => {
    if (Array.isArray(rawDocumentos)) {
      const invalidDocs = rawDocumentos.filter(d => !d || !d.id || !d.titulo || !d.titulo.trim());
      if (invalidDocs.length > 0) {
        invalidDocs.forEach(inv => {
          if (inv?.id) {
            deleteDocumento(inv.id);
          }
        });
      }
    }
  }, [rawDocumentos, deleteDocumento]);

  // Filtrar apenas documentos válidos com título
  const documentos = useMemo(() => {
    return (rawDocumentos || []).filter(d => Boolean(d && d.id && d.titulo && d.titulo.trim()));
  }, [rawDocumentos]);

  const zerarTodosDocumentos = () => {
    (rawDocumentos || []).forEach(d => {
      if (d?.id) deleteDocumento(d.id);
    });
    try {
      localStorage.removeItem('focus_assinaturas_docs');
      localStorage.removeItem('focus_app_focus_assinaturas_docs');
    } catch {}
    toast.success('Histórico de assinaturas zerado com sucesso!');
  };

  const addDocumento = (doc: DocumentoAssinatura) => {
    if (!doc.titulo || !doc.titulo.trim()) return;
    addDocumentoRaw(doc);
    try {
      dmsService.uploadFileFromModule({
        nome: `${doc.titulo || 'Documento Assinatura'}.pdf`,
        extensao: 'pdf',
        tamanho: doc.tamanho || '1.8 MB',
        tamanhoBytes: 1887436,
        moduloOrigem: 'Contratos',
        categoria: `Assinatura Digital (${doc.tipoDocumento || 'Geral'})`,
        tags: ['Assinaturas Digitais', doc.status, doc.tipoDocumento || 'Geral'],
        responsavelUpload: doc.remetente || 'Módulo Assinaturas Digitais',
        urlConteudo: doc.urlArquivo,
      });
    } catch {}
  };

  // Registrar assinatura em um documento
  const assinarDocumento = (
    docId: string, 
    assinanteId: string, 
    metodo: 'Focus IAM' | 'Gov.br' | 'ICP-Brasil A1/A3',
    detalhesAutenticacao: { ip?: string; dispositivo?: string }
  ) => {
    const doc = documentos.find(d => d.id === docId);
    if (!doc) return;

    const dataHoraNow = new Date().toISOString();
    const novoHashDoc = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-VERIFIED`;

    const assinantesAtualizados = (doc.assinantes || []).map(a => {
      if (a.id === assinanteId) {
        return {
          ...a,
          status: 'Assinado' as const,
          dataHoraAssinatura: dataHoraNow,
          metodoAutenticacao: metodo,
          ipOrigem: detalhesAutenticacao.ip || '187.62.190.12'
        };
      }
      return a;
    });

    const todosAssinados = assinantesAtualizados.every(a => a.status === 'Assinado');

    const atorEncontrado = (doc.assinantes || []).find(a => a.id === assinanteId);

    const novoLogAuditoria: TrilhaAuditoria = {
      id: `aud-${Date.now()}`,
      dataHora: dataHoraNow,
      evento: `Assinatura Efetuada (${metodo})`,
      ator: atorEncontrado?.nome || 'Assinante',
      emailAtor: atorEncontrado?.email || 'email@exemplo.com',
      ip: detalhesAutenticacao.ip || '187.62.190.12',
      dispositivo: detalhesAutenticacao.dispositivo || 'Navegador Web',
      metodoAutenticacao: metodo,
      hashSHA256: novoHashDoc,
      detalhes: `Assinatura digital efetuada via ${metodo}. Carimbo de tempo atrelado à chave privada.`
    };

    const novoStatus = todosAssinados ? 'Assinado' : 'Aguardando Assinatura';

    updateDocumento(docId, {
      status: novoStatus,
      hashSHA256Assinado: novoHashDoc,
      carimboTempo: todosAssinados ? dataHoraNow : doc.carimboTempo,
      assinantes: assinantesAtualizados,
      auditoria: [novoLogAuditoria, ...(doc.auditoria || [])]
    });

    // Auto-sincronizar documento assinado com o DMS
    try {
      dmsService.uploadFileFromModule({
        nome: `${doc.titulo || 'Documento_Assinado'}_ASSINADO.pdf`,
        extensao: 'pdf',
        tamanho: doc.tamanho || '1.8 MB',
        tamanhoBytes: 1887436,
        moduloOrigem: 'Contratos',
        categoria: `Assinatura Digital (${novoStatus})`,
        tags: ['Assinaturas Digitais', novoStatus, metodo],
        responsavelUpload: atorEncontrado?.nome || 'Assinante',
        urlConteudo: doc.urlArquivo,
      });
    } catch {}

    toast.success('Assinatura registrada com sucesso!', {
      description: `O documento foi assinado via ${metodo}.`
    });
  };

  // Cancelar documento
  const cancelarDocumento = (docId: string, motivo: string) => {
    const doc = documentos.find(d => d.id === docId);
    if (!doc) return;

    const novoLog: TrilhaAuditoria = {
      id: `aud-${Date.now()}`,
      dataHora: new Date().toISOString(),
      evento: 'Documento Cancelado',
      ator: 'Administrador',
      emailAtor: 'admin@focustecnologia.com.br',
      ip: '187.62.190.12',
      dispositivo: 'Navegador Web',
      metodoAutenticacao: 'Focus IAM',
      hashSHA256: doc.hashSHA256Original || 'HASH-ORIGINAL',
      detalhes: `Fluxo de assinatura interrompido: ${motivo}`
    };

    updateDocumento(docId, {
      status: 'Cancelado',
      auditoria: [novoLog, ...(doc.auditoria || [])]
    });

    toast.warning('Documento cancelado.', { description: motivo });
  };

  return {
    documentos,
    modelos,
    certificados,
    addDocumento,
    updateDocumento,
    deleteDocumento,
    addModelo,
    addCertificado,
    assinarDocumento,
    cancelarDocumento,
    zerarTodosDocumentos
  };
}
