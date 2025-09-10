import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  themeColor: string;
  horizontalSpacing: number;
  verticalSpacing: number;
  nodeOpacity: number;
  animationSpeed: number;
  showGrid: boolean;
  autoLayout: boolean;
  canvasBackground: string;
  setThemeColor: (color: string) => void;
  setHorizontalSpacing: (spacing: number) => void;
  setVerticalSpacing: (spacing: number) => void;
  setNodeOpacity: (opacity: number) => void;
  setAnimationSpeed: (speed: number) => void;
  setShowGrid: (show: boolean) => void;
  setAutoLayout: (auto: boolean) => void;
  setCanvasBackground: (bg: string) => void;
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
  const [nodeOpacity, setNodeOpacity] = useState(() => 
    parseInt(localStorage.getItem('nodeOpacity') || '90')
  );
  const [animationSpeed, setAnimationSpeed] = useState(() => 
    parseInt(localStorage.getItem('animationSpeed') || '300')
  );
  const [showGrid, setShowGrid] = useState(() => 
    localStorage.getItem('showGrid') === 'true'
  );
  const [autoLayout, setAutoLayout] = useState(() => 
    localStorage.getItem('autoLayout') !== 'false'
  );
  const [canvasBackground, setCanvasBackground] = useState(() => 
    localStorage.getItem('canvasBackground') || 'gradient'
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

  useEffect(() => {
    localStorage.setItem('nodeOpacity', nodeOpacity.toString());
    updateNodeOpacity(nodeOpacity);
  }, [nodeOpacity]);

  useEffect(() => {
    localStorage.setItem('animationSpeed', animationSpeed.toString());
    updateAnimationSpeed(animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    localStorage.setItem('showGrid', showGrid.toString());
  }, [showGrid]);

  useEffect(() => {
    localStorage.setItem('autoLayout', autoLayout.toString());
  }, [autoLayout]);

  useEffect(() => {
    localStorage.setItem('canvasBackground', canvasBackground);
    updateCanvasBackground(canvasBackground);
  }, [canvasBackground]);

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

  const updateNodeOpacity = (opacity: number) => {
    const root = document.documentElement;
    const opacityValue = opacity / 100;
    root.style.setProperty('--node-opacity', opacityValue.toString());
  };

  const updateAnimationSpeed = (speed: number) => {
    const root = document.documentElement;
    root.style.setProperty('--animation-duration', `${speed}ms`);
  };

  const updateCanvasBackground = (bg: string) => {
    const root = document.documentElement;
    switch (bg) {
      case 'solid':
        root.style.setProperty('--canvas-bg', 'hsl(0 0% 0%)');
        break;
      case 'gradient':
        root.style.setProperty('--canvas-bg', 'radial-gradient(circle at 20% 20%, hsl(270 80% 25% / 0.15), transparent 35%), radial-gradient(circle at 80% 30%, hsl(260 70% 30% / 0.15), transparent 40%), linear-gradient(120deg, hsl(220 15% 8%), hsl(220 20% 10%))');
        break;
      case 'dots':
        root.style.setProperty('--canvas-bg', 'radial-gradient(circle at 1px 1px, hsl(270 50% 30% / 0.3) 1px, transparent 0)');
        root.style.setProperty('--canvas-bg-size', '20px 20px');
        break;
    }
  };

  return (
    <SettingsContext.Provider value={{
      themeColor,
      horizontalSpacing,
      verticalSpacing,
      nodeOpacity,
      animationSpeed,
      showGrid,
      autoLayout,
      canvasBackground,
      setThemeColor,
      setHorizontalSpacing,
      setVerticalSpacing,
      setNodeOpacity,
      setAnimationSpeed,
      setShowGrid,
      setAutoLayout,
      setCanvasBackground
    }}>
      {children}
    </SettingsContext.Provider>
  );
};