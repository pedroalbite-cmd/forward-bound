import { createContext, useContext, useState, ReactNode } from "react";

// BU keys that match the MediaInvestmentTab BUs
export type MediaBUKey = 'modelo_atual' | 'o2_tax' | 'oxy_hacker' | 'franquia';

export interface MediaMetasState {
  modelo_atual: Record<string, number>;
  o2_tax: Record<string, number>;
  oxy_hacker: Record<string, number>;
  franquia: Record<string, number>;
}

interface MediaMetasContextType {
  metasPorBU: MediaMetasState;
  setMetasPorBU: (metas: MediaMetasState) => void;
  isLoaded: boolean;
}

const defaultMetas: MediaMetasState = {
  modelo_atual: {},
  o2_tax: {},
  oxy_hacker: {},
  franquia: {},
};

const MediaMetasContext = createContext<MediaMetasContextType | undefined>(undefined);

export function MediaMetasProvider({ children }: { children: ReactNode }) {
  const [metasPorBU, setMetasPorBU] = useState<MediaMetasState>(defaultMetas);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSetMetas = (metas: MediaMetasState) => {
    setMetasPorBU(metas);
    setIsLoaded(true);
  };

  return (
    <MediaMetasContext.Provider value={{ metasPorBU, setMetasPorBU: handleSetMetas, isLoaded }}>
      {children}
    </MediaMetasContext.Provider>
  );
}

export function useMediaMetas() {
  const context = useContext(MediaMetasContext);
  if (context === undefined) {
    throw new Error("useMediaMetas must be used within a MediaMetasProvider");
  }
  return context;
}
