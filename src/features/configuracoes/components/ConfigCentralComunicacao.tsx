import React, { useState } from 'react';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Search,
  CheckCheck,
  Archive,
  Clock,
  ShieldAlert,
  Briefcase,
  Wallet,
  Target,
  ShoppingBag,
  FileText,
  Users,
  Calendar,
  Layers,
  BellRing,
  Smartphone,
  BellOff,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export function ConfigCentralComunicacao() {
  const navigate = useNavigate();
  const {
    notificacoes,
    naoLidasCount,
    marcarComoLida,
    marcarTodasComoLidas,
    arquivar,
    notificar,
    solicitarPermissaoPush,
    desativarPush,
    pushAtivo,
    pushSuportado,
    preferences,
    savePreferences,
  } = useNotificacoesStore();

  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'preferencias'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingPush, setLoadingPush] = useState(false);

  const handleAtivarPush = async () => {
    setLoadingPush(true);
    await solicitarPermissaoPush();
    setLoadingPush(false);
  };

  const handleDesativarPush = async () => {
    setLoadingPush(true);
    await desativarPush();
    setLoadingPush(false);
  };

  const handleToggleCategory = (catKey: keyof typeof preferences.categorias) => {
    savePreferences({
      ...preferences,
      categorias: {
        ...preferences.categorias,
        [catKey]: !preferences.categorias[catKey],
      },
    });
    toast.success('Preferncias atualizadas.');
  };

  const handleToggleCanal = (canalKey: keyof typeof preferences.canais) => {
    savePreferences({
      ...preferences,
      canais: {
        ...preferences.canais,
        [canalKey]: !preferences.canais[canalKey],
      },
    });
    toast.success('Preferncias de canais atualizadas.');
  };

  // Filtragem de Notificações
  const filteredNotificacoes = notificacoes.filter((n) => {
    const matchesSearch =
      (n?.titulo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (n?.descricao || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (n?.responsavel && n.responsavel.toLowerCase().includes((searchTerm || '').toLowerCase()));

    if (selectedCategory === 'todas') return matchesSearch;
    if (selectedCategory === 'naoLidas') return matchesSearch && !n.lida;
    return matchesSearch && (n?.origem || '').toLowerCase() === (selectedCategory || '').toLowerCase();
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredNotificacoes.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkMarkRead = () => {
    selectedIds.forEach((id) => marcarComoLida(id));
    setSelectedIds([]);
    toast.success(`${selectedIds.length} notificaes marcadas como lidas.`);
  };

  const handleBulkArchive = () => {
    selectedIds.forEach((id) => arquivar(id));
    setSelectedIds([]);
    toast.info(`${selectedIds.length} notificaes arquivadas.`);
  };

  const handleSimularNotificacao = () => {
    notificar({
      titulo: 'Alerta de Conciliao Pendente no Fluxo de Caixa',
      descricao: 'Existem lanamentos bancrios pendentes de validao no extrato OFX.',
      origem: 'Financeiro',
      tipo: 'Informao',
      prioridade: 'Alta',
      responsavel: 'Sistema Focus Finance',
      targetUrl: '/conciliacao',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DA SEO CENTRAL DE COMUNICAO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" /> Central de Comunicao & Notificaes
            </h2>
            {naoLidasCount > 0 && (
              <Badge className="bg-red-600 text-white font-semibold">
                {naoLidasCount} nova{naoLidasCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Caixa de entrada de mensagens, alertas do sistema, push notificaes e preferncias de envio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSimularNotificacao} className="text-xs">
            <BellRing className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Simular Notificação
          </Button>
          {naoLidasCount > 0 && (
            <Button variant="outline" size="sm" onClick={marcarTodasComoLidas} className="text-xs">
              <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Marcar lidas
            </Button>
          )}
        </div>
      </div>

      {/* TABS INTERNAS (INBOX VS PREFERÊNCIAS) */}
      <Tabs value={activeSubTab} onValueChange={(val: any) => setActiveSubTab(val)} className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="inbox" className="text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
              <Bell className="w-3.5 h-3.5" /> Mensagens & Alertas
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="text-xs font-semibold gap-1.5 shrink-0 whitespace-nowrap">
              <BellRing className="w-3.5 h-3.5" /> Canais & Preferências
            </TabsTrigger>
          </TabsList>
        </div>

        {/* SUB-TAB 1: INBOX DE NOTIFICAES */}
        <TabsContent value="inbox" className="space-y-6 outline-none">
          {/* CARD DE SETUP PUSH */}
          {pushSuportado && (
            <Card
              className={`border transition-all ${
                pushAtivo
                  ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20'
              }`}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border shadow-2xs ${
                      pushAtivo
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                        : 'bg-orange-500/10 border-orange-500/30 text-orange-600'
                    }`}
                  >
                    {pushAtivo ? <BellRing className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {pushAtivo ? (
                        <>
                          <span className="text-emerald-700 dark:text-emerald-400">Push Notifications Ativas</span>
                          <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">ON</Badge>
                        </>
                      ) : (
                        <>
                          <span className="text-orange-700 dark:text-orange-400">Push Notifications Desativadas</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 border-orange-400 text-orange-600">
                            OFF
                          </Badge>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pushAtivo
                        ? 'Alertas em tempo real ativos no seu navegador e dispositivo mvel.'
                        : 'Ative para receber alertas mesmo com a guia em segundo plano.'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  {pushAtivo ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDesativarPush}
                      disabled={loadingPush}
                      className="text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {loadingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
                      Desativar Push
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleAtivarPush}
                      disabled={loadingPush}
                      className="text-xs gap-1.5 font-semibold"
                    >
                      {loadingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                      Autorizar Notificaes Push
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* BUSCA E CAIXA DE MENSAGENS */}
          <Card className="border-border/80">
            <CardHeader className="p-4 space-y-3 border-b border-border">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar em notificaes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
                    <span className="text-xs font-semibold text-primary">{selectedIds.length} selecionada(s)</span>
                    <Button variant="ghost" size="sm" onClick={handleBulkMarkRead} className="h-7 text-xs">
                      <CheckCheck className="w-3 h-3 mr-1 text-emerald-600" /> Marcar Lidas
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleBulkArchive} className="h-7 text-xs">
                      <Archive className="w-3 h-3 mr-1 text-muted-foreground" /> Arquivar
                    </Button>
                  </div>
                )}
              </div>

              {/* Categorias Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
                {[
                  { id: 'todas', label: 'Todas', count: notificacoes.length },
                  { id: 'naoLidas', label: 'No Lidas', count: naoLidasCount },
                  { id: 'projetos', label: 'Projetos' },
                  { id: 'financeiro', label: 'Financeiro' },
                  { id: 'crm', label: 'CRM' },
                  { id: 'comercial', label: 'Comercial' },
                  { id: 'contratos', label: 'Contratos' },
                  { id: 'rh', label: 'RH' },
                  { id: 'sistema', label: 'Sistema' },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={selectedCategory === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(tab.id)}
                    className="h-7 px-2.5 text-xs rounded-full shrink-0"
                  >
                    {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-border">
              {filteredNotificacoes.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
                  <Bell className="w-8 h-8 opacity-30 mx-auto" />
                  <p>Nenhuma notificao encontrada.</p>
                </div>
              ) : (
                filteredNotificacoes.map((notif) => {
                  const isSelected = selectedIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 flex items-start gap-3 transition-colors ${
                        !notif.lida ? 'bg-primary/5 font-medium' : 'hover:bg-muted/40'
                      } ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(notif.id)}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground">{notif.titulo}</h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(notif.dataCriacao).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{notif.descricao}</p>
                      </div>

                      {notif.targetUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            marcarComoLida(notif.id);
                            navigate({ to: notif.targetUrl });
                          }}
                          className="h-7 text-xs gap-1 font-semibold text-primary"
                        >
                          Ir <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 2: CONFIGURAES E PREFERNCIAS DE CANAIS */}
        <TabsContent value="preferencias" className="space-y-6 outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            {/* CANAIS */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-blue-500" /> Canais de Envio
                </CardTitle>
                <CardDescription className="text-xs">Defina por onde deseja ser alertado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Notificaes na Plataforma</Label>
                  <Switch
                    checked={preferences.canais.notificacoesInternas}
                    onCheckedChange={() => handleToggleCanal('notificacoesInternas')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">E-mails Transacionais</Label>
                  <Switch
                    checked={preferences.canais.email}
                    onCheckedChange={() => handleToggleCanal('email')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Push no Navegador</Label>
                  <Switch
                    checked={preferences.canais.pushNavegador}
                    onCheckedChange={() => handleToggleCanal('pushNavegador')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* REGRAS DE MDULOS */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Regras por Mdulo
                </CardTitle>
                <CardDescription className="text-xs">Selecione quais reas geraro alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {[
                  { key: 'projetos', label: 'Projetos & Tarefas' },
                  { key: 'financeiro', label: 'Financeiro (Contas & Fluxo)' },
                  { key: 'crm', label: 'CRM & Pipeline' },
                  { key: 'contratos', label: 'Contratos & Renovaes' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label className="text-xs">{item.label}</Label>
                    <Switch
                      checked={!!preferences.categorias[item.key as keyof typeof preferences.categorias]}
                      onCheckedChange={() => handleToggleCategory(item.key as any)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
