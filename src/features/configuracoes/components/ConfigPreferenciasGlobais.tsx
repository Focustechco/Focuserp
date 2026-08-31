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
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Globe2 className="w-5 h-5 text-orange-500" /> Preferências Globais & Moeda
          </h3>
          <p className="text-xs text-muted-foreground">
            Configurações regionais, idioma padrão, fuso horário e formatação monetária da plataforma.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Localização e Idioma */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-orange-500" /> Idioma e Região
            </CardTitle>
            <CardDescription className="text-xs">O idioma e formato padrão de números para todos os usuários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
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
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" /> Moeda & Formatação de Tempo
            </CardTitle>
            <CardDescription className="text-xs">Padrões de exibição financeira e fusos horários da organização.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Moeda Base (Tenant)</Label>
              <Select defaultValue="BRL">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL - Real Brasileiro (R$)</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano ($)</SelectItem>
                  <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Casas Decimais (Valores Monetários)</Label>
              <Select defaultValue="2">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (Ex: R$ 1.000)</SelectItem>
                  <SelectItem value="2">2 (Ex: R$ 1.000,00)</SelectItem>
                  <SelectItem value="3">3 (Ex: R$ 1.000,000)</SelectItem>
                  <SelectItem value="4">4 (Ex: R$ 1.000,0000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Fuso Horário Principal (Timezone)</Label>
              <Select defaultValue="America/Sao_Paulo">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">(GMT-03:00) Horário Oficial de Brasília</SelectItem>
                  <SelectItem value="America/Manaus">(GMT-04:00) Manaus</SelectItem>
                  <SelectItem value="America/New_York">(GMT-05:00) New York (EST)</SelectItem>
                  <SelectItem value="UTC">(GMT+00:00) UTC Universal Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
