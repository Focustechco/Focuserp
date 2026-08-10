import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useContasPagarQuery } from '../hooks/useContasPagarQuery';
import { ContaPagar } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor } from '@/features/fornecedores/types';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';

import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';

export function NovaContaSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [parcelado, setParcelado] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  const [fornecedor, setFornecedor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Infraestrutura');
  const [valorOriginal, setValorOriginal] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Boleto');
  const [responsavel, setResponsavel] = useState('');

  const { saveConta } = useContasPagarQuery();
  const { data: fornecedores } = useLocalStorageState<Fornecedor>('focus_fornecedores');
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { notificar } = useNotificacoesStore();
  
  const handleSave = () => {
    if (!fornecedor || fornecedor === 'none') {
      toast.error("Por favor, selecione um Fornecedor cadastrado no sistema.");
      return;
    }
    if (!descricao) {
      toast.error("Por favor, informe a Descrição da despesa.");
      return;
    }
    if (!valorOriginal || parseFloat(valorOriginal) <= 0) {
      toast.error("O Valor Original deve ser maior que zero!");
      return;
    }
    if (!dataVencimento) {
      toast.error("A Data de Vencimento é obrigatória!");
      return;
    }
    if (!categoria) {
      toast.error("A Categoria é obrigatória!");
      return;
    }

    const val = parseFloat(valorOriginal) || 1000;

    const novaConta: ContaPagar = {
      id: `pag-${Date.now()}`,
      numero: `PAG-${Math.floor(100 + Math.random() * 900)}`,
      fornecedor,
      descricao,
      categoria: categoria || 'Operacional',
      valorOriginal: val,
      valorPago: 0,
      saldo: val,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: dataVencimento || new Date().toISOString().split('T')[0],
      formaPagamento: (formaPagamento as any) || 'Boleto',
      status: 'Pendente',
      responsavel: responsavel || 'Financeiro',
      ultimaAtualizacao: new Date().toISOString(),
      historico: [
        { id: `h-${Date.now()}`, data: new Date().toISOString(), usuario: 'Usuário', acao: 'Criação da conta' }
      ]
    };

    saveConta(novaConta as any);

    // Disparar Notificação Automática
    notificar({
      titulo: `Nova Conta a Pagar Lançada (${novaConta.numero})`,
      descricao: `Despesa de R$ ${val.toLocaleString('pt-BR')} para ${fornecedor} com vencimento em ${dataVencimento}.`,
      origem: 'Financeiro',
      tipo: 'Aviso',
      prioridade: 'Alta',
      targetUrl: '/contas-a-pagar',
      usuarioDestino: responsavel || 'Você'
    });

    toast.success("Despesa cadastrada com sucesso!");
    setOpen(false);
    setDescricao('');
    setFornecedor('');
    setValorOriginal('');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Nova Despesa</SheetTitle>
          <SheetDescription>
            Registre uma nova obrigação financeira a pagar.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="parcelamento">Parcelas</TabsTrigger>
            <TabsTrigger value="recorrencia">Recorrência</TabsTrigger>
          </TabsList>
          
          {/* Aba: Geral */}
          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor *</Label>
                <Select value={fornecedor} onValueChange={setFornecedor}>
                  <SelectTrigger id="fornecedor">
                    <SelectValue placeholder="Selecione o fornecedor cadastrado" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum fornecedor cadastrado. Cadastre no módulo Fornecedores primeiro.
                      </SelectItem>
                    ) : (
                      fornecedores.map((f) => {
                        const name = f.nomeFantasia || f.razaoSocial || 'Fornecedor Sem Nome';
                        return (
                          <SelectItem key={f.id} value={name}>
                            {name} ({f.documento || 'Sem doc'})
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" placeholder="Ex: Fatura de Hospedagem Cloud" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                      <SelectItem value="impostos">Impostos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Aprovador / Responsável</Label>
                  <Select value={responsavel} onValueChange={setResponsavel}>
                    <SelectTrigger id="responsavel"><SelectValue placeholder="Selecione o Responsável" /></SelectTrigger>
                    <SelectContent>
                      {usuarios.filter(u => u.status === 'Ativo').map(u => (
                        <SelectItem key={u.id} value={u.nome}>{u.nome} ({u.cargo || u.departamento})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Internas</Label>
                <Input id="observacoes" placeholder="Centro de custos, justificativas..." />
              </div>
            </div>
          </TabsContent>

          {/* Aba: Financeiro */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorOriginal">Valor da Despesa (R$) *</Label>
                <Input id="valorOriginal" type="number" placeholder="0,00" value={valorOriginal} onChange={e => setValorOriginal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Vencimento Original *</Label>
                <Input id="dataVencimento" type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto Obtido (R$)</Label>
                <Input id="desconto" type="number" placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multa">Multa/Juros Projetados (R$)</Label>
                <Input id="multa" type="number" placeholder="0,00" />
              </div>
            </div>
          </TabsContent>

          {/* Aba: Parcelamento */}
          <TabsContent value="parcelamento" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h4 className="font-medium text-sm">Despesa Parcelada</h4>
                <p className="text-xs text-muted-foreground">Dividir este pagamento em várias faturas.</p>
              </div>
              <Switch checked={parcelado} onCheckedChange={setParcelado} />
            </div>

            {parcelado && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Quantidade de Parcelas</Label>
                  <Input type="number" placeholder="Ex: 12" />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo (dias)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>1º Vencimento</Label>
                  <Input type="date" />
                </div>
                <div className="col-span-2 pt-2">
                  <Button variant="secondary" className="w-full">Simular Parcelas</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba: Recorrência */}
          <TabsContent value="recorrencia" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h4 className="font-medium text-sm">Despesa Recorrente</h4>
                <p className="text-xs text-muted-foreground">Obrigações contínuas (aluguel, folha, licenças).</p>
              </div>
              <Switch checked={recorrente} onCheckedChange={setRecorrente} />
            </div>

            {recorrente && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2 col-span-2">
                  <Label>Frequência</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Fim da Recorrência (Opcional)</Label>
                  <Input type="date" />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Despesa</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
