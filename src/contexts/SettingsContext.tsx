import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  themeColor: string;
  nodeSpacing: number;
  setThemeColor: (color: string) => void;
  setNodeSpacing: (spacing: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColor] = useState(() => 
    localStorage.getItem('themeColor') || '270'
  );
  const [nodeSpacing, setNodeSpacing] = useState(() => 
    parseInt(localStorage.getItem('nodeSpacing') || '350')
  );

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    updateCSSVariables(themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('nodeSpacing', nodeSpacing.toString());
  }, [nodeSpacing]);

  const updateCSSVariables = (hue: string) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', `${hue} 80% 65%`);
    root.style.setProperty('--ring', `${hue} 80% 65%`);
    root.style.setProperty('--accent', `${hue} 60% 50%`);
    root.style.setProperty('--sidebar-primary', `${hue} 70% 50%`);
    root.style.setProperty('--sidebar-ring', `${hue} 80% 60%`);
    root.style.setProperty('--edge-primary', `hsl(${hue} 80% 60%)`);
    root.style.setProperty('--edge-secondary', `hsl(${parseInt(hue) - 10} 70% 50%)`);
  };

  return (
    <SettingsContext.Provider value={{
      themeColor,
      nodeSpacing,
      setThemeColor,
      setNodeSpacing
    }}>
      {children}
    </SettingsContext.Provider>
  );
};