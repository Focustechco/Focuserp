import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Hash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export function ConfigNumeracao() {
  const [items, setItems] = useState([
    { nome: 'Contratos', prefixo: 'CTR-', sufixo: '/26', digitos: 5, prox: 1, reinicioAnual: true },
    { nome: 'Projetos', prefixo: 'PRJ-', sufixo: '', digitos: 4, prox: 120, reinicioAnual: false },
    { nome: 'Clientes', prefixo: 'CLI-', sufixo: '', digitos: 5, prox: 85, reinicioAnual: false },
    { nome: 'Fornecedores', prefixo: 'FOR-', sufixo: '', digitos: 5, prox: 42, reinicioAnual: false },
    { nome: 'Contas a Receber (Faturas)', prefixo: 'FAT-', sufixo: '', digitos: 6, prox: 1045, reinicioAnual: true },
    { nome: 'Contas a Pagar', prefixo: 'PAG-', sufixo: '', digitos: 6, prox: 890, reinicioAnual: true }
  ]);
  const [saving, setSaving] = useState(false);

  const updateItem = (idx: number, field: string, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Padrões de numeração salvos com sucesso!");
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Numeração Automática</h2>
          <p className="text-muted-foreground mt-1">Configure o padrão de geração de IDs e códigos da plataforma.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Hash className="w-5 h-5 text-primary" /> Padrões por Módulo</CardTitle>
          <CardDescription>Defina como os identificadores visuais (Human IDs) serão formatados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Sufixo</TableHead>
                  <TableHead>Dígitos (Zeros)</TableHead>
                  <TableHead>Próximo N°</TableHead>
                  <TableHead className="text-center">Reinício Anual</TableHead>
                  <TableHead>Exemplo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((mod, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{mod.nome}</TableCell>
                    <TableCell>
                      <Input value={mod.prefixo} onChange={(e) => updateItem(idx, 'prefixo', e.target.value)} className="w-20 h-8 text-xs font-mono" />
                    </TableCell>
                    <TableCell>
                      <Input value={mod.sufixo} onChange={(e) => updateItem(idx, 'sufixo', e.target.value)} className="w-20 h-8 text-xs font-mono" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={mod.digitos} onChange={(e) => updateItem(idx, 'digitos', Number(e.target.value))} className="w-20 h-8" min={1} max={10} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={mod.prox} onChange={(e) => updateItem(idx, 'prox', Number(e.target.value))} className="w-24 h-8" min={1} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch checked={mod.reinicioAnual} onCheckedChange={(val) => updateItem(idx, 'reinicioAnual', val)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {mod.prefixo}{String(mod.prox).padStart(mod.digitos, '0')}{mod.sufixo}
                      </code>
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
