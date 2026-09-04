import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Camera, Save, ExternalLink, Mail, Phone, MapPin, Globe, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresaConfig } from '@/features/configuracoes/hooks/useEmpresaConfig';
import { useNavigate } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';

interface EmpresaProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmpresaProfileModal({ open, onOpenChange }: EmpresaProfileModalProps) {
  const { empresa, updateEmpresa, uploadLogo, isSaving } = useEmpresaConfig();
  const navigate = useNavigate();

  const [nomeFantasia, setNomeFantasia] = useState(empresa.nomeFantasia || '');
  const [razaoSocial, setRazaoSocial] = useState(empresa.razaoSocial || '');
  const [cnpj, setCnpj] = useState(empresa.cnpj || '');
  const [email, setEmail] = useState(empresa.email || '');
  const [telefone, setTelefone] = useState(empresa.telefone || '');
  const [cidade, setCidade] = useState(empresa.cidade || '');
  const [estado, setEstado] = useState(empresa.estado || '');
  const [logoUrl, setLogoUrl] = useState(empresa.logoUrl || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (empresa) {
      setNomeFantasia(empresa.nomeFantasia || '');
      setRazaoSocial(empresa.razaoSocial || '');
      setCnpj(empresa.cnpj || '');
      setEmail(empresa.email || '');
      setTelefone(empresa.telefone || '');
      setCidade(empresa.cidade || '');
      setEstado(empresa.estado || '');
      setLogoUrl(empresa.logoUrl || '');
    }
  }, [empresa, open]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const url = await uploadLogo('principal', file);
      setLogoUrl(url);
      toast.success('Logotipo da empresa atualizado!');
    } catch (err) {
      toast.error('Falha ao atualizar logotipo.');
    }
  };

  const handleSave = async () => {
    if (!nomeFantasia.trim()) {
      toast.error('Informe o Nome Fantasia da Empresa.');
      return;
    }

    try {
      await updateEmpresa({
        nomeFantasia: nomeFantasia.trim(),
        razaoSocial: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        logoUrl,
      });
      onOpenChange(false);
    } catch (err) {
      // Erro tratado
    }
  };

  const getCompanyInitials = (nameStr: string) => {
    return (nameStr || 'FE')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border bg-card shadow-2xl p-0 overflow-hidden rounded-2xl">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLogoUpload}
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
        />

        {/* HEADER MODAL COM BANNER */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-16 w-16 border-2 border-white/80 shadow-md bg-white overflow-hidden">
                <AvatarImage src={logoUrl} className="object-contain p-1 w-full h-full" />
                <AvatarFallback className="bg-orange-100 text-orange-700 font-black text-xl">
                  {getCompanyInitials(nomeFantasia || 'Focus')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white truncate">{nomeFantasia || 'Focus Tecnologia'}</h3>
                <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-bold">Matriz</Badge>
              </div>
              <p className="text-xs text-orange-100 truncate">{razaoSocial || 'Focus Tecnologia e Sistemas Ltda'}</p>
              <p className="text-[11px] text-white/80 font-mono mt-0.5">{cnpj || '48.912.345/0001-89'}</p>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO RÁPIDO */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">Nome Fantasia (Exibição Global)</Label>
              <Input
                value={nomeFantasia}
                onChange={e => setNomeFantasia(e.target.value)}
                placeholder="Nome da empresa..."
                className="text-xs h-9 font-semibold text-orange-600 dark:text-orange-400"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">Razão Social</Label>
              <Input
                value={razaoSocial}
                onChange={e => setRazaoSocial(e.target.value)}
                placeholder="Razão social oficial..."
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">CNPJ</Label>
              <Input
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Telefone</Label>
              <Input
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(00) 0000-0000"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">E-mail Corporativo</Label>
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="contato@empresa.com.br"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cidade</Label>
              <Input
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="São Paulo"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Estado (UF)</Label>
              <Input
                value={estado}
                onChange={e => setEstado(e.target.value)}
                placeholder="SP"
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="pt-2 border-t flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: '/configuracoes' as any });
              }}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 font-semibold cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" /> Todas Configurações da Empresa
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-9 gap-1.5 font-bold cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Salvando...' : 'Salvar Perfil da Empresa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
