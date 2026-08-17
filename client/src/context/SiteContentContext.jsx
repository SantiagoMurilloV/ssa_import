import { createContext, useContext, useEffect, useState } from 'react';
import { storeApi } from '../api/store.api.js';
import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContent
} from '../../../server/src/config/default-site-content.js';

const SiteContentContext = createContext(mergeSiteContent(DEFAULT_SITE_CONTENT));

export function SiteContentProvider({ children }) {
  // arranca con los defaults (render instantáneo) y luego llega lo del admin
  const [content, setContent] = useState(() => mergeSiteContent(DEFAULT_SITE_CONTENT));

  useEffect(() => {
    storeApi
      .getSiteContent()
      .then(({ content }) => setContent(content))
      .catch(() => {});
  }, []);

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

export const useSiteContent = () => useContext(SiteContentContext);
