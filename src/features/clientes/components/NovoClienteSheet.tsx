import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useClientesQuery } from '../hooks/useClientesQuery';
import { Cliente } from '../types';

import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';

export function NovoClienteSheet({ children, clienteToEdit }: { children: React.ReactNode, clienteToEdit?: Cliente }) {
  const [open, setOpen] = useState(false);
  
  const [tipoPessoa, setTipoPessoa] = useState(clienteToEdit?.tipo === 'Pessoa Física' ? 'pf' : 'pj');
  const [documento, setDocumento] = useState(clienteToEdit?.documento || '');
  const [razaoSocial, setRazaoSocial] = useState(clienteToEdit?.razaoSocial || '');
  const [nomeFantasia, setNomeFantasia] = useState(clienteToEdit?.nomeFantasia || '');
  const [ie, setIe] = useState(clienteToEdit?.inscricaoEstadual || '');
  const [segmento, setSegmento] = useState(clienteToEdit?.segmento || '');
  const [porte, setPorte] = useState(clienteToEdit?.porteEmpresa || '');
  const [cidade, setCidade] = useState(clienteToEdit?.endereco?.cidade || '');
  const [estado, setEstado] = useState(clienteToEdit?.endereco?.estado || '');
  
  const contatoPrincipal = clienteToEdit?.contatos?.find(c => c.principal) || clienteToEdit?.contatos?.[0];
  const [contatoNome, setContatoNome] = useState(contatoPrincipal?.nome || '');
  const [contatoEmail, setContatoEmail] = useState(contatoPrincipal?.email || '');
  const [contatoCelular, setContatoCelular] = useState(contatoPrincipal?.celular || '');

  const { saveCliente } = useClientesQuery();
  const { notificar } = useNotificacoesStore();

  // Reset fields if modal is opened/closed or clienteToEdit changes
  useEffect(() => {
    if (open) {
      setTipoPessoa(clienteToEdit?.tipo === 'Pessoa Física' ? 'pf' : 'pj');
      setDocumento(clienteToEdit?.documento || '');
      setRazaoSocial(clienteToEdit?.razaoSocial || '');
      setNomeFantasia(clienteToEdit?.nomeFantasia || '');
      setIe(clienteToEdit?.inscricaoEstadual || '');
      setSegmento(clienteToEdit?.segmento || '');
      setPorte(clienteToEdit?.porteEmpresa || '');
      setCidade(clienteToEdit?.endereco?.cidade || '');
      setEstado(clienteToEdit?.endereco?.estado || '');
      
      const principal = clienteToEdit?.contatos?.find(c => c.principal) || clienteToEdit?.contatos?.[0];
      setContatoNome(principal?.nome || '');
      setContatoEmail(principal?.email || '');
      setContatoCelular(principal?.celular || '');
    }
  }, [open, clienteToEdit]);

  const handleSave = () => {
    if (!razaoSocial && !nomeFantasia) {
      toast.error("Por favor, preencha a Razão Social ou Nome do cliente.");
      return;
    }

    if (!documento || documento.trim() === '') {
      toast.error(tipoPessoa === 'pj' ? "O CNPJ é obrigatório!" : "O CPF é obrigatório!");
      return;
    }

    if (!cidade || !estado) {
      toast.error("A Cidade e o Estado são obrigatórios!");
      return;
    }

    if (!contatoNome || !contatoCelular || !contatoEmail) {
      toast.error("Nome, E-mail e Celular do contato principal são obrigatórios!");
      return;
    }

    const clienteData = {
      tipo: tipoPessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física',
      razaoSocial: razaoSocial || nomeFantasia,
      nomeFantasia: nomeFantasia || razaoSocial,
      documento: documento,
      inscricaoEstadual: ie || 'Isento',
      status: clienteToEdit?.status || 'Ativo',
      segmento: segmento || 'Geral',
      porteEmpresa: porte || 'Médio',
      ultimaAtualizacao: new Date().toISOString(),
      endereco: {
        cep: clienteToEdit?.endereco?.cep || '',
        logradouro: clienteToEdit?.endereco?.logradouro || '',
        numero: clienteToEdit?.endereco?.numero || '',
        bairro: clienteToEdit?.endereco?.bairro || '',
        cidade: cidade,
        estado: estado,
        pais: 'Brasil'
      },
      contatos: [
        {
          id: contatoPrincipal?.id || crypto.randomUUID(),
          nome: contatoNome,
          cargo: contatoPrincipal?.cargo || 'Responsável',
          departamento: contatoPrincipal?.departamento || 'Geral',
          celular: contatoCelular,
          whatsapp: true,
          email: contatoEmail,
          principal: true
        }
      ]
    };

    if (clienteToEdit) {
      saveCliente({
        ...clienteToEdit,
        ...clienteData,
        id: clienteToEdit.id,
      } as any);
    } else {
      const novoCliente: Cliente = {
        id: crypto.randomUUID(),
        codigo: `CLI-${Math.floor(100 + Math.random() * 900)}`,
        dataCadastro: new Date().toISOString(),
        ...(clienteData as any)
      };
      saveCliente(novoCliente as any);
      
      // Disparar Notificação Real
      notificar({
        titulo: `Novo Cliente Cadastrado (${novoCliente.nomeFantasia || novoCliente.razaoSocial})`,
        descricao: `Cliente ${novoCliente.tipo} registrado na base com documento ${novoCliente.documento}.`,
        origem: 'CRM',
        tipo: 'Sucesso',
        prioridade: 'Normal',
        targetUrl: '/clientes'
      });
    }
    
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{clienteToEdit ? 'Editar Cliente' : 'Cadastro de Cliente'}</SheetTitle>
          <SheetDescription>
            Este é o cadastro mestre. As informações salvas aqui refletirão em todo o sistema.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="w-full">
          {/* Scrollable Tabs List for many tabs */}
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <TabsList className="w-max inline-flex">
              <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
              <TabsTrigger value="contatos">Contatos</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="contratos">Contratos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
          </div>
          
          {/* 1. DADOS GERAIS */}
          <TabsContent value="geral" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Cliente</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tipo-pj" checked={tipoPessoa === 'pj'} onCheckedChange={() => setTipoPessoa('pj')} />
                    <label htmlFor="tipo-pj" className="text-sm font-medium">Pessoa Jurídica</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tipo-pf" checked={tipoPessoa === 'pf'} onCheckedChange={() => setTipoPessoa('pf')} />
                    <label htmlFor="tipo-pf" className="text-sm font-medium">Pessoa Física</label>
                  </div>
                </div>
              </div>

              {tipoPessoa === 'pj' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input id="cnpj" placeholder="00.000.000/0001-00" value={documento} onChange={e => setDocumento(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social *</Label>
                      <Input id="razaoSocial" placeholder="Empresa XYZ Ltda" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                      <Input id="nomeFantasia" placeholder="XYZ" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ie">Inscrição Estadual</Label>
                      <Input id="ie" placeholder="Isento" value={ie} onChange={e => setIe(e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input id="cpf" placeholder="000.000.000-00" value={documento} onChange={e => setDocumento(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomePf">Nome Completo *</Label>
                    <Input id="nomePf" placeholder="João da Silva" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="situacao">Situação</Label>
                  <Select defaultValue="ativo">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segmento">Segmento</Label>
                  <Input id="segmento" placeholder="Ex: Tecnologia" value={segmento} onChange={e => setSegmento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="porte">Porte da Empresa</Label>
                  <Select value={porte} onValueChange={setPorte}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="me">Micro (ME)</SelectItem>
                      <SelectItem value="epp">Pequena (EPP)</SelectItem>
                      <SelectItem value="med">Média</SelectItem>
                      <SelectItem value="grd">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea id="obs" placeholder="Anotações internas sobre o cliente..." />
              </div>
            </div>
          </TabsContent>

          {/* 2. CONTATOS */}
          <TabsContent value="contatos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Contatos Vinculados</h4>
              <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Adicionar Contato</Button>
            </div>
            <div className="border rounded-md p-4 space-y-4 relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Contato *</Label>
                  <Input value={contatoNome} onChange={e => setContatoNome(e.target.value)} placeholder="João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Departamento</Label>
                  <Input defaultValue={contatoPrincipal?.cargo || "Diretor Financeiro"} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input type="email" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} placeholder="joao@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Celular / WhatsApp *</Label>
                  <Input value={contatoCelular} onChange={e => setContatoCelular(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="principal" defaultChecked />
                <label htmlFor="principal" className="text-sm font-medium">Este é o contato principal (Cobranças/Avisos)</label>
              </div>
            </div>
          </TabsContent>

          {/* 3. ENDEREÇO */}
          <TabsContent value="endereco" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" placeholder="00000-000" defaultValue={clienteToEdit?.endereco?.cep} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" placeholder="Avenida Brasil" defaultValue={clienteToEdit?.endereco?.logradouro} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" placeholder="1000" defaultValue={clienteToEdit?.endereco?.numero} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" placeholder="Sala 101" />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" placeholder="Centro" defaultValue={clienteToEdit?.endereco?.bairro} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input id="cidade" placeholder="São Paulo" value={cidade} onChange={e => setCidade(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="estado">Estado *</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* 4. FINANCEIRO (Apenas Consumo) */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="rounded-md border border-dashed p-6 text-center">
              <h3 className="font-semibold mb-2">Consulta Financeira (Contas a Receber)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Esta aba apenas reflete os dados existentes nos módulos financeiros. Você não cria títulos por aqui.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Valor em Aberto</div>
                  <div className="font-bold text-red-600">R$ 0,00</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Total Recebido</div>
                  <div className="font-bold text-emerald-600">R$ 0,00</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Mensalidade (Contrato)</div>
                  <div className="font-bold">R$ 0,00</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Títulos Atrasados</div>
                  <div className="font-bold text-muted-foreground">0</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 5. CONTRATOS */}
          <TabsContent value="contratos" className="space-y-4">
            <div className="rounded-md border border-dashed p-6 text-center">
              <h3 className="font-semibold mb-2">Contratos Vinculados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Consumo automático do módulo de Contratos.
              </p>
              <div className="border rounded text-center p-6 text-muted-foreground text-sm">
                Nenhum contrato ativo registrado para este cliente.
              </div>
            </div>
          </TabsContent>

          {/* 6. DOCUMENTOS */}
          <TabsContent value="documentos" className="space-y-4">
            <div className="border rounded p-6 flex flex-col items-center justify-center border-dashed">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <h4 className="font-medium">Anexar Documentos</h4>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Arraste Contratos Sociais, CNH, Procurações ou PDFs.
              </p>
              <Button variant="secondary" size="sm">Selecionar Arquivos</Button>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between border p-3 rounded">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-sm">Contrato_Social_Atualizado.pdf</div>
                    <div className="text-xs text-muted-foreground">Adicionado em 10/10/2025</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* 7. HISTÓRICO */}
          <TabsContent value="historico" className="space-y-4">
            <div className="relative border-l border-muted ml-4 pl-6 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Cobrança Automática Enviada</div>
                <div className="text-xs text-muted-foreground">Sistema • Hoje, 08:30</div>
                <div className="text-sm mt-1">E-mail de lembrete de vencimento enviado com sucesso.</div>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] bg-blue-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Contrato Assinado</div>
                <div className="text-xs text-muted-foreground">Ana Silva • 15/06/2025, 14:00</div>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] bg-gray-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Cadastro Realizado</div>
                <div className="text-xs text-muted-foreground">João Silva • 10/06/2025, 10:15</div>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{clienteToEdit ? 'Salvar Alterações' : 'Salvar Cliente'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
