// Los errores de infraestructura llegan en inglés desde las funciones
// serverless; el comprador siempre debe leer español.
const FRIENDLY_BY_STATUS = {
  429: 'Recibimos muchos intentos desde tu conexión. Espera unos minutos e intenta de nuevo.',
  500: 'Tuvimos un problema de nuestro lado. Intenta de nuevo en un momento.',
  502: 'No pudimos conectarnos en este momento. Intenta de nuevo o escríbenos por WhatsApp.',
  503: 'El servicio no está disponible en este momento. Escríbenos por WhatsApp y te ayudamos.',
  504: 'La conexión tardó demasiado. Intenta de nuevo en un momento.'
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(FRIENDLY_BY_STATUS[status] ?? message);
    this.status = status;
    this.details = details;
    this.rawMessage = message;
  }
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const options = { method, headers: {} };
  if (formData) options.body = formData;
  else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`/api${path}`, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* sin cuerpo */
  }
  if (!response.ok) {
    throw new ApiError(response.status, payload?.error ?? 'Error de red', payload?.details);
  }
  return payload;
}

export const storeApi = {
  getCatalog: () => request('/catalog'),
  getSiteContent: () => request('/site-content'),
  createOrder: (order) => request('/orders', { method: 'POST', body: order }),
  uploadReceipt: (reference, file, token) => {
    const formData = new FormData();
    // El token va primero: multer procesa los campos en orden y el servidor
    // necesita leerlo del mismo body que trae el archivo.
    if (token) formData.append('token', token);
    formData.append('image', file);
    return request(`/receipt?reference=${encodeURIComponent(reference)}`, {
      method: 'POST',
      formData
    });
  },
  createEncargo: (formData) => request('/encargos', { method: 'POST', formData }),
  subscribe: (email, website = '') =>
    request('/subscribe', { method: 'POST', body: { email, website } })
};
