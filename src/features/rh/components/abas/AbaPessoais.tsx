import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, CreditCard, QrCode, Building2 } from 'lucide-react';
import { FormaPagamentoRH } from '../../types';
import { toast } from 'sonner';

interface AbaPessoaisProps {
  foto: string;
  setFoto: (val: string) => void;
  nomeCompleto: string;
  setNomeCompleto: (val: string) => void;
  nomeSocial: string;
  setNomeSocial: (val: string) => void;
  cpf: string;
  setCpf: (val: string) => void;
  rg: string;
  setRg: (val: string) => void;
  dataNascimento: string;
  setDataNascimento: (val: string) => void;
  telefone: string;
  setTelefone: (val: string) => void;
  emailCorporativo: string;
  setEmailCorporativo: (val: string) => void;
  
  // Mtodo de Pagamento
  formaPagamento: FormaPagamentoRH;
  setFormaPagamento: (val: FormaPagamentoRH) => void;
  tipoChavePix: string;
  setTipoChavePix: (val: string) => void;
  chavePix: string;
  setChavePix: (val: string) => void;
  banco: string;
  setBanco: (val: string) => void;
  agencia: string;
  setAgencia: (val: string) => void;
  conta: string;
  setConta: (val: string) => void;
  tipoConta: string;
  setTipoConta: (val: string) => void;
  titularConta: string;
  setTitularConta: (val: string) => void;
}

export function AbaPessoais({
  foto, setFoto,
  nomeCompleto, setNomeCompleto,
  nomeSocial, setNomeSocial,
  cpf, setCpf,
  rg, setRg,
  dataNascimento, setDataNascimento,
  telefone, setTelefone,
  emailCorporativo, setEmailCorporativo,
  formaPagamento, setFormaPagamento,
  tipoChavePix, setTipoChavePix,
  chavePix, setChavePix,
  banco, setBanco,
  agencia, setAgencia,
  conta, setConta,
  tipoConta, setTipoConta,
  titularConta, setTitularConta
}: AbaPessoaisProps) {
  
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Otimizar e comprimir foto para banco de dados relacional
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFoto(compressedDataUrl);
          toast.success("Foto de perfil carregada e otimizada com sucesso!");
        } else {
          setFoto(evt.target?.result as string);
          toast.success("Foto de perfil anexada!");
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name: string) => {
    return (name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pt-4 animate-fade-in pb-8">
      
      {/* Foto & Identificao com Upload Real */}
      <div className="flex items-center gap-6 pb-6 border-b">
        <div className="relative group cursor-pointer">
          <Avatar className="w-20 h-20 border-4 border-background shadow-md overflow-hidden">
            <AvatarImage src={foto} className="object-cover" />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {getInitials(nomeCompleto)}
            </AvatarFallback>
          </Avatar>
          
          {/* Boto de Camera com Input Transparente */}
          <div className="absolute -bottom-1 -right-1 rounded-full w-7 h-7 bg-orange-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Camera className="w-3.5 h-3.5" />
          </div>

          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer rounded-full z-20"
            onChange={handleFotoChange}
            title="Clique para alterar a foto de perfil"
          />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Foto & Perfil do Colaborador</h3>
          <p className="text-xs text-muted-foreground">Clique no cone da cmera para enviar a foto de perfil do colaborador (JPG, PNG ou WEBP).</p>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label>Nome Completo *</Label>
          <Input 
            placeholder="Ex: Adriano Leal" 
            value={nomeCompleto} 
            onChange={e => setNomeCompleto(e.target.value)} 
          />
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label>Nome Social (Opcional)</Label>
          <Input 
            placeholder="Como prefere ser chamado" 
            value={nomeSocial} 
            onChange={e => setNomeSocial(e.target.value)} 
          />
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label>CPF *</Label>
          <Input 
            placeholder="000.000.000-00" 
            value={cpf} 
            onChange={e => setCpf(e.target.value)} 
          />
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label>RG (Opcional)</Label>
          <Input 
            placeholder="00.000.000-0" 
            value={rg} 
            onChange={e => setRg(e.target.value)} 
          />
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label>Data de Nascimento *</Label>
          <Input 
            type="date" 
            value={dataNascimento} 
            onChange={e => setDataNascimento(e.target.value)} 
          />
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label>Telefone / WhatsApp *</Label>
          <Input 
            placeholder="(11) 99999-9999" 
            value={telefone} 
            onChange={e => setTelefone(e.target.value)} 
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>E-mail Corporativo *</Label>
          <Input 
            type="email" 
            placeholder="colaborador@focustecnologia.com.br" 
            value={emailCorporativo} 
            onChange={e => setEmailCorporativo(e.target.value)} 
          />
        </div>
      </div>

      {/* SEO: MTODO DE PAGAMENTO DO COLABORADOR */}
      <div className="pt-4 border-t space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Mtodo de Pagamento do Colaborador</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Defina como e onde o salrio/remunerao do colaborador ser depositado mensalmente.
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs bg-muted/20 p-4 rounded-xl border">
          
          <div className="col-span-2 sm:col-span-1 space-y-2">
            <Label className="font-semibold">Forma de Pagamento *</Label>
            <Select value={formaPagamento} onValueChange={(v: any) => setFormaPagamento(v)}>
              <SelectTrigger><SelectValue placeholder="Selecione a forma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX (Transferncia Instantnea)</SelectItem>
                <SelectItem value="Transferncia Bancria (TED/DOC)">Transferncia Bancria (TED/DOC)</SelectItem>
                <SelectItem value="Depsito em Conta">Depsito em Conta Corrente/Poupana</SelectItem>
                <SelectItem value="Boleto">Boleto de Cobrana / PJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-2">
            <Label className="font-semibold">Titular da Conta</Label>
            <Input 
              placeholder="Nome completo do titular (se em branco, usa o nome do colaborador)" 
              value={titularConta} 
              onChange={e => setTitularConta(e.target.value)} 
            />
          </div>

          {/* Se PIX */}
          {formaPagamento === 'PIX' && (
            <>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label className="font-semibold flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-emerald-500" /> Tipo de Chave PIX
                </Label>
                <Select value={tipoChavePix} onValueChange={setTipoChavePix}>
                  <SelectTrigger><SelectValue placeholder="Tipo de Chave" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                    <SelectItem value="Chave Aleatria">Chave Aleatria (EVP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label className="font-semibold">Chave PIX</Label>
                <Input 
                  placeholder="Informe a chave PIX" 
                  value={chavePix} 
                  onChange={e => setChavePix(e.target.value)} 
                />
              </div>
            </>
          )}

          {/* Dados Bancrios */}
          <div className="col-span-2 sm:col-span-1 space-y-2">
            <Label className="font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-500" /> Banco / Instituio Financeira
            </Label>
            <Input 
              placeholder="Ex: Ita, Nubank, Banco do Brasil, Bradesco" 
              value={banco} 
              onChange={e => setBanco(e.target.value)} 
            />
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-2">
            <Label className="font-semibold">Tipo de Conta</Label>
            <Select value={tipoConta} onValueChange={setTipoConta}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                <SelectItem value="Conta Poupana">Conta Poupana</SelectItem>
                <SelectItem value="Conta Pagamento">Conta Pagamento / Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-2">
            <Label className="font-semibold">Agncia (sem dgito)</Label>
            <Input 
              placeholder="Ex: 0185" 
              value={agencia} 
              onChange={e => setAgencia(e.target.value)} 
            />
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-2">
            <Label className="font-semibold">Nmero da Conta com Dgito</Label>
            <Input 
              placeholder="Ex: 49201-8" 
              value={conta} 
              onChange={e => setConta(e.target.value)} 
            />
          </div>

        </div>
      </div>

    </div>
  );
}
