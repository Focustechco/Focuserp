import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Save, Lock, CheckCircle2 } from 'lucide-react';
import { usePermissoesStore } from '../hooks/usePermissoesStore';
import { toast } from 'sonner';

export function MatrizPermissoesView() {
  const { perfis } = usePermissoesStore();
  const [selectedPerfilId, setSelectedPerfilId] = useState<string>(perfis[0]?.id || 'p-admin');

  const selectedPerfil = perfis.find(p => p.id === selectedPerfilId) || perfis[0] || {
    id: 'p-default',
    nome: 'Perfil Geral',
    descricao: 'Perfil de acesso corporativo padrão',
    corBadge: 'bg-primary text-white',
    departamentoPadrao: 'Geral'
  };

  const modulos = [
    { key: 'dashboard', label: 'Dashboard Executivo' },
    { key: 'contasReceber', label: 'Contas a Receber' },
    { key: 'contasPagar', label: 'Contas a Pagar' },
    { key: 'cobrancas', label: 'Cobranças' },
    { key: 'fluxoCaixa', label: 'Fluxo de Caixa' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'fornecedores', label: 'Fornecedores' },
    { key: 'projetos', label: 'Projetos' },
    { key: 'contratos', label: 'Contratos' },
    { key: 'centroCustos', label: 'Centro de Custos' },
    { key: 'fiscal', label: 'Fiscal' },
    { key: 'agenda', label: 'Agenda Financeira' },
    { key: 'rh', label: 'RH & Pessoas' },
    { key: 'marketing', label: 'Marketing Ops' },
    { key: 'relatorios', label: 'Central de Relatórios' },
    { key: 'documentos', label: 'Central de Documentos (DMS)' },
    { key: 'integracoes', label: 'Hub de Integrações' },
  ];

  const handleSaveMatrix = () => {
    toast.success(`Matriz de Permissões do perfil "${selectedPerfil?.nome || 'Selecionado'}" salva com sucesso!`);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Matriz de Permissões Granular (RBAC)
          </h3>
          <p className="text-xs text-muted-foreground">Configure permissões de Visualização, Criação, Edição, Exclusão, Exportação e Aprovação por Módulo.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedPerfilId} onValueChange={setSelectedPerfilId}>
            <SelectTrigger className="w-60 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(perfis || []).map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleSaveMatrix} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs">
            <Save className="w-4 h-4" /> Salvar Matriz
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base text-primary">{selectedPerfil?.nome}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedPerfil?.descricao}</p>
            </div>
            <Badge className={selectedPerfil?.corBadge}>{selectedPerfil?.departamentoPadrao}</Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="border rounded-lg overflow-hidden bg-card text-xs">
            <table className="w-full">
              <thead className="bg-muted/50 border-b text-left">
                <tr>
                  <th className="p-3">Módulo da Plataforma</th>
                  <th className="p-3 text-center">Visualizar</th>
                  <th className="p-3 text-center">Criar</th>
                  <th className="p-3 text-center">Editar</th>
                  <th className="p-3 text-center">Excluir</th>
                  <th className="p-3 text-center">Exportar</th>
                  <th className="p-3 text-center">Aprovar</th>
                </tr>
              </thead>
              <tbody>
                {modulos.map(m => (
                  <tr key={m.key} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{m.label}</td>
                    <td className="p-3 text-center"><Checkbox defaultChecked={true} /></td>
                    <td className="p-3 text-center"><Checkbox defaultChecked={selectedPerfil?.nome !== 'Auditor'} /></td>
                    <td className="p-3 text-center"><Checkbox defaultChecked={selectedPerfil?.nome !== 'Auditor'} /></td>
                    <td className="p-3 text-center"><Checkbox defaultChecked={selectedPerfil?.nome === 'Super Administrador'} /></td>
                    <td className="p-3 text-center"><Checkbox defaultChecked={true} /></td>
                    <td className="p-3 text-center"><Checkbox defaultChecked={(selectedPerfil?.nome || '').includes('Administrador') || selectedPerfil?.nome === 'Diretoria'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
