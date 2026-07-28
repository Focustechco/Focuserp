import React, { useState } from 'react';
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
import { Save, Network, ArrowRight } from 'lucide-react';
import { mockPlanoContas } from '../mockData';
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
  const [codigo, setCodigo] = useState(categoriaParaEditar?.codigo || '');
  const [nome, setNome] = useState(categoriaParaEditar?.nome || '');
  const [tipo, setTipo] = useState<string>(categoriaParaEditar?.tipo || 'Despesa');
  const [natureza, setNatureza] = useState<string>(categoriaParaEditar?.natureza || 'Operacional');

  const { addItem, updateItem } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas');

  const handleSave = () => {
    if (!nome) {
      toast.error("Por favor, informe o Nome da Categoria.");
      return;
    }

    if (isEditing && categoriaParaEditar) {
      updateItem(categoriaParaEditar.id, {
        codigo: codigo || categoriaParaEditar.codigo,
        nome,
        tipo: (tipo as any),
        natureza: (natureza as any)
      });
      toast.success("Categoria atualizada com sucesso!");
    } else {
      const novaCat: CategoriaFinanceira = {
        id: `cat-${Date.now()}`,
        codigo: codigo || `${Math.floor(1 + Math.random() * 5)}.${Math.floor(1 + Math.random() * 9)}`,
        nome,
        tipo: (tipo as any) || 'Despesa',
        natureza: (natureza as any) || 'Operacional',
        status: 'Ativa',
        dataAtualizacao: new Date().toISOString(),
        qtdLancamentos: 0,
        saldoAcumuladoMensal: 0
      };
      addItem(novaCat);
      toast.success("Categoria criada com sucesso!");
    }

    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] flex flex-col p-0 h-full overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border shadow-sm">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  {isEditing ? `Editar Categoria (${categoriaParaEditar.codigo})` : 'Nova Categoria Financeira'}
                </SheetTitle>
                <SheetDescription>
                  Configure as propriedades desta conta no Plano de Contas.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* TABS E CONTEDO */}
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
                  <>
                    <TabsTrigger value="utilizacao" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2">
                      Utilizao
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2">
                      Histrico
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
              
              {/* ABA: DADOS GERAIS */}
              <TabsContent value="gerais" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cdigo Contbil</Label>
                    <Input placeholder="Ex: 2.1.3" value={codigo} onChange={e => setCodigo(e.target.value)} />
                    <p className="text-[11px] text-muted-foreground">Sugerido automaticamente pela Hierarquia.</p>
                  </div>
                  <div className="space-y-2 flex flex-col justify-center">
                    <div className="flex items-center justify-between border rounded-md p-3 bg-background">
                      <Label className="cursor-pointer">Status da Categoria</Label>
                      <Switch defaultChecked={categoriaParaEditar?.status === 'Ativa' || !isEditing} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome da Categoria <span className="text-rose-500">*</span></Label>
                  <Input placeholder="Ex: Google Ads" value={nome} onChange={e => setNome(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Financeiro</Label>
                    <Select defaultValue={categoriaParaEditar?.tipo || 'Despesa'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receita">Receita (Entrada)</SelectItem>
                        <SelectItem value="Despesa">Despesa (Sada)</SelectItem>
                        <SelectItem value="Transferncia">Transferncia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Natureza</Label>
                    <Select defaultValue={categoriaParaEditar?.natureza || 'Operacional'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operacional">Operacional</SelectItem>
                        <SelectItem value="Administrativa">Administrativa</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Financeira">Financeira</SelectItem>
                        <SelectItem value="Tributria">Tributria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Setor Responsvel</Label>
                    <Select defaultValue={categoriaParaEditar?.setor || 'Geral'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o Setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Geral">Toda Empresa</SelectItem>
                        <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Centro de Custo (Opcional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Vincular CC padro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cc-01">Marketing Digital (CC-001)</SelectItem>
                        <SelectItem value="cc-02">Infraestrutura (CC-002)</SelectItem>
                      </SelectContent>
                    </Select>
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
                    Toda categoria deve pertencer a um grupo pai, exceto as categorias Raiz (ex: 1.0 Receitas).
                  </p>
                  
                  <div className="space-y-2 bg-background p-4 rounded-md border">
                    <Label>Categoria Pai</Label>
                    <Select defaultValue={categoriaParaEditar?.parentId || 'raiz'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a raiz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raiz">Nenhuma (Tornar Categoria Raiz)</SelectItem>
                        {mockPlanoContas.filter(c => !categoriaParaEditar || c.id !== categoriaParaEditar.id).map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.codigo} - {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-background">
                  <Label className="text-muted-foreground">Preview da Estrutura Contbil</Label>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">2.0 Despesas</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">2.2 Marketing</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">Sua Categoria</span>
                  </div>
                </div>
              </TabsContent>

              {/* ABA: UTILIZAO (Somente Modo Edio) */}
              {isEditing && (
                <TabsContent value="utilizacao" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border rounded-lg p-4 bg-background text-center shadow-sm">
                      <p className="text-sm text-muted-foreground">Lanamentos Vinculados</p>
                      <p className="text-2xl font-bold mt-1">{categoriaParaEditar?.qtdLancamentos || 0}</p>
                    </div>
                    <div className="border rounded-lg p-4 bg-background text-center shadow-sm">
                      <p className="text-sm text-muted-foreground">Saldo Base Histrico</p>
                      <p className={`text-xl font-bold mt-1 ${categoriaParaEditar?.tipo === 'Receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {(categoriaParaEditar?.saldoAcumuladoMensal || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 p-4 rounded-lg border border-amber-200 dark:border-amber-900 text-sm">
                    <strong>Ateno:</strong> Como esta categoria possui {categoriaParaEditar?.qtdLancamentos} lanamentos financeiros, sua excluso estrutural foi bloqueada pelo banco de dados. Voc pode inativ-la na aba Dados Gerais para evitar novos lanamentos.
                  </div>
                </TabsContent>
              )}

              {/* ABA: HISTRICO (Somente Modo Edio) */}
              {isEditing && (
                <TabsContent value="historico" className="space-y-6 mt-0">
                  <div className="relative border-l-2 border-muted ml-3 space-y-6">
                    
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 bg-background border-2 border-primary w-4 h-4 rounded-full"></div>
                      <p className="text-sm font-semibold">Alterao de Natureza</p>
                      <p className="text-xs text-muted-foreground">Ontem s 14:32 por Maria Controller</p>
                      <div className="mt-2 text-sm bg-background border rounded p-2 text-muted-foreground">
                        Mudou de <span className="line-through">Administrativa</span> para <span className="font-medium text-foreground">Operacional</span>.
                      </div>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 bg-background border-2 border-muted w-4 h-4 rounded-full"></div>
                      <p className="text-sm font-semibold">Cadastro da Categoria</p>
                      <p className="text-xs text-muted-foreground">H 4 meses por Sistema Admin</p>
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
            <Save className="w-4 h-4" /> Salvar Definies
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
