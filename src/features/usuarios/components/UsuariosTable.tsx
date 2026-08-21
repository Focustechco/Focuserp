import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocalStorageState } from '@/hooks/useDataStore';
import { INITIAL_USUARIOS } from '../data/initialData';
import { Search, Filter, MoreHorizontal, KeyRound, ShieldAlert, UserCheck, UserX, Smartphone, Trash2, Key, Copy, Eye, EyeOff, UserSwitch } from 'lucide-react';
import { UserFormSheet } from './UserFormSheet';
import { Usuario, UserStatus } from '../types';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';

export function UsuariosTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  // Modal para Visualizar Senha (Exclusivo Super Admin)
  const [viewPasswordUser, setViewPasswordUser] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: usuarios, updateItem, deleteItem } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { isSuperAdmin, currentUser, switchUser } = useAuth();

  const filteredUsers = (usuarios || []).filter(user => {
    const matchesSearch = 
      (user.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.departamento || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || (user.status || '').toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Ativo</Badge>;
      case 'Inativo': return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20">Inativo</Badge>;
      case 'Bloqueado': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">Bloqueado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca logou';
    return new Date(dateString).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 animate-fade-in pt-4">
      {/* Barra de Ferramentas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, e-mail, depto..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
              <SelectItem value="bloqueado">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isSuperAdmin ? (
            <Button className="gap-2 w-full sm:w-auto" onClick={() => { setSelectedUser(null); setSheetOpen(true); }}>
              <UserCheck className="w-4 h-4" /> Novo Usuário
            </Button>
          ) : (
            <Badge variant="outline" className="text-xs py-2 px-3 bg-muted/40">
              Apenas Super Administrador pode cadastrar usuários
            </Badge>
          )}
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Departamento & Cargo</TableHead>
              <TableHead>Perfil (IAM)</TableHead>
              <TableHead>Segurança & 2FA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhum usuário encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-primary/20 shadow-sm shrink-0">
                        <AvatarImage src={user.foto} className="object-cover" />
                        <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                          {(user.nome || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {user.nome}
                          {user.id === currentUser?.id && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
                              Você (Sessão Ativa)
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{user.departamento}</div>
                    <div className="text-xs text-muted-foreground">{user.cargo}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{user.perfil}</Badge>
                    {(user.rolesComplementares || []).length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1">+{(user.rolesComplementares || []).length} roles</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      {user.mfaHabilitado ? (
                         <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Smartphone className="w-3.5 h-3.5" /> 2FA ON</span>
                      ) : (
                         <span className="flex items-center gap-1 text-rose-500"><ShieldAlert className="w-3.5 h-3.5" /> 2FA OFF</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(user.ultimoLogin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Ações Administrativas</DropdownMenuLabel>
                        
                        {isSuperAdmin && (
                          <DropdownMenuItem onClick={() => { setSelectedUser(user as unknown as Usuario); setSheetOpen(true); }}>
                            Editar Configurações IAM
                          </DropdownMenuItem>
                        )}

                        {isSuperAdmin && (
                          <DropdownMenuItem onClick={() => { setViewPasswordUser(user); setShowPassword(false); }}>
                            <Key className="w-4 h-4 mr-2 text-primary" /> Visualizar / Copiar Senha
                          </DropdownMenuItem>
                        )}

                        {isSuperAdmin && user.id !== currentUser?.id && (
                          <DropdownMenuItem onClick={() => switchUser(user.id)} className="text-blue-600 dark:text-blue-400">
                            <KeyRound className="w-4 h-4 mr-2" /> Alternar para este Usuário
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {isSuperAdmin && (
                          <>
                            {user.status === 'Ativo' ? (
                              <DropdownMenuItem className="text-amber-600" onClick={() => {
                                updateItem(user.id, { status: 'Bloqueado' });
                                toast.success(`Acesso bloqueado para o usuário ${user.nome}`);
                              }}>
                                <ShieldAlert className="w-4 h-4 mr-2" /> Bloquear Acesso
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-emerald-600" onClick={() => {
                                updateItem(user.id, { status: 'Ativo' });
                                toast.success(`Acesso desbloqueado para o usuário ${user.nome}`);
                              }}>
                                <UserCheck className="w-4 h-4 mr-2" /> Desbloquear Acesso
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem className="text-rose-600" onClick={() => {
                              updateItem(user.id, { status: 'Inativo' });
                              toast.success(`O usuário ${user.nome} foi inativado`);
                            }}>
                              <UserX className="w-4 h-4 mr-2" /> Inativar Usuário
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-rose-600 font-semibold" onClick={() => {
                              if (usuarios.length <= 1) {
                                toast.error('Não é possível excluir o único usuário administrador do sistema.');
                                return;
                              }
                              deleteItem(user.id);
                              toast.success(`Usuário ${user.nome} excluído do diretório.`);
                            }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir Registro
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL DE VISUALIZAÇÃO DE SENHA (SUPER ADMIN) */}
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
                  type={showPassword ? "text" : "password"}
                  readOnly
                  value={viewPasswordUser?.senha || 'Focus@2026'}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar" : "Mostrar"}
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
