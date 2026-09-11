import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Clock, User, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { toast } from 'sonner';

export function ReportHistoryView() {
  const { history } = useRelatoriosStore();

  const handleRedownload = (itemTitle: string, format: string) => {
    toast.success(`Re-download do relatório ${itemTitle} (${format}) iniciado.`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pt-1 sm:pt-2">
      <Card className="rounded-2xl">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Histórico & Trilha de Auditoria de Emissões
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {history.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">Nenhum histórico de emissão registrado ainda.</p>
              <p className="text-xs mt-1">Gere novos relatórios pelo Catálogo para registrar o log de auditoria.</p>
            </div>
          ) : (
            <>
              {/* Visualização Mobile: Cards Touch-Friendly */}
              <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                {history.map((item) => (
                  <div key={item.id} className="border p-3.5 rounded-xl bg-card space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-1 font-semibold">
                          {item.category}
                        </Badge>
                        <h4 className="font-bold text-xs text-foreground leading-tight">
                          {item.reportTitle}
                        </h4>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] shrink-0">
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{item.generatedBy}</span>
                      </div>
                      <span>{new Date(item.generatedAt).toLocaleString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {item.format} • {item.fileSize}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRedownload(item.reportTitle, item.format)}
                        className="h-7 text-xs gap-1 text-primary rounded-lg px-2.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visualização Desktop: Tabela */}
              <div className="hidden sm:block border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 text-left font-semibold">Relatório</th>
                      <th className="p-3 text-left font-semibold">Módulo</th>
                      <th className="p-3 text-left font-semibold">Emitido Por</th>
                      <th className="p-3 text-left font-semibold">Data / Hora</th>
                      <th className="p-3 text-left font-semibold">Formato / Tamanho</th>
                      <th className="p-3 text-left font-semibold">Status</th>
                      <th className="p-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold text-primary">{item.reportTitle}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="w-3 h-3" /> {item.generatedBy}
                          </div>
                        </td>
                        <td className="p-3 font-medium">
                          {new Date(item.generatedAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {item.format} • {item.fileSize}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleRedownload(item.reportTitle, item.format)}
                            className="h-7 text-xs gap-1 text-primary hover:text-primary"
                          >
                            <Download className="w-3.5 h-3.5" /> Re-download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

