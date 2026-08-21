import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Key, Shield, Lock, Globe, Laptop, History, Save, XCircle, Camera } from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario, UserProfile, UserStatus } from '../types';
import { INITIAL_USUARIOS } from '../data/initialData';
import { toast } from 'sonner';
import { ActiveUserProfile, DEFAULT_ACTIVE_USER } from '@/components/UserProfileModal';

interface UserFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null; // null for new user
}

export function UserFormSheet({ isOpen, onClose, user }: UserFormSheetProps) {
  const isEditing = !!user;

  const [nome, setNome] = useState('');
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('financeiro');
  const [status, setStatus] = useState<UserStatus>('Ativo');
  const [perfil, setPerfil] = useState<UserProfile>('Financeiro');
  const [mfaHabilitado, setMfaHabilitado] = useState(true);
  const [foto, setFoto] = useState('');

  const { addItem, updateItem } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { data: activeUsers, save: setActiveUsers } = useLocalStorageState<ActiveUserProfile>('focus_active_user', [DEFAULT_ACTIVE_USER]);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setNomeExibicao(user.nomeExibicao || user.nome || '');
      setEmail(user.email || '');
      setTelefone(user.telefone || '');
      setCargo(user.cargo || '');
      setDepartamento(user.departamento || 'financeiro');
      setStatus(user.status || 'Ativo');
      setPerfil(user.perfil || 'Financeiro');
      setMfaHabilitado(user.mfaHabilitado ?? true);
      setFoto(user.foto || '');
    } else {
      setNome('');
      setNomeExibicao('');
      setEmail('');
      setTelefone('');
      setCargo('');
      setDepartamento('financeiro');
      setStatus('Ativo');
      setPerfil('Financeiro');
      setMfaHabilitado(true);
      setFoto('');
    }
  }, [user, isOpen]);

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const src = evt.target?.result as string;
        if (!src) return;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 120;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setFoto(compressed);
            toast.success("Foto de perfil otimizada e carregada!");
          }
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error('Erro de Validação', { description: 'O Nome Completo do usuário é obrigatório.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Erro de Validação', { description: 'Informe um E-mail corporativo válido.' });
      return;
    }
    if (!cargo.trim()) {
      toast.error('Erro de Validação', { description: 'O Cargo / Título é obrigatório.' });
      return;
    }

    if (isEditing && user) {
      const updatedUser = {
        ...user,
        nome: nome.trim(),
        nomeExibicao: nomeExibicao.trim() || nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cargo: cargo.trim(),
        departamento,
        status,
        perfil,
        mfaHabilitado,
        foto
      };
      updateItem(user.id, updatedUser);

      // Se o usuário editado for o ativo, atualiza o perfil ativo
      if (activeUsers.length > 0 && (activeUsers[0].nome === user.nome || activeUsers[0].email === user.email)) {
        setActiveUsers([{
          ...activeUsers[0],
          id: 'active_user_1',
          nome: updatedUser.nome,
          cargo: updatedUser.cargo,
          email: updatedUser.email,
          avatarUrl: foto || activeUsers[0].avatarUrl
        }]);
      }

      toast.success('Usuário atualizado com sucesso!');
    } else {
      const novoUsuario: Usuario = {
        id: `usr-${Date.now()}`,
        foto,
        nome: nome.trim(),
        nomeExibicao: nomeExibicao.trim() || nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || '(11) 90000-0000',
        cargo: cargo.trim(),
        departamento,
        matricula: `FT-${Math.floor(100 + Math.random() * 900)}`,
        status,
        perfil,
        rolesComplementares: [],
        mfaHabilitado,
        ultimoLogin: new Date().toISOString(),
        tentativasFalhas: 0,
        sessoes: [],
        permissoes: {
          dashboard: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          contasReceber: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          contasPagar: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          cobrancas: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          fluxoCaixa: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          clientes: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          fornecedores: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          projetos: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          contratos: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          centroCustos: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          planoContas: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          fiscal: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          agenda: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          conciliacao: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          dre: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          kpis: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, exportar: true, importar: false, imprimir: true },
          administracao: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, exportar: false, importar: false, imprimir: false }
        },
        auditoria: [
          {
            id: `aud-${Date.now()}`,
            dataHora: new Date().toISOString(),
            acao: 'Usuário Criado',
            modulo: 'Administração',
            ip: '127.0.0.1',
            dispositivo: 'Navegador Web',
            detalhes: 'Usuário ativado no diretório local.'
          }
        ]
      };
      addItem(novoUsuario);

      // Ao criar um usuário, ele vira o perfil da conta (Active User)
      setActiveUsers([{
        id: 'active_user_1',
        nome: novoUsuario.nome,
        cargo: novoUsuario.cargo,
        email: novoUsuario.email,
        avatarUrl: foto || (activeUsers.length > 0 ? activeUsers[0].avatarUrl : '') // seta a nova foto enviada
      }]);

      toast.success('Novo usuário cadastrado e definido como Perfil da Conta!');
    }

    onClose();
  };

  const modulesList = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'contasReceber', name: 'Contas a Receber' },
    { id: 'contasPagar', name: 'Contas a Pagar' },
    { id: 'cobrancas', name: 'Cobranças' },
    { id: 'fluxoCaixa', name: 'Fluxo de Caixa' },
    { id: 'clientes', name: 'Clientes' },
    { id: 'fornecedores', name: 'Fornecedores' },
    { id: 'projetos', name: 'Projetos' },
    { id: 'contratos', name: 'Contratos' },
    { id: 'centroCustos', name: 'Centro de Custos' },
    { id: 'planoContas', name: 'Plano de Contas' },
    { id: 'fiscal', name: 'Fiscal' },
    { id: 'agenda', name: 'Agenda Financeira' },
    { id: 'conciliacao', name: 'Conciliação Bancária' },
    { id: 'dre', name: 'DRE Gerencial' },
    { id: 'kpis', name: 'Indicadores (KPIs)' },
    { id: 'administracao', name: 'Administração IAM' }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[800px] flex flex-col p-0 h-full overflow-hidden bg-background">
        
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border shadow-xs">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  {isEditing ? `Editar: ${user?.nome}` : 'Novo Usuário (IAM)'}
                </SheetTitle>
                <SheetDescription>
                  Configure identidade, perfil e matriz de acesso.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <Tabs defaultValue="pessoais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4">
            <TabsList className="w-full h-auto flex flex-wrap bg-muted/50 p-1">
              <TabsTrigger value="pessoais" className="gap-2 flex-1 min-w-[100px] text-xs"><User className="w-3.5 h-3.5"/> Dados</TabsTrigger>
              <TabsTrigger value="acesso" className="gap-2 flex-1 min-w-[100px] text-xs"><Key className="w-3.5 h-3.5"/> Acesso</TabsTrigger>
              <TabsTrigger value="perfil" className="gap-2 flex-1 min-w-[100px] text-xs"><Shield className="w-3.5 h-3.5"/> Perfil</TabsTrigger>
              <TabsTrigger value="permissoes" className="gap-2 flex-1 min-w-[110px] text-xs"><Lock className="w-3.5 h-3.5"/> Matriz</TabsTrigger>
              <TabsTrigger value="seguranca" className="gap-2 flex-1 min-w-[100px] text-xs"><Globe className="w-3.5 h-3.5"/> Seg.</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            
            {/* ABA 1: DADOS PESSOAIS */}
            <TabsContent value="pessoais" className="space-y-4 outline-none m-0">
              <div className="flex items-center gap-4 py-4 mb-4 border-b">
                <div className="relative group shrink-0">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                    <AvatarImage src={foto} className="object-cover" />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                      {nome ? nome.substring(0, 2).toUpperCase() : 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <Label 
                    htmlFor="foto-upload-user" 
                    className="absolute bottom-0 right-[-4px] p-1 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </Label>
                  <Input 
                    id="foto-upload-user" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFotoUpload}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">Foto de Perfil</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Clique no ícone de câmera para adicionar ou alterar a foto do usuário.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Adriano Leal" />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>Nome de Exibição</Label>
                  <Input value={nomeExibicao} onChange={e => setNomeExibicao(e.target.value)} placeholder="Ex: Adriano Leal" />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>E-mail Corporativo *</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="adriano@empresa.com" type="email" />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>Telefone / Celular</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99888-7766" />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>Departamento</Label>
                  <Select value={departamento} onValueChange={setDepartamento}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Comercial">Comercial / Vendas</SelectItem>
                      <SelectItem value="Engenharia">Tecnologia & Dev</SelectItem>
                      <SelectItem value="Diretoria">Diretoria</SelectItem>
                      <SelectItem value="RH">Recursos Humanos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>Cargo / Título *</Label>
                  <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: CEO / Gerente de Projetos" />
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: ACESSO */}
            <TabsContent value="acesso" className="space-y-6 outline-none m-0">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 space-y-2">
                  <Label>Login de Usuário</Label>
                  <Input value={email} readOnly disabled className="bg-muted/40" />
                </div>
              </div>
              
              <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Autenticação de 2 Fatores (MFA)</Label>
                    <p className="text-xs text-muted-foreground">Exigir código via app no login.</p>
                  </div>
                  <Switch checked={mfaHabilitado} onCheckedChange={setMfaHabilitado} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Status da Conta</Label>
                    <p className="text-xs text-muted-foreground">Contas ativas podem receber atribuição de tarefas.</p>
                  </div>
                  <Select value={status} onValueChange={val => setStatus(val as UserStatus)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* ABA 3: PERFIL */}
            <TabsContent value="perfil" className="space-y-6 outline-none m-0">
               <div className="space-y-2">
                  <Label>Perfil Principal (Master Role)</Label>
                  <Select value={perfil} onValueChange={val => setPerfil(val as UserProfile)}>
                    <SelectTrigger><SelectValue placeholder="Selecione um perfil padrão" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Administrador">Super Administrador (Full Access)</SelectItem>
                      <SelectItem value="Administrador Financeiro">Administrador Financeiro</SelectItem>
                      <SelectItem value="Financeiro">Operação Financeira</SelectItem>
                      <SelectItem value="Comercial">Comercial & Contratos</SelectItem>
                      <SelectItem value="Projetos">Gestão de Projetos</SelectItem>
                      <SelectItem value="Diretoria">Diretoria (Read-Only Total)</SelectItem>
                      <SelectItem value="Auditor">Auditor Externo</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </TabsContent>

            {/* ABA 4: MATRIZ DE PERMISSÕES */}
            <TabsContent value="permissoes" className="space-y-4 outline-none m-0">
               <div className="border rounded-md overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                     <tr>
                       <th className="px-4 py-3 font-medium">Módulo</th>
                       <th className="px-4 py-3 font-medium text-center">Ver</th>
                       <th className="px-4 py-3 font-medium text-center">Criar</th>
                       <th className="px-4 py-3 font-medium text-center">Editar</th>
                       <th className="px-4 py-3 font-medium text-center">Excluir</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {modulesList.map((mod) => (
                       <tr key={mod.id} className="hover:bg-muted/20">
                         <td className="px-4 py-3 font-medium">{mod.name}</td>
                         <td className="px-4 py-3 text-center"><Checkbox defaultChecked /></td>
                         <td className="px-4 py-3 text-center"><Checkbox defaultChecked /></td>
                         <td className="px-4 py-3 text-center"><Checkbox defaultChecked /></td>
                         <td className="px-4 py-3 text-center"><Checkbox defaultChecked /></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </TabsContent>

            {/* ABA 5: SEGURANÇA AVANÇADA */}
            <TabsContent value="seguranca" className="space-y-6 outline-none m-0">
               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1 space-y-2">
                   <Label>Horário Permitido</Label>
                   <Select defaultValue="qualquer">
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="qualquer">Qualquer horário</SelectItem>
                       <SelectItem value="comercial">Horário Comercial (08h às 18h)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="col-span-2 sm:col-span-1 space-y-2">
                   <Label>Dias Permitidos</Label>
                   <Select defaultValue="todos">
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="todos">Todos os dias</SelectItem>
                       <SelectItem value="uteis">Apenas dias úteis (Seg-Sex)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> Salvar Usuário
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}
