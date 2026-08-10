import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Users,
  AlertTriangle,
  Repeat,
  Target,
  MoreHorizontal,
  Download,
  Plus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useContasReceberQuery } from "@/features/contas-receber/hooks/useContasReceberQuery";
import { useContasPagarQuery } from "@/features/contas-pagar/hooks/useContasPagarQuery";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Contrato } from "@/features/contratos/types";
import { NovoRecebimentoSheet } from "@/features/contas-receber/components/NovoRecebimentoSheet";

const currency = (v?: number | null) => {
  const num = typeof v === "number" && !isNaN(v) ? v : 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
};

const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

interface StatProps {
  label: string;
  value: string;
  delta: number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "success" | "destructive" | "muted";
}

function StatCard({ label, value, delta, hint, icon: Icon, accent = "primary" }: StatProps) {
  const up = delta >= 0;
  const accentClass =
    accent === "success"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
      : accent === "destructive"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
      : accent === "muted"
      ? "bg-muted text-muted-foreground"
      : "bg-primary/10 text-primary";

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${
              up ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
            }`}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { recebimentos: contasReceber = [] } = useContasReceberQuery();
  const { contas: contasPagar = [] } = useContasPagarQuery();
  const { clientes = [] } = useClientesQuery();
  const { data: contratos = [] } = useLocalStorageState<Contrato>("focus_contratos");

  // Cálculos dinâmicos
  const totalRecebido = contasReceber.reduce((acc, c) => acc + (c.valorRecebido || 0), 0);
  const totalPago = contasPagar.reduce((acc, c) => acc + (c.valorPago || 0), 0);
  const saldoEmCaixa = totalRecebido - totalPago;

  const receitasDoMes = contasReceber.reduce((acc, c) => acc + (c.valorOriginal || 0), 0);
  const despesasDoMes = contasPagar.reduce((acc, c) => acc + (c.valorOriginal || 0), 0);
  const lucroLiquido = receitasDoMes - despesasDoMes;

  const mrr = contratos.reduce((acc, c) => acc + (c.valorMensalidade || (c as any).valor_mensal || 0), 0);
  const arr = mrr * 12;
  const clientesAtivosCount = clientes.length;

  const titulosEmAberto = contasReceber.filter((c) => c.status !== "Recebido" && c.status !== "Pago");
  const valorEmAberto = titulosEmAberto.reduce((acc, c) => acc + (c.saldo || 0), 0);
  const percentualInadimplencia = receitasDoMes > 0 ? ((valorEmAberto / receitasDoMes) * 100).toFixed(1) : "0.0";

  // Próximos recebimentos pendentes
  const proximosRecebimentos = titulosEmAberto.slice(0, 6);

  // Agrupamento por Categoria para Receita
  const catMapReceita: Record<string, number> = {};
  contasReceber.forEach((c) => {
    const cat = c.categoria || "Geral";
    catMapReceita[cat] = (catMapReceita[cat] || 0) + (c.valorOriginal || 0);
  });
  const revenueByCategory = Object.keys(catMapReceita).length > 0
    ? Object.entries(catMapReceita).map(([name, value]) => ({ name, value }))
    : [{ name: "Sem receitas", value: 0 }];

  // Agrupamento por Categoria para Despesas
  const catMapDespesa: Record<string, number> = {};
  contasPagar.forEach((c) => {
    const cat = c.categoria || "Operacional";
    catMapDespesa[cat] = (catMapDespesa[cat] || 0) + (c.valorOriginal || 0);
  });
  const expensesByCenter = Object.keys(catMapDespesa).length > 0
    ? Object.entries(catMapDespesa).map(([name, value]) => ({ name, value }))
    : [{ name: "Sem despesas", value: 0 }];

  // Dados do gráfico de Fluxo de Caixa (Dynamic)
  const cashflowData = [
    { m: "Mês Atual", entradas: receitasDoMes, saidas: despesasDoMes },
  ];

  // Dados de MRR (Dynamic)
  const mrrData = [
    { m: "Mês Atual", v: mrr }
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão consolidada em tempo real do desempenho financeiro da Focus Tecnologia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <NovoRecebimentoSheet>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Recebimento
            </Button>
          </NovoRecebimentoSheet>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo em caixa" value={currency(saldoEmCaixa)} delta={0} hint="entradas - saídas" icon={Wallet} />
        <StatCard label="Receitas do mês" value={currency(receitasDoMes)} delta={0} hint="títulos previstos" icon={TrendingUp} accent="success" />
        <StatCard label="Despesas do mês" value={currency(despesasDoMes)} delta={0} hint="contas a pagar" icon={TrendingDown} accent="destructive" />
        <StatCard label="Lucro líquido" value={currency(lucroLiquido)} delta={0} hint="receitas - despesas" icon={PiggyBank} accent={lucroLiquido >= 0 ? "success" : "destructive"} />
        <StatCard label="MRR" value={currency(mrr)} delta={0} hint={`ARR: ${currency(arr)}`} icon={Repeat} />
        <StatCard label="Clientes ativos" value={String(clientesAtivosCount)} delta={0} hint="base cadastrada" icon={Users} />
        <StatCard label="Inadimplência" value={`${percentualInadimplencia}%`} delta={0} hint={`${currency(valorEmAberto)} em aberto`} icon={AlertTriangle} accent="destructive" />
        <StatCard label="Meta de faturamento" value={receitasDoMes > 0 ? "100%" : "0%"} delta={0} hint="acompanhamento em tempo real" icon={Target} accent="muted" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Fluxo de caixa</CardTitle>
              <CardDescription>Entradas vs Saídas registradas</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground/70" /> Saídas
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  cursor={{ stroke: "var(--color-border)" }}
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => currency(v)}
                />
                <Area type="monotone" dataKey="entradas" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gEnt)" />
                <Area type="monotone" dataKey="saidas" stroke="var(--color-foreground)" strokeOpacity={0.7} strokeWidth={2} fill="url(#gSai)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Receita por categoria</CardTitle>
              <CardDescription>Composição do faturamento real</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                >
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => currency(v)}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MRR — Receita recorrente</CardTitle>
            <CardDescription>Contratos ativos</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mrrData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => currency(v)}
                />
                <Line type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Despesas por categoria</CardTitle>
              <CardDescription>Distribuição de contas a pagar</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[240px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCenter} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => currency(v)}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Próximos recebimentos</CardTitle>
              <CardDescription>Títulos pendentes no sistema</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {proximosRecebimentos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum recebimento pendente cadastrado.
              </div>
            ) : (
              <div className="divide-y">
                {proximosRecebimentos.map((r) => {
                  const variant =
                    r.status === "Atrasado" || r.status === "Vencido"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
                  const clienteNome = r.cliente || (r as any).clienteNome || "Cliente";
                  const initials = (clienteNome || "C")
                    .split(" ")
                    .filter(Boolean)
                    .map((w: string) => w[0])
                    .slice(0, 2)
                    .join("") || "CL";
                  const valorExibir = r.saldo ?? r.valorOriginal ?? 0;
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{clienteNome}</p>
                          <p className="text-xs text-muted-foreground">{r.descricao || "Título"} · Vence em {r.dataVencimento || "A vencer"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={`${variant} border-0 text-[10px] font-medium`}>
                          {r.status || "Pendente"}
                        </Badge>
                        <span className="w-24 text-right text-sm font-semibold tabular-nums">
                          {currency(valorExibir)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo de Atividades</CardTitle>
            <CardDescription>Cadastros no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Clientes Cadastrados", count: clientes.length },
              { label: "Contratos Vigentes", count: contratos.length },
              { label: "Contas a Pagar", count: contasPagar.length },
              { label: "Contas a Receber", count: contasReceber.length },
            ].map((g) => (
              <div key={g.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{g.label}</span>
                  <span className="tabular-nums font-bold text-primary">
                    {g.count}
                  </span>
                </div>
                <Progress value={g.count > 0 ? 100 : 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
