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
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <HardDrive className="w-5 h-5 text-orange-500" /> Backup, Recuperação & Disaster Recovery
          </h3>
          <p className="text-xs text-muted-foreground">
            Gerenciamento de snapshots automatizados, cópias criptografadas em nuvem e histórico de restauração.
          </p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer" 
          onClick={handleSave} 
          disabled={saving}
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange-500" /> Política de Retenção & Agendamento
            </CardTitle>
            <CardDescription className="text-xs">Configure a periodicidade de backup e provedor de armazenamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Frequência de Backup Automático</Label>
              <Select defaultValue="diario">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário (Recomendado)</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Tempo de Retenção</Label>
              <Select defaultValue="30">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">1 Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Local de Armazenamento</Label>
              <Select defaultValue="aws">
                <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">AWS S3 (Padrão Focus Cloud)</SelectItem>
                  <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full gap-2 rounded-xl h-9 text-xs font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20" 
                onClick={handleGerarBackup} 
                disabled={generating}
              >
                <Download className="w-3.5 h-3.5" /> {generating ? "Gerando Snapshot..." : "Gerar Backup Manual Agora"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange-500" /> Histórico de Snapshots Disponíveis
            </CardTitle>
            <CardDescription className="text-xs">Pontos de restauração verificados prontos para recuperação.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs">
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
