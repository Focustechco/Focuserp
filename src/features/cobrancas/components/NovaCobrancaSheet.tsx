import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Send, Clock, QrCode, MessageSquare, Mail, Smartphone, Layers, CheckCircle2, User } from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { Cliente } from '@/features/clientes/types';
import { Cobranca, CanalEnvio } from '../types';
import { INITIAL_COBRANCAS } from '../mockData';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function NovaCobrancaSheet({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tituloId, setTituloId] = useState<string>('');
  const [clienteNome, setClienteNome] = useState('');
  const [valor, setValor] = useState<string>('');
  const [vencimento, setVencimento] = useState('');
  const [referencia, setReferencia] = useState('');
  
  // Canais selecionados
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);

  // Mensagem e Agendamento
  const [mensagem, setMensagem] = useState('');
  const [agendado, setAgendado] = useState(false);
  const [dataAgendamento, setDataAgendamento] = useState('');

  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: clientes = [] } = useLocalStorageState<Cliente>('focus_clientes');
  const { addItem } = useLocalStorageState<Cobranca>('focus_cobrancas', INITIAL_COBRANCAS);
  const { notificar } = useNotificacoesStore();

  // Títulos em aberto ou pendentes
  const titulosDisponiveis = useMemo(() => {
    return contasReceber.filter(t => t.status !== 'Recebido');
  }, [contasReceber]);

  // Ao selecionar um título real do Contas a Receber
  const handleSelectTitulo = (id: string) => {
    setTituloId(id);
    const titulo = titulosDisponiveis.find(t => t.id === id);
    if (titulo) {
      setClienteNome(titulo.cliente || 'Cliente');
      setValor(String(titulo.valorOriginal || 0));
      setVencimento(titulo.dataVencimento || new Date().toISOString().split('T')[0]);
      setReferencia(titulo.numero || `REC-${id.substring(0, 4)}`);
      
      const vlrFormatado = formatCurrency(titulo.valorOriginal);
      const dtFormatada = formatDateBrasilia(titulo.dataVencimento);
      setMensagem(`Olá ${titulo.cliente}! Segue o lembrete de pagamento da fatura ${titulo.numero} no valor de ${vlrFormatado} com vencimento em ${dtFormatada}. Segue em anexo a chave PIX e o boleto bancário.`);
    }
  };

  const handleSave = () => {
    if (!clienteNome.trim()) {
      toast.error("Por favor, selecione um título ou informe o Cliente.");
      return;
    }
    const valorNum = parseFloat(valor) || 0;
    if (valorNum <= 0) {
      toast.error("O valor da cobrança deve ser maior que zero.");
      return;
    }

    const canais: CanalEnvio[] = [];
    if (sendWhatsApp) canais.push('WhatsApp');
    if (sendEmail) canais.push('E-mail');
    if (sendSms) canais.push('SMS');

    if (canais.length === 0) {
      toast.error("Selecione ao menos um canal de envio (WhatsApp, E-mail ou SMS).");
      return;
    }

    const cobId = `COB-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const pixChave = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865405${valorNum.toFixed(2)}5802BR5913FOCUS ERP6009SAO PAULO62070503***6304`;

    const novaCobranca: Cobranca = {
      id: cobId,
      cliente: clienteNome.trim(),
      tituloReferencia: referencia || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      valor: valorNum,
      vencimento: vencimento || new Date().toISOString().split('T')[0],
      canal: canais,
      dataHoraEnvio: agendado ? undefined : nowIso,
      agendamento: agendado ? (dataAgendamento || nowIso) : undefined,
      statusCobranca: agendado ? 'Agendada' : 'Enviada',
      statusEntrega: agendado ? 'Pendente' : 'Entregue',
      statusLeitura: 'Não lida',
      responsavel: 'Usuário Focus',
      mensagemPersonalizada: mensagem,
      pixCopiaECola: pixChave,
      linhaDigitavel: "34191.79001 01043.510047 91020.150008 8 98760000540000",
      linkBoleto: `https://focuserp.com.br/boletos/${referencia || cobId}.pdf`,
      timeline: [
        {
          id: `t-${Date.now()}-1`,
          dataHora: nowIso,
          usuario: "Usuário Focus",
          canal: canais[0],
          acao: agendado ? "Cobrança Agendada" : "Cobrança Disparada",
          detalhes: agendado 
            ? `Programada para disparo em ${dataAgendamento || 'data agendada'}.`
            : `Envio multicanal concluído para ${canais.join(', ')}.`
        }
      ]
    };

    addItem(novaCobranca);

    notificar({
      titulo: agendado ? `Cobrança Agendada para ${clienteNome}` : `Cobrança Enviada para ${clienteNome}`,
      descricao: `${formatCurrency(valorNum)} via ${canais.join(' / ')}. Referência ${novaCobranca.tituloReferencia}.`,
      origem: 'Cobranças',
      tipo: 'Informação',
      prioridade: 'Normal',
      targetUrl: '/cobrancas',
      usuarioDestino: 'Você'
    });

    toast.success(agendado ? "Cobrança agendada com sucesso!" : "Cobrança disparada com sucesso!");
    setOpen(false);
    
    // Limpar estado
    setTituloId('');
    setClienteNome('');
    setValor('');
    setVencimento('');
    setReferencia('');
    setMensagem('');
    setAgendado(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Send className="w-4 h-4" /> Nova Cobrança
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-[620px] overflow-y-auto p-6 space-y-6">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border shadow-xs">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Nova Cobrança Multicanal</SheetTitle>
              <SheetDescription>
                Dispare notificações automáticas por WhatsApp, E-mail e SMS com PIX e Boleto.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* 1. SELEÇÃO DO TÍTULO REAL */}
          <div className="space-y-3 p-4 bg-muted/30 border rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" /> 1. Selecionar Título a Receber
            </h4>
            
            <div className="space-y-2">
              <Label>Título Pendente (Contas a Receber)</Label>
              <Select value={tituloId} onValueChange={handleSelectTitulo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um título real em aberto..." />
                </SelectTrigger>
                <SelectContent>
                  {titulosDisponiveis.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum título pendente no momento</SelectItem>
                  ) : (
                    titulosDisponiveis.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="font-mono font-bold mr-1.5">{t.numero}</span>
                        <span>• {t.cliente}</span>
                        <span className="text-emerald-600 font-semibold ml-1.5">({formatCurrency(t.valorOriginal)})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente / Sacado *</Label>
                <Input 
                  placeholder="Nome do cliente" 
                  value={clienteNome} 
                  onChange={e => setClienteNome(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor da Cobrança (R$) *</Label>
                <Input 
                  type="number" 
                  placeholder="0,00" 
                  value={valor} 
                  onChange={e => setValor(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Vencimento Original</Label>
                <Input 
                  type="date" 
                  value={vencimento} 
                  onChange={e => setVencimento(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Referência / Documento</Label>
                <Input 
                  placeholder="Ex: REC-1025" 
                  value={referencia} 
                  onChange={e => setReferencia(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* 2. CANAIS DE ENVIO */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Canais de Disparo
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                  sendWhatsApp ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300' : 'bg-card'
                }`}
                onClick={() => setSendWhatsApp(!sendWhatsApp)}
              >
                <MessageSquare className="w-5 h-5 mb-1.5 text-green-600" />
                <span className="text-xs font-bold">WhatsApp</span>
                <span className="text-[10px] text-muted-foreground">PIX + PDF</span>
              </div>

              <div 
                className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                  sendEmail ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300' : 'bg-card'
                }`}
                onClick={() => setSendEmail(!sendEmail)}
              >
                <Mail className="w-5 h-5 mb-1.5 text-blue-600" />
                <span className="text-xs font-bold">E-mail</span>
                <span className="text-[10px] text-muted-foreground">Boleto anexo</span>
              </div>

              <div 
                className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                  sendSms ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' : 'bg-card'
                }`}
                onClick={() => setSendSms(!sendSms)}
              >
                <Smartphone className="w-5 h-5 mb-1.5 text-amber-600" />
                <span className="text-xs font-bold">SMS</span>
                <span className="text-[10px] text-muted-foreground">Lembrete rápido</span>
              </div>
            </div>
          </div>

          {/* 3. MENSAGEM */}
          <div className="space-y-2">
            <Label htmlFor="mensagem">3. Mensagem Personalizada</Label>
            <Textarea 
              id="mensagem" 
              placeholder="Digite o texto da notificação..." 
              className="h-24 text-xs resize-none"
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              O link do boleto e o código PIX Copia e Cola serão injetados automaticamente no rodapé da mensagem.
            </p>
          </div>

          {/* 4. AGENDAMENTO */}
          <div className="border rounded-xl p-3.5 bg-card flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold cursor-pointer">Agendar Envio</Label>
              <p className="text-[11px] text-muted-foreground">Programar o disparo para uma data futura.</p>
            </div>
            <Switch checked={agendado} onCheckedChange={setAgendado} />
          </div>

          {agendado && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="text-xs">Data e Hora do Disparo</Label>
              <Input 
                type="datetime-local" 
                value={dataAgendamento} 
                onChange={e => setDataAgendamento(e.target.value)} 
              />
            </div>
          )}
        </div>

        <SheetFooter className="pt-4 border-t flex flex-row items-center justify-between sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-2">
            <Send className="w-4 h-4" /> {agendado ? 'Agendar Cobrança' : 'Disparar Cobrança'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
