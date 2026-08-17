// Fallback si el API del admin no responde (timeout 8 s). La fuente de verdad
// SIEMPRE es el admin; esto solo evita una tienda en blanco.
const P = (id, name, detail, category, price, inStock, featured) => ({
  id,
  name,
  detail,
  description: '',
  category,
  currency: 'COP',
  inStock,
  featured,
  basePrice: price,
  price,
  photos: []
});

const PRODUCTS = [
  P('termo-stanley-quencher', 'Termo Stanley Quencher 1.18 L', 'Color Rose Quartz · original', 'Hogar', 219000, true, true),
  P('airpods-pro-2', 'AirPods Pro 2 (USB-C)', 'Sellados, garantía Apple', 'Tecnología', 949000, false, true),
  P('bruma-sol-de-janeiro-62', 'Bruma Sol de Janeiro 62', '240 ml · Sephora USA', 'Belleza', 168000, true, true)
];

export const DEFAULT_CATALOG = {
  products: PRODUCTS,
  categories: [...new Set(PRODUCTS.map((p) => p.category))],
  // Espejo de DEFAULT_SHIPPING_CONFIG en ssa_admin: si difiere, con el admin
  // caído la tienda mostraría un envío distinto al que se cobra.
  shipping: { defaultFee: 15000, cities: [{ name: 'Bogotá', fee: 10000 }] },
  promotion: null,
  paymentChannels: []
};
