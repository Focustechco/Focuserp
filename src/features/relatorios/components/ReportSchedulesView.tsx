import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Plus, Clock, Mail, Trash2, CheckCircle2 } from 'lucide-react';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { ScheduleFrequency, ReportFormat } from '../types';
import { toast } from 'sonner';

export function ReportSchedulesView() {
  const { schedules, catalog, addSchedule, removeSchedule } = useRelatoriosStore();
  const [openModal, setOpenModal] = useState(false);

  const [reportId, setReportId] = useState(catalog[0].id);
  const [frequency, setFrequency] = useState<ScheduleFrequency>('Semanal');
  const [horario, setHorario] = useState('08:00');
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState<ReportFormat>('PDF');

  const handleCreateSchedule = () => {
    if (!email) {
      toast.error('Informe o e-mail do destinatário.');
      return;
    }

    const selectedDef = catalog.find(c => c.id === reportId) || catalog[0];

    addSchedule({
      id: `sched-${Date.now()}`,
      reportId: selectedDef.id,
      reportTitle: selectedDef.title,
      category: selectedDef.category,
      frequency,
      horario,
      responsavel: 'Administrador',
      destinatarions: [email],
      format,
      proximaExecucao: new Date(Date.now() + 86400000 * 7).toLocaleDateString('pt-BR'),
      status: 'Ativo'
    });

    toast.success('Agendamento de relatório configurado com sucesso!');
    setOpenModal(false);
    setEmail('');
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pt-1 sm:pt-2">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base">Agendamentos Automáticos de Relatórios</h3>
          <p className="text-xs text-muted-foreground">Programe emissões periódicas enviadas diretamente por e-mail.</p>
        </div>
        <Button onClick={() => setOpenModal(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs h-9 rounded-xl shadow-xs shrink-0 w-full xs:w-auto">
          <Plus className="w-4 h-4" /> Novo Agendamento
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-3 sm:p-6">
          {schedules.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">Nenhum agendamento ativo no momento.</p>
              <p className="text-xs mt-1">Clique em "Novo Agendamento" para programar o envio automático por e-mail.</p>
            </div>
          ) : (
            <>
              {/* Visualização Mobile: Cards */}
              <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                {schedules.map((item) => (
                  <div key={item.id} className="border p-3.5 rounded-xl bg-card space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {item.frequency}
                        </Badge>
                        <h4 className="font-bold text-xs text-foreground leading-tight">
                          {item.reportTitle}
                        </h4>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] shrink-0">
                        {item.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{item.destinatarions.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>{item.horario}</span>
                        </div>
                        <span>Próx: {item.proximaExecucao}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {item.format}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSchedule(item.id)}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
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
                      <th className="p-3 text-left font-semibold">Frequência</th>
                      <th className="p-3 text-left font-semibold">Horário</th>
                      <th className="p-3 text-left font-semibold">Destinatários</th>
                      <th className="p-3 text-left font-semibold">Formato</th>
                      <th className="p-3 text-left font-semibold">Próxima Execução</th>
                      <th className="p-3 text-left font-semibold">Status</th>
                      <th className="p-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {schedules.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold text-primary">{item.reportTitle}</td>
                        <td className="p-3">
                          <Badge variant="outline">{item.frequency}</Badge>
                        </td>
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" /> {item.horario}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.destinatarions.join(', ')}</div>
                        </td>
                        <td className="p-3 font-bold uppercase">{item.format}</td>
                        <td className="p-3 font-medium">{item.proximaExecucao}</td>
                        <td className="p-3">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{item.status}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeSchedule(item.id)}
                            className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Criar Agendamento */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Configurar Novo Agendamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-2">
              <Label>Selecionar Relatório</Label>
              <Select value={reportId} onValueChange={setReportId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {catalog.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diário">Diário</SelectItem>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF Corporativo</SelectItem>
                    <SelectItem value="XLSX">Excel (.xlsx)</SelectItem>
                    <SelectItem value="DOCX">Word (.docx)</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Horário do Envio</Label>
                <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>E-mail do Destinatário</Label>
                <Input placeholder="diretoria@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateSchedule}>Agendar Envio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
