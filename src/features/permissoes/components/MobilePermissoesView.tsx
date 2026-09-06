import React, { useState } from 'react';
import { Users, Lock, LayoutGrid, Filter, Search, Building2, Edit3, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePermissoesStore } from '../hooks/usePermissoesStore';
import { Usuario, UserProfile } from '@/features/usuarios/types';
import { MatrizPermissoesView } from './MatrizPermissoesView';
import { PermissoesDashboard } from './PermissoesDashboard';
import { toast } from 'sonner';

export function MobilePermissoesView() {
  const { usuarios, colaboradores, updateColaboradorSetorECargo } = usePermissoesStore();

  const [activeTab, setActiveTab] = useState<'colaboradores' | 'matriz' | 'dashboard'>('colaboradores');
  const [search, setSearch] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  // Campos de Edição
  const [novoSetor, setNovoSetor] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<UserProfile>('Financeiro');

  const filteredUsers = usuarios.filter(
    (u) =>
      (u?.nome || '').toLowerCase().includes((search || '').toLowerCase()) ||
      (u?.email || '').toLowerCase().includes((search || '').toLowerCase()) ||
      (u?.departamento || '').toLowerCase().includes((search || '').toLowerCase()) ||
      (u?.cargo || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const handleOpenEdit = (user: Usuario) => {
    setSelectedUser(user);
    setNovoSetor(user.departamento || 'Financeiro');
    setNovoCargo(user.cargo || 'Analista');
    setNovoPerfil(user.perfil || 'Financeiro');
  };

  const handleSaveSync = () => {
    if (!selectedUser) return;

    updateColaboradorSetorECargo(selectedUser.id, novoSetor, novoCargo, novoPerfil);

    toast.success(
      `Setor de ${selectedUser.nome} alterado para "${novoSetor}"! Sincronizado automaticamente com os módulos RH e Usuários.`
    );

    setSelectedUser(null);
  };

  const sections = [
    { id: 'colaboradores', label: `Colaboradores (${usuarios.length})`, icon: Users },
    { id: 'matriz', label: 'Matriz de Permissões', icon: Lock },
    { id: 'dashboard', label: 'Dashboard de Governança', icon: LayoutGrid },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. STICKY TOP BAR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {/* Seletor Rápido de Seção Drawer */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-muted-foreground/20 text-xs font-medium flex items-center gap-1.5 flex-1 justify-start"
              >
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate">
                  {sections.find((s) => s.id === activeTab)?.label}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b text-left">
                <SheetTitle className="text-base font-bold">Seções de Permissões & IAM</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Gestão de perfis, sincronização de setores e matriz de acessos
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-1 gap-2 py-4">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isCurrent = activeTab === sec.id;
                  return (
                    <Button
                      key={sec.id}
                      type="button"
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActiveTab(sec.id as any);
                        setFilterSheetOpen(false);
                      }}
                      className={`h-11 justify-start gap-2.5 text-xs rounded-xl ${
                        isCurrent ? 'bg-primary text-white font-bold' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {sec.label}
                    </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Horizontal Section Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTEÚDO */}
      <div className="p-3.5 space-y-4">
        {/* ABA: COLABORADORES & SETORES */}
        {activeTab === 'colaboradores' && (
          <div className="space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome, setor ou cargo..."
                className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
                <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-sm text-foreground">Nenhum colaborador encontrado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tente buscar por outro termo.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredUsers.map((user) => {
                  const rhSync = colaboradores.some(
                    (c) =>
                      ((c?.email || '').toLowerCase() === (user?.email || '').toLowerCase() && user?.email) ||
                      ((c?.nomeCompleto || '').toLowerCase() === (user?.nome || '').toLowerCase() && user?.nome)
                  );

                  return (
                    <div
                      key={user.id}
                      className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-2xs space-y-2.5 transition-all hover:border-primary/40"
                    >
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-foreground truncate">{user.nome}</h4>
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        </div>

                        <div className="shrink-0">
                          {rhSync ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sync RH
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Padrão</Badge>
                          )}
                        </div>
                      </div>

                      {/* Informações de Setor, Cargo e Perfil */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 text-[11px]">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Setor / Departamento</span>
                          <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-[10px] font-semibold mt-0.5">
                            <Building2 className="w-3 h-3" /> {user.departamento || 'Geral'}
                          </Badge>
                          <span className="text-muted-foreground text-[10px] block mt-1 truncate">Cargo: {user.cargo || '-'}</span>
                        </div>

                        <div>
                          <span className="text-muted-foreground block text-[10px]">Perfil de Acesso (RBAC)</span>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-bold mt-0.5">
                            {user.perfil}
                          </Badge>
                        </div>
                      </div>

                      {/* Botão de Ação Direta */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(user)}
                        className="w-full h-8 text-xs gap-1.5 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Alterar Setor & Perfil (Sync Automático)
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: MATRIZ DE PERMISSÕES */}
        {activeTab === 'matriz' && (
          <MatrizPermissoesView />
        )}

        {/* ABA: DASHBOARD DE GOVERNANÇA */}
        {activeTab === 'dashboard' && (
          <PermissoesDashboard />
        )}
      </div>

      {/* Modal Alterar Setor & Perfil */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="w-5 h-5 text-orange-500" /> Sincronizador de Setor & Permissões
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 border rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                <p className="font-bold text-foreground">{selectedUser.nome}</p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                <p className="text-[10px] text-orange-700 dark:text-orange-300 mt-1 font-semibold">
                  ⚠️ Alterar o setor aqui atualizará instantaneamente o módulo RH e o diretório IAM.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Novo Setor / Departamento *</Label>
                <Select value={novoSetor} onValueChange={setNovoSetor}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="RH / Pessoas">RH / Pessoas</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="TI / Tecnologia">TI / Tecnologia</SelectItem>
                    <SelectItem value="Operações">Operações</SelectItem>
                    <SelectItem value="Diretoria">Diretoria</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Fiscal">Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Novo Cargo</Label>
                <Input value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="h-9 text-xs" />
              </div>

              <div className="space-y-2">
                <Label>Novo Perfil de Acesso (RBAC)</Label>
                <Select value={novoPerfil} onValueChange={(v: any) => setNovoPerfil(v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Super Administrador">Super Administrador</SelectItem>
                    <SelectItem value="Administrador Financeiro">Administrador Financeiro</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Projetos">Projetos</SelectItem>
                    <SelectItem value="Diretoria">Diretoria</SelectItem>
                    <SelectItem value="Auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveSync} className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              <RefreshCw className="w-4 h-4" /> Salvar & Sincronizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
