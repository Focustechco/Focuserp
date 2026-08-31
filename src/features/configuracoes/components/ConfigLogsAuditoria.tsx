import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText, History } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ConfigLogsAuditoria() {
  const auditoria = [
    { id: 1, dataHora: '2026-07-20T16:45:00', usuario: 'Admin Principal', acao: 'Alterou Cor Primária', ip: '192.168.1.1' },
    { id: 2, dataHora: '2026-07-20T16:30:12', usuario: 'Admin Principal', acao: 'Ativou MFA Global', ip: '192.168.1.1' },
    { id: 3, dataHora: '2026-07-19T10:15:00', usuario: 'Sistema', acao: 'Gerou Backup Diário', ip: 'internal' },
    { id: 4, dataHora: '2026-07-18T09:00:22', usuario: 'Carlos Silva', acao: 'Gerou Chave API', ip: '200.150.45.10' },
  ];

  const logs = [
    { id: 1, dataHora: '2026-07-20T16:45:05', nivel: 'INFO', servico: 'UI_THEME_SERVICE', mensagem: 'Cache de estilos invalidado com sucesso.' },
    { id: 2, dataHora: '2026-07-20T14:22:11', nivel: 'ERROR', servico: 'WEBHOOK_DISPATCHER', mensagem: 'Falha ao entregar evento contrato.vencido para https://zap.webhook.com/x992 (HTTP 500)' },
    { id: 3, dataHora: '2026-07-20T10:15:01', nivel: 'INFO', servico: 'WEBHOOK_DISPATCHER', mensagem: 'Evento fatura.paga entregue com sucesso (200ms).' },
    { id: 4, dataHora: '2026-07-20T00:05:33', nivel: 'WARN', servico: 'BACKUP_SERVICE', mensagem: 'O tamanho do snapshot diário excedeu 4GB. Verifique a retenção.' },
  ];

  const getNivelBadge = (nivel: string) => {
    switch(nivel) {
      case 'INFO': return <Badge variant="secondary" className="font-mono text-[10px]">INFO</Badge>;
      case 'WARN': return <Badge variant="outline" className="font-mono text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">WARN</Badge>;
      case 'ERROR': return <Badge variant="outline" className="font-mono text-[10px] bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">ERROR</Badge>;
      default: return <Badge variant="secondary">{nivel}</Badge>;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="border-b pb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
          <History className="w-5 h-5 text-orange-500" /> Trilha de Auditoria & Logs Técnicos
        </h3>
        <p className="text-xs text-muted-foreground">
          Rastreabilidade completa de ações administrativas, eventos de segurança e depuração de serviços.
        </p>
      </div>

      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-orange-500" /> Histórico & Rastreabilidade de Conformidade
          </CardTitle>
          <CardDescription className="text-xs">Estes registros são read-only (imutáveis) para fins de governança e LGPD.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          <Tabs defaultValue="auditoria" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="auditoria" className="gap-2"><History className="w-4 h-4" /> Auditoria de Configurações</TabsTrigger>
              <TabsTrigger value="logs" className="gap-2"><ScrollText className="w-4 h-4" /> Logs Técnicos (Sistema)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="auditoria">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação Realizada</TableHead>
                      <TableHead>IP Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditoria.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        <TableCell className="text-sm">{new Date(item.dataHora).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="font-medium">{item.usuario}</TableCell>
                        <TableCell>{item.acao}</TableCell>
                        <TableCell><code className="text-xs text-muted-foreground font-mono">{item.ip}</code></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Serviço Interno</TableHead>
                      <TableHead>Mensagem de Log</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="font-mono text-xs hover:bg-muted/20">
                        <TableCell className="text-muted-foreground">{new Date(log.dataHora).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{getNivelBadge(log.nivel)}</TableCell>
                        <TableCell className="text-blue-600 dark:text-blue-400 font-bold">{log.servico}</TableCell>
                        <TableCell>{log.mensagem}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
