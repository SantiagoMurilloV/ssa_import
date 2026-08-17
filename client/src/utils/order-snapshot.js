// El carrito se limpia al crear el pedido, así que guardamos el resumen para
// la página de gracias (sobrevive un refresh, no una sesión nueva).
const KEY = 'ssa-order-snapshot';

export const saveOrderSnapshot = (snapshot) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* sin sessionStorage: la página de gracias muestra solo la referencia */
  }
};

export const readOrderSnapshot = (reference) => {
  try {
    const snapshot = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (!snapshot || (reference && snapshot.reference !== reference)) return null;
    return snapshot;
  } catch {
    return null;
  }
};
