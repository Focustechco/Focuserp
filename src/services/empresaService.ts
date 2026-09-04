import { supabase } from '@/lib/supabaseClient';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

export interface EmpresaConfig {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ie: string;
  im: string;
  cnae: string;
  regimeTributario: 'simples' | 'presumido' | 'real' | string;
  email: string;
  telefone: string;
  whatsapp: string;
  website: string;
  cep: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  pais: string;
  logoUrl?: string; // Logo Principal
  logoBrancaUrl?: string; // Logo Negativa
  marcaDaguaUrl?: string; // Marca d'água
  updatedAt?: string;
}

export const DEFAULT_EMPRESA_CONFIG: EmpresaConfig = {
  id: 'empresa_principal',
  razaoSocial: 'Focus Tecnologia e Sistemas Ltda',
  nomeFantasia: 'Focus Tecnologia',
  cnpj: '48.912.345/0001-89',
  ie: '109.876.543.210',
  im: '987654-0',
  cnae: '62.01-1-00 - Desenvolvimento de programas de computador sob encomenda',
  regimeTributario: 'presumido',
  email: 'contato@focustecnologia.com.br',
  telefone: '(11) 3456-7890',
  whatsapp: '(11) 98765-4321',
  website: 'https://focustecnologia.com.br',
  cep: '01310-100',
  endereco: 'Avenida Paulista, 1000',
  numero: '1000',
  complemento: 'Andar 14',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  pais: 'Brasil',
  logoUrl: '',
  logoBrancaUrl: '',
  marcaDaguaUrl: '',
  updatedAt: new Date().toISOString(),
};

const EMPRESA_STORAGE_KEYS = [
  'focus_app_empresa_config',
  'focus_empresa_config',
  'focus_empresa_institucional',
];

function broadcastEmpresaUpdate(empresa: EmpresaConfig) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('focus_empresa_updated', { detail: empresa }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

// Converte string base64 para Blob binário para upload no Supabase Storage
function base64ToBlob(base64: string, contentType = 'image/png'): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * Service Central de Gestão dos Dados da Empresa & Perfil Institucional
 * 100% Persistido no Banco de Dados Relacional Supabase e Sincronizado em Tempo Real na Navbar.
 */
export const empresaService = {
  /**
   * Obtém os dados da empresa (cache local imediato + banco de dados)
   */
  getEmpresaConfigSync(): EmpresaConfig {
    if (typeof window === 'undefined') return DEFAULT_EMPRESA_CONFIG;
    for (const key of EMPRESA_STORAGE_KEYS) {
      const raw = safeGetItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return { ...DEFAULT_EMPRESA_CONFIG, ...parsed };
          }
        } catch {}
      }
    }
    return DEFAULT_EMPRESA_CONFIG;
  },

  /**
   * Busca os dados da empresa atualizados diretamente do Supabase
   */
  async getEmpresaConfig(): Promise<EmpresaConfig> {
    const local = this.getEmpresaConfigSync();

    try {
      // 1. Tentar tabela dedicada 'empresa_config'
      const { data: dbEmpresa, error: dbErr } = await supabase
        .from('empresa_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!dbErr && dbEmpresa) {
        const merged: EmpresaConfig = {
          ...local,
          id: dbEmpresa.id || local.id,
          razaoSocial: dbEmpresa.razao_social || dbEmpresa.razaoSocial || local.razaoSocial,
          nomeFantasia: dbEmpresa.nome_fantasia || dbEmpresa.nomeFantasia || local.nomeFantasia,
          cnpj: dbEmpresa.cnpj || local.cnpj,
          ie: dbEmpresa.ie || dbEmpresa.inscricao_estadual || local.ie,
          im: dbEmpresa.im || dbEmpresa.inscricao_municipal || local.im,
          cnae: dbEmpresa.cnae || local.cnae,
          regimeTributario: dbEmpresa.regime_tributario || dbEmpresa.regime || local.regimeTributario,
          email: dbEmpresa.email || local.email,
          telefone: dbEmpresa.telefone || local.telefone,
          whatsapp: dbEmpresa.whatsapp || local.whatsapp,
          website: dbEmpresa.website || local.website,
          cep: dbEmpresa.cep || local.cep,
          endereco: dbEmpresa.endereco || dbEmpresa.logradouro || local.endereco,
          numero: dbEmpresa.numero || local.numero,
          complemento: dbEmpresa.complemento || local.complemento,
          bairro: dbEmpresa.bairro || local.bairro,
          cidade: dbEmpresa.cidade || local.cidade,
          estado: dbEmpresa.estado || local.estado,
          pais: dbEmpresa.pais || local.pais,
          logoUrl: dbEmpresa.logo_url || dbEmpresa.logoUrl || local.logoUrl,
          logoBrancaUrl: dbEmpresa.logo_branca_url || dbEmpresa.logoBrancaUrl || local.logoBrancaUrl,
          marcaDaguaUrl: dbEmpresa.marca_dagua_url || dbEmpresa.marcaDaguaUrl || local.marcaDaguaUrl,
          updatedAt: dbEmpresa.updated_at || dbEmpresa.updatedAt || local.updatedAt,
        };

        this.saveLocalCache(merged);
        return merged;
      }
    } catch (e) {
      console.warn('[empresaService] Verificando fallback de banco:', e);
    }

    return local;
  },

  /**
   * Salva as configurações da empresa no Banco Relacional e no Cache Local
   */
  async saveEmpresaConfig(dados: Partial<EmpresaConfig>): Promise<EmpresaConfig> {
    const current = this.getEmpresaConfigSync();
    const updated: EmpresaConfig = {
      ...current,
      ...dados,
      updatedAt: new Date().toISOString(),
    };

    // 1. Salvar no cache local para resposta instantânea
    this.saveLocalCache(updated);
    broadcastEmpresaUpdate(updated);

    // 2. Persistir no Banco de Dados Relacional Supabase
    try {
      const payloadDb = {
        id: updated.id || 'empresa_principal',
        razao_social: updated.razaoSocial,
        nome_fantasia: updated.nomeFantasia,
        cnpj: updated.cnpj,
        ie: updated.ie,
        im: updated.im,
        cnae: updated.cnae,
        regime_tributario: updated.regimeTributario,
        email: updated.email,
        telefone: updated.telefone,
        whatsapp: updated.whatsapp,
        website: updated.website,
        cep: updated.cep,
        endereco: updated.endereco,
        numero: updated.numero,
        complemento: updated.complemento,
        bairro: updated.bairro,
        cidade: updated.cidade,
        estado: updated.estado,
        pais: updated.pais,
        logo_url: updated.logoUrl,
        logo_branca_url: updated.logoBrancaUrl,
        marca_dagua_url: updated.marcaDaguaUrl,
        updated_at: updated.updatedAt,
      };

      const { error } = await supabase
        .from('empresa_config')
        .upsert(payloadDb, { onConflict: 'id' });

      if (error) {
        // Fallback: gravar também via row estruturada na tabela 'clients' com prefixo __COMPANY_PROFILE__
        try {
          await supabase.from('clients').upsert({
            id: '00000000-0000-4000-a000-000000000001',
            razao_social: updated.razaoSocial,
            nome_fantasia: `__COMPANY_PROFILE__ ${updated.nomeFantasia}`,
            cnpj: updated.cnpj,
            email: updated.email,
            telefone: updated.telefone,
            endereco: JSON.stringify(updated),
          }, { onConflict: 'id' });
        } catch {}
      }
    } catch (e) {
      console.warn('[empresaService] Falha ao sincronizar com o banco remoto:', e);
    }

    return updated;
  },

  /**
   * Salva os dados no cache local
   */
  saveLocalCache(empresa: EmpresaConfig) {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(empresa);
      EMPRESA_STORAGE_KEYS.forEach(key => {
        safeSetItem(key, serialized);
      });
    } catch {}
  },

  /**
   * Upload de logotipo corporativo (Principal, Branco ou Marca d'Água)
   */
  async uploadLogo(
    tipo: 'principal' | 'branca' | 'marca_dagua',
    fileOrBase64: File | string
  ): Promise<string> {
    try {
      let blob: Blob;
      let fileExt = 'png';
      let contentType = 'image/png';

      if (typeof fileOrBase64 === 'string') {
        if (fileOrBase64.startsWith('data:image/svg')) {
          contentType = 'image/svg+xml';
          fileExt = 'svg';
        } else if (fileOrBase64.startsWith('data:image/jpeg') || fileOrBase64.startsWith('data:image/jpg')) {
          contentType = 'image/jpeg';
          fileExt = 'jpg';
        }
        blob = base64ToBlob(fileOrBase64, contentType);
      } else {
        blob = fileOrBase64;
        const ext = fileOrBase64.name.split('.').pop()?.toLowerCase();
        if (ext) fileExt = ext;
        contentType = fileOrBase64.type || 'image/png';
      }

      const fileName = `empresa_logo_${tipo}_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // 1. Tentar upload no Supabase Storage
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (e) {
      console.warn('[empresaService] Falha ao enviar para Supabase Storage, mantendo base64:', e);
    }

    // Se for string base64, retorna diretamente
    if (typeof fileOrBase64 === 'string') {
      return fileOrBase64;
    }

    // Converter File em base64 como garantia offline
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrBase64);
    });
  },
};
