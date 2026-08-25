import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { Dogstrology, type DogstrologyDependencies } from '@/index';

const DomainContext = createContext<Dogstrology | null>(null);

/**
 * Cliente de consultas afinado para una app **local-first**: los datos salen
 * de SQLite, no de la red.
 * - `staleTime: Infinity` — un dato local no caduca solo; se invalida cuando
 *   una mutación lo cambia, y solo entonces.
 * - `retry: 0` — reintentar una consulta a SQLite no arregla nada; si falla,
 *   falla de verdad y la UI tiene que enseñarlo.
 * - `refetchOnWindowFocus: false` — no hay ventana que enfocar.
 */
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: 0, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });

export interface DomainProviderProps {
  children: ReactNode;
  /** Sustituciones para tests o para una pantalla de desarrollo. */
  dependencies?: DogstrologyDependencies;
  queryClient?: QueryClient;
}

/**
 * Pone el dominio a disposición de la UI. Es el único puente entre React y la
 * app: los componentes piden casos de uso, nunca repositorios (BRD §12.2.3).
 */
export function DomainProvider({ children, dependencies, queryClient }: DomainProviderProps) {
  const domain = useMemo(() => Dogstrology.create(dependencies), [dependencies]);
  const client = useMemo(() => queryClient ?? createQueryClient(), [queryClient]);

  return (
    <QueryClientProvider client={client}>
      <DomainContext.Provider value={domain}>{children}</DomainContext.Provider>
    </QueryClientProvider>
  );
}

export function useDomain(): Dogstrology {
  const domain = useContext(DomainContext);
  if (!domain) throw new Error('useDomain() fuera de <DomainProvider>');
  return domain;
}
