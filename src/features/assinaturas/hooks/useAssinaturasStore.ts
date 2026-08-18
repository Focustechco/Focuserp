import { useLocalStorageState } from '@/hooks/useDataStore';
import { DocumentoAssinatura, ModeloDocumento, CertificadoDigital, TrilhaAuditoria } from '../types';
import { INITIAL_DOCUMENTOS_ASSINATURA, INITIAL_MODELOS_DOCUMENTOS, INITIAL_CERTIFICADOS } from '../data/initialData';
import { toast } from 'sonner';

export function useAssinaturasStore() {
  const { 
    data: documentos, 
    addItem: addDocumento, 
    updateItem: updateDocumento, 
    deleteItem: deleteDocumento 
  } = useLocalStorageState<DocumentoAssinatura>('focus_assinaturas_docs', INITIAL_DOCUMENTOS_ASSINATURA);

  const { data: modelos, addItem: addModelo } = useLocalStorageState<ModeloDocumento>('focus_assinaturas_modelos', INITIAL_MODELOS_DOCUMENTOS);
  const { data: certificados, addItem: addCertificado } = useLocalStorageState<CertificadoDigital>('focus_assinaturas_certificados', INITIAL_CERTIFICADOS);

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

    updateDocumento(docId, {
      status: todosAssinados ? 'Assinado' : 'Aguardando Assinatura',
      hashSHA256Assinado: novoHashDoc,
      carimboTempo: todosAssinados ? dataHoraNow : doc.carimboTempo,
      assinantes: assinantesAtualizados,
      auditoria: [novoLogAuditoria, ...(doc.auditoria || [])]
    });

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
    cancelarDocumento
  };
}
