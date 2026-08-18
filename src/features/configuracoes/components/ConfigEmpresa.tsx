import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockConfigEmpresa } from '../mockData';
import { Save, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

export function ConfigEmpresa() {
  const [empresa, setEmpresa] = useState(mockConfigEmpresa);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Dados da empresa salvos com sucesso!");
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Institucional (Empresa)</h2>
          <p className="text-muted-foreground mt-1">Dados oficiais utilizados em faturas, contratos e relatórios.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados Principais */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dados Principais</CardTitle>
            <CardDescription>Informações legais e fiscais da organização.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input defaultValue={mockConfigEmpresa.razaoSocial} />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input defaultValue={mockConfigEmpresa.nomeFantasia} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input defaultValue={mockConfigEmpresa.cnpj} />
              </div>
              <div className="space-y-2">
                <Label>Inscrição Estadual (IE)</Label>
                <Input defaultValue={mockConfigEmpresa.ie} />
              </div>
              <div className="space-y-2">
                <Label>Inscrição Municipal (IM)</Label>
                <Input defaultValue={mockConfigEmpresa.im} />
              </div>
              <div className="space-y-2">
                <Label>CNAE Principal</Label>
                <Input defaultValue={mockConfigEmpresa.cnae} />
              </div>
              <div className="space-y-2">
                <Label>Regime Tributário</Label>
                <Select defaultValue="presumido">
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail Corporativo</Label>
              <Input defaultValue={mockConfigEmpresa.email} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Telefone Fixo</Label>
              <Input defaultValue={mockConfigEmpresa.telefone} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input defaultValue={mockConfigEmpresa.whatsapp} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input defaultValue={mockConfigEmpresa.website} />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço Matriz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input defaultValue={mockConfigEmpresa.cep} />
            </div>
            <div className="space-y-2">
              <Label>Logradouro / Bairro</Label>
              <Input defaultValue={mockConfigEmpresa.endereco} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input defaultValue={mockConfigEmpresa.cidade} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input defaultValue={mockConfigEmpresa.estado} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input defaultValue={mockConfigEmpresa.pais} />
            </div>
          </CardContent>
        </Card>

        {/* Assinaturas e Logos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Logos e Marcas</CardTitle>
            <CardDescription>Estes arquivos serão estampados em documentos fiscais e propostas comerciais.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Logo Principal (Cor)</p>
                <p className="text-xs text-muted-foreground mt-1">PNG ou SVG transparente</p>
              </div>
              <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer transition-colors bg-slate-900 text-slate-400">
                <UploadCloud className="w-8 h-8 mb-2" />
                <p className="text-sm font-medium text-white">Logo Branca (Negativa)</p>
                <p className="text-xs mt-1">Para fundos escuros</p>
              </div>
              <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Marca d'Água</p>
                <p className="text-xs text-muted-foreground mt-1">Para fundos de contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
