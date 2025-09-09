import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  horizontalSpacing: number;
  verticalSpacing: number;
  setHorizontalSpacing: (value: number) => void;
  setVerticalSpacing: (value: number) => void;
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
  const [horizontalSpacing, setHorizontalSpacing] = useState(() => {
    const saved = localStorage.getItem('canvas-horizontal-spacing');
    return saved ? parseInt(saved) : 400;
  });
  
  const [verticalSpacing, setVerticalSpacing] = useState(() => {
    const saved = localStorage.getItem('canvas-vertical-spacing');
    return saved ? parseInt(saved) : 300;
  });

  useEffect(() => {
    localStorage.setItem('canvas-horizontal-spacing', horizontalSpacing.toString());
  }, [horizontalSpacing]);

  useEffect(() => {
    localStorage.setItem('canvas-vertical-spacing', verticalSpacing.toString());
  }, [verticalSpacing]);

  return (
    <SettingsContext.Provider value={{
      horizontalSpacing,
      verticalSpacing,
      setHorizontalSpacing,
      setVerticalSpacing,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};