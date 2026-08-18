import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ShieldCheck, KeyRound, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';

export function ConfigSeguranca() {
  const [mfaGlobal, setMfaGlobal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Políticas de segurança salvas com sucesso!");
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Segurança da Plataforma</h2>
          <p className="text-muted-foreground mt-1">Políticas globais de acesso e senhas para todos os usuários.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Senhas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Política de Senhas</CardTitle>
            <CardDescription>Regras para criação e renovação de credenciais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Complexidade Mínima</Label>
              <Select defaultValue="alta">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa (Apenas 6+ caracteres)</SelectItem>
                  <SelectItem value="media">Média (Letras e números)</SelectItem>
                  <SelectItem value="alta">Alta (Maiúsculas, minúsculas, números e símbolos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiração Automática de Senha</Label>
              <Select defaultValue="90">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nunca expira</SelectItem>
                  <SelectItem value="30">A cada 30 dias</SelectItem>
                  <SelectItem value="90">A cada 90 dias</SelectItem>
                  <SelectItem value="180">A cada 180 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Controle de Sessão</CardTitle>
            <CardDescription>Gerenciamento de conexões ativas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Deslogar por inatividade (minutos)</Label>
              <Input type="number" defaultValue="30" min="5" />
            </div>
            <div className="space-y-2">
              <Label>Tempo máximo absoluto de sessão (horas)</Label>
              <Input type="number" defaultValue="12" min="1" />
              <p className="text-[10px] text-muted-foreground mt-1">Derruba o usuário mesmo se ele estiver ativo, forçando novo login.</p>
            </div>
          </CardContent>
        </Card>

        {/* MFA e Bloqueios */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-500"><AlertOctagon className="w-5 h-5" /> Acesso Estrito</CardTitle>
            <CardDescription>Configurações de alta segurança para prevenção de ataques.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">MFA Obrigatório para Toda a Empresa</Label>
                <p className="text-xs text-muted-foreground">Força a autenticação em 2 fatores para qualquer perfil de acesso. (Sobrescreve configurações individuais no módulo de Usuários).</p>
              </div>
              <Switch />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Tentativas de Login até Bloqueio</Label>
                <Select defaultValue="5">
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 tentativas</SelectItem>
                    <SelectItem value="5">5 tentativas</SelectItem>
                    <SelectItem value="10">10 tentativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tempo de Bloqueio (minutos)</Label>
                <Select defaultValue="30">
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="0">Bloqueio Permanente (Exige desbloqueio do Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
