import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MousePointerClick, TrendingUp, HandCoins, Megaphone, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const leadsData = [];



const canalData = [];


const kpiData = [];


const campanhasAtivas = [
  { nome: 'Black Friday 2026', canal: 'Meta Ads', status: 'Em Andamento', progresso: 65, orcamento: 'R$ 12.000' },
  { nome: 'Captação de Leads ERP', canal: 'Google Ads', status: 'Em Andamento', progresso: 40, orcamento: 'R$ 8.500' },
  { nome: 'Webinar Gestão Tech', canal: 'LinkedIn', status: 'Pausada', progresso: 80, orcamento: 'R$ 3.200' },
];

export function MarketingDashboard() {
  return (
    <div className="flex flex-col space-y-6 animate-fade-in pb-8">
      {/* KPIs */}
      <div className="order-2 md:order-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => (
          <Card key={idx} className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change} vs mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Geração de Leads */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Geração de Leads — Orgânico vs Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="pago" name="Tráfego Pago" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPaid)" />
                  <Area type="monotone" dataKey="organico" name="Orgânico" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOrganic)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leads por Canal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Leads por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={canalData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={70} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campanhas Ativas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> Campanhas Ativas
          </CardTitle>
          <Badge variant="secondary">{campanhasAtivas.length} campanhas</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campanhasAtivas.map((c, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20 hover:border-primary/40 transition-colors">
                <div className="p-2 bg-primary/10 rounded-md shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">{c.nome}</p>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${c.status === 'Em Andamento' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-amber-600 border-amber-200 bg-amber-50'}`}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-secondary rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${c.progresso}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{c.progresso}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{c.canal}</p>
                  <p className="text-sm font-semibold">{c.orcamento}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
