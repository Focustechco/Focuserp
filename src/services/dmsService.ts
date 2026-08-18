import { supabase } from '@/lib/supabaseClient';
import { PastaDMS, DocumentoDMS, AuditLogDocumento } from '@/features/documentos/types';

/**
 * Service de Integração de Dados Reais no Banco Supabase para o Módulo de Gestão de Documentos (DMS / ECM).
 */
export const dmsService = {
  async getPastas(): Promise<PastaDMS[]> {
    try {
      const { data, error } = await supabase
        .from('dms_pastas')
        .select('*')
        .order('data_criacao', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          nome: item.nome || 'Nova Pasta',
          parentId: item.parent_id || null,
          caminhoCompleto: item.caminho_completo || `/${item.nome}`,
          moduloVinculado: item.modulo_vinculado,
          dataCriacao: item.data_criacao || new Date().toISOString(),
          criadoPor: item.criado_por || 'Usuário Administrador',
        }));
      }
      return [];
    } catch (err) {
      console.error('[dmsService.getPastas] Erro ao buscar no Supabase:', err);
      return [];
    }
  },

  async savePasta(pasta: PastaDMS): Promise<void> {
    try {
      const payload = {
        id: pasta.id,
        nome: pasta.nome,
        parent_id: pasta.parentId,
        caminho_completo: pasta.caminhoCompleto,
        modulo_vinculado: pasta.moduloVinculado,
        data_criacao: pasta.dataCriacao,
        criado_por: pasta.criadoPor,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('dms_pastas').upsert(payload);
      if (error) {
        console.warn('[dmsService.savePasta] Supabase upsert note:', error.message);
      }
    } catch (err) {
      console.error('[dmsService.savePasta] Erro:', err);
    }
  },

  async getDocumentos(): Promise<DocumentoDMS[]> {
    try {
      const { data, error } = await supabase
        .from('dms_documentos')
        .select('*')
        .order('data_upload', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          codigo: item.codigo || `DOC-${item.id}`,
          nome: item.nome || 'Documento Sem Nome',
          extensao: item.extensao || 'pdf',
          tamanho: item.tamanho || '1.0 MB',
          tamanhoBytes: item.tamanho_bytes || 1048576,
          pastaId: item.pasta_id || 'root',
          caminhoPasta: item.caminho_pasta || '/',
          moduloOrigem: item.modulo_origem || 'Geral',
          clienteId: item.cliente_id,
          clienteNome: item.cliente_nome,
          projetoId: item.projeto_id,
          projetoNome: item.projeto_nome,
          contratoId: item.contrato_id,
          contratoNumero: item.contrato_numero,
          tags: item.tags || [],
          categoria: item.categoria || 'Geral',
          responsavelUpload: item.responsavel_upload || 'Usuário Administrador',
          dataUpload: item.data_upload || new Date().toISOString(),
          dataUltimaAlteracao: item.data_ultima_alteracao || new Date().toISOString(),
          versaoAtual: item.versao_atual || '1.0',
          favorito: Boolean(item.favorito),
          status: item.status || 'Ativo',
          urlConteudo: item.url_conteudo,
          historicoVersoes: item.historico_versoes || [],
        }));
      }
      return [];
    } catch (err) {
      console.error('[dmsService.getDocumentos] Erro ao buscar no Supabase:', err);
      return [];
    }
  },

  async saveDocumento(doc: DocumentoDMS): Promise<void> {
    try {
      const payload = {
        id: doc.id,
        codigo: doc.codigo,
        nome: doc.nome,
        extensao: doc.extensao,
        tamanho: doc.tamanho,
        tamanho_bytes: doc.tamanhoBytes,
        pasta_id: doc.pastaId,
        caminho_pasta: doc.caminhoPasta || '/',
        modulo_origem: doc.moduloOrigem,
        cliente_id: doc.clienteId,
        cliente_nome: doc.clienteNome,
        projeto_id: doc.projetoId,
        projeto_nome: doc.projetoNome,
        contrato_id: doc.contratoId,
        contrato_numero: doc.contratoNumero,
        tags: doc.tags || [],
        categoria: doc.categoria,
        responsavel_upload: doc.responsavelUpload,
        data_upload: doc.dataUpload,
        data_ultima_alteracao: doc.dataUltimaAlteracao,
        versao_atual: doc.versaoAtual,
        favorito: doc.favorito,
        status: doc.status,
        url_conteudo: doc.urlConteudo,
        historico_versoes: doc.historicoVersoes,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('dms_documentos').upsert(payload);
      if (error) {
        console.warn('[dmsService.saveDocumento] Supabase upsert note:', error.message);
      }
    } catch (err) {
      console.error('[dmsService.saveDocumento] Erro:', err);
    }
  },

  async deleteDocumento(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('dms_documentos').delete().eq('id', id);
      if (error) {
        console.warn('[dmsService.deleteDocumento] Supabase delete note:', error.message);
      }
    } catch (err) {
      console.error('[dmsService.deleteDocumento] Erro:', err);
    }
  }
};
