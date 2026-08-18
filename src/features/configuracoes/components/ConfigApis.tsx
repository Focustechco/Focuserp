import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, Copy, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export function ConfigApis() {
  const [apis, setApis] = useState([
    { id: 1, nome: 'Integração Power BI', ambiente: 'Produção', chave: 'sk_live_f983...d8a2', status: 'Ativo', criadoEm: '2026-01-10', expiracao: 'Nunca' },
    { id: 2, nome: 'App Mobile Força de Vendas', ambiente: 'Produção', chave: 'sk_live_84nd...m29z', status: 'Ativo', criadoEm: '2026-03-22', expiracao: '2027-03-22' },
    { id: 3, nome: 'E-commerce Homologação', ambiente: 'Sandbox', chave: 'sk_test_92pq...k1m3', status: 'Revogada', criadoEm: '2026-05-14', expiracao: 'Revogada' }
  ]);

  const handleCreateKey = () => {
    const nome = prompt('Nome da nova integração:');
    if (!nome) return;
    const randomHash = Math.random().toString(36).substring(2, 6) + '...' + Math.random().toString(36).substring(2, 6);
    const newKey = {
      id: Date.now(),
      nome,
      ambiente: 'Produção',
      chave: `sk_live_${randomHash}`,
      status: 'Ativo',
      criadoEm: new Date().toISOString().split('T')[0],
      expiracao: 'Nunca'
    };
    setApis((prev) => [newKey, ...prev]);
    toast.success(`Chave de API "${nome}" criada com sucesso!`);
  };

  const handleCopy = (chave: string) => {
    navigator.clipboard?.writeText(chave);
    toast.success('Chave de API copiada para a área de transferência!');
  };

  const handleRevoke = (id: number, nome: string) => {
    setApis((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Chave "${nome}" revogada e excluída com sucesso.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">APIs e Chaves (Tokens)</h2>
          <p className="text-muted-foreground mt-1">Gere tokens de acesso para integrar sistemas externos ao Focus Finance.</p>
        </div>
        <Button className="gap-2" onClick={handleCreateKey}>
          <Plus className="w-4 h-4" /> Nova Chave de API
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> Credenciais de Acesso</CardTitle>
          <CardDescription>Mantenha essas chaves em segredo. Elas possuem as mesmas permissões do perfil que as gerou.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nome da Integração</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Chave Pública / Token</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apis.map((api) => (
                  <TableRow key={api.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{api.nome}</TableCell>
                    <TableCell>
                      <Badge variant={api.ambiente === 'Produção' ? 'default' : 'secondary'}>{api.ambiente}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{api.chave}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(api.chave)} title="Copiar Chave">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(api.criadoEm).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{api.expiracao === 'Nunca' || api.expiracao === 'Revogada' ? api.expiracao : new Date(api.expiracao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={api.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}>
                        {api.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950" onClick={() => handleRevoke(api.id, api.nome)} title="Revogar Chave">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
