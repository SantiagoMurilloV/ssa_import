import { useEffect } from 'react';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import { trackPageView } from '../api/track.api.js';
import Hero from '../components/home/Hero.jsx';
import ComoFunciona from '../components/home/ComoFunciona.jsx';
import { SECTION_COMPONENTS, resolveHomeSections } from '../components/home/section-registry.js';

export default function HomePage() {
  const content = useSiteContent();

  useEffect(() => {
    trackPageView();
  }, []);

  // Al cargar con hash (#como, #encargos) el navegador no hace scroll solo
  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 120);
  }, []);

  const sections = resolveHomeSections(content.layout);

  return (
    <>
      <Hero />
      <ComoFunciona />
      {sections.map(({ key }) => {
        const Section = SECTION_COMPONENTS[key];
        return <Section key={key} />;
      })}
    </>
  );
}
