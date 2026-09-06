import React, { useState, useRef } from 'react';
import {
  Users,
  Activity,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  KeyRound,
  ShieldAlert,
  UserCheck,
  UserX,
  Smartphone,
  Trash2,
  Camera,
  Key,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { INITIAL_USUARIOS } from '../data/initialData';
import { Usuario } from '../types';
import { UserFormSheet } from './UserFormSheet';
import { UsuariosDashboard } from './UsuariosDashboard';
import { useAuth } from '@/features/auth/AuthContext';
import { userService } from '@/services/userService';
import { toast } from 'sonner';

export function MobileUsuariosView() {
  const [activeTab, setActiveTab] = useState<'diretorio' | 'dashboard'>('diretorio');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modal para Visualizar Senha
  const [viewPasswordUser, setViewPasswordUser] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadUserId, setTargetUploadUserId] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: usuarios, updateItem, deleteItem } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { isSuperAdmin, currentUser, switchUser } = useAuth();

  const filteredUsers = (usuarios || []).filter((user) => {
    const matchesSearch =
      (user.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.departamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.cargo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'todos' || (user.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px]">
            Ativo
          </Badge>
        );
      case 'Inativo':
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20 text-[10px]">
            Inativo
          </Badge>
        );
      case 'Bloqueado':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 text-[10px]">
            Bloqueado
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca logou';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTriggerAvatarUpload = (userId: string) => {
    setTargetUploadUserId(userId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadUserId) return;

    setIsUploadingPhoto(true);
    const toastId = toast.loading('Processando foto de perfil...');
    try {
      const newFotoUrl = await userService.uploadUserAvatar(targetUploadUserId, file);
      updateItem(targetUploadUserId, { foto: newFotoUrl });
      toast.success('Foto de perfil atualizada no banco!', { id: toastId });
    } catch {
      toast.error('Erro ao salvar foto.', { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      setTargetUploadUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser: Usuario) => {
    if (usuarios.length <= 1) {
      toast.error('Não é possível excluir o único usuário administrador.');
      return;
    }
    if (targetUser.id === currentUser?.id || targetUser.email.toLowerCase().trim() === (currentUser?.email || '').toLowerCase().trim()) {
      toast.error('Não é possível excluir sua própria sessão ativa.');
      return;
    }

    const toastId = toast.loading(`Excluindo ${targetUser.nome}...`);
    try {
      await userService.deleteUser(targetUser.id, targetUser.email);
      deleteItem(targetUser.id);
      toast.success(`Usuário ${targetUser.nome} excluído com sucesso.`, { id: toastId });
    } catch {
      toast.error('Erro ao excluir usuário.', { id: toastId });
    }
  };

  const sections = [
    { id: 'diretorio', label: `Diretório (${usuarios.length})`, icon: Users },
    { id: 'dashboard', label: 'Monitor de Governança', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />

      {/* 1. STICKY TOP BAR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuário, email, depto..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Drawer de Filtro de Status */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-xl shrink-0 ${
                  statusFilter !== 'todos' ? 'border-primary text-primary bg-primary/5' : 'border-muted-foreground/20'
                }`}
                aria-label="Filtro de Status"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b text-left">
                <SheetTitle className="text-base font-bold">Filtro de Status de Usuários</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Selecione os usuários por status de acesso
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-2 py-4">
                {[
                  { id: 'todos', label: 'Todos Status' },
                  { id: 'ativo', label: 'Ativos' },
                  { id: 'inativo', label: 'Inativos' },
                  { id: 'bloqueado', label: 'Bloqueados' },
                ].map((st) => (
                  <Button
                    key={st.id}
                    type="button"
                    variant={statusFilter === st.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(st.id);
                      setFilterSheetOpen(false);
                    }}
                    className={`h-10 justify-start text-xs rounded-xl ${
                      statusFilter === st.id ? 'bg-primary text-white font-bold' : ''
                    }`}
                  >
                    {st.label}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Novo Usuário */}
          {isSuperAdmin && (
            <Button
              onClick={() => {
                setSelectedUser(null);
                setSheetOpen(true);
              }}
              size="sm"
              className="h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl gap-1 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Usuário
            </Button>
          )}
        </div>

        {/* Pílulas de Alternância */}
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
        {activeTab === 'diretorio' && (
          <div className="space-y-2.5">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
                <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-sm text-foreground">Nenhum usuário encontrado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tente alterar os termos de busca ou filtro de status.</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-2xs space-y-2.5 transition-all hover:border-primary/40"
                >
                  {/* Linha Superior: Avatar, Nome, Status e Menu */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        onClick={() => handleTriggerAvatarUpload(user.id)}
                        className="relative group cursor-pointer shrink-0"
                        title="Alterar foto"
                      >
                        <Avatar className="w-11 h-11 border border-primary/20 shadow-xs">
                          <AvatarImage src={user.foto} className="object-cover w-full h-full" />
                          <AvatarFallback className="text-xs font-bold bg-orange-500/10 text-orange-600">
                            {(user.nome || 'U').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground truncate">{user.nome}</h4>
                          {user.id === currentUser?.id && (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20 font-bold">
                              Você
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Status Badge + Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusBadge(user.status)}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 p-0 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs">
                          <DropdownMenuLabel>Ações Administrativas</DropdownMenuLabel>

                          {isSuperAdmin && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user as unknown as Usuario);
                                setSheetOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              Editar IAM
                            </DropdownMenuItem>
                          )}

                          {isSuperAdmin && user.id !== currentUser?.id && (
                            <DropdownMenuItem onClick={() => switchUser(user.id)} className="text-blue-600 dark:text-blue-400 cursor-pointer">
                              <KeyRound className="w-3.5 h-3.5 mr-2" /> Alternar para Usuário
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {isSuperAdmin && (
                            <>
                              {user.status === 'Ativo' ? (
                                <DropdownMenuItem
                                  className="text-amber-600 cursor-pointer"
                                  onClick={() => {
                                    updateItem(user.id, { status: 'Bloqueado' });
                                    userService.updateUserProfile(user.id, { status: 'Bloqueado' });
                                    toast.success(`Acesso bloqueado para ${user.nome}`);
                                  }}
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Bloquear Acesso
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-emerald-600 cursor-pointer"
                                  onClick={() => {
                                    updateItem(user.id, { status: 'Ativo' });
                                    userService.updateUserProfile(user.id, { status: 'Ativo' });
                                    toast.success(`Acesso desbloqueado para ${user.nome}`);
                                  }}
                                >
                                  <UserCheck className="w-3.5 h-3.5 mr-2" /> Desbloquear Acesso
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                className="text-rose-600 cursor-pointer"
                                onClick={() => {
                                  updateItem(user.id, { status: 'Inativo' });
                                  userService.updateUserProfile(user.id, { status: 'Inativo' });
                                  toast.success(`${user.nome} inativado`);
                                }}
                              >
                                <UserX className="w-3.5 h-3.5 mr-2" /> Inativar Usuário
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="text-rose-600 font-semibold cursor-pointer"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Registro
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Informações Detalhadas do Card */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Departamento & Cargo</span>
                      <span className="font-semibold text-foreground truncate block">{user.departamento || 'Geral'}</span>
                      <span className="text-muted-foreground text-[10px] block truncate">{user.cargo || 'Colaborador'}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">Perfil IAM & 2FA</span>
                      <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0 mt-0.5">
                        {user.perfil}
                      </Badge>
                      <div className="mt-1">
                        {user.mfaHabilitado ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                            <Smartphone className="w-3 h-3" /> 2FA Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-500 font-medium text-[10px]">
                            <ShieldAlert className="w-3 h-3" /> 2FA Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé: Último Acesso */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                    <span>Último acesso: {formatDate(user.ultimoLogin)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <UsuariosDashboard />
        )}
      </div>

      {/* MODAL DE VISUALIZAÇÃO DE SENHA */}
      <Dialog open={!!viewPasswordUser} onOpenChange={(open) => !open && setViewPasswordUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Credenciais de Acesso
            </DialogTitle>
            <DialogDescription>
              Senha corporativa de <strong>{viewPasswordUser?.nome}</strong> ({viewPasswordUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Senha Atual:</span>
              <div className="flex items-center gap-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  readOnly
                  value={viewPasswordUser?.senha || 'Focus@2026'}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(viewPasswordUser?.senha || 'Focus@2026');
                    toast.success('Senha copiada com sucesso!');
                  }}
                  title="Copiar Senha"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
              Como Super Administrador, você pode repassar esta credencial para o colaborador realizar o primeiro acesso ao Focus ERP.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPasswordUser(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserFormSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
