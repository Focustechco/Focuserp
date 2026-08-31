import React, { useState } from 'react';
import { Projeto, ProjetoMembroEquipe } from '../types';
import { useProjetoDetalhesStore } from '../hooks/useProjetoDetalhesStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  UserCheck, 
  Clock, 
  Trash2, 
  Mail, 
  Phone, 
  Shield, 
  Briefcase, 
  Calendar,
  Layers
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';

interface ProjetoEquipeViewProps {
  projeto: Projeto;
}

export function ProjetoEquipeView({ projeto }: ProjetoEquipeViewProps) {
  const { equipe, addMembro, deleteMembro, updateMembro } = useProjetoDetalhesStore(projeto.id);
  const { data: usuarios = INITIAL_USUARIOS } = useLocalStorageState<Usuario[]>('focus_usuarios', INITIAL_USUARIOS);

  const [openModal, setOpenModal] = useState(false);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Desenvolvedor');
  const [papelNoProjeto, setPapelNoProjeto] = useState<ProjetoMembroEquipe['papelNoProjeto']>('Fullstack Engineer');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [horasDedicadasSemana, setHorasDedicadasSemana] = useState('40');

  const totalHorasSemanais = equipe.reduce((acc, m) => acc + (m.horasDedicadasSemana || 0), 0);

  const handleSelectUsuario = (userId: string) => {
    setSelectedUsuarioId(userId);
    const user = usuarios.find(u => u.id === userId);
    if (user) {
      setNome(user.nome);
      setEmail(user.email || '');
      setCargo(user.cargo || 'Especialista');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    addMembro({
      usuarioId: selectedUsuarioId || undefined,
      nome,
      cargo: cargo || 'Membro do Time',
      papelNoProjeto,
      email: email || undefined,
      telefone: telefone || undefined,
      horasDedicadasSemana: parseInt(horasDedicadasSemana) || 40,
      dataEntrada: new Date().toISOString().split('T')[0],
      status: 'Ativo',
    });

    setSelectedUsuarioId('');
    setNome('');
    setCargo('Desenvolvedor');
    setEmail('');
    setTelefone('');
    setHorasDedicadasSemana('40');
    setOpenModal(false);
  };

  const getInitials = (n: string) => {
    return (n || 'U').split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const getPapelBadge = (papel: ProjetoMembroEquipe['papelNoProjeto']) => {
    switch (papel) {
      case 'Gerente de Projeto (PM)': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      case 'Tech Lead': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'UI/UX Designer': return 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20';
      case 'QA Tester': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'Product Owner (PO)': return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20';
      default: return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner com Indicadores */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Tamanho da Squad</span>
              <div className="text-2xl font-bold text-foreground">{equipe.length} Membros</div>
              <p className="text-[11px] text-muted-foreground">Profissionais alocados no projeto</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Dedicação Semanal Total</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalHorasSemanais}h / semana</div>
              <p className="text-[11px] text-muted-foreground">Capacidade produtiva combinada</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Gerência de Projeto (PM)</span>
              <div className="text-sm font-bold text-foreground truncate">{projeto.responsavelPrincipal || 'Não definido'}</div>
              <p className="text-[11px] text-muted-foreground">Liderança de entrega</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Shield className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Membros da Equipe */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Squad & Alocação de Recursos Humanos
            </CardTitle>
            <CardDescription className="text-xs">
              Membros do time, papéis técnicos e carga horária alocada no projeto {projeto.codigo}.
            </CardDescription>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Alocar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" /> Alocar Profissional no Projeto
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                {/* Selecionar Usuário do ERP */}
                <div className="space-y-1.5">
                  <Label className="font-semibold">Selecionar do Catálogo de Usuários (Opcional)</Label>
                  <Select value={selectedUsuarioId} onValueChange={handleSelectUsuario}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Escolha um colaborador cadastrado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.nome} ({u.cargo || 'Colaborador'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Nome Completo do Profissional *</Label>
                  <Input 
                    placeholder="Ex: Carlos Andrade" 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Papel no Projeto *</Label>
                    <Select value={papelNoProjeto} onValueChange={(val: any) => setPapelNoProjeto(val)}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gerente de Projeto (PM)">Gerente de Projeto (PM)</SelectItem>
                        <SelectItem value="Tech Lead">Tech Lead</SelectItem>
                        <SelectItem value="Fullstack Engineer">Fullstack Engineer</SelectItem>
                        <SelectItem value="Desenvolvedor Frontend">Desenvolvedor Frontend</SelectItem>
                        <SelectItem value="Desenvolvedor Backend">Desenvolvedor Backend</SelectItem>
                        <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                        <SelectItem value="QA Tester">QA Tester</SelectItem>
                        <SelectItem value="DevOps & Cloud">DevOps & Cloud</SelectItem>
                        <SelectItem value="Product Owner (PO)">Product Owner (PO)</SelectItem>
                        <SelectItem value="Consultor Técnico">Consultor Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Cargo na Empresa</Label>
                    <Input 
                      placeholder="Ex: Senior Developer" 
                      value={cargo} 
                      onChange={e => setCargo(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">E-mail Profissional</Label>
                    <Input 
                      type="email" 
                      placeholder="dev@empresa.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Horas Semanais (Dedicadas)</Label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 40" 
                      value={horasDedicadasSemana} 
                      onChange={e => setHorasDedicadasSemana(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Confirmar Alocação
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-5">
          {equipe.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhum membro alocado nesta squad</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Aloque desenvolvedores, designers e gerentes para este projeto para gerir capacidade e entregas.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Alocar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {equipe.map((membro) => (
                <div 
                  key={membro.id} 
                  className="p-4 rounded-2xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-orange-500/30">
                        <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-xs">
                          {getInitials(membro.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-xs text-foreground">{membro.nome}</h4>
                        <p className="text-[11px] text-muted-foreground">{membro.cargo}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMembro(membro.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Desvincular membro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    <Badge className={getPapelBadge(membro.papelNoProjeto)}>
                      {membro.papelNoProjeto}
                    </Badge>

                    <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span>Carga: <strong>{membro.horasDedicadasSemana}h / semana</strong></span>
                      </div>
                      {membro.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate">{membro.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>Alocado desde: {new Date(membro.dataEntrada).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
