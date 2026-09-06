import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, MousePointer2, Megaphone, Plus, Search, Filter, TrendingUp, MonitorSmartphone, BarChart4 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLocalStorageState } from "@/hooks/useDataStore";

export interface CampanhaTrafego {
  id: string;
  nome: string;
  plataforma: string;
  status: string;
  investido: string;
  cliques: number;
  cpa: string;
  roas: string;
  investimentoVal?: number;
  retornoVal?: number;
}

const defaultCampanhas: CampanhaTrafego[] = [
  { id: 'tr-1', nome: 'Leads ERP - Conversão', plataforma: 'Google Ads', status: 'Ativa', investido: 'R$ 3.500', cliques: 4200, cpa: 'R$ 85', roas: '4.2x', investimentoVal: 3500, retornoVal: 14700 },
  { id: 'tr-2', nome: 'Black Friday - Awareness', plataforma: 'Meta Ads', status: 'Ativa', investido: 'R$ 4.200', cliques: 12800, cpa: 'R$ 42', roas: '3.8x', investimentoVal: 4200, retornoVal: 15960 },
  { id: 'tr-3', nome: 'Decision Makers B2B', plataforma: 'LinkedIn Ads', status: 'Ativa', investido: 'R$ 2.800', cliques: 980, cpa: 'R$ 220', roas: '5.1x', investimentoVal: 2800, retornoVal: 14280 },
  { id: 'tr-4', nome: 'Retargeting - Visitantes', plataforma: 'Meta Ads', status: 'Pausada', investido: 'R$ 1.100', cliques: 3200, cpa: 'R$ 38', roas: '2.9x', investimentoVal: 1100, retornoVal: 3190 },
];

const barData = [
  { name: 'Meta Ads', investimento: 5300, retorno: 19150 },
  { name: 'Google Ads', investimento: 3500, retorno: 14700 },
  { name: 'LinkedIn Ads', investimento: 2800, retorno: 14280 },
];

export function TrafegoPagoView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campanhas'>('dashboard');
  const [searchTerm, setSearchTerm] = useState("");

  const { data: campanhas } = useLocalStorageState<CampanhaTrafego>('focus_marketing_trafego', defaultCampanhas);

  const filteredCampanhas = campanhas.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.plataforma.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInvestido = campanhas.reduce((acc, c) => acc + (c.investimentoVal || 0), 0);
  const totalCliques = campanhas.reduce((acc, c) => acc + (c.cliques || 0), 0);
  const cpcMedio = totalCliques > 0 ? totalInvestido / totalCliques : 0;
  const roasMedio = campanhas.length > 0
    ? campanhas.reduce((acc, c) => acc + parseFloat(c.roas || '0'), 0) / campanhas.length
    : 0;

  const kpis = [
    { title: "Investimento Total", value: `R$ ${totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: "Este mês", icon: <DollarSign className="w-5 h-5 text-muted-foreground" /> },
    { title: "Custo por Clique (CPC)", value: `R$ ${cpcMedio.toFixed(2)}`, change: "Média por clique", icon: <MousePointer2 className="w-5 h-5 text-muted-foreground" /> },
    { title: "ROAS Médio", value: `${roasMedio.toFixed(1)}x`, change: "Retorno sobre ad spend", icon: <TrendingUp className="w-5 h-5 text-muted-foreground" /> },
    { title: "Total de Cliques", value: totalCliques.toLocaleString('pt-BR'), change: "Interações totais", icon: <BarChart4 className="w-5 h-5 text-muted-foreground" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4 pb-2 border-b">
        <div>
          <h3 className="font-medium text-lg">Gestão de Tráfego Pago</h3>
          <p className="text-sm text-muted-foreground">Central de controle de performance, orçamentos e criativos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shrink-0"><MonitorSmartphone className="w-4 h-4"/> Conectar Conta</Button>
          <Button className="gap-2 shrink-0"><Plus className="w-4 h-4"/> Nova Campanha</Button>
        </div>
      </div>

      {/* Tabs internas */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <Button variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} size="sm" className="gap-2" onClick={() => setActiveTab('dashboard')}>
          <TrendingUp className="w-4 h-4"/> Dashboard
        </Button>
        <Button variant={activeTab === 'campanhas' ? 'secondary' : 'ghost'} size="sm" className="gap-2" onClick={() => setActiveTab('campanhas')}>
          <Megaphone className="w-4 h-4"/> Campanhas
        </Button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="flex flex-col space-y-6">
          <div className="order-2 md:order-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => (
              <Card key={idx}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  {kpi.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="order-1 md:order-2">
            <CardHeader>
              <CardTitle className="text-lg">Investimento vs Retorno por Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="investimento" name="Investimento (R$)" fill="hsl(var(--primary)/0.6)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="retorno" name="Retorno Estimado (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'campanhas' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar campanha..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2"><Filter className="w-4 h-4"/> Filtros</Button>
          </div>
          
          <div className="border rounded-lg bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left font-medium">Campanha</th>
                  <th className="p-3 text-left font-medium">Plataforma</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Investido</th>
                  <th className="p-3 text-left font-medium">Cliques</th>
                  <th className="p-3 text-left font-medium">CPA</th>
                  <th className="p-3 text-left font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCampanhas.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma campanha encontrada.</td></tr>
                ) : filteredCampanhas.map((campanha) => (
                  <tr key={campanha.id} className="hover:bg-muted/30 cursor-pointer">
                    <td className="p-3 font-semibold text-primary">{campanha.nome}</td>
                    <td className="p-3">{campanha.plataforma}</td>
                    <td className="p-3">
                      <Badge variant={campanha.status === 'Ativa' ? 'default' : 'secondary'} className={campanha.status === 'Ativa' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}>
                        {campanha.status}
                      </Badge>
                    </td>
                    <td className="p-3">{campanha.investido}</td>
                    <td className="p-3">{campanha.cliques.toLocaleString('pt-BR')}</td>
                    <td className="p-3 font-medium">{campanha.cpa}</td>
                    <td className="p-3 text-emerald-600 font-bold">{campanha.roas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
