import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red';

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themeColors = {
  purple: {
    primary: '270 80% 65%',
    accent: '270 60% 50%',
    edge: '270 80% 60%',
    edgeSecondary: '260 70% 50%',
  },
  blue: {
    primary: '210 100% 65%',
    accent: '210 60% 50%', 
    edge: '210 100% 60%',
    edgeSecondary: '200 70% 50%',
  },
  green: {
    primary: '142 76% 60%',
    accent: '142 60% 45%',
    edge: '142 76% 55%', 
    edgeSecondary: '132 70% 45%',
  },
  orange: {
    primary: '25 95% 65%',
    accent: '25 75% 50%',
    edge: '25 95% 60%',
    edgeSecondary: '15 85% 50%',
  },
  pink: {
    primary: '330 81% 70%',
    accent: '330 61% 55%',
    edge: '330 81% 65%',
    edgeSecondary: '320 71% 55%',
  },
  red: {
    primary: '0 84% 65%',
    accent: '0 64% 50%',
    edge: '0 84% 60%',
    edgeSecondary: '350 74% 50%',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeColor) || 'purple';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    
    const colors = themeColors[theme];
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--edge-primary', `hsl(${colors.edge})`);
    root.style.setProperty('--edge-secondary', `hsl(${colors.edgeSecondary})`);
    root.style.setProperty('--ring', colors.primary);
    root.style.setProperty('--sidebar-primary', colors.accent);
    root.style.setProperty('--sidebar-ring', colors.primary);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};