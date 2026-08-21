import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyTheme = (dark: boolean) => {
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    try {
      const stored = localStorage.getItem('focus_dark_mode');
      const dark = stored !== null ? JSON.parse(stored) : false;
      setIsDark(dark);
      applyTheme(dark);
    } catch {}

    const handleThemeChange = () => {
      try {
        const stored = localStorage.getItem('focus_dark_mode');
        const dark = stored !== null ? JSON.parse(stored) : false;
        setIsDark(dark);
        applyTheme(dark);
      } catch {}
    };

    window.addEventListener('focus_theme_update', handleThemeChange);
    return () => window.removeEventListener('focus_theme_update', handleThemeChange);
  }, []);

  const toggleTheme = (enableDark?: boolean) => {
    const nextState = enableDark !== undefined ? enableDark : !isDark;
    setIsDark(nextState);
    try {
      localStorage.setItem('focus_dark_mode', JSON.stringify(nextState));
      if (nextState) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.dispatchEvent(new Event('focus_theme_update'));
    } catch {}
  };

  return { isDark, toggleTheme };
}
