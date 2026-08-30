import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Users, UserCheck, DollarSign, Wallet, 
  TrendingUp, ShieldCheck, PieChart as PieIcon, ArrowUpRight, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor } from '@/features/fornecedores/types';
import { ContaPagar } from '@/features/contas-pagar/types';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function FornecedoresTab() {
  const { data: fornecedoresData } = useLocalStorageState<Fornecedor>('focus_fornecedores', []);
  const { data: contasPagarData } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const fornecedores = Array.isArray(fornecedoresData) ? fornecedoresData : [];
  const contasPagar = Array.isArray(contasPagarData) ? contasPagarData : [];

  const metricas = useMemo(() => {
    const total = fornecedores.length;
    const ativos = fornecedores.filter(f => f?.status === 'Ativo' || f?.status === 'Homologado').length;
    const pjCount = fornecedores.filter(f => f?.tipo === 'Pessoa Jurídica').length;
    const pfCount = fornecedores.filter(f => f?.tipo === 'Pessoa Física').length;

    // Calcular pagamentos a fornecedores
    let totalPago = fornecedores.reduce((acc, f) => acc + (f?.totalPago || 0), 0);
    let saldoAberto = fornecedores.reduce((acc, f) => acc + (f?.saldoAberto || 0), 0);

    // Se houver contas a pagar reais no sistema, integrar
    if (contasPagar.length > 0) {
      const pagoCP = contasPagar.filter(c => c.status === 'Pago').reduce((acc, c) => acc + c.valorOriginal, 0);
      const abertoCP = contasPagar.filter(c => c.status === 'Pendente' || c.status === 'Vencido').reduce((acc, c) => acc + c.valorOriginal, 0);
      if (pagoCP > 0) totalPago = pagoCP;
      if (abertoCP > 0) saldoAberto = abertoCP;
    }

    // Distribuição por categoria
    const catMap: Record<string, number> = {};
    fornecedores.forEach(f => {
      const cat = f?.categoria || 'Serviços Gerais';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const dataCategorias = Object.entries(catMap).map(([name, value]) => ({
      name,
      value
    }));

    // Top Fornecedores por Volume
    const topGastos = fornecedores.map(f => {
      const nome = f?.nomeFantasia || f?.razaoSocial || 'Fornecedor';
      return {
        id: f?.id,
        nome,
        categoria: f?.categoria || 'Geral',
        status: f?.status || 'Ativo',
        chavePix: f?.dadosBancarios?.[0]?.chavePix || 'Não informada',
        pago: f?.totalPago || 0,
        aberto: f?.saldoAberto || 0,
        total: (f?.totalPago || 0) + (f?.saldoAberto || 0)
      };
    }).sort((a, b) => b.total - a.total).slice(0, 5);

    return {
      total,
      ativos,
      pjCount,
      pfCount,
      totalPago,
      saldoAberto,
      dataCategorias,
      topGastos
    };
  }, [fornecedores, contasPagar]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* 4 CARDS DE KPIS FORNECEDORES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Building2 className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {metricas.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricas.pjCount} Pessoas Jurídicas e {metricas.pfCount} PFs
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Homologados</CardTitle>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {metricas.ativos}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricas.total > 0 ? ((metricas.ativos / metricas.total) * 100).toFixed(0) : 100}% da base homologada
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volume Total Liquidado</CardTitle>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(metricas.totalPago)}
            </div>
            <p className="text-xs text-muted-foreground">
              Histórico pago a parceiros
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo a Liquidar (Aberto)</CardTitle>
            <Wallet className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(metricas.saldoAberto)}
            </div>
            <p className="text-xs text-muted-foreground">
              Previsão de contas a pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS DE CATEGORIAS E TOP FORNECEDORES */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Categoria */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-500" /> Fornecedores por Segmento
            </CardTitle>
            <CardDescription className="text-xs">
              Classificação por tipo de serviço e suprimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex items-center justify-center">
              {metricas.dataCategorias.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhum fornecedor cadastrado.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricas.dataCategorias}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {metricas.dataCategorias.map((entry, index) => (
                        <Cell key={`pie-cat-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Fornecedores por Volume */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Top Fornecedores por Volume (R$)
            </CardTitle>
            <CardDescription className="text-xs">
              Principais contas e valores consolidados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {metricas.topGastos.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Nenhum dado financeiro disponível.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas.topGastos} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Volume Pago']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="pago" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {metricas.topGastos.map((entry, index) => (
                        <Cell key={`cell-top-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE PRINCIPAIS PARCEIROS */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-500" /> Principais Fornecedores & Parceiros Estratégicos
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Razão Social / Nome Fantasia</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Chave PIX / Contato</th>
                  <th className="p-3 text-right">Volume Pago (R$)</th>
                  <th className="p-3 text-right">Saldo em Aberto (R$)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metricas.topGastos.map(f => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">{f.nome}</td>
                    <td className="p-3"><Badge variant="outline">{f.categoria}</Badge></td>
                    <td className="p-3 font-mono text-muted-foreground">{f.chavePix}</td>
                    <td className="p-3 text-right font-extrabold text-emerald-600">{formatCurrency(f.pago)}</td>
                    <td className="p-3 text-right font-bold text-amber-600">{formatCurrency(f.aberto)}</td>
                    <td className="p-3 text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                        {f.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
