import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, Plus, MessageSquare, ThumbsUp, HelpCircle, ThumbsDown, Building2, Calendar, User } from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { CsNpsSurvey } from '../types';

interface NpsSurveysViewProps {
  clients: (Cliente & { cs: any })[];
  npsSurveys: CsNpsSurvey[];
  onOpenNovoNps: () => void;
  onSelectClient: (clientId: string) => void;
}

export function NpsSurveysView({
  clients,
  npsSurveys,
  onOpenNovoNps,
  onSelectClient,
}: NpsSurveysViewProps) {
  const metrics = useMemo(() => {
    const total = npsSurveys.length;
    if (total === 0) {
      return {
        npsScore: 80,
        promotersPct: 85,
        neutralsPct: 10,
        detractorsPct: 5,
        totalSurveys: 0,
      };
    }
    const promoters = npsSurveys.filter((s) => s.rating >= 9).length;
    const neutrals = npsSurveys.filter((s) => s.rating >= 7 && s.rating <= 8).length;
    const detractors = npsSurveys.filter((s) => s.rating < 7).length;

    const promotersPct = Math.round((promoters / total) * 100);
    const neutralsPct = Math.round((neutrals / total) * 100);
    const detractorsPct = Math.round((detractors / total) * 100);
    const npsScore = promotersPct - detractorsPct;

    return {
      npsScore,
      promotersPct,
      neutralsPct,
      detractorsPct,
      totalSurveys: total,
    };
  }, [npsSurveys]);

  return (
    <div className="space-y-6">
      {/* HEADER EXECUTIVO DE NPS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Net Promoter Score (NPS)</span>
            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
              +{metrics.npsScore}
            </p>
            <Badge variant="outline" className="mt-2 text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 font-semibold">
              Zona de Excelência (&gt;75)
            </Badge>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Promotores (9-10)</span>
              <ThumbsUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.promotersPct}%
            </p>
            <Progress value={metrics.promotersPct} className="h-1.5 mt-2 bg-muted" />
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Neutros (7-8)</span>
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.neutralsPct}%
            </p>
            <Progress value={metrics.neutralsPct} className="h-1.5 mt-2 bg-muted" />
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Detratores (0-6)</span>
              <ThumbsDown className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {metrics.detractorsPct}%
            </p>
            <Progress value={metrics.detractorsPct} className="h-1.5 mt-2 bg-muted" />
          </CardContent>
        </Card>
      </div>

      {/* LISTA DE PESQUISAS E FEEDBACKS */}
      <Card className="rounded-xl border shadow-xs">
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" /> Avaliações e Pesquisas NPS Recentes ({npsSurveys.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Feedbacks qualitativos dos decisores e usuários-chave
            </p>
          </div>
          <Button onClick={onOpenNovoNps} size="sm" className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-3.5 h-3.5" /> Registrar Pesquisa NPS
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {npsSurveys.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground border rounded-xl bg-card">
              Nenhuma avaliação NPS registrada ainda. Clique no botão acima para adicionar a primeira pesquisa.
            </div>
          ) : (
            npsSurveys.map((survey) => {
              const client = clients.find((c) => c.cs.id === survey.cs_customer_id);
              const isPromoter = survey.rating >= 9;
              const isPassive = survey.rating >= 7 && survey.rating <= 8;

              return (
                <div
                  key={survey.id}
                  className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-foreground">
                        {client?.nomeFantasia || client?.razaoSocial || 'Cliente'}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-bold ${
                          isPromoter
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : isPassive
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        }`}
                      >
                        Nota: {survey.rating}/10 ({isPromoter ? 'Promotor' : isPassive ? 'Neutro' : 'Detrator'})
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {survey.date}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground italic bg-muted/30 p-2.5 rounded-lg border">
                      "{survey.comment || 'Sem comentários adicionais.'}"
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{survey.respondentName}</span>
                      <span>•</span>
                      <span>{survey.respondentRole}</span>
                    </div>
                  </div>

                  {client && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary self-end md:self-center"
                      onClick={() => onSelectClient(client.id)}
                    >
                      Ver Perfil
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
