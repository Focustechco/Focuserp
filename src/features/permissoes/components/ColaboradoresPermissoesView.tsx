import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Building2, RefreshCw, Edit3, ShieldCheck, CheckCircle2, UserCheck } from 'lucide-react';
import { usePermissoesStore } from '../hooks/usePermissoesStore';
import { Usuario, UserProfile } from '@/features/usuarios/types';
import { toast } from 'sonner';

export function ColaboradoresPermissoesView() {
  const { usuarios, colaboradores, updateColaboradorSetorECargo } = usePermissoesStore();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  // Campos do Formulário de Edição de Setor / Perfil
  const [novoSetor, setNovoSetor] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<UserProfile>('Financeiro');

  const filteredUsers = usuarios.filter(u => 
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
      `Setor de ${selectedUser.nome} alterado para "${novoSetor}"! Sincronizado automaticamente com os módulos RH e Usuários.`,
      { duration: 5000 }
    );

    setSelectedUser(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Atribuição de Permissões & Setores por Colaborador
          </h3>
          <p className="text-xs text-muted-foreground">
            Altere o setor ou departamento do colaborador aqui para sincronizar instantaneamente no RH e no Diretório de Usuários.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input 
            placeholder="Pesquisar por nome, setor ou cargo..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="border rounded-lg overflow-hidden bg-card text-xs">
            <table className="w-full">
              <thead className="bg-muted/50 border-b text-left">
                <tr>
                  <th className="p-3">Colaborador / Usuário</th>
                  <th className="p-3">Setor / Departamento</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Perfil de Acesso (RBAC)</th>
                  <th className="p-3">Status Sync RH</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const rhSync = colaboradores.some(c => 
                    ((c?.email || '').toLowerCase() === (user?.email || '').toLowerCase() && user?.email) || 
                    ((c?.nomeCompleto || '').toLowerCase() === (user?.nome || '').toLowerCase() && user?.nome)
                  );

                  return (
                    <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-primary">{user.nome}</div>
                        <div className="text-[10px] text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-3 font-semibold">
                        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                          <Building2 className="w-3 h-3" /> {user.departamento}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground font-medium">{user.cargo}</td>
                      <td className="p-3 font-bold">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                          {user.perfil}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {rhSync ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sincronizado RH
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Padrão Usuário</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleOpenEdit(user)}
                          className="h-7 text-xs gap-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Alterar Setor & Perfil
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Alterar Setor & Perfil (Com Sincronização Automática) */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="w-5 h-5 text-orange-500" /> Sincronizador de Setor & Permissões
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                <p className="font-bold text-foreground">{selectedUser.nome}</p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                <p className="text-[10px] text-orange-700 dark:text-orange-300 mt-1 font-semibold">
                  ⚠️ Alterar o setor aqui atualizará instantaneamente o módulo RH e o diretório IAM.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Novo Setor / Departamento *</Label>
                <Select value={novoSetor} onValueChange={setNovoSetor}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input value={novoCargo} onChange={e => setNovoCargo(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Novo Perfil de Acesso (RBAC)</Label>
                <Select value={novoPerfil} onValueChange={(v: any) => setNovoPerfil(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveSync} className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white">
              <RefreshCw className="w-4 h-4" /> Salvar & Sincronizar em Todos os Módulos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
