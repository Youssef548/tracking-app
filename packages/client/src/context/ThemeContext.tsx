import { createContext, useContext, useState, useEffect, useRef } from 'react';

type ThemeValue = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: ThemeValue;
  setTheme: (value: ThemeValue) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(value: ThemeValue, mq: MediaQueryList): void {
  const html = document.documentElement;
  if (value === 'dark') {
    html.classList.add('dark');
  } else if (value === 'light') {
    html.classList.remove('dark');
  } else {
    // auto — follow OS
    mq.matches ? html.classList.add('dark') : html.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeValue>(
    () => (localStorage.getItem('theme') as ThemeValue | null) ?? 'auto'
  );
  const mq = useRef(window.matchMedia('(prefers-color-scheme: dark)'));
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Remove previous OS listener before applying new theme
    if (listenerRef.current) {
      mq.current.removeEventListener('change', listenerRef.current);
      listenerRef.current = null;
    }

    applyTheme(theme, mq.current);

    if (theme === 'auto') {
      listenerRef.current = () => applyTheme('auto', mq.current);
      mq.current.addEventListener('change', listenerRef.current);
    }

    return () => {
      if (listenerRef.current) {
        mq.current.removeEventListener('change', listenerRef.current);
      }
    };
  }, [theme]);

  function setTheme(value: ThemeValue): void {
    localStorage.setItem('theme', value);
    setThemeState(value);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
