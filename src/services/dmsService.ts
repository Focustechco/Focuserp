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

      // Fallback para localStorage
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('focus_app_dms_pastas');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }

      return [];
    } catch {
      return [];
    }
  },

  async savePasta(pasta: PastaDMS): Promise<void> {
    try {
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('focus_app_dms_pastas');
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((p: any) => p.id !== pasta.id);
        window.localStorage.setItem('focus_app_dms_pastas', JSON.stringify([...filtered, pasta]));
      }

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
      await supabase.from('dms_pastas').upsert(payload);
    } catch {}
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

      // Fallback para localStorage
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('focus_app_dms_documentos');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }

      return [];
    } catch {
      return [];
    }
  },

  async saveDocumento(doc: DocumentoDMS): Promise<void> {
    try {
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('focus_app_dms_documentos');
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((d: any) => d.id !== doc.id);
        window.localStorage.setItem('focus_app_dms_documentos', JSON.stringify([...filtered, doc]));
      }

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
      await supabase.from('dms_documentos').upsert(payload);
    } catch {}
  },

  async deleteDocumento(id: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('focus_app_dms_documentos');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter((d: any) => d.id !== id);
          window.localStorage.setItem('focus_app_dms_documentos', JSON.stringify(filtered));
        }
      }

      await supabase.from('dms_documentos').delete().eq('id', id);
    } catch {}
  }
};
