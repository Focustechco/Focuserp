import React, { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Info, Share2, FolderKanban, Activity, History, Tag, FolderTree } from "lucide-react";
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto } from '../types';
import { INITIAL_CENTROS } from '../data/initialData';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { CategoriaFinanceira } from '@/features/plano-contas/types';
import { INITIAL_CATEGORIAS } from '@/features/plano-contas/mockData';
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

  const { notificar } = useNotificacoesStore();
  const { addItem, data: centros } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { data: planoContas = [] } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);

  const centrosPaisDisponiveis = centros.filter(c => !c.centroPaiId);

  // Categorias integradas do Plano de Contas
  const categoriasDisponiveis = useMemo(() => {
    const ativas = planoContas.filter(c => c && c.status !== 'Inativa');
    const filtradas = ativas.filter(c => c.tipo === tipo || !c.tipo);
    return filtradas.length > 0 ? filtradas : ativas;
  }, [planoContas, tipo]);

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

    const selectedCatObj = categoriasDisponiveis.find(c => c.id === categoria || c.nome === categoria);
    const catNome = selectedCatObj ? selectedCatObj.nome : (categoria || (tipo === 'Receita' ? 'Receitas Operacionais' : 'Despesas Operacionais'));

    const novoCC: CentroCusto = {
      id: `cc-${Date.now()}`,
      codigo: codigo.trim(),
      nome: nome.trim(),
      tipo: (tipo as any) || 'Despesa',
      categoria: catNome,
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
        <div className="p-6 pb-2 border-b bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border shadow-xs">
                <FolderTree className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Configuração do Centro de Custo</SheetTitle>
                <SheetDescription>
                  Crie a estrutura analítica integrada ao Plano de Contas e Departamentos.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <Tabs defaultValue="gerais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b overflow-x-auto scrollbar-hide bg-background">
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

                {/* CATEGORIA INTEGRADA DO PLANO DE CONTAS */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" /> Categoria no Plano de Contas
                  </Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger><SelectValue placeholder="Selecione a Categoria" /></SelectTrigger>
                    <SelectContent>
                      {categoriasDisponiveis.map(cat => (
                        <SelectItem key={cat.id} value={cat.nome}>
                          <span className="font-mono text-muted-foreground mr-1.5 text-xs">{cat.codigo}</span>
                          {cat.nome}
                        </SelectItem>
                      ))}
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
                  <Input placeholder="Ex: Marketing / Vendas / Engenharia" value={departamento} onChange={e => setDepartamento(e.target.value)} />
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

            {/* 2. REGRAS DE RATEIO */}
            <TabsContent value="rateio" className="space-y-4 mt-0">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium">Rateio Automático</h4>
                  <p className="text-xs text-muted-foreground">Distribua automaticamente despesas deste centro entre outros centros operacionais.</p>
                </div>
                <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Nova Regra</Button>
              </div>

              <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Nenhum rateio automático configurado.
              </div>
            </TabsContent>

            {/* 3. PROJETOS INTEGRADOS */}
            <TabsContent value="projetos" className="space-y-4 mt-0">
              <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Os projetos que utilizarem este Centro de Custo serão linkados automaticamente após o cadastro.
              </div>
            </TabsContent>

            {/* 4. FINANCEIRO INTEGRADO */}
            <TabsContent value="financeiro" className="space-y-4 mt-0">
              <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Transações do Contas a Pagar e Contas a Receber aparecerão aqui após serem classificadas com este Centro.
              </div>
            </TabsContent>

            {/* 5. HISTÓRICO */}
            <TabsContent value="historico" className="space-y-4 mt-0">
              <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Histórico de alterações e auditoria contábil.
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t flex justify-end gap-2 bg-muted/10">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Centro de Custo</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
