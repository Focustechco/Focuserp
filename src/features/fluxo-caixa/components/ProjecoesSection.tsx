import React, { useState } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { consolidateFluxoFromStores } from '../utils/consolidateData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ProjecoesSection() {
  const { data: titulos } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contas } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const [horizonteDias, setHorizonteDias] = useState<string>('30');
  const [cenario, setCenario] = useState<'realista' | 'otimista' | 'pessimista'>('realista');

  const fluxoConsolidado = consolidateFluxoFromStores(titulos, contas);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const limiteDias = Number(horizonteDias);
  const dataLimite = new Date(hoje.getTime() + limiteDias * 86400000);

  // Filtrar ttulos com vencimento no horizonte futuro
  const titulosFuturos = titulos.filter((t) => {
    if (t.status === 'Cancelado' || t.status === 'Recebido') return false;
    const dt = new Date(t.dataVencimento || Date.now());
    return dt >= hoje && dt <= dataLimite;
  });

  const contasFuturas = contas.filter((c) => {
    if (c.status === 'Cancelado' || c.status === 'Pago') return false;
    const dt = new Date(c.dataVencimento || Date.now());
    return dt >= hoje && dt <= dataLimite;
  });

  // Saldo Atual Realizado (soma das movimentações confirmadas)
  const saldoAtualRealizado = fluxoConsolidado.length > 0 ? fluxoConsolidado[fluxoConsolidado.length - 1].saldoAcumuladoDia : 0;

  // Cálculo das entradas e saídas no período selecionado
  const entradasBase = titulosFuturos.reduce((acc, t) => acc + (t.valorOriginal - (t.valorRecebido || 0)), 0);
  const saidasBase = contasFuturas.reduce((acc, c) => acc + (c.valorOriginal - (c.valorPago || 0)), 0);

  // Ajustes de Cenários
  let fatorEntrada = 1.0;
  let fatorSaida = 1.0;

  if (cenario === 'otimista') {
    fatorEntrada = 1.1; // +10% novos contratos/recebimentos
    fatorSaida = 0.95; // -5% economia operacional
  } else if (cenario === 'pessimista') {
    fatorEntrada = 0.85; // 15% de inadimplência/atraso
    fatorSaida = 1.05; // +5% de imprevistos
  }

  const entradasProjetadas = entradasBase * fatorEntrada;
  const saidasProjetadas = saidasBase * fatorSaida;
  const resultadoProjetadoPeriodo = entradasProjetadas - saidasProjetadas;
  const saldoFinalProjetado = saldoAtualRealizado + resultadoProjetadoPeriodo;

  // Agrupamento por Semanas/Perodos no horizonte selecionado
  const projecoesSemanais: Array<{
    periodoLabel: string;
    entradas: number;
    saidas: number;
    resultado: number;
    saldoAcumulado: number;
  }> = [];

  let saldoAcumuladoTemp = saldoAtualRealizado;
  const numSemanas = Math.ceil(limiteDias / 7);

  for (let i = 0; i < numSemanas; i++) {
    const inicioSem = new Date(hoje.getTime() + i * 7 * 86400000);
    const fimSem = new Date(hoje.getTime() + (i + 1) * 7 * 86400000);

    const recSemana = titulosFuturos
      .filter((t) => {
        const d = new Date(t.dataVencimento || Date.now());
        return d >= inicioSem && d < fimSem;
      })
      .reduce((acc, t) => acc + (t.valorOriginal - (t.valorRecebido || 0)), 0) * fatorEntrada;

    const pagSemana = contasFuturas
      .filter((c) => {
        const d = new Date(c.dataVencimento || Date.now());
        return d >= inicioSem && d < fimSem;
      })
      .reduce((acc, c) => acc + (c.valorOriginal - (c.valorPago || 0)), 0) * fatorSaida;

    const resSemana = recSemana - pagSemana;
    saldoAcumuladoTemp += resSemana;

    projecoesSemanais.push({
      periodoLabel: `Semana ${i + 1} (${inicioSem.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${fimSem.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`,
      entradas: recSemana,
      saidas: pagSemana,
      resultado: resSemana,
      saldoAcumulado: saldoAcumuladoTemp,
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DE PROJEES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Projeções de Fluxo de Caixa Futuro
          </h2>
          <p className="text-xs text-muted-foreground">
            Modelagem preditiva baseada estritamente nas obrigaes reais a pagar e ttulos a receber cadastrados
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Horizonte */}
          <div className="w-40">
            <Select value={horizonteDias} onValueChange={setHorizonteDias}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Horizonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Prximos 30 dias</SelectItem>
                <SelectItem value="60">Prximos 60 dias</SelectItem>
                <SelectItem value="90">Prximos 90 dias</SelectItem>
                <SelectItem value="180">Prximos 180 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Cenrio */}
          <div className="w-36">
            <Select value={cenario} onValueChange={(val: any) => setCenario(val)}>
              <SelectTrigger className="text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realista">Cenrio Realista</SelectItem>
                <SelectItem value="otimista">Cenrio Otimista</SelectItem>
                <SelectItem value="pessimista">Cenrio Pessimista</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPIS DE PROJEO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saldo Atual em Caixa
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{formatCurrency(saldoAtualRealizado)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Saldo de ponto de partida</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Entradas Projetadas ({horizonteDias}d)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(entradasProjetadas)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {titulosFuturos.length} ttulo(s) a receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saídas Projetadas ({horizonteDias}d)
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              -{formatCurrency(saidasProjetadas)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {contasFuturas.length} conta(s) a pagar
            </p>
          </CardContent>
        </Card>

        <Card className={saldoFinalProjetado >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saldo Projetado Final
            </CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${saldoFinalProjetado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(saldoFinalProjetado)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Resultado no final dos {horizonteDias} dias ({cenario})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE PROJEÇÃO SEMANAL */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Evolução Projetada por Período</CardTitle>
              <CardDescription className="text-xs">
                Demonstrativo semana a semana do fluxo financeiro previsto
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">
              Cenário: {cenario}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Período Semanal</TableHead>
                <TableHead className="text-xs text-right">Entradas Previstas</TableHead>
                <TableHead className="text-xs text-right">Saídas Previstas</TableHead>
                <TableHead className="text-xs text-right">Resultado do Período</TableHead>
                <TableHead className="text-xs text-right bg-muted/20">Saldo Projetado Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projecoesSemanais.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    Sem lançamentos futuros para os próximos {horizonteDias} dias.
                  </TableCell>
                </TableRow>
              ) : (
                projecoesSemanais.map((p, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell className="text-xs font-semibold text-foreground">
                      {p.periodoLabel}
                    </TableCell>

                    <TableCell className="text-xs text-right font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.entradas)}
                    </TableCell>

                    <TableCell className="text-xs text-right font-medium text-rose-600 dark:text-rose-400">
                      -{formatCurrency(p.saidas)}
                    </TableCell>

                    <TableCell
                      className={`text-xs text-right font-bold ${
                        p.resultado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {p.resultado >= 0 ? '+' : ''}
                      {formatCurrency(p.resultado)}
                    </TableCell>

                    <TableCell
                      className={`text-xs text-right font-black bg-muted/10 ${
                        p.saldoAcumulado >= 0 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(p.saldoAcumulado)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
