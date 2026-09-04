import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, UploadCloud, Search, CheckCircle2, Building2, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresaConfig } from '../hooks/useEmpresaConfig';
import { cnpjService } from '@/services/cnpjService';

export function ConfigEmpresa() {
  const { empresa, updateEmpresa, uploadLogo, isSaving } = useEmpresaConfig();

  const [formData, setFormData] = useState(empresa);
  const [searchingCnpj, setSearchingCnpj] = useState(false);

  // Input refs para uploads
  const principalInputRef = useRef<HTMLInputElement>(null);
  const brancaInputRef = useRef<HTMLInputElement>(null);
  const marcaDaguaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(empresa);
  }, [empresa]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateEmpresa(formData);
    } catch (err) {
      // toast já disparado no hook
    }
  };

  // Consulta automática de CNPJ via Receita Federal
  const handleConsultarCnpj = async () => {
    const rawCnpj = (formData.cnpj || '').replace(/\D/g, '');
    if (rawCnpj.length !== 14) {
      toast.error('Informe um CNPJ válido com 14 dígitos para consulta.');
      return;
    }

    setSearchingCnpj(true);
    try {
      const dados = await cnpjService.consultarCNPJ(rawCnpj);
      if (dados) {
        setFormData(prev => ({
          ...prev,
          razaoSocial: dados.razaoSocial || prev.razaoSocial,
          nomeFantasia: dados.nomeFantasia || dados.razaoSocial || prev.nomeFantasia,
          cnpj: dados.cnpj || prev.cnpj,
          cnae: dados.cnae || prev.cnae,
          email: dados.email || prev.email,
          telefone: dados.telefone || prev.telefone,
          cep: dados.cep || prev.cep,
          endereco: dados.logradouro || prev.endereco,
          numero: dados.numero || prev.numero,
          complemento: dados.complemento || prev.complemento,
          bairro: dados.bairro || prev.bairro,
          cidade: dados.municipio || prev.cidade,
          estado: dados.uf || prev.estado,
        }));
        toast.success(`Dados da empresa "${dados.razaoSocial || dados.nomeFantasia}" importados com sucesso!`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível consultar os dados do CNPJ.');
    } finally {
      setSearchingCnpj(false);
    }
  };

  // Upload handler para logotipos
  const handleFileUpload = async (
    tipo: 'principal' | 'branca' | 'marca_dagua',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      if (!base64) return;

      try {
        const url = await uploadLogo(tipo, file);
        if (tipo === 'principal') setFormData(prev => ({ ...prev, logoUrl: url }));
        if (tipo === 'branca') setFormData(prev => ({ ...prev, logoBrancaUrl: url }));
        if (tipo === 'marca_dagua') setFormData(prev => ({ ...prev, marcaDaguaUrl: url }));
        toast.success(`Logotipo (${tipo}) atualizado com sucesso!`);
      } catch (err) {
        // Erro tratado
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async (tipo: 'principal' | 'branca' | 'marca_dagua') => {
    if (tipo === 'principal') {
      setFormData(prev => ({ ...prev, logoUrl: '' }));
      await updateEmpresa({ logoUrl: '' });
    } else if (tipo === 'branca') {
      setFormData(prev => ({ ...prev, logoBrancaUrl: '' }));
      await updateEmpresa({ logoBrancaUrl: '' });
    } else if (tipo === 'marca_dagua') {
      setFormData(prev => ({ ...prev, marcaDaguaUrl: '' }));
      await updateEmpresa({ marcaDaguaUrl: '' });
    }
    toast.success('Logotipo removido.');
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Inputs ocultos de upload */}
      <input
        type="file"
        ref={principalInputRef}
        onChange={e => handleFileUpload('principal', e)}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={brancaInputRef}
        onChange={e => handleFileUpload('branca', e)}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={marcaDaguaInputRef}
        onChange={e => handleFileUpload('marca_dagua', e)}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5 text-orange-500" /> Dados Institucionais & Cadastro da Empresa
          </h3>
          <p className="text-xs text-muted-foreground">
            Informações legais, fiscais, endereço e identidade visual sincronizados em faturas, contratos e na barra superior.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-9 px-4 shadow-xs cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. DADOS FISCAIS & CADASTRAIS */}
        <Card className="md:col-span-2 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Dados Fiscais & Cadastrais</CardTitle>
              <CardDescription className="text-xs">Informações oficiais registradas na Receita Federal e órgãos competentes.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConsultarCnpj}
              disabled={searchingCnpj || !formData.cnpj}
              className="text-xs gap-1.5 h-8 font-semibold border-orange-500/30 text-orange-600 hover:bg-orange-500/10 cursor-pointer"
            >
              {searchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {searchingCnpj ? "Consultando Receita..." : "Consultar CNPJ"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Razão Social *</Label>
                <Input 
                  value={formData.razaoSocial || ''} 
                  onChange={e => handleChange('razaoSocial', e.target.value)}
                  placeholder="Nome empresarial completo..."
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nome Fantasia (Exibido na Plataforma e Navbar) *</Label>
                <Input 
                  value={formData.nomeFantasia || ''} 
                  onChange={e => handleChange('nomeFantasia', e.target.value)}
                  placeholder="Nome comercial da marca..."
                  className="text-xs h-9 font-bold text-orange-600 dark:text-orange-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">CNPJ *</Label>
                <div className="relative">
                  <Input 
                    value={formData.cnpj || ''} 
                    onChange={e => handleChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="text-xs h-9 pr-8"
                  />
                  {formData.cnpj && formData.cnpj.length >= 14 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-2.5 top-2.5 pointer-events-none" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Inscrição Estadual (IE)</Label>
                <Input 
                  value={formData.ie || ''} 
                  onChange={e => handleChange('ie', e.target.value)}
                  placeholder="Inscrição Estadual..."
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Inscrição Municipal (IM)</Label>
                <Input 
                  value={formData.im || ''} 
                  onChange={e => handleChange('im', e.target.value)}
                  placeholder="Inscrição Municipal..."
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">CNAE Principal</Label>
                <Input 
                  value={formData.cnae || ''} 
                  onChange={e => handleChange('cnae', e.target.value)}
                  placeholder="Código e atividade principal..."
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">Regime Tributário</Label>
                <Select 
                  value={formData.regimeTributario || 'presumido'} 
                  onValueChange={val => handleChange('regimeTributario', val)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Selecione o regime..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional (ME / EPP)</SelectItem>
                    <SelectItem value="presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="real">Lucro Real</SelectItem>
                    <SelectItem value="mei">Microempreendedor Individual (MEI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. CONTATO */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold">Contato & Canais Oficiais</CardTitle>
            <CardDescription className="text-xs">Informações de atendimento e canais corporativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">E-mail Corporativo</Label>
              <Input 
                value={formData.email || ''} 
                onChange={e => handleChange('email', e.target.value)}
                type="email" 
                placeholder="contato@empresa.com.br"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Telefone Fixo</Label>
              <Input 
                value={formData.telefone || ''} 
                onChange={e => handleChange('telefone', e.target.value)}
                placeholder="(00) 0000-0000"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">WhatsApp Corporativo</Label>
              <Input 
                value={formData.whatsapp || ''} 
                onChange={e => handleChange('whatsapp', e.target.value)}
                placeholder="(00) 90000-0000"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Website Oficial</Label>
              <Input 
                value={formData.website || ''} 
                onChange={e => handleChange('website', e.target.value)}
                placeholder="https://empresa.com.br"
                className="text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. ENDEREÇO MATRIZ */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold">Endereço Matriz</CardTitle>
            <CardDescription className="text-xs">Localização da sede da empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-1">
                <Label className="text-xs font-semibold">CEP</Label>
                <Input 
                  value={formData.cep || ''} 
                  onChange={e => handleChange('cep', e.target.value)}
                  placeholder="00000-000"
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold">Bairro</Label>
                <Input 
                  value={formData.bairro || ''} 
                  onChange={e => handleChange('bairro', e.target.value)}
                  placeholder="Bairro..."
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5 col-span-3">
                <Label className="text-xs font-semibold">Logradouro / Avenida / Rua</Label>
                <Input 
                  value={formData.endereco || ''} 
                  onChange={e => handleChange('endereco', e.target.value)}
                  placeholder="Avenida Paulista..."
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <Label className="text-xs font-semibold">Número</Label>
                <Input 
                  value={formData.numero || ''} 
                  onChange={e => handleChange('numero', e.target.value)}
                  placeholder="1000"
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cidade</Label>
                <Input 
                  value={formData.cidade || ''} 
                  onChange={e => handleChange('cidade', e.target.value)}
                  placeholder="São Paulo"
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estado (UF)</Label>
                <Input 
                  value={formData.estado || ''} 
                  onChange={e => handleChange('estado', e.target.value)}
                  placeholder="SP"
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">País</Label>
              <Input 
                value={formData.pais || 'Brasil'} 
                onChange={e => handleChange('pais', e.target.value)}
                placeholder="Brasil"
                className="text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. LOGOS E IDENTIDADE INSTITUCIONAL */}
        <Card className="md:col-span-2 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold">Logos, Marcas e Imagem de Perfil da Empresa</CardTitle>
            <CardDescription className="text-xs">
              A Logo Principal é exibida na Navbar do ERP, em relatórios corporativos, faturas e contratos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Logo Principal (Cor) */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-foreground mb-2">Logo Principal (Colorida / Navbar)</p>
                {formData.logoUrl ? (
                  <div className="relative group w-full h-36 border rounded-xl p-3 flex items-center justify-center bg-card shadow-2xs">
                    <img
                      src={formData.logoUrl}
                      alt="Logo Principal"
                      className="max-h-24 max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => principalInputRef.current?.click()}
                        className="text-xs h-7 px-2.5 font-bold cursor-pointer"
                      >
                        Trocar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeLogo('principal')}
                        className="text-xs h-7 px-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => principalInputRef.current?.click()}
                    className="w-full h-36 border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-orange-500/5 hover:border-orange-500/50 cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-orange-500 mb-2 transition-colors" />
                    <p className="text-xs font-semibold text-foreground">Upload Logo Colorida</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PNG, SVG ou WebP transparente</p>
                  </div>
                )}
              </div>

              {/* Logo Branca (Negativa) */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-foreground mb-2">Logo Branca (Fundo Escuro / Dark Mode)</p>
                {formData.logoBrancaUrl ? (
                  <div className="relative group w-full h-36 border rounded-xl p-3 flex items-center justify-center bg-slate-950 shadow-2xs">
                    <img
                      src={formData.logoBrancaUrl}
                      alt="Logo Branca"
                      className="max-h-24 max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => brancaInputRef.current?.click()}
                        className="text-xs h-7 px-2.5 font-bold cursor-pointer"
                      >
                        Trocar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeLogo('branca')}
                        className="text-xs h-7 px-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => brancaInputRef.current?.click()}
                    className="w-full h-36 border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-950/90 text-slate-400 hover:bg-slate-900 cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-white mb-2 transition-colors" />
                    <p className="text-xs font-semibold text-white">Upload Logo Negativa</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Para fundos escuros e relatórios</p>
                  </div>
                )}
              </div>

              {/* Marca d'Água */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-foreground mb-2">Marca d'Água (Contratos & PDFs)</p>
                {formData.marcaDaguaUrl ? (
                  <div className="relative group w-full h-36 border rounded-xl p-3 flex items-center justify-center bg-card shadow-2xs">
                    <img
                      src={formData.marcaDaguaUrl}
                      alt="Marca d'Água"
                      className="max-h-24 max-w-full object-contain opacity-60"
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => marcaDaguaInputRef.current?.click()}
                        className="text-xs h-7 px-2.5 font-bold cursor-pointer"
                      >
                        Trocar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeLogo('marca_dagua')}
                        className="text-xs h-7 px-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => marcaDaguaInputRef.current?.click()}
                    className="w-full h-36 border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-orange-500/5 hover:border-orange-500/50 cursor-pointer transition-all group"
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground group-hover:text-orange-500 mb-2 transition-colors" />
                    <p className="text-xs font-semibold text-foreground">Upload Marca d'Água</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Para fundo de propostas e contratos</p>
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
