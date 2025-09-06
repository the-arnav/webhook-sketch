import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  themeColor: string;
  horizontalSpacing: number;
  verticalSpacing: number;
  setThemeColor: (color: string) => void;
  setHorizontalSpacing: (spacing: number) => void;
  setVerticalSpacing: (spacing: number) => void;
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
  const [horizontalSpacing, setHorizontalSpacing] = useState(() => 
    parseInt(localStorage.getItem('horizontalSpacing') || '350')
  );
  const [verticalSpacing, setVerticalSpacing] = useState(() => 
    parseInt(localStorage.getItem('verticalSpacing') || '200')
  );

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    updateCSSVariables(themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('horizontalSpacing', horizontalSpacing.toString());
  }, [horizontalSpacing]);

  useEffect(() => {
    localStorage.setItem('verticalSpacing', verticalSpacing.toString());
  }, [verticalSpacing]);

  const updateCSSVariables = (hue: string) => {
    const root = document.documentElement;
    
    // Primary theme colors
    root.style.setProperty('--primary', `${hue} 80% 65%`);
    root.style.setProperty('--ring', `${hue} 80% 65%`);
    root.style.setProperty('--accent', `${hue} 60% 50%`);
    root.style.setProperty('--sidebar-primary', `${hue} 70% 50%`);
    root.style.setProperty('--sidebar-ring', `${hue} 80% 60%`);
    
    // Canvas and node colors
    root.style.setProperty('--edge-primary', `hsl(${hue} 80% 60%)`);
    root.style.setProperty('--edge-secondary', `hsl(${parseInt(hue) - 10} 70% 50%)`);
    root.style.setProperty('--edge-glow', `0 0 20px hsl(${hue} 80% 60% / 0.4)`);
    
    // Node styling with theme
    const lighterHue = parseInt(hue) + 10;
    const darkerHue = parseInt(hue) - 10;
    
    root.style.setProperty('--node-subject-border', `hsl(${hue} 40% 30%)`);
    root.style.setProperty('--node-title-border', `hsl(${hue} 30% 25%)`);
    root.style.setProperty('--node-desc-border', `hsl(${hue} 25% 20%)`);
    
    // Glass panel theming
    root.style.setProperty('--glass-bg', `hsl(${hue} 25% 12% / 0.8)`);
    root.style.setProperty('--glass-border', `hsl(${hue} 50% 40% / 0.3)`);
    
    // Premium effects with theme
    root.style.setProperty('--premium-glow', `0 0 30px hsl(${hue} 80% 60% / 0.3)`);
    root.style.setProperty('--premium-border', `linear-gradient(135deg, hsl(${hue} 80% 50% / 0.5), hsl(${lighterHue} 70% 60% / 0.3))`);
  };

  return (
    <SettingsContext.Provider value={{
      themeColor,
      horizontalSpacing,
      verticalSpacing,
      setThemeColor,
      setHorizontalSpacing,
      setVerticalSpacing
    }}>
      {children}
    </SettingsContext.Provider>
  );
};