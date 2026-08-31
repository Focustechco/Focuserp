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
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Hash className="w-5 h-5 text-orange-500" /> Padrões de Numeração Automática (Human IDs)
          </h3>
          <p className="text-xs text-muted-foreground">
            Configure prefixos, sufixos, quantidade de dígitos e reinício anual dos códigos gerados nos módulos.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Hash className="w-4 h-4 text-orange-500" /> Regras de Numeração por Módulo
          </CardTitle>
          <CardDescription className="text-xs">Defina a estrutura visual dos identificadores de faturas, contratos e cadastros.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
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
