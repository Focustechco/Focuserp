import React, { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, Network, ArrowRight, FolderTree, Tag } from 'lucide-react';
import { CategoriaFinanceira } from '../types';
import { INITIAL_CATEGORIAS } from '../mockData';
import { CentroCusto } from '@/features/centro-de-custos/types';
import { INITIAL_CENTROS } from '@/features/centro-de-custos/data/initialData';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { toast } from 'sonner';

interface NovaCategoriaSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaParaEditar?: CategoriaFinanceira | null;
}

export function NovaCategoriaSheet({ isOpen, onClose, categoriaParaEditar }: NovaCategoriaSheetProps) {
  const [activeTab, setActiveTab] = useState("gerais");
  const isEditing = !!categoriaParaEditar;

  const { data: planoContas = [], addItem, updateItem } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);
  const { data: centrosCusto = [] } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);

  const [codigo, setCodigo] = useState(categoriaParaEditar?.codigo || '');
  const [nome, setNome] = useState(categoriaParaEditar?.nome || '');
  const [tipo, setTipo] = useState<string>(categoriaParaEditar?.tipo || 'Despesa');
  const [natureza, setNatureza] = useState<string>(categoriaParaEditar?.natureza || 'Operacional');
  const [setor, setSetor] = useState<string>(categoriaParaEditar?.setor || 'Geral');
  const [centroCustoPadraoId, setCentroCustoPadraoId] = useState<string>(categoriaParaEditar?.centroCustoPadraoId || 'none');
  const [parentId, setParentId] = useState<string>(categoriaParaEditar?.parentId || 'raiz');
  const [statusAtivo, setStatusAtivo] = useState(categoriaParaEditar?.status !== 'Inativa');

  // Centros de custo disponíveis
  const centrosDisponiveis = useMemo(() => {
    const ativos = centrosCusto.filter(c => c && c.status !== 'Inativo');
    const filtrados = ativos.filter(c => c.tipo === tipo || !c.tipo);
    return filtrados.length > 0 ? filtrados : ativos;
  }, [centrosCusto, tipo]);

  // Categorias pais disponíveis
  const categoriasPais = useMemo(() => {
    return planoContas.filter(c => !categoriaParaEditar || c.id !== categoriaParaEditar.id);
  }, [planoContas, categoriaParaEditar]);

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Por favor, informe o Nome da Categoria.");
      return;
    }

    const selectedCC = centrosDisponiveis.find(cc => cc.id === centroCustoPadraoId);

    if (isEditing && categoriaParaEditar) {
      updateItem(categoriaParaEditar.id, {
        codigo: codigo.trim() || categoriaParaEditar.codigo,
        nome: nome.trim(),
        tipo: (tipo as any),
        natureza: (natureza as any),
        setor,
        centroCustoPadraoId: centroCustoPadraoId !== 'none' ? centroCustoPadraoId : undefined,
        parentId: parentId !== 'raiz' ? parentId : undefined,
        status: statusAtivo ? 'Ativa' : 'Inativa',
        dataAtualizacao: new Date().toISOString()
      });
      toast.success("Categoria atualizada com sucesso!");
    } else {
      const novaCat: CategoriaFinanceira = {
        id: `cat-${Date.now()}`,
        codigo: codigo.trim() || `${tipo === 'Receita' ? '1' : '2'}.${Math.floor(1 + Math.random() * 9)}`,
        nome: nome.trim(),
        tipo: (tipo as any) || 'Despesa',
        natureza: (natureza as any) || 'Operacional',
        setor,
        centroCustoPadraoId: centroCustoPadraoId !== 'none' ? centroCustoPadraoId : undefined,
        parentId: parentId !== 'raiz' ? parentId : undefined,
        status: statusAtivo ? 'Ativa' : 'Inativa',
        dataAtualizacao: new Date().toISOString(),
        qtdLancamentos: 0,
        saldoAcumuladoMensal: 0,
        descricao: selectedCC ? `Vinculada ao Centro de Custo ${selectedCC.nome}` : undefined
      };
      addItem(novaCat);
      toast.success("Categoria criada com sucesso!");
    }

    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[620px] flex flex-col p-0 h-full overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border shadow-xs">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  {isEditing ? `Editar Categoria (${categoriaParaEditar.codigo})` : 'Nova Categoria Financeira'}
                </SheetTitle>
                <SheetDescription>
                  Configure as propriedades desta conta e seu vínculo com o Centro de Custos.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* TABS E CONTEÚDO */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 pt-4 border-b bg-background">
              <TabsList className="w-full justify-start h-auto bg-transparent p-0 overflow-x-auto">
                <TabsTrigger value="gerais" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2">
                  Dados Gerais
                </TabsTrigger>
                <TabsTrigger value="hierarquia" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2">
                  Hierarquia
                </TabsTrigger>
                {isEditing && (
                  <TabsTrigger value="utilizacao" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2">
                    Utilização
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
              
              {/* ABA: DADOS GERAIS */}
              <TabsContent value="gerais" className="space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código Contábil</Label>
                    <Input placeholder="Ex: 2.1.3" value={codigo} onChange={e => setCodigo(e.target.value)} />
                    <p className="text-[11px] text-muted-foreground">Sugerido automaticamente pela Hierarquia.</p>
                  </div>
                  <div className="space-y-2 flex flex-col justify-center">
                    <div className="flex items-center justify-between border rounded-md p-3 bg-background">
                      <Label className="cursor-pointer">Status da Categoria</Label>
                      <Switch checked={statusAtivo} onCheckedChange={setStatusAtivo} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome da Categoria <span className="text-rose-500">*</span></Label>
                  <Input placeholder="Ex: Tráfego Pago, AWS, Consultoria..." value={nome} onChange={e => setNome(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Financeiro</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receita">Receita (Entrada)</SelectItem>
                        <SelectItem value="Despesa">Despesa (Saída)</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Natureza</Label>
                    <Select value={natureza} onValueChange={setNatureza}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operacional">Operacional</SelectItem>
                        <SelectItem value="Administrativa">Administrativa</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Financeira">Financeira</SelectItem>
                        <SelectItem value="Tributária">Tributária</SelectItem>
                        <SelectItem value="Investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Setor Responsável</Label>
                    <Select value={setor} onValueChange={setSetor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o Setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Geral">Toda Empresa</SelectItem>
                        <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Operações">Operações</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* CENTRO DE CUSTOS INTEGRADO */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-primary" /> Centro de Custo Padrão
                    </Label>
                    <Select value={centroCustoPadraoId} onValueChange={setCentroCustoPadraoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vincular Centro de Custo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Vínculo Manual)</SelectItem>
                        {centrosDisponiveis.map(cc => (
                          <SelectItem key={cc.id} value={cc.id}>
                            <span className="font-mono text-muted-foreground mr-1 text-xs">{cc.codigo}</span>
                            {cc.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">Preenche automaticamente o Centro de Custo nos lançamentos.</p>
                  </div>
                </div>
              </TabsContent>

              {/* ABA: HIERARQUIA */}
              <TabsContent value="hierarquia" className="space-y-6 mt-0">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Network className="w-4 h-4" /> Relacionamento Pai-Filho
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Toda categoria pode pertencer a um grupo pai, organizando a estrutura do Plano de Contas.
                  </p>
                  
                  <div className="space-y-2 bg-background p-4 rounded-md border">
                    <Label>Categoria Pai</Label>
                    <Select value={parentId} onValueChange={setParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria pai..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raiz">Nenhuma (Tornar Categoria Raiz)</SelectItem>
                        {categoriasPais.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.codigo} - {c.nome} ({c.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-background">
                  <Label className="text-muted-foreground text-xs block mb-2">Preview da Estrutura Contábil</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-medium">
                      {parentId !== 'raiz' ? categoriasPais.find(c => c.id === parentId)?.nome || 'Plano de Contas' : 'Raiz'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-semibold text-primary px-2.5 py-1 bg-primary/10 rounded-md border border-primary/20">
                      {nome || 'Sua Categoria'}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* ABA: UTILIZAÇÃO (Modo Edição) */}
              {isEditing && (
                <TabsContent value="utilizacao" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border rounded-lg p-4 bg-background text-center shadow-xs">
                      <p className="text-xs text-muted-foreground uppercase font-medium">Lançamentos Vinculados</p>
                      <p className="text-2xl font-bold mt-1 text-foreground">{categoriaParaEditar?.qtdLancamentos || 0}</p>
                    </div>
                    <div className="border rounded-lg p-4 bg-background text-center shadow-xs">
                      <p className="text-xs text-muted-foreground uppercase font-medium">Saldo Acumulado Real</p>
                      <p className={`text-xl font-bold mt-1 ${categoriaParaEditar?.tipo === 'Receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {(categoriaParaEditar?.saldoAcumuladoMensal || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )}

            </div>
          </Tabs>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-background flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>Cancelar Cadastro</Button>
          <Button className="gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" /> Salvar Definições
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
