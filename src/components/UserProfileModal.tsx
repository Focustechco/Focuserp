import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, User, Briefcase, Mail, Save } from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { toast } from 'sonner';

export interface ActiveUserProfile {
  nome: string;
  cargo: string;
  email: string;
  avatarUrl?: string;
}

export const DEFAULT_ACTIVE_USER: ActiveUserProfile = {
  nome: "Adriano Leal",
  cargo: "CEO / Diretor de Tecnologia",
  email: "adriano.leal@focustecnologia.com.br",
  avatarUrl: ""
};

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { data: activeUsers, setAllItems: setActiveUsers } = useLocalStorageState<ActiveUserProfile>('focus_active_user', [DEFAULT_ACTIVE_USER]);
  const activeUser = activeUsers[0] || DEFAULT_ACTIVE_USER;

  const { data: usuarios, updateItem: updateUser } = useLocalStorageState<Usuario>('focus_usuarios');

  const [nome, setNome] = useState(activeUser.nome);
  const [cargo, setCargo] = useState(activeUser.cargo);
  const [email, setEmail] = useState(activeUser.email);
  const [avatarUrl, setAvatarUrl] = useState(activeUser.avatarUrl || '');

  useEffect(() => {
    if (activeUser) {
      setNome(activeUser.nome);
      setCargo(activeUser.cargo);
      setEmail(activeUser.email);
      setAvatarUrl(activeUser.avatarUrl || '');
    }
  }, [activeUser, open]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setAvatarUrl(evt.target.result as string);
        toast.success("Foto de perfil carregada com sucesso!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Informe seu Nome de Exibio.");
      return;
    }

    const updatedUser: ActiveUserProfile = {
      nome: nome.trim(),
      cargo: cargo.trim() || 'Colaborador Focus',
      email: email.trim() || 'usuario@focustecnologia.com.br',
      avatarUrl
    };

    // 1. Atualizar Perfil Ativo Global
    setActiveUsers([updatedUser]);



    // 3. Sincronizar com Mdulo Usurios (IAM) se houver registro correspondente
    const userCorrespondente = usuarios.find(u => u.nome === activeUser.nome || u.email === activeUser.email || u.nome === updatedUser.nome);
    if (userCorrespondente) {
      updateUser(userCorrespondente.id, {
        ...userCorrespondente,
        nome: updatedUser.nome,
        cargo: updatedUser.cargo,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl
      });
    }

    toast.success(`Perfil de "${updatedUser.nome}" atualizado com sucesso!`);
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return (name || 'AL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border shadow-2xl p-6">
        <DialogHeader className="mb-2">
          {/* SEM O CONE DA FOTO 2 DE ACORDO COM A SOLICITAO */}
          <DialogTitle className="text-lg font-bold">
            Personalizao do Perfil
          </DialogTitle>
          <DialogDescription className="text-xs">
            Altere seu nome, cargo e foto de perfil de exibio na plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 text-xs">
          {/* Avatar com upload de Foto Real */}
          <div className="flex flex-col items-center justify-center space-y-2 pb-2">
            <div className="relative group cursor-pointer">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg overflow-hidden">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-orange-500/10 text-orange-600">
                  {getInitials(nome)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 bg-orange-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer rounded-full z-20"
                onChange={handleFotoChange}
                title="Clique para alterar a foto de perfil"
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">Clique no cone da cmera para enviar a foto</span>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Nome de Exibio *
            </Label>
            <Input 
              placeholder="Ex: Adriano Leal" 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary" /> Cargo / Posio *
            </Label>
            <Input 
              placeholder="Ex: CEO / Diretor de Tecnologia" 
              value={cargo} 
              onChange={e => setCargo(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" /> E-mail Corporativo
            </Label>
            <Input 
              type="email"
              placeholder="exemplo@focustecnologia.com.br" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Save className="w-4 h-4" /> Salvar Alteraes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
