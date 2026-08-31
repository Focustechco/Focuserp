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
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-5 h-5 text-orange-500" /> Segurança, Políticas & Autenticação
          </h3>
          <p className="text-xs text-muted-foreground">
            Políticas globais de senhas, autenticação em duas etapas (2FA), controle de sessão e restrição de IP.
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
        {/* Senhas */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-orange-500" /> Política de Senhas Corporativas
            </CardTitle>
            <CardDescription className="text-xs">Regras de complexidade, histórico e renovação de credenciais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
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
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" /> Controle de Sessão & Timeout
            </CardTitle>
            <CardDescription className="text-xs">Gerenciamento de conexões ativas e encerramento por inatividade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Deslogar por Inatividade (minutos)</Label>
              <Input type="number" defaultValue="30" min="5" className="rounded-xl h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Tempo Máximo de Sessão (horas)</Label>
              <Input type="number" defaultValue="12" min="1" className="rounded-xl h-9 text-xs" />
            </div>
          </CardContent>
        </Card>

        {/* MFA e Bloqueios */}
        <Card className="md:col-span-2 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-4 h-4" /> Acesso Estrito & Prevenção de Intrusões (MFA)
            </CardTitle>
            <CardDescription className="text-xs">Parâmetros de autenticação reforçada e bloqueio por força bruta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold cursor-pointer">MFA Obrigatório para Toda a Empresa</Label>
                <p className="text-[11px] text-muted-foreground">Força autenticação em duas etapas (2FA via Authenticator) para todos os colaboradores.</p>
              </div>
              <Switch checked={mfaGlobal} onCheckedChange={setMfaGlobal} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="font-semibold">Tentativas de Login até Bloqueio</Label>
                <Select defaultValue="5">
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 tentativas</SelectItem>
                    <SelectItem value="5">5 tentativas</SelectItem>
                    <SelectItem value="10">10 tentativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Tempo de Bloqueio Temporário</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="0">Bloqueio Permanente (Requer Admin)</SelectItem>
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
