import { CentroCusto } from './types';

/**
 * Verifica se um lançamento financeiro (Conta a Pagar ou Título a Receber)
 * pertence de forma ESTRITA e ESPECÍFICA a um Centro de Custo.
 * 
 * Regra de Ouro: Um lançamento SOMENTE pertence ao Centro de Custo se foi
 * explicitamente atribuído a ele por ID, código ou nome exato do Centro de Custo.
 * Lançamentos sem centro de custo atribuído retornam false.
 */
export function isItemMatchingCentroStrict(
  item: { 
    centroCustoId?: string; 
    centroCustoNome?: string; 
    centroCusto?: string;
  },
  centro: CentroCusto
): boolean {
  if (!item || !centro) return false;

  const itemCcId = (item.centroCustoId || '').trim();
  const itemCcNome = (item.centroCustoNome || '').trim().toLowerCase();
  const itemCc = (item.centroCusto || '').trim().toLowerCase();

  // Se o lançamento não tem nenhum centro de custo informado, não vincula a nada
  if (!itemCcId && !itemCcNome && !itemCc) return false;

  const cId = (centro.id || '').trim();
  const cCod = (centro.codigo || '').trim().toLowerCase();
  const cNome = (centro.nome || '').trim().toLowerCase();
  const cFull = `${cCod} - ${cNome}`.toLowerCase();
  const cFullNoSpace = `${cCod}-${cNome}`.toLowerCase();
  const cFullAlt = `${cCod} ${cNome}`.toLowerCase();

  // 1. Vínculo Direto por ID
  if (cId && (itemCcId === cId || itemCc === cId.toLowerCase() || itemCcNome === cId.toLowerCase())) {
    return true;
  }

  // 2. Vínculo por Código Analítico exato (ex: "1.0", "1.1", "2.0")
  if (cCod && (itemCcId.toLowerCase() === cCod || itemCc === cCod || itemCcNome === cCod)) {
    return true;
  }

  // 3. Vínculo por Nome Exato do Centro (ex: "Operacional & Tecnologia")
  if (cNome && (itemCcNome === cNome || itemCc === cNome)) {
    return true;
  }

  // 4. Vínculo por Código + Nome Completo (ex: "1.0 - Operacional & Tecnologia")
  if (
    itemCcNome === cFull || itemCc === cFull ||
    itemCcNome === cFullNoSpace || itemCc === cFullNoSpace ||
    itemCcNome === cFullAlt || itemCc === cFullAlt
  ) {
    return true;
  }

  return false;
}
