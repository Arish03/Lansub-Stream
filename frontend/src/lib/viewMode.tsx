'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewMode = 'simple' | 'advanced';

interface ViewModeContextType {
  mode: ViewMode;
  isSimple: boolean;
  isAdvanced: boolean;
  toggleMode: () => void;
  setMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  mode: 'simple',
  isSimple: true,
  isAdvanced: false,
  toggleMode: () => {},
  setMode: () => {},
});

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>('simple');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lansub_view_mode') as ViewMode;
      if (saved === 'simple' || saved === 'advanced') {
        setModeState(saved);
      }
    } catch {}
  }, []);

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('lansub_view_mode', newMode);
    } catch {}
  };

  const toggleMode = () => {
    setMode(mode === 'simple' ? 'advanced' : 'simple');
  };

  return (
    <ViewModeContext.Provider
      value={{
        mode,
        isSimple: mode === 'simple',
        isAdvanced: mode === 'advanced',
        toggleMode,
        setMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
