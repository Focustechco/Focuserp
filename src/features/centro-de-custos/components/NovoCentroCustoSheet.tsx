import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Info, Share2, FolderKanban, Activity, History } from "lucide-react";
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto } from '../types';
import { INITIAL_CENTROS } from '../data/initialData';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { toast } from 'sonner';

export function NovoCentroCustoSheet({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<string>("Despesa");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [centroPaiId, setCentroPaiId] = useState<string>("");
  const [departamento, setDepartamento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [descricao, setDescricao] = useState("");

  const { addItem, data: centros } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const centrosPaisDisponiveis = centros.filter(c => !c.centroPaiId);

  const handleSave = () => {
    if (!codigo.trim()) {
      toast.error("Erro de Validação", { description: "Por favor, informe o Código Analítico (ex: 1.0 ou 1.1)." });
      return;
    }
    if (!nome.trim()) {
      toast.error("Erro de Validação", { description: "Por favor, informe o Nome do Centro de Custo." });
      return;
    }
    if (!departamento.trim()) {
      toast.error("Erro de Validação", { description: "O Departamento / Área é obrigatório." });
      return;
    }
    if (!responsavel.trim()) {
      toast.error("Erro de Validação", { description: "O Responsável pela área é obrigatório." });
      return;
    }

    const novoCC: CentroCusto = {
      id: `cc-${Date.now()}`,
      codigo: codigo.trim(),
      nome: nome.trim(),
      tipo: (tipo as any) || 'Despesa',
      categoria: categoria || (tipo === 'Receita' ? 'Desenvolvimento' : 'Administrativo'),
      departamento: departamento.trim(),
      responsavel: responsavel.trim(),
      status: 'Ativo',
      centroPaiId: centroPaiId && centroPaiId !== 'none' ? centroPaiId : undefined,
      descricao: descricao.trim() || 'Centro de Custo criado pelo usuário.',
      rateios: [],
      projetosVinculados: [],
      contratosVinculados: [],
      totalReceitaClassificada: 0,
      totalDespesaClassificada: 0,
      quantidadeLancamentos: 0,
      dataCadastro: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      historico: [
        {
          id: `h-${Date.now()}`,
          acao: 'Centro de Custo Criado',
          usuario: responsavel.trim(),
          data: new Date().toISOString()
        }
      ]
    };

    addItem(novoCC);

    if (responsavel) {
      notificar({
        titulo: `Você foi definido como gestor do Centro de Custo "${novoCC.nome}"`,
        descricao: `Centro de Custo ${novoCC.codigo} (${novoCC.departamento}) registrado sob sua responsabilidade.`,
        origem: 'Configurações',
        tipo: 'Informação',
        prioridade: 'Normal',
        targetUrl: '/centro-de-custos',
        usuarioDestino: responsavel.trim()
      });
    }

    toast.success("Centro de Custo cadastrado com sucesso!");
    setOpen(false);
    
    // Limpar estado
    setNome("");
    setCodigo("");
    setCategoria("");
    setCentroPaiId("");
    setDepartamento("");
    setResponsavel("");
    setDescricao("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || <Button><Plus className="mr-2 h-4 w-4" /> Novo Centro de Custo</Button>}
      </SheetTrigger>
      <SheetContent side="right" className="w-[95vw] sm:w-[800px] sm:max-w-[800px] flex flex-col p-0">
        <div className="p-6 pb-2 border-b">
          <SheetHeader>
            <SheetTitle>Configuração do Centro de Custo</SheetTitle>
            <SheetDescription>
              Crie a estrutura analítica de receitas e despesas.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="gerais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b overflow-x-auto scrollbar-hide">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent flex-nowrap min-w-max pb-1">
              <TabsTrigger value="gerais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Dados Gerais</TabsTrigger>
              <TabsTrigger value="rateio" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Regras de Rateio</TabsTrigger>
              <TabsTrigger value="projetos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-blue-600">Projetos (Integrados)</TabsTrigger>
              <TabsTrigger value="financeiro" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-blue-600">Financeiro (Integrado)</TabsTrigger>
              <TabsTrigger value="historico" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Histórico</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            {/* 1. DADOS GERAIS */}
            <TabsContent value="gerais" className="space-y-4 mt-0">
              <div className="flex items-center gap-3 p-4 bg-muted/30 border rounded-lg mb-4">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm">Centros de Custos estruturam a classificação financeira da empresa para organizar relatórios DRE e custos departamentais.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código Analítico *</Label>
                  <Input placeholder="Ex: 1.0 ou 1.1" value={codigo} onChange={e => setCodigo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Centro *</Label>
                  <Input placeholder="Ex: Marketing de Performance" value={nome} onChange={e => setNome(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>Natureza *</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receita">Receita (Centro de Lucro)</SelectItem>
                      <SelectItem value="Despesa">Despesa (Centro de Custo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria Financeira</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger><SelectValue placeholder="Selecione a Categoria" /></SelectTrigger>
                    <SelectContent>
                      {tipo === 'Receita' ? (
                        <>
                          <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                          <SelectItem value="Consultoria">Consultoria</SelectItem>
                          <SelectItem value="Suporte">Suporte</SelectItem>
                          <SelectItem value="Licenciamento">Licenciamento</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Administrativo">Administrativo</SelectItem>
                          <SelectItem value="Cloud">Cloud e Infraestrutura</SelectItem>
                          <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                          <SelectItem value="Jurídico">Jurídico</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Centro Pai (Hierarquia)</Label>
                  <Select value={centroPaiId} onValueChange={setCentroPaiId}>
                    <SelectTrigger><SelectValue placeholder="Nenhum (Centro Raiz)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Será um Centro Raiz)</SelectItem>
                      {centrosPaisDisponiveis.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Departamento / Área *</Label>
                  <Input placeholder="Ex: Engenharia / Vendas" value={departamento} onChange={e => setDepartamento(e.target.value)} />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Gestor / Responsável *</Label>
                  <SelectResponsavel
                    value={responsavel}
                    onValueChange={setResponsavel}
                    placeholder="Selecione o Gestor responsável"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição / Finalidade</Label>
                <Textarea placeholder="Para que serve este centro?" className="h-20" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
            </TabsContent>

            {/* 2. RATEIO */}
            <TabsContent value="rateio" className="space-y-4 mt-0">
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Regras de Rateio Automático</h3>
               </div>
               <div className="border rounded-lg p-8 text-center bg-muted/5">
                <Share2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Nenhuma regra de rateio configurada no momento.</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  As regras de rateio automático poderão ser vinculadas após salvar o centro.
                </p>
               </div>
            </TabsContent>

            {/* 3. PROJETOS (Read-only) */}
            <TabsContent value="projetos" className="space-y-4 mt-0">
               <div className="border rounded-lg p-8 text-center bg-muted/5">
                <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Projetos Vinculados</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Os projetos cadastrados no módulo de Projetos que pertençam a esta área serão associados automaticamente.
                </p>
               </div>
            </TabsContent>

            {/* 4. FINANCEIRO (Read-only) */}
            <TabsContent value="financeiro" className="space-y-4 mt-0">
               <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <Activity className="w-5 h-5" />
                <p className="text-sm">Os lançamentos financeiros associados serão contabilizados automaticamente a partir das Contas a Pagar e Contas a Receber.</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 border p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/10">
                  <Label className="text-emerald-800 dark:text-emerald-500">Receita Acumulada</Label>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">R$ 0,00</div>
                </div>
                <div className="space-y-2 border p-4 rounded-lg bg-rose-50 dark:bg-rose-950/10">
                  <Label className="text-rose-800 dark:text-rose-500">Despesa Acumulada</Label>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">R$ 0,00</div>
                </div>
               </div>
            </TabsContent>

            {/* 5. HISTÓRICO */}
            <TabsContent value="historico" className="space-y-4 mt-0">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Estruturação de Centro de Custo</span>
                      <span className="text-xs text-muted-foreground">Novo registro</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Ao clicar em Salvar Estrutura, o centro de custo será gravado.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="p-6 border-t bg-muted/10 mt-auto">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar Estrutura</Button>
            </div>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
