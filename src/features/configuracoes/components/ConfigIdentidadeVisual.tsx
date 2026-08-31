import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Paintbrush, Monitor, LayoutTemplate } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

export function ConfigIdentidadeVisual() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Paintbrush className="w-5 h-5 text-orange-500" /> Identidade Visual & Customização
          </h3>
          <p className="text-xs text-muted-foreground">
            Personalize a paleta de cores corporativa, logos para modo claro/escuro e comportamento da interface.
          </p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer" 
          onClick={() => toast.success("Configurações de identidade visual salvas com sucesso!")}
        >
          <Save className="w-3.5 h-3.5" /> Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cores */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-orange-500" /> Paleta de Cores da Marca
            </CardTitle>
            <CardDescription className="text-xs">Cores oficiais aplicadas nos componentes e botões da plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f97316] border shadow-sm"></div>
              <div className="flex-1 space-y-1">
                <Label>Cor Primária (Hex)</Label>
                <Input defaultValue="#f97316" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1e293b] border shadow-sm"></div>
              <div className="flex-1 space-y-1">
                <Label>Cor Secundária (Hex)</Label>
                <Input defaultValue="#1e293b" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#3b82f6] border shadow-sm"></div>
              <div className="flex-1 space-y-1">
                <Label>Cor de Destaque / Links (Hex)</Label>
                <Input defaultValue="#3b82f6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tema e Estilo */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Monitor className="w-4 h-4 text-orange-500" /> Preferências de Tema & Tipografia
            </CardTitle>
            <CardDescription className="text-xs">Controle de modo claro/escuro e fontes do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold cursor-pointer" onClick={() => toggleTheme()}>Modo Escuro (Dark Mode)</Label>
                <p className="text-[11px] text-muted-foreground">Alternar entre tema claro e escuro na plataforma.</p>
              </div>
              <Switch 
                checked={isDark} 
                onCheckedChange={(checked) => {
                  toggleTheme(checked);
                  toast.success(checked ? "Tema Escuro ativado!" : "Tema Claro ativado!");
                }} 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Estilo de Ícones</Label>
              <Select defaultValue="lucide">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lucide">Minimalista (Lucide Icons)</SelectItem>
                  <SelectItem value="solid">Preenchido (Solid Icons)</SelectItem>
                  <SelectItem value="duotone">Bicolor (Duotone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Tipografia Oficial (Fonte)</Label>
              <Select defaultValue="inter">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter (Padrão Focus Design System)</SelectItem>
                  <SelectItem value="roboto">Roboto Sans</SelectItem>
                  <SelectItem value="outfit">Outfit Modern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Densidade de Interface */}
        <Card className="md:col-span-2 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-orange-500" /> Densidade da Interface
            </CardTitle>
            <CardDescription className="text-xs">Ajuste o tamanho de tabelas, menus e botões da aplicação.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-2xl p-4 cursor-pointer hover:border-orange-500 transition-colors">
                <div className="h-14 bg-muted/50 rounded-xl flex items-center justify-center mb-3">
                  <div className="w-3/4 h-2 bg-muted-foreground/30 rounded"></div>
                </div>
                <h3 className="font-bold text-xs text-center text-foreground">Compacta</h3>
                <p className="text-[11px] text-muted-foreground text-center mt-1">Mais informações por tela (Notebooks)</p>
              </div>
              <div className="border-2 border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 rounded-2xl p-4 cursor-pointer transition-colors relative">
                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange-500"></div>
                <div className="h-14 bg-muted/50 rounded-xl flex flex-col items-center justify-center gap-1.5 mb-3">
                  <div className="w-3/4 h-2 bg-muted-foreground/30 rounded"></div>
                  <div className="w-1/2 h-2 bg-muted-foreground/30 rounded"></div>
                </div>
                <h3 className="font-bold text-xs text-center text-orange-600">Padrão Focus (Confortável)</h3>
                <p className="text-[11px] text-muted-foreground text-center mt-1">Equilíbrio perfeito de ergonomia</p>
              </div>
              <div className="border rounded-2xl p-4 cursor-pointer hover:border-orange-500 transition-colors">
                <div className="h-14 bg-muted/50 rounded-xl flex flex-col items-center justify-center gap-2 mb-3 p-2">
                  <div className="w-full h-2.5 bg-muted-foreground/30 rounded"></div>
                  <div className="w-3/4 h-2.5 bg-muted-foreground/30 rounded"></div>
                </div>
                <h3 className="font-bold text-xs text-center text-foreground">Espaçosa</h3>
                <p className="text-[11px] text-muted-foreground text-center mt-1">Fontes maiores e mais respiro visual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
