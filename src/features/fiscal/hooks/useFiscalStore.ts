import { useLocalStorageState } from '@/hooks/useDataStore';
import { DocumentoFiscal } from '../types';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';

const INITIAL_FISCAL_DOCS: DocumentoFiscal[] = [
  {
    id: 'd1000000-0000-4000-8000-000000000001',
    tipo: 'NFS-e',
    numero: '1042',
    serie: '1',
    chaveAcesso: '35260112345678901234550010000010421009876543',
    dataEmissao: '2026-07-15',
    dataEntrada: '2026-07-15',
    entidade: {
      tipo: 'Cliente',
      id: 'c1000000-0000-4000-8000-000000000001',
      nome: 'TechServices Brasil Ltda',
      cnpjCpf: '12.345.678/0001-90'
    },
    vinculos: {
      projetoId: 'a1000000-0000-4000-8000-000000000001',
      projetoNome: 'Implantação ERP Focus',
      centroCusto: 'Tecnologia'
    },
    valorTotal: 18500.00,
    observacoes: 'Nota fiscal emitida referente aos serviços mensais de consultoria ERP.',
    impostos: [
      { id: 'imp-1', tipo: 'ISS', baseCalculo: 18500.00, aliquota: 5.0, valor: 925.00 },
      { id: 'imp-2', tipo: 'PIS', baseCalculo: 18500.00, aliquota: 0.65, valor: 120.25 },
      { id: 'imp-3', tipo: 'COFINS', baseCalculo: 18500.00, aliquota: 3.0, valor: 555.00 }
    ],
    retencoes: [
      { id: 'ret-1', tipo: 'IRRF', percentual: 1.5, valor: 277.50, responsavel: 'Tomador' }
    ],
    anexos: [
      {
        id: 'anx-1',
        nome: 'NFSe_1042_TechServices.pdf',
        extensao: 'pdf',
        tamanho: '240 KB',
        dataUpload: new Date().toISOString(),
        usuario: 'Ana Costa',
        url: ''
      }
    ],
    historico: [
      {
        id: 'hist-1',
        dataHora: new Date().toISOString(),
        usuario: 'Ana Costa',
        acao: 'Emissão e Validação',
        detalhes: 'Nota fiscal gerada e validada com sucesso.'
      }
    ],
    status: 'Emitido',
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: 'd2000000-0000-4000-8000-000000000002',
    tipo: 'NF-e',
    numero: '4589',
    serie: '2',
    chaveAcesso: '35260198765432109876550020000045891001234567',
    dataEmissao: '2026-07-18',
    dataEntrada: '2026-07-19',
    entidade: {
      tipo: 'Fornecedor',
      id: 'f1000000-0000-4000-8000-000000000001',
      nome: 'Kalunga Comércio de Suprimentos',
      cnpjCpf: '98.765.432/0001-10'
    },
    vinculos: {
      centroCusto: 'Administrativo'
    },
    valorTotal: 3450.80,
    observacoes: 'Aquisição de suprimentos de escritório e periféricos de informática.',
    impostos: [
      { id: 'imp-10', tipo: 'ICMS', baseCalculo: 3450.80, aliquota: 18.0, valor: 621.14 }
    ],
    retencoes: [],
    anexos: [
      {
        id: 'anx-2',
        nome: 'NFe_4589_Kalunga.pdf',
        extensao: 'pdf',
        tamanho: '512 KB',
        dataUpload: new Date().toISOString(),
        usuario: 'Carlos Silva',
        url: ''
      }
    ],
    historico: [
      {
        id: 'hist-2',
        dataHora: new Date().toISOString(),
        usuario: 'Carlos Silva',
        acao: 'Recebimento e Registros',
        detalhes: 'Nota de entrada registrada e vinculada ao contas a pagar.'
      }
    ],
    status: 'Recebido',
    dataAtualizacao: new Date().toISOString()
  }
];

export function useFiscalStore() {
  const { data: documentos, addItem, updateItem, removeItem, setItems } = useLocalStorageState<DocumentoFiscal>(
    'focus_fiscal_documentos',
    INITIAL_FISCAL_DOCS
  );

  const { pastas, uploadDocument } = useDocumentosStore();

  const saveDocumentoAndSyncDMS = (doc: DocumentoFiscal, fileDataUrl?: string) => {
    // 1. Salvar no estado local do Módulo Fiscal
    const exists = documentos.some(d => d.id === doc.id);
    if (exists) {
      updateItem(doc.id, doc);
    } else {
      addItem(doc);
    }

    // 2. Salvar AUTOMATICAMENTE no Módulo de Documentos (DMS)
    let pastaFiscal = pastas.find(p => 
      p.nome.toLowerCase().includes('fiscal') || 
      p.moduloVinculado?.toLowerCase() === 'fiscal'
    ) || pastas[0];

    if (pastaFiscal) {
      // A) Salvar a Nota Fiscal Gerada / Registro Fiscal
      const nomeNotaGerada = `Nota_Gerada_${doc.tipo}_${doc.numero}_${doc.entidade.nome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      uploadDocument({
        nome: nomeNotaGerada,
        extensao: 'PDF',
        tamanho: '350 KB',
        tamanhoBytes: 350 * 1024,
        pastaId: pastaFiscal.id,
        moduloOrigem: 'Fiscal',
        categoria: `Nota Fiscal Gerada (${doc.tipo})`,
        tags: ['Fiscal', 'Nota Gerada', doc.tipo, `NF-${doc.numero}`, doc.entidade.nome],
        clienteId: doc.entidade.tipo === 'Cliente' ? doc.entidade.id : undefined,
        clienteNome: doc.entidade.tipo === 'Cliente' ? doc.entidade.nome : undefined,
        projetoId: doc.vinculos?.projetoId,
        projetoNome: doc.vinculos?.projetoNome,
        contratoId: doc.vinculos?.contratoId,
        contratoNumero: doc.vinculos?.contratoNome,
        urlConteudo: fileDataUrl || (doc.anexos.length > 0 ? doc.anexos[0].url : undefined)
      });

      // B) Salvar a Nota Upada / Arquivos Anexados
      if (doc.anexos && doc.anexos.length > 0) {
        doc.anexos.forEach(anx => {
          const extUpper = anx.extensao.toUpperCase();
          const extValid = (extUpper === 'PDF' || extUpper === 'XML' || extUpper === 'DOCX' || extUpper === 'XLSX') ? extUpper : 'PDF';
          
          uploadDocument({
            nome: `Nota_Upada_${anx.nome}`,
            extensao: extValid as any,
            tamanho: anx.tamanho || '500 KB',
            tamanhoBytes: 500 * 1024,
            pastaId: pastaFiscal.id,
            moduloOrigem: 'Fiscal',
            categoria: `Nota Fiscal Upada (Anexo)`,
            tags: ['Fiscal', 'Nota Upada', anx.extensao.toUpperCase(), `NF-${doc.numero}`],
            clienteId: doc.entidade.tipo === 'Cliente' ? doc.entidade.id : undefined,
            clienteNome: doc.entidade.tipo === 'Cliente' ? doc.entidade.nome : undefined,
            projetoId: doc.vinculos?.projetoId,
            projetoNome: doc.vinculos?.projetoNome,
            contratoId: doc.vinculos?.contratoId,
            contratoNumero: doc.vinculos?.contratoNome,
            urlConteudo: anx.url || fileDataUrl
          });
        });
      }
    }
  };

  return {
    documentos,
    saveDocumentoAndSyncDMS,
    deleteDocumento: removeItem,
    setDocumentos: setItems
  };
}
