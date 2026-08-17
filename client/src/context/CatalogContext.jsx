import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storeApi } from '../api/store.api.js';
import { DEFAULT_CATALOG } from '../../../server/src/config/default-catalog.js';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', ...DEFAULT_CATALOG });

  // reload sirve para volver a leer el inventario cuando el admin nos dice que
  // algo se agotó: el catálogo se cachea 10 s en el edge y aquí solo se pedía
  // una vez al montar.
  const reload = useCallback(
    () =>
      storeApi
        .getCatalog()
        .then((catalog) => setState({ status: 'ready', ...catalog }))
        .catch(() => setState((s) => ({ ...s, status: 'ready' }))),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ ...state, reload }), [state, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
