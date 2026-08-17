import { useState } from 'react';
import { storeApi } from '../api/store.api.js';
import { useCart } from '../context/CartContext.jsx';

const PHONE_PATTERN = /^[\d\s().-]{7,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMPTY_FORM = {
  fullName: '',
  phone: '',
  email: '',
  department: '',
  city: '',
  address: '',
  notes: '',
  website: '' // honeypot: ver components/Honeypot.jsx
};

export function validateForm(form) {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = 'Escribe tu nombre completo';
  if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Teléfono inválido (7 a 15 dígitos)';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Correo inválido';
  if (form.department.trim().length < 2) errors.department = 'Falta el departamento';
  if (form.city.trim().length < 2) errors.city = 'Falta la ciudad';
  if (form.address.trim().length < 5) errors.address = 'Dirección muy corta';
  return errors;
}

export function useCheckoutForm() {
  const { items, clearCart } = useCart();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [busy, setBusy] = useState(false);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Crea el pedido. El admin recalcula precios y envío: lo que devuelve manda.
  const submitOrder = async (paymentChannelId) => {
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return null;

    setBusy(true);
    setSubmitError(null);
    try {
      const payload = {
        customer: {
          fullName: form.fullName.trim(),
          phone: `+57 ${form.phone.trim()}`,
          email: form.email.trim()
        },
        shipping: {
          department: form.department.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {})
        },
        payment: 'transfer',
        ...(paymentChannelId ? { paymentChannelId } : {}),
        items: Object.entries(items).map(([productId, quantity]) => ({ productId, quantity })),
        website: form.website
      };
      const result = await storeApi.createOrder(payload);
      clearCart();
      return result;
    } catch (err) {
      setSubmitError(
        err.details?.[0]?.message ?? err.message ?? 'No pudimos crear tu pedido. Intenta de nuevo.'
      );
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { form, setField, errors, submitError, busy, submitOrder };
}
