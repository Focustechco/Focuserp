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
import { User, Key, Shield, Lock, Globe, Laptop, History, Save, XCircle, Camera, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario, UserProfile, UserStatus } from '../types';
import { INITIAL_USUARIOS } from '../data/initialData';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { userService } from '@/services/userService';

interface UserFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null; // null for new user
}

export function UserFormSheet({ isOpen, onClose, user }: UserFormSheetProps) {
  const isEditing = !!user;
  const { isSuperAdmin, currentUser } = useAuth();

  const [nome, setNome] = useState('');
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('financeiro');
  const [status, setStatus] = useState<UserStatus>('Ativo');
  const [perfil, setPerfil] = useState<UserProfile>('Financeiro');
  const [mfaHabilitado, setMfaHabilitado] = useState(true);
  const [foto, setFoto] = useState('');

  const { addItem, updateItem } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setNomeExibicao(user.nomeExibicao || user.nome || '');
      setEmail(user.email || '');
      setSenha(user.senha || 'Focus@2026');
      setTelefone(user.telefone || '');
      setCargo(user.cargo || '');
      setDepartamento(user.departamento || 'Financeiro');
      setStatus(user.status || 'Ativo');
      setPerfil(user.perfil || 'Financeiro');
      setMfaHabilitado(user.mfaHabilitado ?? true);
      setFoto(user.foto || '');
    } else {
      setNome('');
      setNomeExibicao('');
      setEmail('');
      setSenha('Focus@2026');
      setTelefone('');
      setCargo('');
      setDepartamento('Financeiro');
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
          const maxDim = 256;
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
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            setFoto(compressed);
            toast.success("Foto de perfil carregada e pronta para salvar!");
          }
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGerarSenha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(pass);
    setShowSenha(true);
    toast.success('Nova senha gerada!');
  };

  const handleCopiarSenha = () => {
    if (!senha) return;
    navigator.clipboard.writeText(senha);
    toast.success('Senha copiada para a área de transferência!');
  };

  const handleSave = async () => {
    if (!isSuperAdmin && !isEditing) {
      toast.error('Permissão Negada', { description: 'Apenas o Super Administrador pode cadastrar novos usuários.' });
      return;
    }

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

    let finalFoto = foto;
    if (foto && foto.startsWith('data:')) {
      try {
        finalFoto = await userService.uploadUserAvatar(email.trim(), foto);
      } catch (e) {
        console.warn('[UserFormSheet] Erro ao subir foto no storage:', e);
      }
    }

    if (isEditing && user) {
      const updatedUser: Usuario = {
        ...user,
        nome: nome.trim(),
        nomeExibicao: nomeExibicao.trim() || nome.trim(),
        email: email.trim(),
        senha: senha.trim() || user.senha || 'Focus@2026',
        telefone: telefone.trim(),
        cargo: cargo.trim(),
        departamento,
        status,
        perfil,
        mfaHabilitado,
        foto: finalFoto,
      };
      updateItem(user.id, updatedUser);
      await userService.saveUser(updatedUser);
      toast.success('Usuário e foto atualizados e sincronizados no Banco de Dados!');
    } else {
      const novoUsuario: Usuario = {
        id: crypto.randomUUID(),
        foto: finalFoto,
        nome: nome.trim(),
        nomeExibicao: nomeExibicao.trim() || nome.trim(),
        email: email.trim(),
        senha: senha.trim() || 'Focus@2026',
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
          administracao: { visualizar: perfil === 'Super Administrador', criar: perfil === 'Super Administrador', editar: perfil === 'Super Administrador', excluir: false, aprovar: perfil === 'Super Administrador', exportar: true, importar: false, imprimir: true }
        },
        auditoria: [
          {
            id: `aud-${Date.now()}`,
            dataHora: new Date().toISOString(),
            acao: 'Criação de Usuário',
            modulo: 'Governança IAM',
            ip: '127.0.0.1',
            dispositivo: 'Painel Web',
            detalhes: `Conta criada pelo Administrador: ${currentUser?.nome || 'Admin'}`
          }
        ]
      };
      addItem(novoUsuario);
      await userService.saveUser(novoUsuario);
      toast.success('Novo usuário cadastrado e sincronizado com o Banco de Dados!');
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
                  Configure identidade, credenciais de acesso, perfil e permissões funcionais.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <Tabs defaultValue="pessoais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4">
            <TabsList className="w-full h-auto flex flex-wrap bg-muted/50 p-1">
              <TabsTrigger value="pessoais" className="gap-2 flex-1 min-w-[100px] text-xs"><User className="w-3.5 h-3.5"/> Dados</TabsTrigger>
              <TabsTrigger value="acesso" className="gap-2 flex-1 min-w-[100px] text-xs"><Key className="w-3.5 h-3.5"/> Acesso & Senha</TabsTrigger>
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

            {/* ABA 2: ACESSO & SENHA */}
            <TabsContent value="acesso" className="space-y-6 outline-none m-0">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 space-y-2">
                  <Label>Login de Usuário (E-mail)</Label>
                  <Input value={email || 'Informe o e-mail na aba Dados'} readOnly disabled className="bg-muted/40" />
                </div>

                {/* SENHA (VISÍVEL E GERÁVEL PARA SUPER ADMIN) */}
                <div className="col-span-2 space-y-2 bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-foreground flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-primary" /> Senha de Acesso do Usuário
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGerarSenha}
                        className="h-7 text-xs gap-1 text-primary hover:text-primary/80"
                      >
                        <RefreshCw className="w-3 h-3" /> Gerar Senha
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopiarSenha}
                        className="h-7 text-xs gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copiar
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      type={showSenha ? "text" : "password"}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Defina a senha do usuário"
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    >
                      {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    O Super Administrador tem permissão para visualizar, redefinir e fornecer esta senha diretamente ao colaborador.
                  </p>
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
                    <p className="text-xs text-muted-foreground">Contas ativas podem acessar o sistema e receber atribuições.</p>
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
                      <SelectItem value="Super Administrador">Super Administrador (Full Access Total)</SelectItem>
                      <SelectItem value="Administrador Financeiro">Administrador Financeiro</SelectItem>
                      <SelectItem value="Financeiro">Operação Financeira</SelectItem>
                      <SelectItem value="Comercial">Comercial & Contratos</SelectItem>
                      <SelectItem value="Projetos">Gestão de Projetos & Dev</SelectItem>
                      <SelectItem value="Diretoria">Diretoria</SelectItem>
                      <SelectItem value="Auditor">Auditor Externo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Apenas contas com perfil <strong>Super Administrador</strong> podem cadastrar usuários e gerenciar credenciais.
                  </p>
                </div>
            </TabsContent>

            {/* ABA 4: MATRIZ DE PERMISSÕES */}
            <TabsContent value="permissoes" className="space-y-4 outline-none m-0">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3">Módulo</th>
                      <th className="p-3 text-center">Ver</th>
                      <th className="p-3 text-center">Criar</th>
                      <th className="p-3 text-center">Editar</th>
                      <th className="p-3 text-center">Excluir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {modulesList.map(mod => (
                      <tr key={mod.id} className="hover:bg-muted/20">
                        <td className="p-3 font-medium">{mod.name}</td>
                        <td className="p-3 text-center"><Checkbox defaultChecked /></td>
                        <td className="p-3 text-center"><Checkbox defaultChecked={perfil.includes('Admin')} /></td>
                        <td className="p-3 text-center"><Checkbox defaultChecked={perfil.includes('Admin')} /></td>
                        <td className="p-3 text-center"><Checkbox defaultChecked={perfil === 'Super Administrador'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ABA 5: SEGURANÇA */}
            <TabsContent value="seguranca" className="space-y-4 outline-none m-0">
              <div className="p-4 bg-muted/20 border rounded-lg text-xs space-y-2">
                <p className="font-semibold text-foreground">Políticas de Segurança Focus IAM</p>
                <p className="text-muted-foreground">Senhas devem possuir no mínimo 8 caracteres com letras maiúsculas e caracteres especiais.</p>
                <p className="text-muted-foreground">A autenticação corporativa aplica isolamento de rotas e privilégios mínimos de acesso.</p>
              </div>
            </TabsContent>

          </ScrollArea>
        </Tabs>

        {/* RODAPÉ COM AÇÕES */}
        <div className="p-4 border-t flex justify-end gap-3 bg-muted/10">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <XCircle className="w-4 h-4" /> Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> {isEditing ? 'Salvar Alterações' : 'Cadastrar Usuário'}
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}
