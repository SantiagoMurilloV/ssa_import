import { z } from 'zod';

// ESPEJO de ssa_admin/server/src/schemas/public.schemas.js (createOrderSchema).
// Si cambias uno, cambia el otro.
export const createOrderSchema = z
  .object({
    customer: z
      .object({
        fullName: z.string().trim().min(2).max(120),
        phone: z.string().trim().regex(/^\+?[\d\s().-]{7,20}$/, 'Invalid phone number'),
        email: z.string().trim().email().max(160)
      })
      .strict(),
    shipping: z
      .object({
        department: z.string().trim().min(2).max(80),
        city: z.string().trim().min(2).max(80),
        address: z.string().trim().min(5).max(200),
        notes: z.string().trim().max(500).optional()
      })
      .strict(),
    payment: z.literal('transfer'),
    paymentChannelId: z.string().trim().max(60).optional(),
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(60),
            // Cuál variante (talla/color/aroma). Ausente = producto sin opciones.
            variantId: z.number().int().positive().optional(),
            quantity: z.number().int().min(1).max(10)
          })
          .strict()
      )
      .min(1)
      .max(8),
    website: z.literal('')
  })
  .strict();
