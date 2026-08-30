import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Download, Plus, MoreHorizontal, User, 
  Building2, Trash2, Eye, Edit, DollarSign, Phone, Mail 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovoFornecedorSheet } from './NovoFornecedorSheet';
import { FornecedorPerfilSheet } from './FornecedorPerfilSheet';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

export function FornecedoresList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  
  // Modais de Perfil e Edição
  const [selectedFornecedorPerfil, setSelectedFornecedorPerfil] = useState<Fornecedor | null>(null);
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  const [selectedFornecedorEdit, setSelectedFornecedorEdit] = useState<Fornecedor | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: fornecedores = [], deleteItem } = useLocalStorageState<Fornecedor>('focus_fornecedores');
  const navigate = useNavigate();

  const safeFornecedores = Array.isArray(fornecedores) ? fornecedores : [];

  const filteredData = useMemo(() => {
    return safeFornecedores.filter((f: any) => {
      if (!f || !f.id) return false;
      if (f.caminhoCompleto || f.parentId !== undefined) return false;
      const name = f.nomeFantasia || f.razaoSocial || f.name || f.nome;
      if (!name || name.trim() === '' || name === 'Fornecedor Sem Nome') return false;

      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        name.toLowerCase().includes(search) ||
        (f.codigo || '').toLowerCase().includes(search) ||
        (f.documento || '').includes(search) ||
        (f.categoria || '').toLowerCase().includes(search);

      if (!matchesSearch) return false;

      if (categoriaFilter !== 'todas' && f.categoria !== categoriaFilter) return false;
      if (statusFilter !== 'todos' && f.status !== statusFilter) return false;

      return true;
    });
  }, [safeFornecedores, searchTerm, categoriaFilter, statusFilter]);

  const handleOpenPerfil = (fornecedor: Fornecedor) => {
    setSelectedFornecedorPerfil(fornecedor);
    setIsPerfilOpen(true);
  };

  const handleOpenEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedorEdit(fornecedor);
    setIsEditOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.info("Nenhum fornecedor para exportar.");
      return;
    }

    const headers = ["Código", "Nome Fantasia", "Razão Social", "Documento", "Categoria", "Cidade", "UF", "Status"];
    const rows = filteredData.map(f => [
      f.codigo || '',
      `"${f.nomeFantasia || ''}"`,
      `"${f.razaoSocial || ''}"`,
      `"${f.documento || ''}"`,
      `"${f.categoria || ''}"`,
      `"${f.endereco?.cidade || ''}"`,
      `"${f.endereco?.estado || ''}"`,
      f.status || 'Ativo'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fornecedores_focus_erp_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de fornecedores exportado com sucesso!");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar fornecedor, CNPJ, código..." 
              className="pl-8 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs h-9 gap-1.5 cursor-pointer">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
          <NovoFornecedorSheet>
            <Button size="sm" className="text-xs h-9 gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Novo Fornecedor
            </Button>
          </NovoFornecedorSheet>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-semibold">Código</TableHead>
              <TableHead className="text-xs font-semibold">Fornecedor</TableHead>
              <TableHead className="text-xs font-semibold">Categoria</TableHead>
              <TableHead className="text-xs font-semibold">Contato Principal</TableHead>
              <TableHead className="text-xs font-semibold">Localidade</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((fornecedor) => {
                const contatos = Array.isArray(fornecedor?.contatos) ? fornecedor.contatos : [];
                const contatoPrincipal = contatos.find(c => c?.principal) || contatos[0];
                return (
                  <TableRow 
                    key={fornecedor.id} 
                    onClick={() => handleOpenPerfil(fornecedor)}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {fornecedor.codigo || 'F-000'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                          fornecedor.tipo === 'Pessoa Jurídica' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                        }`}>
                          {fornecedor.tipo === 'Pessoa Jurídica' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {fornecedor.nomeFantasia || fornecedor.razaoSocial || 'Fornecedor'}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono truncate">
                            {fornecedor.documento || 'Sem documento'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-[10px]">
                        {fornecedor.categoria || 'Geral'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-foreground">{contatoPrincipal?.nome || 'N/D'}</span>
                        <span className="text-[11px] text-muted-foreground">{contatoPrincipal?.celular || contatoPrincipal?.email || 'Sem contato'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="text-foreground">{fornecedor.endereco?.cidade || 'N/D'}</span>
                        <span className="text-[11px] text-muted-foreground">{fornecedor.endereco?.estado || ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={fornecedor.status === 'Ativo' ? 'default' : 'secondary'} 
                        className={`text-[10px] ${fornecedor.status === 'Ativo' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      >
                        {fornecedor.status || 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs px-2 text-primary hover:bg-primary/10 gap-1"
                          onClick={() => handleOpenPerfil(fornecedor)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Perfil
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => handleOpenPerfil(fornecedor)}>
                              <Eye className="w-3.5 h-3.5 mr-2 text-primary" />
                              Ver Perfil Completo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(fornecedor)}>
                              <Edit className="w-3.5 h-3.5 mr-2 text-blue-600" />
                              Editar Cadastro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate({ to: '/contas-a-pagar' })}>
                              <DollarSign className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                              Ver no Contas a Pagar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 cursor-pointer" 
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedor.nomeFantasia || fornecedor.razaoSocial}"?`)) {
                                  deleteItem(fornecedor.id);
                                  toast.success("Fornecedor removido com sucesso!");
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Excluir Fornecedor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheet de Perfil 360° */}
      <FornecedorPerfilSheet 
        fornecedor={selectedFornecedorPerfil}
        open={isPerfilOpen}
        onOpenChange={setIsPerfilOpen}
        onEdit={(forn) => handleOpenEdit(forn)}
      />

      {/* Sheet de Edição Completa */}
      <NovoFornecedorSheet 
        fornecedorToEdit={selectedFornecedorEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </div>
  );
}

