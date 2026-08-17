import { useEffect } from 'react';

// Replica el IntersectionObserver + MutationObserver del diseño: cualquier
// [data-reveal] o [data-stagger] que entre en viewport se marca como "in".
export function useReveal() {
  useEffect(() => {
    const observed = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute(
            entry.target.hasAttribute('data-stagger') ? 'data-stagger' : 'data-reveal',
            'in'
          );
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    const observe = () => {
      document
        .querySelectorAll('[data-reveal]:not([data-reveal="in"]), [data-stagger]:not([data-stagger="in"])')
        .forEach((el) => {
          if (observed.has(el)) return;
          observed.add(el);
          if (el.hasAttribute('data-stagger')) {
            Array.from(el.children).forEach((child, i) => {
              child.style.transitionDelay = `${i * 110}ms`;
            });
          }
          io.observe(el);
        });
    };

    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    observe();

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

// Parallax del hero: el globo se aleja y desvanece al bajar.
export function useHeroParallax() {
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        const vh = window.innerHeight;
        const f = Math.min(1, y / (vh * 0.9));
        const globo = document.querySelector('[data-parallax="globo"]');
        const hero = document.querySelector('[data-parallax="hero"]');
        if (globo) {
          globo.style.transform = `translateY(${y * 0.38}px) scale(${1 + f * 0.06})`;
          globo.style.opacity = String(1 - f * 0.85);
        }
        if (hero) {
          hero.style.transform = `translateY(${y * 0.16}px)`;
          hero.style.opacity = String(1 - f * 0.7);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}
