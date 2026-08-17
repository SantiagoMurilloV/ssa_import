import { createContext, useContext, useEffect, useState } from 'react';
import { storeApi } from '../api/store.api.js';
import { DEFAULT_CATALOG } from '../../../server/src/config/default-catalog.js';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', ...DEFAULT_CATALOG });

  useEffect(() => {
    storeApi
      .getCatalog()
      .then((catalog) => setState({ status: 'ready', ...catalog }))
      .catch(() => setState((s) => ({ ...s, status: 'ready' })));
  }, []);

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
