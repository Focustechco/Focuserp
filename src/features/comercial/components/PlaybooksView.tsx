import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Layers, CheckCircle2, FileText, ExternalLink, Sparkles, Plus } from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';

export function PlaybooksView() {
  const { playbooks } = useComercialStore();
  const [selectedPlaybook, setSelectedPlaybook] = useState(playbooks[0]?.id || '');

  const active = playbooks.find(p => p.id === selectedPlaybook) || playbooks[0];

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <BookOpen className="w-5 h-5 text-orange-500" /> Playbooks Oficiais de Vendas (Focus Ops)
          </h3>
          <p className="text-xs text-muted-foreground">
            Manuais metodológicos passo a passo para SDRs, Closers e Consultores Comerciais.
          </p>
        </div>
      </div>

      {/* Grid com Seleção Lateral & Conteúdo do Playbook */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Menu Lateral de Playbooks */}
        <div className="space-y-2">
          {playbooks.map(pb => (
            <button
              key={pb.id}
              onClick={() => setSelectedPlaybook(pb.id)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all space-y-1 block ${
                active?.id === pb.id 
                  ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-500/60 shadow-xs' 
                  : 'bg-card border-border hover:border-orange-300'
              }`}
            >
              <Badge variant="outline" className="text-[10px] font-semibold text-orange-600 border-orange-400">
                {pb.funcaoAlvo}
              </Badge>
              <h4 className="font-bold text-xs text-foreground leading-snug">{pb.titulo}</h4>
            </button>
          ))}
        </div>

        {/* Conteúdo Detalhado do Playbook Ativo */}
        {active && (
          <Card className="md:col-span-3 rounded-2xl border shadow-xs bg-card">
            <CardHeader className="border-b pb-4 space-y-1.5">
              <div className="flex justify-between items-center">
                <Badge className="bg-orange-600 text-white font-bold text-xs">{active.funcaoAlvo}</Badge>
              </div>
              <CardTitle className="text-lg font-extrabold text-foreground">{active.titulo}</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                {active.descricao}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5 text-xs">
              {/* Etapas do Processo */}
              <div className="space-y-3">
                <h5 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" /> Etapas do Processo Metodológico
                </h5>

                <div className="space-y-3">
                  {active.etapasDoProcesso.map((et, idx) => (
                    <div key={idx} className="p-4 rounded-xl border bg-muted/20 space-y-1.5">
                      <h6 className="font-bold text-xs text-primary">{et.titulo}</h6>
                      <p className="text-foreground text-xs leading-relaxed">{et.instrucoes}</p>

                      {et.ferramentasRecomendadas && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground font-semibold">Ferramentas:</span>
                          {et.ferramentasRecomendadas.map((f, fIdx) => (
                            <span key={fIdx} className="text-[10px] bg-background border px-1.5 py-0.5 rounded-md font-mono">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklists Oficiais */}
              {active.checklists && (
                <div className="space-y-2 pt-3 border-t">
                  <h5 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Checklists de Qualidade & Conformidade
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {active.checklists.map((chk, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium text-foreground">{chk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
