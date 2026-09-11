import { useCallback, useEffect, useState } from 'react';
import { storeApi } from '../api/store.api.js';

// Avisos push de UNA referencia. El navegador tiene una sola suscripción push
// (un endpoint); en el admin ese endpoint se asocia a cada código que la
// persona activó. Aquí se recuerda en localStorage a qué códigos se suscribió.
const STORAGE_KEY = 'ssa-tracking-subs';

const supported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent);
const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true);

const readSubs = () => {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const writeSubs = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(list)]));
  } catch {
    /* sin almacenamiento: el estado vive solo en esta visita */
  }
};

const urlBase64ToUint8Array = (base64) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
};

// Registra el service worker si aún no está (main.jsx lo hace al cargar, pero
// aquí no se puede depender de eso) y espera a que esté activo.
const ensureRegistration = async () => {
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
};

/**
 * Estados:
 *   loading      averiguando
 *   unsupported  el navegador no puede (en iPhone hace falta instalar la tienda)
 *   unavailable  el servidor no tiene push configurado
 *   denied       la persona bloqueó las notificaciones de este sitio
 *   off / on     se puede activar / ya sigue este código
 */
export function useTrackingNotifications(reference, push) {
  const [state, setState] = useState(supported ? 'loading' : 'unsupported');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reference) return undefined;
    if (!supported) {
      setState('unsupported');
      return undefined;
    }
    if (!push?.enabled) {
      setState('unavailable');
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        if (Notification.permission === 'denied') return setState('denied');
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = registration && (await registration.pushManager.getSubscription());
        if (cancelled) return;
        setState(subscription && readSubs().includes(reference) ? 'on' : 'off');
      } catch {
        if (!cancelled) setState('off');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference, push?.enabled]);

  const enable = useCallback(async () => {
    if (!reference || !push?.publicKey) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const registration = await ensureRegistration();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(push.publicKey)
        }));
      await storeApi.subscribeTracking(reference, subscription.toJSON());
      writeSubs([...readSubs(), reference]);
      setState('on');
    } catch (err) {
      // El navegador devuelve el detalle en inglés ("Registration failed…"):
      // el comprador lee siempre español, y el detalle técnico va a la consola.
      console.warn('[tracking] no se pudo suscribir', err);
      setError(
        err?.status
          ? err.message
          : 'No pudimos activar los avisos en este navegador. Intenta de nuevo o guarda el enlace de esta página: siempre verás la etapa actual.'
      );
    } finally {
      setBusy(false);
    }
  }, [reference, push?.publicKey]);

  const disable = useCallback(async () => {
    if (!reference) return;
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration && (await registration.pushManager.getSubscription());
      if (subscription) {
        await storeApi.unsubscribeTracking(reference, subscription.endpoint).catch(() => {});
        const remaining = readSubs().filter((ref) => ref !== reference);
        writeSubs(remaining);
        // Sin más códigos seguidos, la suscripción del navegador ya no sirve
        if (remaining.length === 0) await subscription.unsubscribe().catch(() => {});
      } else {
        writeSubs(readSubs().filter((ref) => ref !== reference));
      }
      setState('off');
    } catch (err) {
      setError(err.message ?? 'No pudimos desactivar los avisos.');
    } finally {
      setBusy(false);
    }
  }, [reference]);

  const hint =
    isIOS && !isStandalone
      ? 'En iPhone los avisos solo funcionan con la tienda instalada: toca Compartir → “Agregar a pantalla de inicio”, abre SSA Import desde ahí y vuelve a esta guía.'
      : 'Este navegador no admite notificaciones. Guarda el enlace de esta página y vuelve cuando quieras: siempre verás la etapa actual.';

  return { state, error, busy, enable, disable, hint };
}
