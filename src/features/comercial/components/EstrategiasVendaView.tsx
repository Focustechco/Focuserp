import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, CheckCircle2, Target, Users, BookOpen, Plus, ArrowRight, User
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { EstrategiaComercial } from '../types';
import { toast } from 'sonner';

export function EstrategiasVendaView() {
  const { estrategias, addEstrategiaItem, toggleChecklistEstrategia } = useComercialStore();
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<EstrategiaComercial['categoria']>('Prospecção Outbound');
  const [objetivo, setObjetivo] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [quandoUtilizar, setQuandoUtilizar] = useState('');
  const [etapasText, setEtapasText] = useState('');
  const [checklistText, setChecklistText] = useState('');
  const [responsavel, setResponsavel] = useState('Adriano Leal');

  const handleCreate = () => {
    if (!titulo.trim() || !objetivo.trim()) {
      toast.error('Preencha o título e objetivo da estratégia.');
      return;
    }

    const etapas = etapasText.split('\n').map(e => e.trim()).filter(Boolean);
    const checklist = checklistText.split('\n').map(c => ({ item: c.trim(), concluido: false })).filter(c => Boolean(c.item));

    addEstrategiaItem({
      id: `est-${Date.now()}`,
      titulo: titulo.trim(),
      categoria,
      objetivo: objetivo.trim(),
      publicoAlvo: publicoAlvo.trim() || 'Decisores C-Level e Gerentes',
      quandoUtilizar: quandoUtilizar.trim() || 'Durante o ciclo comercial',
      etapas: etapas.length > 0 ? etapas : ['Planejamento', 'Execução', 'Acompanhamento'],
      checklist: checklist.length > 0 ? checklist : [{ item: 'Validar dados do cliente', concluido: false }],
      responsavel
    });

    toast.success('Estratégia comercial adicionada!');
    setOpenModal(false);
    setTitulo('');
    setObjetivo('');
    setPublicoAlvo('');
    setQuandoUtilizar('');
    setEtapasText('');
    setChecklistText('');
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-orange-500" /> Estratégias Comerciais & Base de Conhecimento
          </h3>
          <p className="text-xs text-muted-foreground">
            Diretrizes operacionais, táticas de prospecção, réguas de follow-up e checklists para o time.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Estratégia
        </Button>
      </div>

      {/* Grid de Estratégias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {estrategias.map(est => (
          <Card key={est.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-3 space-y-1.5 border-b">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-[10px] font-semibold bg-orange-50 text-orange-700 border-orange-300">
                  {est.categoria}
                </Badge>
                <span className="text-[11px] text-muted-foreground">Resp: <strong>{est.responsavel}</strong></span>
              </div>
              <CardTitle className="text-sm font-bold text-foreground">{est.titulo}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                🎯 {est.objetivo}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-3.5 text-xs">
              {/* Contexto & Público */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 text-[11px]">
                <div>
                  <span className="text-muted-foreground block font-semibold">Público-Alvo:</span>
                  <span className="font-medium text-foreground">{est.publicoAlvo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-semibold">Quando Utilizar:</span>
                  <span className="font-medium text-foreground">{est.quandoUtilizar}</span>
                </div>
              </div>

              {/* Etapas */}
              <div className="space-y-1.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground block">
                  Etapas de Execução:
                </span>
                <div className="space-y-1">
                  {est.etapas.map((et, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-foreground text-xs">
                      <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{et}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist Interativo */}
              <div className="space-y-2 pt-2 border-t">
                <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground block">
                  Checklist Operacional:
                </span>
                <div className="space-y-1.5">
                  {est.checklist.map((chk, cIdx) => (
                    <label 
                      key={cIdx} 
                      className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox 
                        checked={chk.concluido} 
                        onCheckedChange={() => toggleChecklistEstrategia(est.id, cIdx)}
                      />
                      <span className={`text-xs ${chk.concluido ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {chk.item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Nova Estratégia */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="w-5 h-5 text-orange-500" /> Cadastrar Nova Estratégia Comercial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título da Estratégia *</Label>
              <Input 
                placeholder="Ex: Playbook de Prospecção Outbound B2B"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Categoria</Label>
                <Select value={categoria} onValueChange={(v: any) => setCategoria(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prospecção Outbound">Outbound</SelectItem>
                    <SelectItem value="Inbound & Nutrição">Inbound</SelectItem>
                    <SelectItem value="Follow-up de Alto Impacto">Follow-up</SelectItem>
                    <SelectItem value="Negociação Avançada">Negociação</SelectItem>
                    <SelectItem value="Fechamento & Urgência">Fechamento</SelectItem>
                    <SelectItem value="Expansão de Carteira (Upsell)">Upsell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Responsável</Label>
                <Input 
                  value={responsavel}
                  onChange={e => setResponsavel(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Objetivo Comercial *</Label>
              <Input 
                placeholder="Ex: Aumentar a taxa de resposta em leads frios para 40%"
                value={objetivo}
                onChange={e => setObjetivo(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Público-Alvo</Label>
                <Input 
                  placeholder="Ex: CFOs e Diretores Financeiros"
                  value={publicoAlvo}
                  onChange={e => setPublicoAlvo(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Quando Utilizar</Label>
                <Input 
                  placeholder="Ex: Imediatamente após o envio da proposta"
                  value={quandoUtilizar}
                  onChange={e => setQuandoUtilizar(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Etapas de Execução (1 por linha)</Label>
              <Textarea 
                placeholder="Etapa 1: Pesquisa inicial&#10;Etapa 2: Primeiro toque no WhatsApp&#10;Etapa 3: Ligação de alinhamento"
                value={etapasText}
                onChange={e => setEtapasText(e.target.value)}
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Checklist Operacional (1 item por linha)</Label>
              <Textarea 
                placeholder="Validar CNPJ&#10;Identificar decisor final&#10;Registrar próximo follow-up"
                value={checklistText}
                onChange={e => setChecklistText(e.target.value)}
                className="rounded-xl min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              Salvar Estratégia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
