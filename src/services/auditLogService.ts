import { supabase } from '@/lib/supabaseClient';
import { auditLogSchema, AuditLogDTO } from '@/schemas/auditLogSchema';

export const auditLogService = {
  /**
   * Buscar registros de auditoria do sistema
   */
  async getAuditLogs(): Promise<AuditLogDTO[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users:user_id (
            nome,
            email
          )
        `)
        .order('data_hora', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const userName = item.users?.nome || item.user_name || item.userName || 'Sistema';

          const mapped = {
            id: item.id,
            tenantId: item.tenant_id,
            userId: item.user_id,
            userName,
            action: item.acao || item.action || 'Ação desconhecida',
            entity: item.entidade || item.entity || '',
            modulo: item.modulo || 'Geral',
            details: item.detalhes || item.details,
            ip: item.ip,
            dispositivo: item.dispositivo,
            detalhesJson: item.detalhes_json || {},
            dataHora: item.data_hora || item.created_at,
            created_at: item.created_at,
          };
          const parsed = auditLogSchema.safeParse(mapped);
          if (parsed.success) {
            return parsed.data;
          }
          console.error(`[auditLogService.getAuditLogs] Falha na validação do log ${item.id}:`, parsed.error.format());
          return null;
        }).filter((item): item is AuditLogDTO => item !== null);
      }

      // Fallback LocalStorage
      const rawLocal = typeof window !== 'undefined' ? window.localStorage.getItem('focus_dms_audit') : null;
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      }

      return [];
    } catch (err) {
      console.error('[auditLogService.getAuditLogs] Erro ao buscar logs de auditoria:', err);
      return [];
    }
  },

  /**
   * Registrar novo evento de auditoria
   */
  async logAction(logData: Partial<AuditLogDTO> & { action: string }): Promise<AuditLogDTO> {
    const id = logData.id || crypto.randomUUID();
    const dataHora = logData.dataHora || new Date().toISOString();

    const payload = {
      id,
      tenant_id: logData.tenantId,
      user_id: logData.userId,
      acao: logData.action,
      modulo: logData.modulo || 'Geral',
      ip: logData.ip || '127.0.0.1',
      dispositivo: logData.dispositivo || (typeof navigator !== 'undefined' ? navigator.userAgent : 'System'),
      detalhes: logData.details || logData.entity || '',
      detalhes_json: logData.detalhesJson || {},
      data_hora: dataHora,
    };

    const { error } = await supabase.from('audit_logs').insert(payload);
    if (error) {
      // Audit log failures are non-fatal: log the error but do not throw
      console.error('[auditLogService.logAction] Erro ao registrar audit log:', error);
    }

    const created: AuditLogDTO = {
      id,
      tenantId: logData.tenantId,
      userId: logData.userId,
      userName: logData.userName || 'Sistema',
      action: logData.action,
      entity: logData.entity || '',
      modulo: logData.modulo || 'Geral',
      details: logData.details,
      ip: payload.ip,
      dispositivo: payload.dispositivo,
      detalhesJson: payload.detalhes_json,
      dataHora,
      created_at: dataHora,
    };

    return auditLogSchema.parse(created);
  }
};
