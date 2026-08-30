import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Cobranca } from '../types';
import { INITIAL_COBRANCAS } from '../mockData';
import { Send, CheckCircle2, MessageSquare, DollarSign, TrendingUp, AlertTriangle, QrCode, ArrowUpRight } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function Dashboard() {
  const { data: cobrancasData } = useLocalStorageState<Cobranca>('focus_cobrancas', INITIAL_COBRANCAS);
  const cobrancas = Array.isArray(cobrancasData) ? cobrancasData : [];

  const {
    total,
    enviadasHoje,
    lidas,
    respondidas,
    pagas,
    totalValor,
    totalRecuperado,
    taxaLeitura,
    taxaResposta,
    taxaConversao,
    canaisData,
    statusData
  } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalCount = cobrancas.length;
    
    let envHoje = 0;
    let countLidas = 0;
    let countRespondidas = 0;
    let countPagas = 0;
    let sumValor = 0;
    let sumRecuperado = 0;

    let whatsAppCount = 0;
    let emailCount = 0;
    let smsCount = 0;

    cobrancas.forEach(c => {
      sumValor += c.valor || 0;
      if (c.statusCobranca === 'Paga') {
        countPagas += 1;
        sumRecuperado += c.valor || 0;
      }
      if ((c.dataHoraEnvio || '').startsWith(todayStr)) {
        envHoje += 1;
      }
      if (c.statusLeitura === 'Lida') {
        countLidas += 1;
      }
      if (c.respostaCliente || c.statusCobranca === 'Respondida') {
        countRespondidas += 1;
      }

      if (Array.isArray(c.canal)) {
        if (c.canal.includes('WhatsApp')) whatsAppCount += 1;
        if (c.canal.includes('E-mail')) emailCount += 1;
        if (c.canal.includes('SMS')) smsCount += 1;
      }
    });

    const txLeitura = totalCount > 0 ? Math.round((countLidas / totalCount) * 100) : 0;
    const txResposta = totalCount > 0 ? Math.round((countRespondidas / totalCount) * 100) : 0;
    const txConversao = totalCount > 0 ? Math.round((countPagas / totalCount) * 100) : 0;

    const cData = [
      { name: 'WhatsApp', value: whatsAppCount, color: '#22c55e' },
      { name: 'E-mail', value: emailCount, color: '#3b82f6' },
      { name: 'SMS', value: smsCount, color: '#f59e0b' },
    ].filter(item => item.value > 0);

    const sData = [
      { name: 'Pagas', quantidade: countPagas, valor: sumRecuperado, fill: '#10b981' },
      { name: 'Respondidas', quantidade: countRespondidas, valor: cobrancas.filter(c => c.statusCobranca === 'Respondida').reduce((a, b) => a + (b.valor || 0), 0), fill: '#6366f1' },
      { name: 'Lidas', quantidade: countLidas, valor: cobrancas.filter(c => c.statusLeitura === 'Lida').reduce((a, b) => a + (b.valor || 0), 0), fill: '#0ea5e9' },
      { name: 'Enviadas', quantidade: cobrancas.filter(c => c.statusCobranca === 'Enviada').length, valor: cobrancas.filter(c => c.statusCobranca === 'Enviada').reduce((a, b) => a + (b.valor || 0), 0), fill: '#94a3b8' },
    ];

    return {
      total: totalCount,
      enviadasHoje: envHoje,
      lidas: countLidas,
      respondidas: countRespondidas,
      pagas: countPagas,
      totalValor: sumValor,
      totalRecuperado: sumRecuperado,
      taxaLeitura: txLeitura,
      taxaResposta: txResposta,
      taxaConversao: txConversao,
      canaisData: cData.length > 0 ? cData : [{ name: 'WhatsApp', value: 1, color: '#22c55e' }],
      statusData: sData
    };
  }, [cobrancas]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Recuperado
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRecuperado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span><strong>{taxaConversao}%</strong> de taxa de conversão</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Taxa de Leitura
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {taxaLeitura}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lidas} de {total} cobranças visualizadas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Taxa de Resposta
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {taxaResposta}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {respondidas} clientes responderam ou prometeram pagar
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Disparos Hoje
            </CardTitle>
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
              <Send className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {enviadasHoje}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {total} notificações ativas no pipeline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Desempenho e Canais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">Funil de Eficiência de Cobrança</CardTitle>
            <CardDescription className="text-xs">
              Volume de cobranças por estágio (Enviadas, Lidas, Respondidas e Pagas)
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(value: any, name: any) => [
                      name === 'quantidade' ? `${value} títulos` : formatCurrency(value),
                      name === 'quantidade' ? 'Quantidade' : 'Valor Total'
                    ]}
                  />
                  <Bar dataKey="quantidade" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">Distribuição por Canal</CardTitle>
            <CardDescription className="text-xs">
              Engajamento e alcance por canal de comunicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={canaisData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {canaisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => [`${value} disparos`, 'Volume']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
