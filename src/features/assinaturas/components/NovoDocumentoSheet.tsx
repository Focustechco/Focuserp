import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Upload, Plus, Trash2, ShieldCheck, UserCheck, Landmark, Award } from 'lucide-react';
import { DocumentoAssinatura, TipoAssinatura, PapelAssinante } from '../types';
import { toast } from 'sonner';

interface NovoDocumentoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (novoDoc: DocumentoAssinatura) => void;
}

export function NovoDocumentoSheet({ isOpen, onClose, onSubmit }: NovoDocumentoSheetProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<'Contrato Comercial' | 'Admissão RH' | 'Proposta CRM' | 'Distrato' | 'Jurídico' | 'Outros'>('Contrato Comercial');
  const [tipoAssinatura, setTipoAssinatura] = useState<TipoAssinatura>('Eletrônica Simples');
  const [moduloOrigem, setModuloOrigem] = useState('Contratos');

  // Assinantes
  const [assinantes, setAssinantes] = useState<{ id: string; nome: string; email: string; cpf?: string; papel: PapelAssinante }[]>([]);

  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoCpf, setNovoCpf] = useState('');
  const [novoPapel, setNovoPapel] = useState<PapelAssinante>('Assinante');

  const handleAddAssinante = () => {
    if (!novoNome.trim() || !novoEmail.trim()) {
      toast.error('Informe nome e e-mail do assinante.');
      return;
    }

    setAssinantes([
      ...assinantes,
      {
        id: `ass-${Date.now()}`,
        nome: novoNome.trim(),
        email: novoEmail.trim(),
        cpf: novoCpf.trim() || '000.000.000-00',
        papel: novoPapel
      }
    ]);

    setNovoNome('');
    setNovoEmail('');
    setNovoCpf('');
  };

  const handleRemoveAssinante = (id: string) => {
    if (assinantes.length <= 1) {
      toast.error('O documento precisa de pelo menos 1 assinante.');
      return;
    }
    setAssinantes(assinantes.filter(a => a.id !== id));
  };

  const handleFinalizar = () => {
    if (!titulo.trim()) {
      toast.error('Informe o título do documento.');
      return;
    }

    const doc: DocumentoAssinatura = {
      id: `doc-${Date.now()}`,
      codigoValidacao: `FS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      titulo: titulo.trim(),
      descricao: descricao.trim() || 'Documento cadastrado para assinatura.',
      categoria,
      tamanhoKb: 1250,
      dataCriacao: new Date().toISOString(),
      status: 'Aguardando Assinatura',
      tipoAssinaturaExigida: tipoAssinatura,
      hashSHA256Original: `sha256_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
      moduloOrigem,
      assinantes: assinantes.map((a, idx) => ({
        id: a.id,
        nome: a.nome,
        email: a.email,
        cpf: a.cpf,
        papel: a.papel,
        status: 'Pendente',
        ordem: idx + 1
      })),
      auditoria: [
        {
          id: `aud-${Date.now()}`,
          dataHora: new Date().toISOString(),
          evento: 'Documento Registrado',
          ator: 'Administrador Focus',
          emailAtor: 'admin@focustecnologia.com.br',
          ip: '187.62.190.12',
          dispositivo: 'Navegador Web',
          metodoAutenticacao: 'Focus IAM',
          hashSHA256: `sha256_${Date.now()}`,
          detalhes: 'Documento criado e disparado para o fluxo de assinaturas.'
        }
      ]
    };

    onSubmit(doc);
    onClose();
    toast.success('Documento enviado com sucesso!');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[750px] flex flex-col p-0 h-full overflow-hidden bg-background">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border shadow-xs">
                <FileSignature className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Novo Documento para Assinatura</SheetTitle>
                <SheetDescription>
                  Configure os assinantes, modalidade de autenticação e validade jurídica.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Seção 1: Dados do Documento */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <Upload className="w-4 h-4 text-primary" /> 1. Arquivo e Identificação
            </h3>
            
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-accent/40 transition-colors cursor-pointer space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium">Clique para selecionar o PDF ou arraste aqui</div>
              <p className="text-xs text-muted-foreground">Suporta arquivos PDF de até 25MB (Com carimbo de hash automático)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Título do Contrato / Documento *</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Contrato de Prestação de Serviços Tecnológicos" />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={(val: any) => setCategoria(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contrato Comercial">Contrato Comercial</SelectItem>
                    <SelectItem value="Admissão RH">Admissão RH</SelectItem>
                    <SelectItem value="Proposta CRM">Proposta CRM</SelectItem>
                    <SelectItem value="Distrato">Distrato</SelectItem>
                    <SelectItem value="Jurídico">Jurídico</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label>Módulo Relacionado</Label>
                <Select value={moduloOrigem} onValueChange={setModuloOrigem}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contratos">Módulo Contratos</SelectItem>
                    <SelectItem value="RH">Módulo RH</SelectItem>
                    <SelectItem value="CRM">Módulo CRM</SelectItem>
                    <SelectItem value="Financeiro">Módulo Financeiro</SelectItem>
                    <SelectItem value="Jurídico">Módulo Jurídico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <hr />

          {/* Seção 2: Modalidade de Assinatura Exigida */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" /> 2. Nível de Assinatura Exigido
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${tipoAssinatura === 'Eletrônica Simples' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-accent'}`}
                onClick={() => setTipoAssinatura('Eletrônica Simples')}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" /> Simples
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Desenho, Token E-mail/SMS e Validação de IP.</p>
              </div>

              <div 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${tipoAssinatura === 'Gov.br (Avançada)' ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500' : 'hover:border-accent'}`}
                onClick={() => setTipoAssinatura('Gov.br (Avançada)')}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Landmark className="w-3.5 h-3.5" /> Gov.br (Oficial)
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Login e assinatura pelo portal Gov.br (Prata/Ouro).</p>
              </div>

              <div 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${tipoAssinatura === 'ICP-Brasil (Qualificada A1/A3)' ? 'border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500' : 'hover:border-accent'}`}
                onClick={() => setTipoAssinatura('ICP-Brasil (Qualificada A1/A3)')}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <Award className="w-3.5 h-3.5" /> ICP-Brasil
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Certificados digitais A1/A3 com validade total em cartórios.</p>
              </div>

            </div>
          </div>

          <hr />

          {/* Seção 3: Assinantes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <UserCheck className="w-4 h-4 text-primary" /> 3. Assinantes & Participantes
            </h3>

            <div className="space-y-2">
              {assinantes.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div>
                      <div className="font-medium text-xs">{a.nome} <span className="text-muted-foreground">({a.email})</span></div>
                      <div className="text-[10px] text-muted-foreground">CPF: {a.cpf} • Função: {a.papel}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAssinante(a.id)}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Adicionar novo participante */}
            <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <div className="text-xs font-semibold">Adicionar Assinante</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nome Completo *" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="bg-background text-xs" />
                <Input placeholder="E-mail Corporativo *" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} className="bg-background text-xs" />
                <Input placeholder="CPF" value={novoCpf} onChange={e => setNovoCpf(e.target.value)} className="bg-background text-xs" />
                <Select value={novoPapel} onValueChange={(v: any) => setNovoPapel(v)}>
                  <SelectTrigger className="bg-background text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assinante">Assinante</SelectItem>
                    <SelectItem value="Testemunha">Testemunha</SelectItem>
                    <SelectItem value="Aprovador">Aprovador</SelectItem>
                    <SelectItem value="Observador">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={handleAddAssinante}>
                <Plus className="w-3.5 h-3.5" /> Adicionar Participante
              </Button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-primary gap-2" onClick={handleFinalizar}>
            <ShieldCheck className="w-4 h-4" /> Disparar Documento
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}
