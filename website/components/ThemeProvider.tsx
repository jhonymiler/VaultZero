'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Resolve o problema de hidratação no cliente vs. servidor
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Não renderiza o provedor de tema até que o componente seja montado
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
