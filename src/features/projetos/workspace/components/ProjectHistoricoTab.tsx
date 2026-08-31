import React from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  User, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Flag 
} from 'lucide-react';

interface ProjectHistoricoTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectHistoricoTab({ projeto }: ProjectHistoricoTabProps) {
  const { logs } = useProjetoWorkspaceStore(projeto);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-orange-500" /> Trilha de Auditoria & Histórico de Atividades
          </CardTitle>
          <CardDescription className="text-xs">
            Registro cronológico e imutável de todas as modificações realizadas no projeto {projeto.codigo}.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <History className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhuma atividade registrada</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Todas as ações (criação de tasks, refinamentos de backlog, sprints e marcos) serão auditadas automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-orange-500/20 ml-4 pl-6 space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-1 bg-orange-600 rounded-full w-3.5 h-3.5 border-2 border-background shadow-xs" />
                  
                  <div className="p-3.5 rounded-xl border bg-muted/10 space-y-1 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{log.acao}</span>
                        <Badge variant="outline" className="text-[10px]">{log.entidade}</Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                      <User className="w-3 h-3 text-orange-500" />
                      <span>Usuário: <strong>{log.usuarioNome}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
