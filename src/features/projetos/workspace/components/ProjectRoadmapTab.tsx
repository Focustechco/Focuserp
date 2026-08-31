import React from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Flag, 
  Zap, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProjectRoadmapTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectRoadmapTab({ projeto, onNavigateTab }: ProjectRoadmapTabProps) {
  const { sprints, milestones, tasks, stats } = useProjetoWorkspaceStore(projeto);

  // Ordenar sprints e marcos cronologicamente
  const timelineItems = [
    ...sprints.map(s => ({
      id: s.id,
      tipo: 'sprint' as const,
      titulo: s.nome,
      subtitulo: s.objetivo,
      dataInicio: s.dataInicio,
      dataFim: s.dataFim,
      status: s.status,
      progresso: s.progresso,
    })),
    ...milestones.map(m => ({
      id: m.id,
      tipo: 'milestone' as const,
      titulo: m.titulo,
      subtitulo: m.entregavel || m.descricao,
      dataInicio: m.dataPrevisao,
      dataFim: m.dataPrevisao,
      status: m.status,
      progresso: m.status === 'Concluído' ? 100 : m.status === 'Em Andamento' ? 50 : 0,
    }))
  ].sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Roadmap Executivo & Timeline de Entregas
            </CardTitle>
            <CardDescription className="text-xs">
              Visão cronológica das Sprints, Macro Marcos e Entregáveis do projeto {projeto.codigo}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onNavigateTab('sprints')}
              className="rounded-xl text-xs gap-1 font-semibold"
            >
              <Zap className="w-3.5 h-3.5 text-orange-500" /> Ver Sprints
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onNavigateTab('marcos')}
              className="rounded-xl text-xs gap-1 font-semibold"
            >
              <Flag className="w-3.5 h-3.5 text-orange-500" /> Ver Marcos
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {timelineItems.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhum evento no Roadmap ainda</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Crie Sprints e Marcos para estruturar a linha do tempo de entrega do projeto.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-orange-500/30 ml-4 pl-6 sm:pl-8 space-y-8 my-2">
              {timelineItems.map((item) => {
                const isSprint = item.tipo === 'sprint';
                const isDone = item.status === 'Concluído' || item.status === 'Concluída';

                return (
                  <div key={item.id} className="relative group">
                    {/* Marcador na Timeline */}
                    <div className={`absolute -left-[33px] sm:-left-[41px] top-1.5 w-6 h-6 rounded-full border-4 border-background flex items-center justify-center transition-transform group-hover:scale-125 ${
                      isDone 
                        ? 'bg-emerald-600 text-white' 
                        : isSprint 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-purple-600 text-white'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-3 h-3" /> : isSprint ? <Zap className="w-3 h-3" /> : <Flag className="w-3 h-3" />}
                    </div>

                    {/* Card do Evento */}
                    <div className="p-4 rounded-2xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={isSprint ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]' : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 text-[10px]'}>
                            {isSprint ? 'Sprint' : 'Marco / Milestone'}
                          </Badge>
                          <h4 className="font-bold text-sm text-foreground">{item.titulo}</h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Calendar className="w-3.5 h-3.5 text-orange-500" />
                            {new Date(item.dataInicio).toLocaleDateString('pt-BR')} 
                            {item.dataInicio !== item.dataFim && ` → ${new Date(item.dataFim).toLocaleDateString('pt-BR')}`}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                        </div>
                      </div>

                      {item.subtitulo && (
                        <p className="text-xs text-muted-foreground">{item.subtitulo}</p>
                      )}

                      {isSprint && (
                        <div className="space-y-1 pt-1 border-t">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Avanço da Sprint</span>
                            <span className="font-bold text-foreground">{item.progresso}%</span>
                          </div>
                          <Progress value={item.progresso} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
