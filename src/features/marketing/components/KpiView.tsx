import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart4, TrendingUp, HandCoins, Users, MousePointerClick, Target } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

export function KpiView() {
  const kpiData = [
    { title: "Custo de Aquisição (CAC)", value: "R$ 450,00", change: "-12.5%", isPositive: true, icon: <HandCoins className="w-5 h-5 text-muted-foreground" /> },
    { title: "Leads Qualificados (MQL)", value: "342", change: "+18.2%", isPositive: true, icon: <Users className="w-5 h-5 text-muted-foreground" /> },
    { title: "Taxa de Conversão Geral", value: "3.2%", change: "+0.4%", isPositive: true, icon: <MousePointerClick className="w-5 h-5 text-muted-foreground" /> },
    { title: "Lifetime Value (LTV)", value: "R$ 12.500", change: "+5.0%", isPositive: true, icon: <TrendingUp className="w-5 h-5 text-muted-foreground" /> },
    { title: "LTV / CAC Ratio", value: "27.7", change: "+4.1", isPositive: true, icon: <Target className="w-5 h-5 text-muted-foreground" /> },
    { title: "Custo por Lead (CPL)", value: "R$ 35,00", change: "-5.0%", isPositive: true, icon: <BarChart4 className="w-5 h-5 text-muted-foreground" /> },
  ];

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const conversionsData = meses.slice(0, 6).map((mes, index) => ({
    name: mes,
    leads: 120 + (index * 35) + Math.floor(Math.random() * 50),
    oportunidades: 40 + (index * 15) + Math.floor(Math.random() * 20),
    vendas: 10 + (index * 5) + Math.floor(Math.random() * 10),
  }));

  const roiData = meses.slice(0, 6).map((mes, index) => ({
    name: mes,
    investimento: 5000 + (index * 1000),
    retorno: 15000 + (index * 4500) + Math.floor(Math.random() * 2000),
  }));

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pb-8">
      <div className="order-2 md:order-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <p className={`text-xs mt-1 font-medium ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.change} em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funil de Conversão (Evolução)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionsData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="leads" name="Leads (MQL)" fill="hsl(var(--primary)/0.4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="oportunidades" name="Oportunidades (SQL)" fill="hsl(var(--primary)/0.7)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vendas" name="Vendas (Won)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ROI de Marketing (Ad Spend vs Receita)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="investimento" name="Investimento (CAC)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="retorno" name="Receita Gerada" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
