/**
 * Safe LocalStorage Wrapper that prevents QuotaExceededError and prevents crashes.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (
      e?.name === 'QuotaExceededError' ||
      e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e?.code === 22 ||
      e?.code === 1014 ||
      e?.number === -2147024882
    ) {
      try {
        // 1. Limpar caches não-essenciais para liberar espaço imediatamente
        const nonEssentialKeys = [
          'focus_app_notificacoes',
          'focus_notificacoes',
          'focus_app_audit_logs',
          'focus_audit_logs',
          'focus_app_dms_cache',
          'focus_app_state_cache'
        ];
        nonEssentialKeys.forEach((k) => {
          try {
            window.localStorage.removeItem(k);
          } catch {}
        });

        // 2. Limpar chaves que contenham conteúdo base64 ou excessivamente grandes (> 200KB)
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const k = window.localStorage.key(i);
          if (k && k !== key) {
            try {
              const item = window.localStorage.getItem(k);
              if (item && (item.length > 200000 || item.includes('data:image/') || item.includes('data:application/'))) {
                window.localStorage.removeItem(k);
              }
            } catch {}
          }
        }

        window.localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}
