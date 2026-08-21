import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, User, Briefcase, Mail, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { Badge } from './ui/badge';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { currentUser, updateCurrentUserProfile } = useAuth();

  const [nome, setNome] = useState(currentUser?.nome || '');
  const [cargo, setCargo] = useState(currentUser?.cargo || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.foto || '');

  useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || '');
      setCargo(currentUser.cargo || '');
      setEmail(currentUser.email || '');
      setAvatarUrl(currentUser.foto || '');
    }
  }, [currentUser, open]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
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
          setAvatarUrl(compressed);
          toast.success("Foto de perfil otimizada e carregada!");
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Informe seu Nome de Exibição.");
      return;
    }

    updateCurrentUserProfile({
      nome: nome.trim(),
      nomeExibicao: nome.trim(),
      cargo: cargo.trim() || 'Colaborador Focus',
      email: email.trim(),
      foto: avatarUrl,
    });

    onOpenChange(false);
  };

  const getInitials = (nameStr: string) => {
    return (nameStr || 'AL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border shadow-2xl p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-bold flex items-center justify-between">
            <span>Meu Perfil de Acesso</span>
            <Badge variant="secondary" className="text-xs">
              {currentUser?.perfil || 'Usuário'}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Altere seu nome, cargo e foto de exibição corporativa.
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
            <span className="text-[11px] text-muted-foreground font-medium">Clique no ícone da câmera para enviar a foto</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Nome Completo
              </Label>
              <Input 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                placeholder="Seu nome"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" /> Cargo / Função
              </Label>
              <Input 
                value={cargo} 
                onChange={(e) => setCargo(e.target.value)} 
                placeholder="Ex: CEO / Diretor Executivo"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" /> E-mail Corporativo
              </Label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="seu.email@focustecnologia.com.br"
                className="text-xs h-9"
              />
            </div>

            <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-semibold text-xs text-foreground">Perfil de Acesso IAM</div>
                  <div className="text-[11px] text-muted-foreground">{currentUser?.departamento || 'Geral'}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-medium bg-background">
                {currentUser?.perfil || 'Usuário'}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} className="text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white">
            <Save className="w-3.5 h-3.5" /> Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
