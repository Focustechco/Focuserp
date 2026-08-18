import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { HardDrive, Download, RotateCcw, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export function ConfigBackup() {
  const [historico, setHistorico] = useState([
    { id: 1, data: '2026-07-20T00:00:00', tipo: 'Automático', tamanho: '4.2 GB', status: 'Concluído' },
    { id: 2, data: '2026-07-19T00:00:00', tipo: 'Automático', tamanho: '4.1 GB', status: 'Concluído' },
    { id: 3, data: '2026-07-18T15:30:00', tipo: 'Manual', tamanho: '4.0 GB', status: 'Concluído' },
  ]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGerarBackup = () => {
    setGenerating(true);
    toast.info('Iniciando cópia de segurança e snapshot dos dados...');
    setTimeout(() => {
      setGenerating(false);
      const newSnapshot = {
        id: Date.now(),
        data: new Date().toISOString(),
        tipo: 'Manual',
        tamanho: '4.3 GB',
        status: 'Concluído'
      };
      setHistorico((prev) => [newSnapshot, ...prev]);
      toast.success('Backup manual gerado e armazenado na nuvem com sucesso!');
    }, 1000);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Políticas de backup salvas com sucesso!');
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Backup e Recuperação</h2>
          <p className="text-muted-foreground mt-1">Gerencie a retenção de dados e snapshots de segurança da plataforma.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HardDrive className="w-5 h-5 text-primary" /> Política de Retenção</CardTitle>
            <CardDescription>Configure com que frequência o ERP gera cópias de segurança.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Frequência de Backup Automático</Label>
              <Select defaultValue="diario">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário (Recomendado)</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tempo de Retenção</Label>
              <Select defaultValue="30">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">1 Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Local de Armazenamento</Label>
              <Select defaultValue="aws">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">AWS S3 (Padrão Focus)</SelectItem>
                  <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4">
              <Button variant="outline" className="w-full gap-2 text-primary border-primary hover:bg-primary/5" onClick={handleGerarBackup} disabled={generating}>
                <Download className="w-4 h-4" /> {generating ? "Gerando Snapshot..." : "Gerar Backup Manual Agora"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Snapshots</CardTitle>
            <CardDescription>Arquivos disponíveis para recuperação de desastres (Disaster Recovery).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px] text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((bkp) => (
                    <TableRow key={bkp.id}>
                      <TableCell className="font-medium">{new Date(bkp.data).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{bkp.tipo}</Badge>
                      </TableCell>
                      <TableCell>{bkp.tamanho}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          {bkp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" className="gap-2">
                          <RotateCcw className="w-3 h-3" /> Restaurar
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
    </div>
  );
}
