import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Globe2, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function ConfigPreferenciasGlobais() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Preferências gerais salvas com sucesso!");
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Preferências Gerais</h2>
          <p className="text-muted-foreground mt-1">Configurações regionais e formatos padrão da plataforma.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Localização e Idioma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe2 className="w-5 h-5 text-primary" /> Idioma e Região</CardTitle>
            <CardDescription>O idioma e formato padrão de números para todos os usuários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Idioma Padrão</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (United States)</SelectItem>
                  <SelectItem value="es-ES">Español (España)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato de Data</Label>
              <Select defaultValue="dd/mm/yyyy">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY (Ex: 31/12/2026)</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY (Ex: 12/31/2026)</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD (Ex: 2026-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primeiro dia da Semana</Label>
              <Select defaultValue="domingo">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="domingo">Domingo</SelectItem>
                  <SelectItem value="segunda">Segunda-feira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Formatos Monetários e Tempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Moeda e Tempo</CardTitle>
            <CardDescription>Padrões de exibição financeira e fusos horários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Moeda Base (Tenant)</Label>
              <Select defaultValue="BRL">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL - Real Brasileiro (R$)</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano ($)</SelectItem>
                  <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Casas Decimais (Valores Monetários)</Label>
              <Select defaultValue="2">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (Ex: R$ 1.000)</SelectItem>
                  <SelectItem value="2">2 (Ex: R$ 1.000,00)</SelectItem>
                  <SelectItem value="3">3 (Ex: R$ 1.000,000)</SelectItem>
                  <SelectItem value="4">4 (Ex: R$ 1.000,0000)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">Geralmente, sistemas usam 2 a 4 casas decimais dependendo da precisão dos custos industriais.</p>
            </div>
            <div className="space-y-2">
              <Label>Fuso Horário Principal (Timezone)</Label>
              <Select defaultValue="America/Sao_Paulo">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">(GMT-03:00) Brasília, São Paulo</SelectItem>
                  <SelectItem value="America/Manaus">(GMT-04:00) Manaus</SelectItem>
                  <SelectItem value="America/New_York">(GMT-05:00) New York</SelectItem>
                  <SelectItem value="UTC">(GMT+00:00) Coordinated Universal Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
