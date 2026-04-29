'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULTS = {
  frequency: 150,
  visibility: 0.5,
  size: 1.5,
  speed: 2.5,
  repulsion: 120, // Default deflection radius
};

interface UIContextType {
  bgSettings: {
    frequency: number;
    visibility: number;
    size: number;
    speed: number;
    repulsion: number;
  };
  setBgSettings: (settings: any) => void;
  saveSettings: () => void;
  resetToDefaults: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [bgSettings, setBgSettings] = useState(DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem('glinqx_bg_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBgSettings({
          frequency: parsed.frequency ?? DEFAULTS.frequency,
          visibility: parsed.visibility ?? DEFAULTS.visibility,
          size: parsed.size ?? DEFAULTS.size,
          speed: parsed.speed ?? DEFAULTS.speed,
          repulsion: parsed.repulsion ?? DEFAULTS.repulsion,
        });
      } catch (e) {
        console.error('Failed to load bg settings', e);
      }
    }
  }, []);

  const updateSettings = (newSettings: any) => {
    setBgSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveSettings = () => {
    localStorage.setItem('glinqx_bg_settings', JSON.stringify(bgSettings));
  };

  const resetToDefaults = () => {
    setBgSettings(DEFAULTS);
  };

  return (
    <UIContext.Provider value={{ bgSettings, setBgSettings: updateSettings, saveSettings, resetToDefaults }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
}
