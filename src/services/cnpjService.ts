/**
 * Serviço Unificado e Resiliente de Consulta de CNPJ na Receita Federal
 * Utiliza estratégia multi-provedor (BrasilAPI, MinhaReceita, OpenCNPJ e CNPJ.ws) com fallback automático,
 * sanitização de caracteres, validação de dígitos verificadores e formatação automática.
 */

export interface CnpjLookupResult {
  cnpj: string;
  cnpjFormatado: string;
  razaoSocial: string;
  nomeFantasia: string;
  dataAbertura?: string; // YYYY-MM-DD
  situacaoCadastral?: string; // Ativa, Inapta, Baixada, etc.
  cnaeCodigo?: string;
  cnaeDescricao?: string;
  porte?: string; // ME, EPP, DEMAIS, etc.
  naturezaJuridica?: string;
  cep?: string;
  cepFormatado?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  pais?: string;
  email?: string;
  telefone?: string;
  simplesNacional?: boolean;
  mei?: boolean;
  qsa?: Array<{
    nome: string;
    qualificacao?: string;
  }>;
}

/**
 * Validação de dígitos verificadores do CNPJ (Módulo 11)
 */
export function validarCnpj(cnpj: string): boolean {
  const limpo = (cnpj || '').replace(/\D/g, '');

  if (limpo.length !== 14) return false;

  // Elimina CNPJs com todos os dígitos iguais (ex: 00000000000000)
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  // Validação do 1º Dígito Verificador
  let tamanho = 12;
  let numeros = limpo.substring(0, tamanho);
  const digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  // Validação do 2º Dígito Verificador
  tamanho = 13;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

  return true;
}

/**
 * Formata CNPJ para 00.000.000/0000-00
 */
export function formatarCnpj(cnpj: string): string {
  const limpo = (cnpj || '').replace(/\D/g, '').padEnd(14, '0').slice(0, 14);
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CEP para 00000-000
 */
export function formatarCep(cep: string): string {
  const limpo = (cep || '').replace(/\D/g, '').slice(0, 8);
  if (limpo.length === 8) {
    return limpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  return limpo;
}

/**
 * Formata Telefone para (00) 0000-0000 ou (00) 00000-0000
 */
export function formatarTelefone(tel: string): string {
  const limpo = (tel || '').replace(/\D/g, '');
  if (limpo.length === 11) {
    return limpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (limpo.length === 10) {
    return limpo.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return tel;
}

/**
 * Utilitário com timeout para requisições fetch
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Provedor 1: BrasilAPI
 */
async function consultarBrasilApi(cleanCnpj: string): Promise<CnpjLookupResult | null> {
  try {
    const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data || !data.razao_social) return null;

    const socios = Array.isArray(data.qsa)
      ? data.qsa.map((s: any) => ({
          nome: s.nome_socio || s.nome || '',
          qualificacao: s.qualificacao_socio || s.qualificacao || '',
        }))
      : [];

    return {
      cnpj: cleanCnpj,
      cnpjFormatado: formatarCnpj(cleanCnpj),
      razaoSocial: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || data.razao_social || '',
      dataAbertura: data.data_inicio_atividade || '',
      situacaoCadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || 'Ativa',
      cnaeCodigo: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
      cnaeDescricao: data.cnae_fiscal_descricao || '',
      porte: data.porte || '',
      naturezaJuridica: data.natureza_juridica || '',
      cep: data.cep ? data.cep.replace(/\D/g, '') : '',
      cepFormatado: data.cep ? formatarCep(data.cep) : '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      pais: 'Brasil',
      email: data.email || '',
      telefone: data.ddd_telefone_1 ? formatarTelefone(data.ddd_telefone_1) : '',
      simplesNacional: Boolean(data.opcao_pelo_simples),
      mei: Boolean(data.opcao_pelo_mei),
      qsa: socios,
    };
  } catch {
    return null;
  }
}

/**
 * Provedor 2: MinhaReceita (Mirror Open-source da Receita Federal)
 */
async function consultarMinhaReceita(cleanCnpj: string): Promise<CnpjLookupResult | null> {
  try {
    const res = await fetchWithTimeout(`https://minhareceita.org/${cleanCnpj}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data || !data.razao_social) return null;

    const socios = Array.isArray(data.qsa)
      ? data.qsa.map((s: any) => ({
          nome: s.nome_socio || s.nome || '',
          qualificacao: s.qualificacao_socio || s.qualificacao || '',
        }))
      : [];

    return {
      cnpj: cleanCnpj,
      cnpjFormatado: formatarCnpj(cleanCnpj),
      razaoSocial: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || data.razao_social || '',
      dataAbertura: data.data_inicio_atividade || '',
      situacaoCadastral: data.descricao_situacao_cadastral || 'Ativa',
      cnaeCodigo: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
      cnaeDescricao: data.cnae_fiscal_descricao || '',
      porte: data.porte || data.descricao_porte || '',
      naturezaJuridica: data.natureza_juridica || '',
      cep: data.cep ? data.cep.replace(/\D/g, '') : '',
      cepFormatado: data.cep ? formatarCep(data.cep) : '',
      logradouro: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ') || data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      pais: 'Brasil',
      email: data.email || '',
      telefone: data.ddd_telefone_1 ? formatarTelefone(data.ddd_telefone_1) : '',
      simplesNacional: Boolean(data.opcao_pelo_simples),
      mei: Boolean(data.opcao_pelo_mei),
      qsa: socios,
    };
  } catch {
    return null;
  }
}

/**
 * Provedor 3: Open CNPJ (OpenCNPJa)
 */
async function consultarOpenCnpja(cleanCnpj: string): Promise<CnpjLookupResult | null> {
  try {
    const res = await fetchWithTimeout(`https://open.cnpja.com/office/${cleanCnpj}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data || (!data.company?.name && !data.alias)) return null;

    const companyName = data.company?.name || data.alias || '';
    const alias = data.alias || companyName;

    return {
      cnpj: cleanCnpj,
      cnpjFormatado: formatarCnpj(cleanCnpj),
      razaoSocial: companyName,
      nomeFantasia: alias,
      dataAbertura: data.founded || '',
      situacaoCadastral: data.status?.text || 'Ativa',
      cnaeCodigo: data.mainActivity?.id ? String(data.mainActivity.id) : '',
      cnaeDescricao: data.mainActivity?.text || '',
      porte: data.company?.size?.text || '',
      naturezaJuridica: data.company?.nature?.text || '',
      cep: data.address?.zip ? data.address.zip.replace(/\D/g, '') : '',
      cepFormatado: data.address?.zip ? formatarCep(data.address.zip) : '',
      logradouro: data.address?.street ? `${data.address.street}` : '',
      numero: data.address?.number || '',
      complemento: data.address?.details || '',
      bairro: data.address?.district || '',
      municipio: data.address?.city || '',
      uf: data.address?.state || '',
      pais: 'Brasil',
      email: data.emails && data.emails[0]?.address ? data.emails[0].address : '',
      telefone: data.phones && data.phones[0] ? formatarTelefone(`${data.phones[0].area}${data.phones[0].number}`) : '',
      simplesNacional: Boolean(data.company?.simples?.optant),
      mei: Boolean(data.company?.simei?.optant),
    };
  } catch {
    return null;
  }
}

/**
 * Provedor 3: CNPJ.ws (API Pública)
 */
async function consultarCnpjWs(cleanCnpj: string): Promise<CnpjLookupResult | null> {
  try {
    const res = await fetchWithTimeout(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data || !data.razao_social) return null;

    const est = data.estabelecimento || {};
    const cidade = est.cidade?.nome || '';
    const estado = est.estado?.sigla || '';
    const logradouro = [est.tipo_logradouro, est.logradouro].filter(Boolean).join(' ') || est.logradouro || '';
    const tel = est.ddd1 && est.telefone1 ? formatarTelefone(`${est.ddd1}${est.telefone1}`) : '';
    const cep = est.cep ? est.cep.replace(/\D/g, '') : '';

    return {
      cnpj: cleanCnpj,
      cnpjFormatado: formatarCnpj(cleanCnpj),
      razaoSocial: data.razao_social || '',
      nomeFantasia: est.nome_fantasia || data.razao_social || '',
      dataAbertura: est.data_inicio_atividade || '',
      situacaoCadastral: est.situacao_cadastral || 'Ativa',
      cnaeCodigo: est.atividade_principal?.id ? String(est.atividade_principal.id) : '',
      cnaeDescricao: est.atividade_principal?.descricao || '',
      porte: data.porte?.descricao || '',
      naturezaJuridica: data.natureza_juridica?.descricao || '',
      cep: cep,
      cepFormatado: cep ? formatarCep(cep) : '',
      logradouro: logradouro,
      numero: est.numero || '',
      complemento: est.complemento || '',
      bairro: est.bairro || '',
      municipio: cidade,
      uf: estado,
      pais: 'Brasil',
      email: est.email || '',
      telefone: tel,
      simplesNacional: Boolean(data.simples?.optante),
      mei: Boolean(data.simples?.optante_simei),
    };
  } catch {
    return null;
  }
}

/**
 * Consulta de CNPJ com Resiliência Total e Fallback em Cascata
 */
export async function consultarCnpj(cnpjInput: string): Promise<CnpjLookupResult> {
  const cleanCnpj = (cnpjInput || '').replace(/\D/g, '');

  if (cleanCnpj.length !== 14) {
    throw new Error('Informe um CNPJ válido contendo exatamente 14 dígitos numéricos.');
  }

  // Tentativa 1: MinhaReceita (Mirror Oficial da Receita Federal - Rápido e Sem 403)
  let result = await consultarMinhaReceita(cleanCnpj);
  if (result) return result;

  // Tentativa 2: CNPJ.ws (API Pública)
  result = await consultarCnpjWs(cleanCnpj);
  if (result) return result;

  // Tentativa 3: BrasilAPI
  result = await consultarBrasilApi(cleanCnpj);
  if (result) return result;

  // Tentativa 4: OpenCNPJa
  result = await consultarOpenCnpja(cleanCnpj);
  if (result) return result;

  throw new Error('Não foi possível localizar os dados deste CNPJ na base pública da Receita Federal. Verifique o número digitado ou tente novamente em instantes.');
}
