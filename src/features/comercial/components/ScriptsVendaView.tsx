import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, Copy, Star, Search, Plus, Tag, Check, User
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { ScriptVenda } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

export function ScriptsVendaView() {
  const { scripts, addScriptItem, toggleScriptFavorito } = useComercialStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<ScriptVenda['categoria']>('WhatsApp');
  const [objetivo, setObjetivo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const categorias = [
    'WhatsApp', 'Primeiro Contato', 'Ligação Fria / Cold Call', 
    'Contorno de Objeções', 'Apresentação & Pitch', 'Fechamento', 'Follow-up', 'Pós-Reunião'
  ];

  const filteredScripts = useMemo(() => {
    return scripts.filter(s => {
      const matchSearch = 
        s.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = categoriaFilter === 'todas' || s.categoria === categoriaFilter;

      return matchSearch && matchCat;
    });
  }, [scripts, searchTerm, categoriaFilter]);

  const handleCopy = (conteudo: string, titulo: string) => {
    navigator.clipboard.writeText(conteudo);
    toast.success(`Script "${titulo}" copiado para a área de transferência!`);
  };

  const handleCreate = () => {
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error('Preencha o título e o conteúdo do script.');
      return;
    }

    addScriptItem({
      id: `sc-${Date.now()}`,
      titulo: titulo.trim(),
      categoria,
      objetivo: objetivo.trim() || 'Abordagem comercial padronizada',
      conteudo: conteudo.trim(),
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      autor: 'Equipe Comercial',
      dataAtualizacao: new Date().toISOString().split('T')[0],
      favorito: false
    });

    toast.success('Script cadastrado na biblioteca!');
    setOpenModal(false);
    setTitulo('');
    setObjetivo('');
    setConteudo('');
    setTagsInput('');
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-orange-500" /> Biblioteca Central de Scripts Comerciais
          </h3>
          <p className="text-xs text-muted-foreground">
            Modelos de mensagem, contorno de objeções, pitches de fechamento e roteiros de ligação para cópia 1-clique.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Script
        </Button>
      </div>

      {/* Barra de Filtros & Categorias */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-muted/20 p-3.5 rounded-2xl border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por palavra-chave, objeção ou tag..."
            className="pl-8 h-8 text-xs bg-background rounded-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex overflow-x-auto gap-1.5 pb-1 sm:pb-0 scrollbar-none">
          <Button 
            size="sm" 
            variant={categoriaFilter === 'todas' ? 'default' : 'outline'}
            onClick={() => setCategoriaFilter('todas')}
            className="h-8 text-xs rounded-xl whitespace-nowrap"
          >
            Todos ({scripts.length})
          </Button>
          {categorias.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={categoriaFilter === cat ? 'default' : 'outline'}
              onClick={() => setCategoriaFilter(cat)}
              className="h-8 text-xs rounded-xl whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Scripts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScripts.map(s => (
          <Card key={s.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2 space-y-1.5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] font-semibold bg-orange-50 text-orange-700 border-orange-300">
                    {s.categoria}
                  </Badge>
                  <CardTitle className="text-sm font-bold text-foreground leading-snug">
                    {s.titulo}
                  </CardTitle>
                </div>

                <button 
                  onClick={() => toggleScriptFavorito(s.id)}
                  className={`p-1.5 rounded-lg transition-colors ${s.favorito ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Favoritar"
                >
                  <Star className={`w-4 h-4 ${s.favorito ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              {s.objetivo && (
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  🎯 <strong>Objetivo:</strong> {s.objetivo}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Conteúdo do Script com Box de Cópia */}
              <div className="p-3.5 rounded-xl bg-muted/40 border text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap select-all max-h-48 overflow-y-auto">
                {s.conteudo}
              </div>

              {/* Tags & Botão de Copiar */}
              <div className="flex justify-between items-center pt-2 border-t text-xs">
                <div className="flex flex-wrap gap-1">
                  {s.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>

                <Button 
                  size="sm" 
                  onClick={() => handleCopy(s.conteudo, s.titulo)}
                  className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1 font-bold shadow-xs"
                >
                  <Copy className="w-3 h-3" /> Copiar Script
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Criar Novo Script */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="w-5 h-5 text-orange-500" /> Adicionar Script de Venda
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título do Script *</Label>
              <Input 
                placeholder="Ex: Abordagem para CFO ou Contorno de preço"
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
                    {categorias.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Tags (separadas por vírgula)</Label>
                <Input 
                  placeholder="Ex: WhatsApp, ERP, Decisor"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Objetivo Comercial</Label>
              <Input 
                placeholder="Ex: Despertar urgência sobre fluxo de caixa manual"
                value={objetivo}
                onChange={e => setObjetivo(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Conteúdo / Modelo de Mensagem *</Label>
              <Textarea 
                placeholder="Escreva a mensagem com variáveis como [Nome], [Empresa], etc..."
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                className="rounded-xl min-h-[120px] font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              Salvar Script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
