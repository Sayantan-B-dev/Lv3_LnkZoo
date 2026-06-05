'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DESKTOP = {
  frequency: 150,
  visibility: 0.5,
  size: 1.5,
  speed: 2.5,
  repulsion: 120,
};

const MOBILE = {
  frequency: 50,
  visibility: 0.5,
  size: 1.5,
  speed: 1.5,
  repulsion: 120,
};

function getDefaults() {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return MOBILE;
  }
  return DESKTOP;
}

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
  const [bgSettings, setBgSettings] = useState(getDefaults);

  useEffect(() => {
    const saved = localStorage.getItem('glinqx_bg_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const defs = getDefaults();
        setBgSettings({
          frequency: parsed.frequency ?? defs.frequency,
          visibility: parsed.visibility ?? defs.visibility,
          size: parsed.size ?? defs.size,
          speed: parsed.speed ?? defs.speed,
          repulsion: parsed.repulsion ?? defs.repulsion,
        });
      } catch (e) {
        console.error('Failed to load bg settings', e);
      }
    }
  }, []);

  const updateSettings = (newSettings: any) => {
    setBgSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveSettings = useCallback(() => {
    localStorage.setItem('glinqx_bg_settings', JSON.stringify(bgSettings));
  }, [bgSettings]);

  const resetToDefaults = useCallback(() => {
    setBgSettings(getDefaults());
  }, []);

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
