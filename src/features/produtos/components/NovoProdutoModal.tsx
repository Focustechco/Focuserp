import React, { useState } from 'react';
import { Boxes, Upload, Plus, X, Globe, GitBranch, FileText, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProdutoFocus, CategoriaProduto, StatusProduto } from '../types';

interface NovoProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduto: (p: Omit<ProdutoFocus, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function NovoProdutoModal({ open, onOpenChange, onAddProduto }: NovoProdutoModalProps) {
  const [form, setForm] = useState({
    nome: '',
    codigo: '',
    categoria: 'ERP & Gestão' as CategoriaProduto,
    status: 'Ativo' as StatusProduto,
    versaoAtual: 'v1.0.0',
    descricaoBreve: '',
    descricaoCompleta: '',
    responsavelPrincipal: '',
    dataLancamento: new Date().toISOString().split('T')[0],
    siteOficial: '',
    repositorioGit: '',
    documentacaoUrl: '',
    capaUrl: '',
    logoUrl: '',
  });

  // Handler para upload de Capa (Base64)
  const handleCapaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, capaUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler para upload de Logo (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return;

    onAddProduto({
      nome: form.nome,
      codigo: form.codigo || `FOCUS-${form.nome.toUpperCase().replace(/\s+/g, '-')}`,
      categoria: form.categoria,
      status: form.status,
      versaoAtual: form.versaoAtual,
      descricaoBreve: form.descricaoBreve || form.nome,
      descricaoCompleta: form.descricaoCompleta || form.descricaoBreve,
      responsavelPrincipal: form.responsavelPrincipal || 'Gerente de Produto',
      dataLancamento: form.dataLancamento,
      siteOficial: form.siteOficial,
      repositorioGit: form.repositorioGit,
      documentacaoUrl: form.documentacaoUrl,
      capaUrl: form.capaUrl,
      logoUrl: form.logoUrl,
      linksUteis: [
        { id: 'l1', titulo: 'Produção', url: form.siteOficial || 'https://focustecnologia.com.br', tipo: 'Produção' },
      ],
      roadmap: [
        { id: 'rm1', titulo: 'Lançamento Oficial da Versão v1.0', descricao: 'Homologação e rollout', prioridade: 'Alta', status: 'Planejamento', dataPrevista: '2026-10-01' },
      ],
      funcionalidades: [
        { id: 'fn1', nome: 'Módulo Principal', descricao: 'Funcionalidade base do produto', status: 'Ativo', versao: form.versaoAtual },
      ],
      releases: [
        { id: 'r1', versao: form.versaoAtual, tipo: 'Major', dataPublicacao: form.dataLancamento, changelog: 'Versão inicial do produto.', responsavel: form.responsavelPrincipal || 'Product Owner' },
      ],
      implementacoes: [],
      integracoes: [],
      equipe: [
        { id: 'eq1', nome: form.responsavelPrincipal || 'Líder do Produto', cargo: 'Product Owner', papelNoProduto: 'Product Owner' },
      ],
    });

    onOpenChange(false);
    setForm({
      nome: '',
      codigo: '',
      categoria: 'ERP & Gestão',
      status: 'Ativo',
      versaoAtual: 'v1.0.0',
      descricaoBreve: '',
      descricaoCompleta: '',
      responsavelPrincipal: '',
      dataLancamento: new Date().toISOString().split('T')[0],
      siteOficial: '',
      repositorioGit: '',
      documentacaoUrl: '',
      capaUrl: '',
      logoUrl: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" /> Cadastrar Novo Produto
          </DialogTitle>
          <DialogDescription className="text-xs">
            Crie um novo software no portfólio Focus Tecnologia com workspace exclusivo, roadmap e documentação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* UPLOADS DE CAPA E LOGO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/20 border border-border rounded-xl">
            {/* Capa Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Imagem de Capa (Banner)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center relative hover:bg-muted/40 transition-colors h-24 flex flex-col items-center justify-center">
                {form.capaUrl ? (
                  <img src={form.capaUrl} alt="Capa Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground">Clique para fazer upload da capa</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCapaUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Logotipo do Produto</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center relative hover:bg-muted/40 transition-colors h-24 flex flex-col items-center justify-center">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo Preview" className="h-14 w-14 object-contain" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground">Clique para fazer upload do logo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Produto *</Label>
              <Input
                required
                placeholder="Ex: Focus Mobile App"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Código Identificador</Label>
              <Input
                placeholder="Ex: FOCUS-MOBILE"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Categoria *</Label>
              <Select value={form.categoria} onValueChange={(v: CategoriaProduto) => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ERP & Gestão">ERP & Gestão</SelectItem>
                  <SelectItem value="CRM & Vendas">CRM & Vendas</SelectItem>
                  <SelectItem value="Business Intelligence">Business Intelligence</SelectItem>
                  <SelectItem value="Fintech & Pay">Fintech & Pay</SelectItem>
                  <SelectItem value="Logística">Logística</SelectItem>
                  <SelectItem value="Educação / EAD">Educação / EAD</SelectItem>
                  <SelectItem value="Inovação & IA">Inovação & IA</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Status Inicial *</Label>
              <Select value={form.status} onValueChange={(v: StatusProduto) => setForm({ ...form, status: v })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                  <SelectItem value="Em Implantação">Em Implantação</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Versão Atual</Label>
              <Input
                value={form.versaoAtual}
                onChange={(e) => setForm({ ...form, versaoAtual: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Descrição Breve (Resumo para o Catálogo)</Label>
            <Input
              placeholder="Descreva a proposta de valor do produto em uma frase..."
              value={form.descricaoBreve}
              onChange={(e) => setForm({ ...form, descricaoBreve: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Descrição Completa</Label>
            <Textarea
              rows={3}
              placeholder="Detalhamento do escopo, arquitetura e público-alvo..."
              value={form.descricaoCompleta}
              onChange={(e) => setForm({ ...form, descricaoCompleta: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Responsável Principal (PO / PM)</Label>
              <Input
                placeholder="Ex: Carlos Andrade (PO)"
                value={form.responsavelPrincipal}
                onChange={(e) => setForm({ ...form, responsavelPrincipal: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Data de Lançamento</Label>
              <Input
                type="date"
                value={form.dataLancamento}
                onChange={(e) => setForm({ ...form, dataLancamento: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Site / URL Oficial</Label>
              <Input
                placeholder="https://..."
                value={form.siteOficial}
                onChange={(e) => setForm({ ...form, siteOficial: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Repositório Git</Label>
              <Input
                placeholder="https://github.com/..."
                value={form.repositorioGit}
                onChange={(e) => setForm({ ...form, repositorioGit: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">URL da Documentação</Label>
              <Input
                placeholder="https://docs.focustecnologia.com.br/..."
                value={form.documentacaoUrl}
                onChange={(e) => setForm({ ...form, documentacaoUrl: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 font-semibold">
              <Plus className="h-4 w-4" /> Criar Produto & Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
