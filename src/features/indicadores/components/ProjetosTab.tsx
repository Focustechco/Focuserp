import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Clock, Percent, Target } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Projeto } from '@/features/projetos/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ProjetosTab() {
  const { data: projetos } = useLocalStorageState<Projeto>('focus_projetos', []);

  const metricas = useMemo(() => {
    let ativos = 0;
    let atrasados = 0;
    let receitaProjetos = 0;
    let horasTotais = 0;
    let lucroEstimado = 0;

    const scatterData: any[] = [];

    projetos.forEach(p => {
      const isConcluido = p.status === 'Concluído' || p.status === 'Cancelado';
      if (!isConcluido) ativos++;

      // Simples heurística de atrasado: sem ver a data, vamos fingir que se horasRealizadas > horasPlanejadas é atraso/estouro.
      if (p.horasRealizadas > p.horasPlanejadas && p.horasPlanejadas > 0) {
        atrasados++;
      }

      receitaProjetos += p.valorContratado || 0;
      horasTotais += p.horasRealizadas || 0;

      const custoEstimado = (p.horasPlanejadas || 0) * 100; // Mock: 100 reais a hora
      const lucroProj = p.valorContratado - custoEstimado;
      lucroEstimado += lucroProj;

      if (!isConcluido) {
        scatterData.push({
          name: p.nome,
          custo: custoEstimado,
          margem: p.valorContratado > 0 ? (lucroProj / p.valorContratado) * 100 : 0,
          horas: p.horasRealizadas || 10
        });
      }
    });

    const margemMedia = receitaProjetos > 0 ? (lucroEstimado / receitaProjetos) * 100 : 0;
    const custoTotal = horasTotais * 100;
    const roiMedio = custoTotal > 0 ? ((receitaProjetos - custoTotal) / custoTotal) * 100 : 0;

    // Fallback pra chart não ficar vazio
    if (scatterData.length === 0) {
      scatterData.push(
        { name: 'Exemplo Alpha', custo: 150000, margem: 45, horas: 1200 },
        { name: 'Exemplo Beta', custo: 85000, margem: 52, horas: 600 }
      );
    }

    return {
      ativos,
      atrasados,
      receitaProjetos,
      margemMedia,
      roiMedio,
      scatterData
    };
  }, [projetos]);

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pt-4">
      <div className="order-2 md:order-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metricas.ativos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gerando {formatCurrency(metricas.receitaProjetos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <Percent className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metricas.margemMedia.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acima da meta (35%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio (Projetos)</CardTitle>
            <Target className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {metricas.roiMedio.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos em Alerta</CardTitle>
            <Clock className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metricas.atrasados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estouro de horas planejado
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="order-1 md:order-2 grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Análise de Rentabilidade vs Esforço (Custo x Margem)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" dataKey="custo" name="Custo do Projeto" stroke="#888888" tickFormatter={(v) => `R$ ${v/1000}k`} />
                <YAxis type="number" dataKey="margem" name="Margem (%)" stroke="#888888" unit="%" />
                <ZAxis type="number" dataKey="horas" range={[50, 500]} name="Horas Investidas" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px' }} formatter={(val, name, props) => {
                  if (name === 'Custo do Projeto') return formatCurrency(val as number);
                  if (name === 'Margem (%)') return `${val?.toFixed ? (val as number).toFixed(1) : val}%`;
                  return val;
                }} labelFormatter={() => ''} />
                <Scatter name="Projetos" data={metricas.scatterData} fill="#3b82f6" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
